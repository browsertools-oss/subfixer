// Builds small MP4 files in code for the tests. The layout follows what real muxers write:
// ftyp, then mdat (the audio and video bytes), then moov (the index) at the end.

export function cat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

export function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n);
  return b;
}

export function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n);
  return b;
}

export function str(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function zeros(n: number): Uint8Array {
  return new Uint8Array(n);
}

// A box: uint32 total size, four-character type, then the parts.
export function box(type: string, ...parts: Uint8Array[]): Uint8Array {
  const body = cat(...parts);
  return cat(u32(8 + body.length), str(type), body);
}

// A full box: the version byte and three flag bytes come first.
export function full(type: string, version: number, flags: number, ...parts: Uint8Array[]): Uint8Array {
  const vf = new Uint8Array([version, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255]);
  return box(type, vf, ...parts);
}

// Packs a three-letter ISO 639-2 code into the 15 bits the mdhd box stores.
export function lang(code: string): Uint8Array {
  const v = ((code.charCodeAt(0) - 0x60) << 10) | ((code.charCodeAt(1) - 0x60) << 5) | (code.charCodeAt(2) - 0x60);
  return u16(v);
}

function sampleEntryTable(codec: string): Uint8Array {
  return full('stsd', 0, 0, u32(1), box(codec, zeros(8)));
}

interface TrackSpec {
  id: number;
  handler: string;
  codec: string;
  language: string;
  timescale: number;
  stts: Uint8Array;
  stsz: Uint8Array;
  stsc: Uint8Array;
  stco: Uint8Array;
}

function track(t: TrackSpec): Uint8Array {
  const tkhd = full('tkhd', 0, 7, u32(0), u32(0), u32(t.id), u32(0), u32(0), zeros(60));
  const mdhd = full('mdhd', 0, 0, u32(0), u32(0), u32(t.timescale), u32(0), lang(t.language), u16(0));
  const hdlr = full('hdlr', 0, 0, u32(0), str(t.handler), zeros(12), zeros(1));
  const stbl = box('stbl', sampleEntryTable(t.codec), t.stts, t.stsz, t.stsc, t.stco);
  return box('trak', tkhd, box('mdia', mdhd, hdlr, box('minf', stbl)));
}

// Table helpers: one entry per sample or chunk.
function stts(pairs: [number, number][]): Uint8Array {
  return full('stts', 0, 0, u32(pairs.length), ...pairs.flatMap(([count, delta]) => [u32(count), u32(delta)]));
}

function stszList(sizes: number[]): Uint8Array {
  return full('stsz', 0, 0, u32(0), u32(sizes.length), ...sizes.map((s) => u32(s)));
}

function stscOne(firstChunk: number, samplesPerChunk: number): Uint8Array {
  return full('stsc', 0, 0, u32(1), u32(firstChunk), u32(samplesPerChunk), u32(1));
}

function stcoList(offsets: number[]): Uint8Array {
  return full('stco', 0, 0, u32(offsets.length), ...offsets.map((o) => u32(o)));
}

const EMPTY_STTS = full('stts', 0, 0, u32(0));
const EMPTY_STSZ = full('stsz', 0, 0, u32(0), u32(0));
const EMPTY_STSC = full('stsc', 0, 0, u32(0));
const EMPTY_STCO = full('stco', 0, 0, u32(0));

export function sampleMp4({ fragmented = false }: { fragmented?: boolean } = {}): Uint8Array {
  const ftyp = box('ftyp', str('isom'), u32(512), str('isom'), str('mp42'));
  const mdatStart = ftyp.length + 8; // file offset of the first byte of mdat's body

  // Lay out the mdat body first and record where each sample lands in the file.
  const parts: Uint8Array[] = [];
  let bodyLen = 0;
  const add = (b: Uint8Array): number => {
    const at = mdatStart + bodyLen;
    parts.push(b);
    bodyLen += b.length;
    return at;
  };

  const video = add(new Uint8Array(3 * 1024 * 1024)); // the video sample, never read

  const s1Text = str('Hello there.');
  const s3Text = str('<i>Café</i>\nsecond line');
  const sizes2 = [2, 2 + s1Text.length, 2, 2 + s3Text.length];
  const chunk1 = add(cat(u16(0), u16(s1Text.length), s1Text));
  add(zeros(1000));
  const chunk2 = add(cat(u16(0), u16(s3Text.length), s3Text));

  const w1 = box('vttc', box('payl', str('Bonjour.')));
  const w2 = cat(box('vttc', box('payl', str('Ligne un'))), box('vttc', box('payl', str('Ligne deux'))));
  const w0 = box('vtte');
  const sizes3 = [w0.length, w1.length, w2.length];
  const chunk3 = add(cat(w0, w1, w2));

  const mdat = box('mdat', ...parts);

  const moovParts = [
    full('mvhd', 0, 0, zeros(96)),
    track({
      id: 1, handler: 'vide', codec: 'avc1', language: 'und', timescale: 1000,
      stts: stts([[1, 1000]]), stsz: stszList([3 * 1024 * 1024]), stsc: stscOne(1, 1), stco: stcoList([video]),
    }),
    track({
      id: 2, handler: 'sbtl', codec: 'tx3g', language: 'eng', timescale: 1000,
      stts: stts([[1, 1000], [1, 1500], [1, 500], [1, 1200]]), stsz: stszList(sizes2), stsc: stscOne(1, 2),
      stco: stcoList([chunk1, chunk2]),
    }),
    track({
      id: 3, handler: 'text', codec: 'wvtt', language: 'fre', timescale: 600,
      stts: stts([[1, 600], [1, 900], [1, 600]]), stsz: stszList(sizes3), stsc: stscOne(1, 3),
      stco: stcoList([chunk3]),
    }),
    track({
      id: 4, handler: 'clcp', codec: 'c608', language: 'eng', timescale: 1000,
      stts: EMPTY_STTS, stsz: EMPTY_STSZ, stsc: EMPTY_STSC, stco: EMPTY_STCO,
    }),
  ];
  if (fragmented) moovParts.push(box('mvex'));
  const moov = box('moov', ...moovParts);

  return cat(ftyp, mdat, moov);
}
