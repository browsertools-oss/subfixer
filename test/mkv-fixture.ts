// Builds small MKV files in code, laid out the way real muxers write them.
import { zlibSync } from 'fflate';

export const UNKNOWN = [0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

export function cat(...parts: (Uint8Array | number[])[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

function idBytes(id: number): number[] {
  const out: number[] = [];
  let n = id;
  while (n > 0) {
    out.unshift(n % 256);
    n = Math.floor(n / 256);
  }
  return out;
}

function sizeBytes(n: number): number[] {
  if (n < 127) return [0x80 | n];
  const out: number[] = [0x01];
  for (let shift = 48; shift >= 0; shift -= 8) out.push(Math.floor(n / 2 ** shift) % 256);
  return out;
}

// An element with a known size. `data` is the body.
export function el(id: number, ...data: (Uint8Array | number[])[]): Uint8Array {
  const body = cat(...data);
  return cat(idBytes(id), sizeBytes(body.length), body);
}

// Element with an unknown size (used for Segment, as live muxers write it).
export function elUnknown(id: number, ...data: (Uint8Array | number[])[]): Uint8Array {
  return cat(idBytes(id), UNKNOWN, ...data);
}

export function uint(id: number, v: number): Uint8Array {
  const bytes: number[] = [];
  let n = v;
  do {
    bytes.unshift(n % 256);
    n = Math.floor(n / 256);
  } while (n > 0);
  return el(id, bytes);
}

export function str(id: number, s: string): Uint8Array {
  return el(id, new TextEncoder().encode(s));
}

// Block payload: track number (size-style vint), signed 16-bit relative time, flags, data.
export function blockBody(track: number, rel: number, data: Uint8Array | number[]): Uint8Array {
  const r = rel < 0 ? rel + 0x10000 : rel;
  return cat([0x80 | track, (r >> 8) & 0xff, r & 0xff, 0x80], data);
}

export function simpleBlock(track: number, rel: number, data: Uint8Array | number[]): Uint8Array {
  return el(0xa3, blockBody(track, rel, data));
}

export function blockGroup(track: number, rel: number, duration: number, data: Uint8Array | number[]): Uint8Array {
  return el(0xa0, el(0xa1, blockBody(track, rel, data)), uint(0x9b, duration));
}

const enc = (s: string) => new TextEncoder().encode(s);

export const ASS_HEADER = '[Script Info]\nScriptType: v4.00+\nPlayResX: 384\nPlayResY: 288\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize\nStyle: Default,Arial,20\n';

export function trackEntry(opts: {
  number: number;
  type: number;
  codec: string;
  language?: string;
  name?: string;
  isDefault: boolean;
  codecPrivate?: string;
  zlib?: boolean;
}): Uint8Array {
  const parts: Uint8Array[] = [
    uint(0xd7, opts.number),
    uint(0x73c5, opts.number),
    uint(0x83, opts.type),
    uint(0x88, opts.isDefault ? 1 : 0),
    str(0x86, opts.codec),
  ];
  if (opts.language) parts.push(str(0x22b59c, opts.language));
  if (opts.name) parts.push(str(0x536e, opts.name));
  if (opts.codecPrivate) parts.push(str(0x63a2, opts.codecPrivate));
  if (opts.zlib) {
    parts.push(el(0x6d80, el(0x6240, el(0x5034, uint(0x4254, 0)))));
  }
  return el(0xae, ...parts);
}

// The sample file. Track 1 is video, 2 to 5 are subtitles:
// 2 SRT eng default, 3 ASS fre "French", 4 PGS eng (picture), 5 SRT ger, zlib compressed.
export function sampleMkv(): Uint8Array {
  const ebml = el(0x1a45dfa3, uint(0x4287, 4), str(0x4282, 'matroska'));
  const info = el(0x1549a966, uint(0x2ad7b1, 1000000), str(0x4d80, 'fixture'));
  const tracks = el(
    0x1654ae6b,
    el(0xae, uint(0xd7, 1), uint(0x83, 1), str(0x86, 'V_MPEG4/ISO/AVC')),
    trackEntry({ number: 2, type: 17, codec: 'S_TEXT/UTF8', language: 'eng', isDefault: true }),
    trackEntry({
      number: 3,
      type: 17,
      codec: 'S_TEXT/ASS',
      language: 'fre',
      name: 'French',
      isDefault: false,
      codecPrivate: ASS_HEADER,
    }),
    trackEntry({ number: 4, type: 17, codec: 'S_VOBSUB', language: 'eng', isDefault: false }),
    trackEntry({ number: 5, type: 17, codec: 'S_TEXT/UTF8', language: 'ger', isDefault: false, zlib: true }),
  );
  const video = simpleBlock(1, 0, new Uint8Array(3 * 1024 * 1024));
  const cluster1 = el(
    0x1f43b675,
    uint(0xe7, 0),
    video,
    blockGroup(2, 1000, 1500, enc('Hello there.')),
    blockGroup(3, 1000, 1500, enc('0,0,Default,,0,0,0,,Bonjour.')),
    simpleBlock(4, 1000, new Uint8Array([1, 2, 3, 4])),
    simpleBlock(5, 1000, zlibSync(enc('Hallo.'))),
  );
  const cluster2 = el(
    0x1f43b675,
    uint(0xe7, 3000),
    blockGroup(2, 0, 1200, enc('<i>Café</i>\nsecond line')),
    blockGroup(3, 0, 1200, enc('1,0,Default,,0,0,0,,{\\an8}En haut')),
  );
  const cues = el(0x1c53bb6b, uint(0xbb, 0));
  return cat(ebml, elUnknown(0x18538067, el(0xec, new Uint8Array(10)), info, tracks, cluster1, cluster2, cues));
}

// Builds a small MKV with two PGS display sets so trackSup can round-trip them.
export function pgsMkv(sets: { start: number; end: number; segments: number[][] }[]): Uint8Array {
  const ebml = cat(el(0x1a45dfa3, uint(0x4286, 1), uint(0x42f7, 1), uint(0x42f2, 2), uint(0x42f3, 2), str(0x4282, 'matroska'), uint(0x4287, 2), uint(0x4285, 2)));
  const segment = elUnknown(0x18538067, cat(info, tracks, clusters(sets)));
  return cat(ebml, segment);
}

function clusters(sets: { start: number; end: number; segments: number[][] }[]): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const s of sets) {
    const payload: number[] = [];
    for (const seg of s.segments) {
      for (const b of seg) payload.push(b);
    }
    parts.push(simpleBlock(1, s.start, new Uint8Array(payload)));
  }
  return el(0x1f43b675, cat(...parts));
}

const info = el(0x1549a966, uint(0x2ad7b1, 1000000));
const tracks = el(0x1654ae6b, trackEntry({ number: 1, type: 17, codec: 'S_HDMV/PGS', language: 'eng', isDefault: false }));

// A source over a byte array that records the length of every read.
export function recordingSource(bytes: Uint8Array, reads: number[]) {
  return {
    size: bytes.length,
    read: async (offset: number, length: number) => {
      reads.push(length);
      return bytes.slice(offset, offset + length);
    },
  };
}
