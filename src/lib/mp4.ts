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
function kids(buf: Uint8Array): Box[] {
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
function find(buf: Uint8Array, ...path: string[]): Uint8Array | null {
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

export async function scanMp4(
  src: MkvSource,
  _onProgress?: (done: number, total: number) => void,
  _signal?: AbortSignal,
): Promise<{ tracks: MkvTrack[]; cues: Map<number, MkvCue[]>; codecPrivate: Map<number, string>; skipped: number }> {
  const moov = await readIndex(src);
  const boxes = kids(moov);
  if (boxes.some((b) => b.type === 'mvex')) {
    throw new Error('This MP4 is split into fragments, as many streaming downloads are. This tool reads regular MP4 files only.');
  }

  const tracks: MkvTrack[] = [];
  for (const trak of boxes.filter((b) => b.type === 'trak')) {
    const tkhd = find(trak.data, 'tkhd');
    const mdhd = find(trak.data, 'mdia', 'mdhd');
    const hdlr = find(trak.data, 'mdia', 'hdlr');
    const stsd = find(trak.data, 'mdia', 'minf', 'stbl', 'stsd');
    if (!tkhd || !mdhd || !hdlr || !stsd) continue;

    const handler = fourCC(hdlr, 8);
    if (!TEXT_HANDLERS.has(handler)) continue;

    const number = view(tkhd).getUint32(tkhd[0] === 1 ? 20 : 12);
    const codec = fourCC(stsd, 12);
    const encrypted = codec === 'encs' || codec === 'enct';
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
  }
  tracks.sort((a, b) => a.number - b.number);

  const codecPrivate = new Map<number, string>();
  for (const t of tracks) codecPrivate.set(t.number, '');
  return { tracks, cues: new Map(), codecPrivate, skipped: 0 };
}
