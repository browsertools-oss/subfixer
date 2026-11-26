// Writes a new MKV with subtitle tracks added or removed. Video and audio blocks are never decoded:
// their bytes are copied from the source by range, and only the headers, the track list and the cues are rebuilt.

import { CHUNK, ID, Reader, children, headerAt, readVint, uintOf, type MkvSource } from './mkv.ts';
import { parse } from './subs.ts';

// A piece of the new file: bytes built here, or a range of the source file.
export type Part = Uint8Array | { start: number; end: number };

export interface AddTrack {
  codec: 'S_TEXT/UTF8' | 'S_TEXT/ASS' | 'S_TEXT/SSA';
  codecPrivate: string;
  cues: { start: number; end: number; text: string }[];
  language: string;
  name: string;
  forced: boolean;
  isDefault: boolean;
}

export interface EditOptions {
  add: AddTrack[];
  remove: number[];
  defaultExisting?: number | 'none';
}

// [ISO 639-2, ISO 639-1, name]. The 639-2 code is what MKV stores.
export const LANGS: [string, string, string][] = [
  ['eng', 'en', 'English'], ['spa', 'es', 'Spanish'], ['fre', 'fr', 'French'], ['ger', 'de', 'German'],
  ['ita', 'it', 'Italian'], ['por', 'pt', 'Portuguese'], ['dut', 'nl', 'Dutch'], ['rus', 'ru', 'Russian'],
  ['pol', 'pl', 'Polish'], ['tur', 'tr', 'Turkish'], ['swe', 'sv', 'Swedish'], ['nor', 'no', 'Norwegian'],
  ['dan', 'da', 'Danish'], ['fin', 'fi', 'Finnish'], ['gre', 'el', 'Greek'], ['heb', 'he', 'Hebrew'],
  ['ara', 'ar', 'Arabic'], ['hin', 'hi', 'Hindi'], ['jpn', 'ja', 'Japanese'], ['kor', 'ko', 'Korean'],
  ['chi', 'zh', 'Chinese'], ['cze', 'cs', 'Czech'], ['hun', 'hu', 'Hungarian'], ['rum', 'ro', 'Romanian'],
  ['ukr', 'uk', 'Ukrainian'], ['vie', 'vi', 'Vietnamese'], ['tha', 'th', 'Thai'], ['ind', 'id', 'Indonesian'],
  ['und', '', 'Undetermined'],
];

const TRACK_TYPE_SUBTITLE = 17;
const enc = new TextEncoder();

// IDs that the writer needs and mkv.ts does not name.
const X = {
  SEEK_HEAD: 0x114d9b74,
  SEEK: 0x4dbb,
  SEEK_ID: 0x53ab,
  SEEK_POSITION: 0x53ac,
  VOID: 0xec,
  CRC32: 0xbf,
  CUES: 0x1c53bb6b,
  CUE_POINT: 0xbb,
  CUE_TIME: 0xb3,
  CUE_TRACK_POSITIONS: 0xb7,
  CUE_TRACK: 0xf7,
  CUE_CLUSTER_POSITION: 0xf1,
  CHAPTERS: 0x1043a770,
  ATTACHMENTS: 0x1941a469,
  TAGS: 0x1254c367,
  TRACK_UID: 0x73c5,
  FLAG_LACING: 0x9c,
  POSITION: 0xa7,
  PREV_SIZE: 0xab,
};

// Bytes of an element ID, with the length marker bits kept.
function idBytes(id: number): number[] {
  const out: number[] = [];
  let n = id;
  while (n > 0) {
    out.unshift(n % 256);
    n = Math.floor(n / 256);
  }
  return out;
}

// A size as a variable-length integer: the shortest form that can hold n.
function sizeVint(n: number): number[] {
  let len = 1;
  while (n >= 2 ** (7 * len) - 1) len++;
  const out: number[] = [];
  let v = n;
  for (let i = 0; i < len; i++) {
    out.unshift(v % 256);
    v = Math.floor(v / 256);
  }
  out[0] |= 1 << (8 - len);
  return out;
}

// 8 bytes, big-endian.
function u64(n: number): number[] {
  const out: number[] = [];
  for (let s = 56; s >= 0; s -= 8) out.push(Math.floor(n / 2 ** s) % 256);
  return out;
}

// A size in the fixed 8-byte form (0x01 then 7 bytes), so it can be patched later without moving anything.
function fixedSize(n: number): number[] {
  return [0x01, ...u64(n).slice(1)];
}

function cat(...parts: (Uint8Array | number[])[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

function el(id: number, ...parts: (Uint8Array | number[])[]): Uint8Array {
  const body = cat(...parts);
  return cat(idBytes(id), sizeVint(body.length), body);
}

function uint(id: number, v: number): Uint8Array {
  const bytes: number[] = [];
  let n = v;
  do {
    bytes.unshift(n % 256);
    n = Math.floor(n / 256);
  } while (n > 0);
  return el(id, bytes);
}

function str(id: number, s: string): Uint8Array {
  return el(id, enc.encode(s));
}

function text(b: Uint8Array | undefined): string {
  return b ? new TextDecoder().decode(b).replace(/\0+$/, '') : '';
}

// Child elements with their offsets inside `b`, so raw bytes can be copied with subarray.
function elements(b: Uint8Array): { id: number; start: number; dataStart: number; end: number }[] {
  const out: { id: number; start: number; dataStart: number; end: number }[] = [];
  let at = 0;
  while (at < b.length) {
    const h = headerAt(b, at, 0);
    if (!h) break;
    const end = h.unknown ? b.length : Math.min(b.length, h.dataStart + h.size);
    out.push({ id: h.id, start: at, dataStart: h.dataStart, end });
    at = end;
  }
  return out;
}

interface Kid {
  id: number;
  bytes: Uint8Array;
  data: Uint8Array;
}

interface Entry {
  number: number;
  type: number;
  uid: number;
  bytes: Uint8Array;
  kids: Kid[];
}

// Every TrackEntry in a Tracks body, with its raw bytes and its children.
function trackEntries(tracksBody: Uint8Array): Entry[] {
  const out: Entry[] = [];
  for (const e of elements(tracksBody)) {
    if (e.id !== ID.TRACK_ENTRY) continue;
    const body = tracksBody.subarray(e.dataStart, e.end);
    const kids: Kid[] = elements(body).map((k) => ({
      id: k.id,
      bytes: body.subarray(k.start, k.end),
      data: body.subarray(k.dataStart, k.end),
    }));
    const num = (id: number) => {
      const k = kids.find((x) => x.id === id);
      return k ? uintOf(k.data) : 0;
    };
    out.push({
      number: num(ID.TRACK_NUMBER),
      type: num(ID.TRACK_TYPE),
      uid: num(X.TRACK_UID),
      bytes: tracksBody.subarray(e.start, e.end),
      kids,
    });
  }
  return out;
}

// Which track a block belongs to, read from the first bytes of a BlockGroup body.
function blockTrackOf(group: Uint8Array): number | null {
  for (const c of elements(group)) {
    if (c.id !== ID.BLOCK) continue;
    const tn = readVint(group, c.dataStart, false);
    return tn ? tn.value : null;
  }
  return null;
}

// Tracks in a file as the page lists them. Reads the track list only, not the film.
export async function listTracks(src: MkvSource): Promise<
  { number: number; type: number; codec: string; language: string; name: string; isDefault: boolean; forced: boolean }[]
> {
  const r = new Reader(src);
  const head = await r.get(0, 12);
  if (head.length < 4 || head[0] !== 0x1a || head[1] !== 0x45 || head[2] !== 0xdf || head[3] !== 0xa3) {
    throw new Error('This is not an MKV or WebM file.');
  }
  const ebml = headerAt(head, 0, 0);
  if (!ebml || ebml.unknown) throw new Error('This is not an MKV or WebM file.');
  const segAt = ebml.dataStart + ebml.size;
  const seg = headerAt(await r.get(segAt, 12), 0, segAt);
  if (!seg || seg.id !== ID.SEGMENT) throw new Error('This MKV has no Segment.');
  const segEnd = seg.unknown ? src.size : Math.min(src.size, seg.dataStart + seg.size);
  let p = seg.dataStart;
  while (p < segEnd) {
    const h = headerAt(await r.get(p, 12), 0, p);
    if (!h || h.id === ID.CLUSTER) break;
    if (h.id === ID.TRACKS) {
      if (h.unknown || h.size > 1 << 20) throw new Error('This MKV track list is damaged.');
      const body = await r.get(h.dataStart, h.size);
      return trackEntries(body).map((e) => {
        const field = (id: number) => e.kids.find((k) => k.id === id)?.data;
        const flag = (id: number, missing: boolean) => {
          const f = field(id);
          return f ? uintOf(f) === 1 : missing;
        };
        return {
          number: e.number,
          type: e.type,
          codec: text(field(ID.CODEC_ID)),
          language: text(field(ID.LANGUAGE)) || 'eng',
          name: text(field(ID.NAME)),
          isDefault: flag(ID.FLAG_DEFAULT, true),
          forced: flag(ID.FLAG_FORCED, false),
        };
      });
    }
    if (h.unknown) break;
    p = h.dataStart + h.size;
  }
  return [];
}

// What the walk over the source keeps, in file order.
type Item =
  | { kind: 'copy'; id: number; start: number; end: number }
  | { kind: 'tracks'; body: Uint8Array }
  | { kind: 'cues'; body: Uint8Array }
  | { kind: 'cluster'; oldRel: number; ts: number; ranges: { start: number; end: number }[]; tsEnd: number };

function addRange(ranges: { start: number; end: number }[], start: number, end: number) {
  const last = ranges[ranges.length - 1];
  if (last && last.end === start) last.end = end;
  else ranges.push({ start, end });
}

// The last cluster whose timestamp is at or before t, or -1.
function lastAtOrBefore(clusters: { ts: number }[], t: number): number {
  let lo = 0;
  let hi = clusters.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (clusters[mid].ts <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

// Writes the source with the added tracks and without the removed ones.
export async function editMkv(
  src: MkvSource,
  opts: EditOptions,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<{ parts: Part[]; size: number; numbers: number[] }> {
  const r = new Reader(src);
  const size = src.size;
  const head = await r.get(0, 12);
  if (head.length < 4 || head[0] !== 0x1a || head[1] !== 0x45 || head[2] !== 0xdf || head[3] !== 0xa3) {
    throw new Error('This is not an MKV or WebM file.');
  }
  const ebml = headerAt(head, 0, 0);
  if (!ebml || ebml.unknown) throw new Error('This is not an MKV or WebM file.');
  const ebmlEnd = ebml.dataStart + ebml.size;
  // Walk top-level elements to find the Segment.
  let p = ebmlEnd;
  let seg: ReturnType<typeof headerAt> | null = null;
  while (p < size) {
    const h = headerAt(await r.get(p, 12), 0, p);
    if (!h) break;
    if (h.id === ID.SEGMENT) {
      seg = h;
      break;
    }
    if (h.unknown) break;
    p = h.dataStart + h.size;
  }
  if (!seg || seg.id !== ID.SEGMENT) throw new Error('This MKV has no Segment.');
  const oldSegData = seg.dataStart;
  const segEnd = seg.unknown ? size : Math.min(size, seg.dataStart + seg.size);

  const removed = new Set(opts.remove);
  const items: Item[] = [];
  let scale = 1000000;
  let tracksBody: Uint8Array | null = null;
  let entries: Entry[] = [];
  let clusterCount = 0;

  // Reads a cluster's children. Blocks of removed tracks are left out; the rest keep their bytes.
  async function readCluster(dataStart: number, bodyEnd: number, pos: number): Promise<Item> {
    const ranges: { start: number; end: number }[] = [];
    let ts = -1;
    let tsEnd = -1;
    let at = dataStart;
    while (at < bodyEnd) {
      const c = headerAt(await r.get(at, 16), 0, at);
      if (!c || c.unknown || c.dataStart + c.size > bodyEnd) throw new Error('This MKV is damaged.');
      const cEnd = c.dataStart + c.size;
      let keep = true;
      if (c.id === ID.TIMESTAMP) {
        ts = uintOf(await r.get(c.dataStart, c.size));
        tsEnd = cEnd;
      } else if (c.id === X.CRC32 || c.id === X.POSITION || c.id === X.PREV_SIZE) {
        keep = false;
      } else if (c.id === ID.SIMPLE_BLOCK) {
        const tn = readVint(await r.get(c.dataStart, 8), 0, false);
        keep = !(tn !== null && removed.has(tn.value));
      } else if (c.id === ID.BLOCK_GROUP) {
        const tn = blockTrackOf(await r.get(c.dataStart, 32));
        keep = !(tn !== null && removed.has(tn));
      }
      if (keep) addRange(ranges, at, cEnd);
      at = cEnd;
    }
    if (ts < 0) throw new Error('This MKV is damaged.');
    return { kind: 'cluster', oldRel: pos - oldSegData, ts, ranges, tsEnd };
  }

  // Pass 1: the top level of the segment, read by header only.
  let pos = oldSegData;
  let lastReport = 0;
  while (pos < segEnd) {
    if (pos - lastReport >= CHUNK) {
      signal?.throwIfAborted();
      onProgress?.(pos, size);
      lastReport = pos;
    }
    const h = headerAt(await r.get(pos, 12), 0, pos);
    if (!h) break;
    if (h.unknown) {
      throw new Error('This file was saved while it was being recorded, so its parts have no stated size. This page cannot edit it.');
    }
    const end = h.dataStart + h.size;
    if (end > segEnd) throw new Error('This MKV is damaged.');

    if (h.id === X.SEEK_HEAD || h.id === X.VOID || h.id === X.CRC32) {
      // Dropped: the seek head is rebuilt and the others are not needed.
    } else if (h.id === ID.CLUSTER) {
      if (!tracksBody) throw new Error('This MKV layout is not supported.');
      items.push(await readCluster(h.dataStart, end, pos));
      clusterCount++;
    } else if (h.id === ID.INFO) {
      const body = await r.get(h.dataStart, h.size);
      for (const c of children(body)) if (c.id === ID.TIMESTAMP_SCALE) scale = uintOf(c.data) || scale;
      items.push({ kind: 'copy', id: h.id, start: pos, end });
    } else if (h.id === ID.TRACKS) {
      if (h.size > 1 << 20) throw new Error('This MKV track list is damaged.');
      tracksBody = await r.get(h.dataStart, h.size);
      entries = trackEntries(tracksBody);
      for (const n of removed) {
        const e = entries.find((x) => x.number === n);
        if (!e || e.type !== TRACK_TYPE_SUBTITLE) throw new Error('Only subtitle tracks can be removed.');
      }
      items.push({ kind: 'tracks', body: tracksBody });
    } else if (h.id === X.CUES) {
      if (h.size <= 64 << 20) items.push({ kind: 'cues', body: await r.get(h.dataStart, h.size) });
    } else {
      items.push({ kind: 'copy', id: h.id, start: pos, end });
    }
    pos = end;
  }
  if (!tracksBody) throw new Error('This MKV has no track list.');
  if (clusterCount === 0) throw new Error('This MKV has no video or audio data.');
  const clusters = items.filter((i): i is Extract<Item, { kind: 'cluster' }> => i.kind === 'cluster');

  // Pass 2: numbers and UIDs for the new tracks, and the new Tracks element.
  const maxExisting = entries.reduce((m, e) => Math.max(m, e.number), 0);
  const uids = new Set(entries.map((e) => e.uid));
  const numbers: number[] = [];
  const addedEntries: Uint8Array[] = [];
  opts.add.forEach((a, i) => {
    const n = maxExisting + 1 + i;
    if (n > 126) throw new Error('This MKV has too many tracks.');
    let uid = 0x53460000 + n;
    while (uids.has(uid)) uid++;
    uids.add(uid);
    numbers.push(n);
    addedEntries.push(
      el(
        ID.TRACK_ENTRY,
        uint(ID.TRACK_NUMBER, n),
        uint(X.TRACK_UID, uid),
        uint(ID.TRACK_TYPE, TRACK_TYPE_SUBTITLE),
        uint(ID.FLAG_DEFAULT, a.isDefault ? 1 : 0),
        uint(ID.FLAG_FORCED, a.forced ? 1 : 0),
        uint(X.FLAG_LACING, 0),
        str(ID.CODEC_ID, a.codec),
        str(ID.LANGUAGE, a.language),
        a.name ? str(ID.NAME, a.name) : [],
        a.codecPrivate ? str(ID.CODEC_PRIVATE, a.codecPrivate) : [],
      ),
    );
  });

  // Default flags: when an added track is default, or the page picks a default, subtitle tracks get FlagDefault set again.
  const rewriteDefaults = opts.add.some((a) => a.isDefault) || opts.defaultExisting !== undefined;
  const keptEntries: Uint8Array[] = [];
  for (const e of entries) {
    if (removed.has(e.number)) continue;
    if (rewriteDefaults && e.type === TRACK_TYPE_SUBTITLE) {
      const kids = e.kids.filter((k) => k.id !== ID.FLAG_DEFAULT).map((k) => k.bytes);
      keptEntries.push(el(ID.TRACK_ENTRY, ...kids, uint(ID.FLAG_DEFAULT, e.number === opts.defaultExisting ? 1 : 0)));
    } else {
      keptEntries.push(e.bytes);
    }
  }
  const tracksBytes = el(ID.TRACKS, ...keptEntries, ...addedEntries);

  // Blocks for the added cues, placed in the cluster that holds their time.
  const scaleTicks = (ms: number) => Math.round((ms * 1e6) / scale);
  const added: { t: number; d: number; n: number; payload: Uint8Array }[] = [];
  opts.add.forEach((a, i) => {
    for (const c of a.cues) {
      added.push({
        t: scaleTicks(c.start),
        d: Math.max(1, scaleTicks(c.end - c.start)),
        n: numbers[i],
        payload: enc.encode(c.text),
      });
    }
  });
  added.sort((x, y) => x.t - y.t);
  const adds: Uint8Array[][] = clusters.map(() => []);
  const extras: { ts: number; blocks: Uint8Array[] }[][] = clusters.map(() => []);
  const blockOf = (a: { n: number; d: number; payload: Uint8Array }, rel: number) => {
    const v = rel < 0 ? rel + 0x10000 : rel;
    return el(ID.BLOCK_GROUP, el(ID.BLOCK, [0x80 | a.n, (v >> 8) & 0xff, v & 0xff, 0x00], a.payload), uint(ID.BLOCK_DURATION, a.d));
  };
  for (const a of added) {
    let i = lastAtOrBefore(clusters, a.t);
    if (i < 0) i = 0;
    const rel = a.t - clusters[i].ts;
    if (rel >= -32768 && rel <= 32767) {
      adds[i].push(blockOf(a, rel));
      continue;
    }
    // Too far from its cluster for a 16-bit time: it goes into an extra cluster right after it.
    const list = extras[i];
    const last = list[list.length - 1];
    if (last && a.t - last.ts <= 32767) last.blocks.push(blockOf(a, a.t - last.ts));
    else list.push({ ts: a.t, blocks: [blockOf(a, 0)] });
  }
  const addBytes = adds.map((a) => cat(...a));
  const extraBytes = extras.map((list) => cat(...list.map((x) => el(ID.CLUSTER, uint(ID.TIMESTAMP, x.ts), ...x.blocks))));
  const clusterBody = (i: number) => {
    let n = addBytes[i].length + extraBytes[i].length;
    for (const rg of clusters[i].ranges) n += rg.end - rg.start;
    return n;
  };

  // Cues: only the points that still land on a kept cluster.
  const cuesItem = items.find((i): i is Extract<Item, { kind: 'cues' }> => i.kind === 'cues');
  const buildCues = (posOf: (oldRel: number) => number): Uint8Array | null => {
    if (!cuesItem) return null;
    const points: Uint8Array[] = [];
    for (const cp of elements(cuesItem.body)) {
      if (cp.id !== X.CUE_POINT) continue;
      const cpBody = cuesItem.body.subarray(cp.dataStart, cp.end);
      const kids = elements(cpBody);
      const time = kids.find((k) => k.id === X.CUE_TIME);
      if (!time) continue;
      const kept: Uint8Array[] = [];
      for (const ctp of kids) {
        if (ctp.id !== X.CUE_TRACK_POSITIONS) continue;
        const ctpBody = cpBody.subarray(ctp.dataStart, ctp.end);
        const fields = elements(ctpBody);
        const tk = fields.find((f) => f.id === X.CUE_TRACK);
        const cpos = fields.find((f) => f.id === X.CUE_CLUSTER_POSITION);
        if (!tk || !cpos) continue;
        const track = uintOf(ctpBody.subarray(tk.dataStart, tk.end));
        const position = uintOf(ctpBody.subarray(cpos.dataStart, cpos.end));
        if (removed.has(track) || !clusters.some((c) => c.oldRel === position)) continue;
        kept.push(el(X.CUE_TRACK_POSITIONS, uint(X.CUE_TRACK, track), el(X.CUE_CLUSTER_POSITION, u64(posOf(position)))));
      }
      if (kept.length) points.push(el(X.CUE_POINT, cpBody.subarray(time.start, time.end), ...kept));
    }
    return points.length ? el(X.CUES, ...points) : null;
  };
  // Positions are always 8 bytes, so the size does not depend on where the clusters land.
  const cuesSize = buildCues(() => 0);

  // Layout: every top-level item after the seek head, with its length.
  const order: { item: Item; id: number; len: number }[] = [];
  for (const it of items) {
    if (it.kind === 'cues' && !cuesSize) continue;
    if (it.kind === 'copy') order.push({ item: it, id: it.id, len: it.end - it.start });
    else if (it.kind === 'tracks') order.push({ item: it, id: ID.TRACKS, len: tracksBytes.length });
    else if (it.kind === 'cues') order.push({ item: it, id: X.CUES, len: cuesSize?.length ?? 0 });
    else {
      const i = clusters.indexOf(it);
      order.push({ item: it, id: ID.CLUSTER, len: 12 + clusterBody(i) });
    }
  }
  const targets = [ID.INFO, ID.TRACKS, X.CHAPTERS, X.ATTACHMENTS, X.TAGS, X.CUES].filter((id) =>
    order.some((o) => o.id === id),
  );
  const seekHeadOf = (posOf: (id: number) => number) =>
    el(X.SEEK_HEAD, ...targets.map((id) => el(X.SEEK, el(X.SEEK_ID, idBytes(id)), el(X.SEEK_POSITION, u64(posOf(id))))));
  const seekHeadSize = seekHeadOf(() => 0).length;

  const offsetOf = new Map<number, number>();
  const clusterAt = new Map<number, number>();
  let off = seekHeadSize;
  for (const o of order) {
    if (!offsetOf.has(o.id)) offsetOf.set(o.id, off);
    if (o.item.kind === 'cluster') clusterAt.set(o.item.oldRel, off);
    off += o.len;
  }
  const segBodySize = off;
  const seekHead = seekHeadOf((id) => offsetOf.get(id) ?? 0);
  const cuesBytes = buildCues((p) => clusterAt.get(p) ?? 0);

  // Parts, in file order. Adjacent source ranges are joined.
  const parts: Part[] = [];
  const push = (p: Part) => {
    const last = parts[parts.length - 1];
    if (!(p instanceof Uint8Array) && last && !(last instanceof Uint8Array) && last.end === p.start) {
      last.end = p.end;
    } else {
      parts.push(p instanceof Uint8Array ? p : { start: p.start, end: p.end });
    }
  };
  push({ start: 0, end: ebmlEnd });
  push(cat([0x18, 0x53, 0x80, 0x67], fixedSize(segBodySize)));
  push(seekHead);
  for (const o of order) {
    const it = o.item;
    if (it.kind === 'copy') {
      push({ start: it.start, end: it.end });
    } else if (it.kind === 'tracks') {
      push(tracksBytes);
    } else if (it.kind === 'cues') {
      if (cuesBytes) push(cuesBytes);
    } else {
      const i = clusters.indexOf(it);
      push(cat([0x1f, 0x43, 0xb6, 0x75], fixedSize(clusterBody(i))));
      // The adds go right after the cluster's timestamp.
      let inserted = false;
      const insertAdds = () => {
        if (inserted) return;
        inserted = true;
        if (addBytes[i].length) push(addBytes[i]);
      };
      for (const rg of it.ranges) {
        if (rg.start < it.tsEnd && rg.end > it.tsEnd) {
          push({ start: rg.start, end: it.tsEnd });
          insertAdds();
          push({ start: it.tsEnd, end: rg.end });
        } else {
          if (rg.start >= it.tsEnd) insertAdds();
          push({ start: rg.start, end: rg.end });
        }
      }
      insertAdds();
      if (extraBytes[i].length) push(extraBytes[i]);
    }
  }
  const total = parts.reduce((n, p) => n + (p instanceof Uint8Array ? p.length : p.end - p.start), 0);
  return { parts, size: total, numbers };
}

// Maps the parsed text of a subtitle file to a track: ASS and SSA keep their style lines, anything else becomes plain UTF-8 text.
export function textTrack(text: string, fileName: string): Pick<AddTrack, 'codec' | 'codecPrivate' | 'cues'> {
  const clean = text.trimStart();
  if (clean.startsWith('[Script Info]')) {
    const lines = clean.split(/\r?\n/);
    const firstDialogue = lines.findIndex((l) => l.trimStart().startsWith('Dialogue:'));
    const header = firstDialogue < 0 ? lines : lines.slice(0, firstDialogue);
    const scriptType = header.find((l) => /^\s*ScriptType:/i.test(l)) ?? '';
    const codec = /ScriptType:\s*v4\.00(?!\+)/i.test(scriptType) ? 'S_TEXT/SSA' : 'S_TEXT/ASS';
    const codecPrivate = header.join('\n').replace(/\s+$/, '') + '\n';
    const cues: { start: number; end: number; text: string }[] = [];
    const ms = (t: string): number | null => {
      const m = /^(\d+):(\d{1,2}):(\d{1,2})\.(\d{1,2})$/.exec(t.trim());
      if (!m) return null;
      return (Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) * 1000 + Number(m[4]) * 10;
    };
    let order = 0;
    for (const line of lines) {
      const trimmed = line.trimStart();
      if (!trimmed.startsWith('Dialogue:')) continue;
      const f = trimmed.slice('Dialogue:'.length).trimStart().split(',');
      const start = ms(f[1] ?? '');
      const end = ms(f[2] ?? '');
      if (start === null || end === null) continue;
      // Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text. The text may hold commas.
      const [layer, , , style, name, ml, mr, mv, effect] = f;
      const body = f.slice(9).join(',');
      cues.push({ start, end, text: `${order},${layer},${style},${name},${ml},${mr},${mv},${effect},${body}` });
      order++;
    }
    if (!cues.length) throw new Error('No subtitle lines found in ' + fileName + '.');
    return { codec, codecPrivate, cues };
  }
  const captions = parse(text, 23.976, { name: fileName }).captions;
  if (!captions.length) throw new Error('No subtitle lines found in ' + fileName + '.');
  return {
    codec: 'S_TEXT/UTF8',
    codecPrivate: '',
    cues: captions.map((c) => ({ start: c.start, end: c.end, text: c.text })),
  };
}

const LANG_ALIAS: Record<string, string> = { fra: 'fre', deu: 'ger' };

// The language from a file name such as "Movie.en.srt" or "Film.spa.forced.srt". Falls back to 'und'.
export function guessLanguage(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  if (parts.length > 1) parts.pop();
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.length !== 2 && p.length !== 3) continue;
    const code = LANG_ALIAS[p] ?? p;
    const hit = LANGS.find(([three, two]) => three === code || two === p);
    if (hit) return hit[0];
  }
  return 'und';
}
