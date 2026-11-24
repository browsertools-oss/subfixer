// Reads the subtitle tracks of an MKV (Matroska) or WebM file without loading the whole file.
// Video and audio blocks are skipped by moving the read position, never read.

import { build, parse, type Caption } from './subs.ts';

export interface MkvSource {
  size: number;
  read(offset: number, length: number): Promise<Uint8Array>;
}

const CHUNK = 1 << 20;

export interface MkvTrack {
  number: number;
  codec: string;
  language: string;
  name: string;
  isDefault: boolean;
  forced: boolean;
  kind: 'srt' | 'ass' | 'vtt' | 'picture' | 'other';
  encrypted: boolean;
}

export interface MkvCue {
  start: number;
  end: number;
  data: Uint8Array;
}

// IDs (Matroska and EBML). Each is the element ID with its length marker bit kept.
const ID = {
  EBML: 0x1a45dfa3,
  SEGMENT: 0x18538067,
  INFO: 0x1549a966,
  TIMESTAMP_SCALE: 0x2ad7b1,
  TRACKS: 0x1654ae6b,
  TRACK_ENTRY: 0xae,
  TRACK_NUMBER: 0xd7,
  TRACK_TYPE: 0x83,
  CODEC_ID: 0x86,
  CODEC_PRIVATE: 0x63a2,
  LANGUAGE: 0x22b59c,
  NAME: 0x536e,
  FLAG_DEFAULT: 0x88,
  FLAG_FORCED: 0x55aa,
  CONTENT_ENCODINGS: 0x6d80,
  CONTENT_ENCODING: 0x6240,
  CONTENT_COMPRESSION: 0x5034,
  CONTENT_COMP_ALGO: 0x4254,
  CONTENT_COMP_SETTINGS: 0x4255,
  CONTENT_ENCRYPTION: 0x5035,
  CLUSTER: 0x1f43b675,
  TIMESTAMP: 0xe7,
  SIMPLE_BLOCK: 0xa3,
  BLOCK_GROUP: 0xa0,
  BLOCK: 0xa1,
  BLOCK_DURATION: 0x9b,
};

const TRACK_TYPE_SUBTITLE = 17;

interface Vint {
  value: number;
  length: number;
  unknown: boolean;
}

// Element IDs keep the marker bit; sizes and track numbers drop it.
function readVint(b: Uint8Array, at: number, keepMarker: boolean): Vint | null {
  const first = b[at];
  if (first === undefined || first === 0) return null;
  let length = 1;
  while (!(first & (0x80 >> (length - 1)))) length++;
  if (at + length > b.length) return null;
  const mask = 0xff >> length;
  let value = keepMarker ? first : first & mask;
  let allOnes = (first & mask) === mask;
  for (let i = 1; i < length; i++) {
    value = value * 256 + b[at + i];
    if (b[at + i] !== 0xff) allOnes = false;
  }
  return { value, length, unknown: !keepMarker && allOnes };
}

interface Element {
  id: number;
  idLength: number;
  dataStart: number;
  size: number;
  unknown: boolean;
}

// Reads one element header at `at` in `b`, where `base` is the file offset of b[0].
function headerAt(b: Uint8Array, at: number, base: number): Element | null {
  const id = readVint(b, at, true);
  if (!id || id.length > 4) return null;
  const size = readVint(b, at + id.length, false);
  if (!size) return null;
  return {
    id: id.value,
    idLength: id.length,
    dataStart: base + at + id.length + size.length,
    size: size.value,
    unknown: size.unknown,
  };
}

// Lists the child elements of a byte range. An element of unknown size runs to the end of the range.
function children(b: Uint8Array): { id: number; data: Uint8Array }[] {
  const out: { id: number; data: Uint8Array }[] = [];
  let at = 0;
  while (at < b.length) {
    const h = headerAt(b, at, 0);
    if (!h) break;
    const start = h.dataStart;
    const end = h.unknown ? b.length : Math.min(b.length, start + h.size);
    out.push({ id: h.id, data: b.subarray(start, end) });
    at = end;
  }
  return out;
}

function uintOf(b: Uint8Array): number {
  let v = 0;
  for (const x of b) v = v * 256 + x;
  return v;
}

function textOf(b: Uint8Array): string {
  return new TextDecoder().decode(b).replace(/\0+$/, '');
}

function kindOf(codec: string): MkvTrack['kind'] {
  if (codec === 'S_TEXT/UTF8') return 'srt';
  if (codec === 'S_TEXT/ASS' || codec === 'S_TEXT/SSA') return 'ass';
  if (codec === 'S_TEXT/WEBVTT') return 'vtt';
  if (codec === 'S_HDMV/PGS' || codec === 'S_VOBSUB' || codec === 'S_DVBSUB') return 'picture';
  return 'other';
}

interface ParsedTrack {
  info: MkvTrack;
  type: number;
  codecPrivate: string;
  compression: { algo: number; settings: Uint8Array } | null;
}

function parseTrackEntry(b: Uint8Array): ParsedTrack {
  const t: ParsedTrack = {
    info: {
      number: 0, codec: '', language: 'eng', name: '', isDefault: true, forced: false, kind: 'other', encrypted: false,
    },
    type: 0,
    codecPrivate: '',
    compression: null,
  };
  for (const c of children(b)) {
    if (c.id === ID.TRACK_NUMBER) t.info.number = uintOf(c.data);
    else if (c.id === ID.TRACK_TYPE) t.type = uintOf(c.data);
    else if (c.id === ID.CODEC_ID) t.info.codec = textOf(c.data);
    else if (c.id === ID.CODEC_PRIVATE) t.codecPrivate = textOf(c.data);
    else if (c.id === ID.LANGUAGE) t.info.language = textOf(c.data) || 'eng';
    else if (c.id === ID.NAME) t.info.name = textOf(c.data);
    else if (c.id === ID.FLAG_DEFAULT) t.info.isDefault = uintOf(c.data) === 1;
    else if (c.id === ID.FLAG_FORCED) t.info.forced = uintOf(c.data) === 1;
    else if (c.id === ID.CONTENT_ENCODINGS) {
      for (const enc of children(c.data)) {
        if (enc.id !== ID.CONTENT_ENCODING) continue;
        for (const e of children(enc.data)) {
          if (e.id === ID.CONTENT_ENCRYPTION) t.info.encrypted = true;
          if (e.id !== ID.CONTENT_COMPRESSION) continue;
          let algo = 0;
          let settings = new Uint8Array(0);
          for (const f of children(e.data)) {
            if (f.id === ID.CONTENT_COMP_ALGO) algo = uintOf(f.data);
            if (f.id === ID.CONTENT_COMP_SETTINGS) settings = f.data;
          }
          t.compression = { algo, settings };
        }
      }
    }
  }
  t.info.kind = kindOf(t.info.codec);
  return t;
}

// Only subtitle tracks are kept in the result.
function parseTracks(b: Uint8Array): ParsedTrack[] {
  const out: ParsedTrack[] = [];
  for (const c of children(b)) {
    if (c.id !== ID.TRACK_ENTRY) continue;
    const parsed = parseTrackEntry(c.data);
    if (parsed.type === TRACK_TYPE_SUBTITLE || parsed.info.codec.startsWith('S_')) out.push(parsed);
  }
  return out;
}

class Reader {
  private src: MkvSource;
  private win: { start: number; bytes: Uint8Array } = { start: 0, bytes: new Uint8Array(0) };

  constructor(src: MkvSource) {
    this.src = src;
  }

  async get(off: number, len: number): Promise<Uint8Array> {
    if (off >= this.src.size) return new Uint8Array(0);
    const end = Math.min(off + len, this.src.size);
    const w = this.win;
    if (off >= w.start && end <= w.start + w.bytes.length) {
      return w.bytes.subarray(off - w.start, end - w.start);
    }
    const want = Math.min(Math.max(len, CHUNK), this.src.size - off);
    const bytes = await this.src.read(off, want);
    this.win = { start: off, bytes };
    return bytes.subarray(0, Math.min(end - off, bytes.length));
  }
}

async function lazyFflate() {
  return import('fflate');
}

export async function scanMkv(
  src: MkvSource,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<{
  tracks: MkvTrack[];
  cues: Map<number, MkvCue[]>;
  codecPrivate: Map<number, string>;
  skipped: number;
}> {
  const r = new Reader(src);
  const size = src.size;
  const head = await r.get(0, 4);
  if (head.length < 4 || head[0] !== 0x1a || head[1] !== 0x45 || head[2] !== 0xdf || head[3] !== 0xa3) {
    throw new Error('This is not an MKV or WebM file.');
  }

  let scale = 1000000;
  let clusterTime = 0;
  let skipped = 0;
  let pos = 0;
  let lastReport = -CHUNK;
  const parsed = new Map<number, ParsedTrack>();
  const cues = new Map<number, MkvCue[]>();

  // Turns a block's payload into the text the track holds.
  async function payloadOf(track: ParsedTrack, raw: Uint8Array): Promise<Uint8Array> {
    const comp = track.compression;
    if (!comp) return raw.slice();
    if (comp.algo === 0) {
      const { unzlibSync } = await lazyFflate();
      return unzlibSync(raw);
    }
    if (comp.algo === 3) {
      const out = new Uint8Array(comp.settings.length + raw.length);
      out.set(comp.settings, 0);
      out.set(raw, comp.settings.length);
      return out;
    }
    throw new Error('compression');
  }

  // block: track number, 2-byte relative time, flags, payload.
  async function addBlock(block: Uint8Array, durationTicks: number | null): Promise<void> {
    const tn = readVint(block, 0, false);
    if (!tn) return;
    const track = parsed.get(tn.value);
    if (!track || track.info.encrypted) return;
    const flags = block[tn.length + 2];
    if (flags & 0x06) {
      skipped++;
      return;
    }
    const rel = (block[tn.length] << 8) | block[tn.length + 1];
    const relSigned = rel >= 0x8000 ? rel - 0x10000 : rel;
    const start = Math.round(((clusterTime + relSigned) * scale) / 1e6);
    const end = durationTicks === null ? -1 : start + Math.round((durationTicks * scale) / 1e6);
    const data = await payloadOf(track, block.subarray(tn.length + 3));
    const list = cues.get(tn.value) ?? [];
    list.push({ start, end, data });
    cues.set(tn.value, list);
  }

  while (pos < size) {
    if (onProgress && pos - lastReport >= CHUNK) {
      signal?.throwIfAborted();
      onProgress(pos, size);
      lastReport = pos;
    }
    const hb = await r.get(pos, 12);
    const h = headerAt(hb, 0, pos);
    if (!h) break;
    const end = h.unknown ? size : h.dataStart + h.size;

    if (h.id === ID.SEGMENT || h.id === ID.CLUSTER) {
      if (h.id === ID.CLUSTER) clusterTime = 0;
      pos = h.dataStart;
      continue;
    }
    if (h.id === ID.INFO || h.id === ID.TRACKS) {
      if (h.unknown) break;
      const body = await r.get(h.dataStart, h.size);
      if (h.id === ID.INFO) {
        for (const c of children(body)) if (c.id === ID.TIMESTAMP_SCALE) scale = uintOf(c.data) || scale;
      } else {
        for (const t of parseTracks(body)) parsed.set(t.info.number, t);
      }
      pos = end;
      continue;
    }
    if (h.id === ID.TIMESTAMP) {
      if (h.unknown) break;
      clusterTime = uintOf(await r.get(h.dataStart, h.size));
      pos = end;
      continue;
    }
    if (h.id === ID.SIMPLE_BLOCK) {
      if (h.unknown) break;
      const first = await r.get(h.dataStart, 8);
      const tn = readVint(first, 0, false);
      const track = tn ? parsed.get(tn.value) : undefined;
      if (track && track.info.kind !== 'picture' && track.info.kind !== 'other' && !track.info.encrypted) {
        await addBlock(await r.get(h.dataStart, h.size), null);
      }
      pos = end;
      continue;
    }
    if (h.id === ID.BLOCK_GROUP) {
      if (h.unknown) break;
      const first = await r.get(h.dataStart, 16);
      let group = first;
      let blockAt = -1;
      for (let at = 0; at < first.length; ) {
        const c = headerAt(first, at, 0);
        if (!c) break;
        if (c.id === ID.BLOCK) {
          blockAt = c.dataStart;
          break;
        }
        if (c.unknown) break;
        at = c.dataStart + c.size;
      }
      if (blockAt < 0) {
        group = await r.get(h.dataStart, h.size);
        for (let at = 0; at < group.length; ) {
          const c = headerAt(group, at, 0);
          if (!c) break;
          if (c.id === ID.BLOCK) {
            blockAt = c.dataStart;
            break;
          }
          if (c.unknown) break;
          at = c.dataStart + c.size;
        }
      }
      const blockTrack = blockAt >= 0 ? readVint(group, blockAt, false) : null;
      const track = blockTrack ? parsed.get(blockTrack.value) : undefined;
      if (track && track.info.kind !== 'picture' && track.info.kind !== 'other' && !track.info.encrypted) {
        const body = await r.get(h.dataStart, h.size);
        let block: Uint8Array | null = null;
        let dur: number | null = null;
        for (const c of children(body)) {
          if (c.id === ID.BLOCK) block = c.data;
          if (c.id === ID.BLOCK_DURATION) dur = uintOf(c.data);
        }
        if (block) await addBlock(block, dur);
      }
      pos = end;
      continue;
    }
    if (h.unknown) break;
    pos = end;
  }

  // Cues without a duration end at the next cue on the same track, or 3 s after the last one.
  for (const list of cues.values()) {
    list.sort((a, b) => a.start - b.start);
    list.forEach((c, i) => {
      if (c.end >= 0) return;
      const next = list[i + 1];
      c.end = next ? next.start : c.start + 3000;
    });
  }

  const tracks: MkvTrack[] = [];
  const codecPrivate = new Map<number, string>();
  for (const [n, t] of [...parsed.entries()].sort((a, b) => a[0] - b[0])) {
    tracks.push(t.info);
    codecPrivate.set(n, t.codecPrivate);
  }
  for (const n of [...cues.keys()]) {
    const t = parsed.get(n);
    if (!t || t.info.kind === 'picture' || t.info.kind === 'other') cues.delete(n);
  }
  return { tracks, cues, codecPrivate, skipped };
}

// ASS time: H:MM:SS.cc (centiseconds).
function assTime(ms: number): string {
  const cs = Math.max(0, Math.round(ms / 10));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

// Saves a track as SRT, VTT or ASS text. The name is the language and format suffix,
// for example ".eng.srt", to put after the video's file name.
export function trackFile(
  track: MkvTrack,
  cues: MkvCue[],
  codecPrivate: string,
): { name: string; text: string } {
  const dec = new TextDecoder();
  const lang = track.language || 'eng';
  const sorted = [...cues].sort((a, b) => a.start - b.start);

  if (track.kind === 'ass') {
    // Payload: ReadOrder,Layer,Style,Name,MarginL,MarginR,MarginV,Effect,Text
    const dialogue = sorted.map((c) => {
      const f = dec.decode(c.data).split(',');
      const text = f.slice(8).join(',').replace(/\n+$/, '');
      return `Dialogue: ${f[1]},${assTime(c.start)},${assTime(c.end)},${f[2]},${f[3]},${f[4]},${f[5]},${f[6]},${f[7]},${text}`;
    });
    const head = codecPrivate.replace(/\s+$/, '');
    const parts = [head];
    if (!/^\[Events\]/m.test(head)) {
      parts.push('', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text');
    }
    return { name: `.${lang}.ass`, text: [...parts, ...dialogue].join('\r\n') + '\r\n' };
  }

  const captions: Caption[] = sorted.map((c) => ({
    start: c.start,
    end: c.end,
    text: dec.decode(c.data).replace(/\n+$/, ''),
  }));
  if (track.kind === 'vtt') return { name: `.${lang}.vtt`, text: build(captions, 'vtt') };
  return { name: `.${lang}.srt`, text: build(captions, 'srt') };
}

// An ASS file as SRT, for a track that was saved as ASS.
export function assToSrt(text: string): string {
  return build(parse(text).captions, 'srt');
}
