// Reads the subtitle tracks of an MP4 (ISO base media) file. It reads the file's index (the moov box)
// and then only the subtitle samples. The mdat box with the audio and video is skipped by moving the
// read position, never read.

import type { MkvSource, MkvTrack, MkvCue } from './mkv.ts';

const MAX_MOOV = 64 << 20;
const MAX_SAMPLE = 1 << 20;

const TOP_LEVEL = new Set(['ftyp', 'moov', 'mdat', 'free', 'skip', 'wide']);
const TEXT_HANDLERS = new Set(['text', 'sbtl', 'subt', 'clcp']);

interface Box {
  type: string;
  data: Uint8Array;
}

function view(b: Uint8Array): DataView {
  return new DataView(b.buffer, b.byteOffset, b.byteLength);
}

function fourCC(b: Uint8Array, at: number): string {
  return String.fromCharCode(b[at], b[at + 1], b[at + 2], b[at + 3]);
}

function uint64(b: Uint8Array, at: number): number {
  const v = view(b);
  return v.getUint32(at) * 2 ** 32 + v.getUint32(at + 4);
}

// Walks the boxes inside a buffer. A size of 0 means the box runs to the end of the buffer.
export function kids(buf: Uint8Array): Box[] {
  const out: Box[] = [];
  let pos = 0;
  while (pos + 8 <= buf.length) {
    let size = view(buf).getUint32(pos);
    let head = 8;
    if (size === 1) {
      if (pos + 16 > buf.length) break;
      size = uint64(buf, pos + 8);
      head = 16;
    } else if (size === 0) {
      size = buf.length - pos;
    }
    if (size < head || pos + size > buf.length) break;
    out.push({ type: fourCC(buf, pos + 4), data: buf.subarray(pos + head, pos + size) });
    pos += size;
  }
  return out;
}

// Follows a path of box types, such as find(trak, 'mdia', 'minf', 'stbl', 'stsd'),
// and returns the data of the last box, or null.
export function find(buf: Uint8Array, ...path: string[]): Uint8Array | null {
  let cur: Uint8Array = buf;
  for (const name of path) {
    const hit = kids(cur).find((b) => b.type === name);
    if (!hit) return null;
    cur = hit.data;
  }
  return cur;
}

// The header of a top-level box at pos, read from the source: 16 bytes at most.
async function headerAt(src: MkvSource, pos: number): Promise<{ type: string; size: number; header: number } | null> {
  const b = await src.read(pos, Math.min(16, src.size - pos));
  if (b.length < 8) return null;
  let size = view(b).getUint32(0);
  let header = 8;
  if (size === 1) {
    if (b.length < 16) return null;
    size = uint64(b, 8);
    header = 16;
  } else if (size === 0) {
    size = src.size - pos;
  }
  if (size < header) return null;
  return { type: fourCC(b, 4), size, header };
}

// Walks the top-level boxes, skipping each by its size, until moov. The mdat is never read.
async function readIndex(src: MkvSource): Promise<Uint8Array> {
  let pos = 0;
  let first = true;
  while (pos < src.size) {
    const h = await headerAt(src, pos);
    if (!h) break;
    if (first) {
      if (!TOP_LEVEL.has(h.type)) throw new Error('This is not an MP4, MKV or WebM file.');
      first = false;
    }
    if (h.type === 'moov') {
      if (h.size > MAX_MOOV) throw new Error('This MP4 index is too large to read.');
      return src.read(pos + h.header, h.size - h.header);
    }
    pos += h.size;
  }
  if (first) throw new Error('This is not an MP4, MKV or WebM file.');
  throw new Error('This MP4 has no index (moov box). The file may be cut short or still downloading.');
}

function language(mdhd: Uint8Array): string {
  const v = view(mdhd);
  const packed = v[0] === 1 ? v.getUint16(32) : v.getUint16(20);
  return String.fromCharCode(((packed >> 10) & 31) + 0x60, ((packed >> 5) & 31) + 0x60, (packed & 31) + 0x60);
}

function kindOf(codec: string): MkvTrack['kind'] {
  if (codec === 'tx3g' || codec === 'text') return 'srt';
  if (codec === 'wvtt') return 'vtt';
  return 'other';
}

// The sample tables of one track, as lists: start and end in ms, byte size and file offset.
export interface Samples {
  start: number[];
  end: number[];
  size: number[];
  offset: number[];
}

// Reads the sample tables (stts, stsz, stsc, stco or co64) into per-sample lists.
export function sampleTable(stbl: Uint8Array, timescale: number): Samples | null {
  const stts = find(stbl, 'stts');
  const stsz = find(stbl, 'stsz');
  const stsc = find(stbl, 'stsc');
  const stco = find(stbl, 'stco');
  const co64 = find(stbl, 'co64');
  if (!stts || !stsz || !stsc || (!stco && !co64)) return null;

  const start: number[] = [];
  const end: number[] = [];
  const sv = view(stts);
  let t = 0;
  for (let i = 0, n = sv.getUint32(4); i < n; i++) {
    const count = sv.getUint32(8 + i * 8);
    const delta = sv.getUint32(12 + i * 8);
    for (let j = 0; j < count; j++) {
      start.push(Math.round((t * 1000) / timescale));
      end.push(Math.round(((t + delta) * 1000) / timescale));
      t += delta;
    }
  }

  const zv = view(stsz);
  const uniform = zv.getUint32(4);
  const count = Math.min(zv.getUint32(8), start.length);
  const size: number[] = [];
  for (let i = 0; i < count; i++) size.push(uniform || zv.getUint32(12 + i * 4));

  const chunkOffset: number[] = [];
  if (stco) {
    const cv = view(stco);
    for (let i = 0, n = cv.getUint32(4); i < n; i++) chunkOffset.push(cv.getUint32(8 + i * 4));
  } else if (co64) {
    const cv = view(co64);
    for (let i = 0, n = cv.getUint32(4); i < n; i++) chunkOffset.push(uint64(co64, 8 + i * 8));
  }

  const runs: { first: number; per: number }[] = [];
  const cs = view(stsc);
  for (let i = 0, n = cs.getUint32(4); i < n; i++) {
    runs.push({ first: cs.getUint32(8 + i * 12), per: cs.getUint32(12 + i * 12) });
  }

  // A chunk holds samplesPerChunk samples, taken from the last stsc run that starts at or before it.
  // The first sample sits at the chunk offset; each next one follows the previous sample.
  const offset: number[] = [];
  let s = 0;
  for (let c = 0; c < chunkOffset.length && s < count; c++) {
    let per = 0;
    for (const r of runs) if (r.first <= c + 1) per = r.per;
    let at = chunkOffset[c];
    for (let k = 0; k < per && s < count; k++) {
      offset.push(at);
      at += size[s];
      s++;
    }
  }

  const n = Math.min(count, offset.length);
  return { start: start.slice(0, n), end: end.slice(0, n), size: size.slice(0, n), offset: offset.slice(0, n) };
}

const utf8 = new TextDecoder();
const utf16 = new TextDecoder('utf-16be');

// The text of a tx3g or text sample: a 16-bit length, then the text (UTF-16 with a BOM, or UTF-8).
function timedText(data: Uint8Array): string | null {
  const n = view(data).getUint16(0);
  if (n === 0) return null;
  const bytes = data.subarray(2, 2 + n);
  const text = bytes[0] === 0xfe && bytes[1] === 0xff ? utf16.decode(bytes.subarray(2)) : utf8.decode(bytes);
  const trimmed = text.replace(/\n+$/, '');
  return trimmed === '' ? null : trimmed;
}

// The text of a WebVTT sample: each vttc box holds a payl box with the text. vtte is an empty cue.
function webvttText(data: Uint8Array): string | null {
  const lines: string[] = [];
  for (const box of kids(data)) {
    if (box.type !== 'vttc') continue;
    const payl = kids(box.data).find((b) => b.type === 'payl');
    if (payl) lines.push(utf8.decode(payl.data));
  }
  return lines.length ? lines.join('\n') : null;
}

export async function scanMp4(
  src: MkvSource,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<{ tracks: MkvTrack[]; cues: Map<number, MkvCue[]>; codecPrivate: Map<number, string>; skipped: number }> {
  const moov = await readIndex(src);
  const boxes = kids(moov);
  if (boxes.some((b) => b.type === 'mvex')) {
    throw new Error('This MP4 is split into fragments, as many streaming downloads are. This tool reads regular MP4 files only.');
  }

  const tracks: MkvTrack[] = [];
  const stbls = new Map<number, { stbl: Uint8Array; timescale: number }>();
  for (const trak of boxes.filter((b) => b.type === 'trak')) {
    const tkhd = find(trak.data, 'tkhd');
    const mdhd = find(trak.data, 'mdia', 'mdhd');
    const hdlr = find(trak.data, 'mdia', 'hdlr');
    const stbl = find(trak.data, 'mdia', 'minf', 'stbl');
    const stsd = stbl && find(stbl, 'stsd');
    if (!tkhd || !mdhd || !hdlr || !stbl || !stsd) continue;

    const handler = fourCC(hdlr, 8);
    if (!TEXT_HANDLERS.has(handler)) continue;

    const number = view(tkhd).getUint32(tkhd[0] === 1 ? 20 : 12);
    const codec = fourCC(stsd, 12);
    const encrypted = codec === 'encs' || codec === 'enct';
    const timescale = view(mdhd).getUint32(mdhd[0] === 1 ? 20 : 12);
    tracks.push({
      number,
      codec,
      language: language(mdhd),
      name: '',
      isDefault: false,
      forced: false,
      kind: encrypted ? 'other' : kindOf(codec),
      encrypted,
    });
    stbls.set(number, { stbl, timescale });
  }
  tracks.sort((a, b) => a.number - b.number);

  const cues = new Map<number, MkvCue[]>();
  const codecPrivate = new Map<number, string>();
  let skipped = 0;
  for (const t of tracks) {
    codecPrivate.set(t.number, '');
    if (t.encrypted || (t.kind !== 'srt' && t.kind !== 'vtt')) continue;
    const info = stbls.get(t.number);
    const table = info ? sampleTable(info.stbl, info.timescale) : null;
    if (!table) continue;

    const list: MkvCue[] = [];
    for (let i = 0; i < table.size.length; i++) {
      if (i % 50 === 0) {
        signal?.throwIfAborted();
        onProgress?.(i, table.size.length);
      }
      const size = table.size[i];
      if (size > MAX_SAMPLE) {
        skipped++;
        continue;
      }
      if (t.kind === 'srt' && size <= 2) continue;
      const data = await src.read(table.offset[i], size);
      const text = t.kind === 'srt' ? timedText(data) : webvttText(data);
      if (text === null) continue;
      list.push({ start: table.start[i], end: table.end[i], data: new TextEncoder().encode(text) });
    }
    if (list.length) cues.set(t.number, list);
  }

  return { tracks, cues, codecPrivate, skipped };
}
