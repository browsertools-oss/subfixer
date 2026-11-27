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

// Same content, but the Segment has a known size, a SeekHead first, and a Cues with two CuePoints.
// CueClusterPosition is the cluster's offset from the segment data start, plus a CueRelativePosition (0xf0) value 3.
export function knownMkv(): Uint8Array {
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
  const cues = el(
    0x1c53bb6b,
    el(0xbb, uint(0xb3, 0), el(0xb7, uint(0xf7, 2), uint(0xf1, 0), uint(0xf0, 3))),
    el(0xbb, uint(0xb3, 3000), el(0xb7, uint(0xf7, 2), uint(0xf1, 0x1000), uint(0xf0, 3))),
  );
  const segData = cat(info, tracks, cluster1, cluster2, cues);
  const seg = el(0x18538067, segData);
  const seekHead = el(
    0x114d9b74,
    el(0x4dbb, el(0x53ab, [0x15, 0x49, 0xa9, 0x66]), el(0x53ac, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1c])),
    el(0x4dbb, el(0x53ab, [0x16, 0x54, 0xae, 0x6b]), el(0x53ac, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x4e])),
  );
  return cat(ebml, seekHead, seg);
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
// A block body with a raw flags byte: track, signed 16-bit relative time, flags, data.
export function rawBlock(track: number, rel: number, flags: number, data: Uint8Array | number[]): Uint8Array {
  const r = rel < 0 ? rel + 0x10000 : rel;
  return cat([0x80 | track, (r >> 8) & 0xff, r & 0xff, flags], data);
}

// A block with lacing: 'xiph' (flags 0x82), 'fixed' (0x84) or 'ebml' (0x86). Frames must be
// under 127 bytes for ebml; the first size and the differences are written as one-byte vints.
export function laced(track: number, rel: number, kind: 'xiph' | 'fixed' | 'ebml', frames: Uint8Array[]): Uint8Array {
  const flags = kind === 'xiph' ? 0x82 : kind === 'fixed' ? 0x84 : 0x86;
  const head: number[] = [frames.length - 1];
  if (kind === 'xiph') {
    for (const f of frames.slice(0, -1)) {
      let n = f.length;
      while (n >= 255) {
        head.push(255);
        n -= 255;
      }
      head.push(n);
    }
  }
  if (kind === 'ebml') {
    let prev = 0;
    frames.slice(0, -1).forEach((f, i) => {
      head.push(i === 0 ? 0x80 | f.length : 0x80 | (f.length - prev + 63));
      prev = f.length;
    });
  }
  return rawBlock(track, rel, flags, cat(head, ...frames));
}

// Frame bytes that are easy to tell apart: every byte is `value`.
function frameOf(value: number, size: number): Uint8Array {
  return new Uint8Array(size).fill(value);
}

// A small file with one H.264 video track, one AAC track, one SRT track, one PGS track and one
// DTS track (or an AC3 track when `ac3Frame` is given). Two clusters; frame bytes depend on the track
// and the frame index, so a test can find each frame in the output.
export function avMkv(opts: { ac3Frame?: Uint8Array } = {}): Uint8Array {
  const enc = (s: string) => new TextEncoder().encode(s);
  const entries = [
    el(0xae, uint(0xd7, 1), uint(0x83, 1), str(0x86, 'V_MPEG4/ISO/AVC'), el(0x63a2, [1, 0x64, 0, 0x1f, 0xff, 0xe1, 0]), el(0xe0, uint(0xb0, 1920), uint(0xba, 1080))),
    el(0xae, uint(0xd7, 2), uint(0x83, 2), str(0x86, 'A_AAC'), str(0x22b59c, 'eng'), el(0x63a2, [0x11, 0x90]), el(0xe1, el(0xb5, [0x47, 0x3b, 0x80, 0x00]), uint(0x9f, 2))),
    el(0xae, uint(0xd7, 3), uint(0x83, 17), str(0x86, 'S_TEXT/UTF8'), str(0x22b59c, 'eng')),
    el(0xae, uint(0xd7, 4), uint(0x83, 17), str(0x86, 'S_HDMV/PGS'), str(0x22b59c, 'eng')),
    el(0xae, uint(0xd7, 5), uint(0x83, 2), str(0x86, opts.ac3Frame ? 'A_AC3' : 'A_DTS')),
  ];
  const video = (i: number) => frameOf(16 + i, 50);
  const audio = (i: number, size: number) => frameOf(32 + i, size);

  const c1 = el(
    0x1f43b675,
    uint(0xe7, 0),
    el(0xa3, rawBlock(1, 0, 0x80, video(0))),
    el(0xa3, rawBlock(1, 125, 0x00, video(1))),
    el(0xa3, rawBlock(1, 42, 0x00, video(2))),
    el(0xa3, rawBlock(1, 83, 0x00, video(3))),
    el(0xa3, rawBlock(2, 0, 0x80, audio(0, 20))),
    el(0xa3, rawBlock(2, 21, 0x80, audio(1, 20))),
    el(0xa3, rawBlock(2, 43, 0x80, audio(2, 20))),
    el(0xa3, laced(2, 64, 'xiph', [audio(3, 10), audio(4, 300), audio(5, 7)])),
    blockGroup(3, 500, 1000, enc('Hello <i>there</i>')),
    ...(opts.ac3Frame ? [el(0xa3, rawBlock(5, 0, 0x80, opts.ac3Frame))] : []),
  );
  const c2 = el(
    0x1f43b675,
    uint(0xe7, 3000),
    el(0xa3, rawBlock(1, 0, 0x80, video(4))),
    el(0xa0, el(0xa1, rawBlock(1, 42, 0x00, video(5))), el(REFERENCE_BLOCK_ID, [0xd6])),
    el(0xa3, laced(2, 0, 'ebml', [audio(6, 5), audio(7, 9), audio(8, 4)])),
    blockGroup(3, 500, 500, enc('Bye.')),
  );
  return cat(
    el(0x1a45dfa3, str(0x4282, 'matroska')),
    el(0x18538067, el(0x1549a966, uint(0x2ad7b1, 1000000)), el(0x1654ae6b, ...entries), c1, c2),
  );
}

const REFERENCE_BLOCK_ID = 0xfb;

export function recordingSource(bytes: Uint8Array, reads: number[]) {
  return {
    size: bytes.length,
    read: async (offset: number, length: number) => {
      reads.push(length);
      return bytes.slice(offset, offset + length);
    },
  };
}
