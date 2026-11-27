import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listRemux, aacConfig, remuxMkv, decodeOrder, mdatHeader, chunkOffsetBox, dac3, dec3 } from '../src/lib/mkvmp4.ts';
import { kids, find } from '../src/lib/mp4.ts';
import { avMkv, recordingSource } from './mkv-fixture.ts';

function sourceOf(bytes: Uint8Array) {
  return recordingSource(bytes, []);
}

// Joins the parts of a remux into one file; ranges are read from the source bytes.
async function remux(bytes: Uint8Array, opts: { audio: number[]; subs: number[]; defaultAudio?: number; defaultSub?: number | null }) {
  const { parts, size, notes } = await remuxMkv(sourceOf(bytes), opts);
  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    const piece = p instanceof Uint8Array ? p : bytes.subarray(p.start, p.end);
    out.set(piece, at);
    at += piece.length;
  }
  return { out, parts, size, notes };
}

function u32At(b: Uint8Array, at: number): number {
  return new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(at);
}

// The track box whose handler is `type` ('vide', 'soun' or 'sbtl').
function trackOf(moov: Uint8Array, type: string): Uint8Array {
  const trak = kids(moov).filter((b) => b.type === 'trak').find((t) => {
    const hdlr = find(t.data, 'mdia', 'hdlr');
    return hdlr !== null && String.fromCharCode(...hdlr.subarray(8, 12)) === type;
  });
  assertFound(trak);
  return trak.data;
}

function assertFound<T>(v: T | undefined): asserts v is T {
  assert.ok(v, 'track not found');
}

// The entries of a stbl table box (after version and flags) as u32 values.
function table(stbl: Uint8Array, type: string): number[] {
  const box = find(stbl, type);
  assert.ok(box, `${type} box`);
  const n = u32At(box, 4);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(u32At(box, 8 + 4 * i));
  return out;
}

test('listRemux says which tracks MP4 can hold and why the rest are left out', async () => {
  const tracks = await listRemux(sourceOf(avMkv()));
  const [video, aac, srt, pgs, dts] = tracks;
  assert.equal(video.type, 'video');
  assert.equal(video.ok, true);
  assert.equal(video.label, 'H.264');
  assert.equal(aac.ok, true);
  assert.equal(aac.label, 'AAC');
  assert.equal(srt.ok, true);
  assert.equal(srt.label, 'SRT');
  assert.equal(pgs.ok, false);
  assert.match(pgs.reason, /\.sup/);
  assert.equal(dts.ok, false);
  assert.match(dts.reason, /DTS/);
});

test('aacConfig builds the AudioSpecificConfig for a track with no CodecPrivate', () => {
  assert.deepEqual([...aacConfig('A_AAC/MPEG4/LC', 48000, 2)!], [0x11, 0x90]);
  assert.equal(aacConfig('A_AAC/MPEG4/LC', 12345, 2), null);
  assert.equal(aacConfig('A_AAC/MPEG9/LC', 48000, 2), null);
});

test('remux writes ftyp, one 64-bit mdat and moov last, and the sizes add up', async () => {
  const { out, size } = await remux(avMkv(), { audio: [2], subs: [3] });
  assert.equal(size, out.length);
  assert.equal(new TextDecoder().decode(out.subarray(4, 8)), 'ftyp');
  const top = kids(out);
  assert.deepEqual(top.map((b) => b.type), ['ftyp', 'mdat', 'moov']);
  // The mdat header is the 64-bit form: size field 1, then the real size.
  assert.equal(u32At(out, 32), 1);
});

test('the video track has the frames in file order, with key frames 1 and 5', async () => {
  const src = avMkv();
  const { out } = await remux(src, { audio: [2], subs: [3] });
  const moov = find(out, 'moov')!;
  const stbl = find(trackOf(moov, 'vide'), 'mdia', 'minf', 'stbl')!;
  const offsets = table(stbl, 'stco');
  const sizes: number[] = [];
  const stsz = find(stbl, 'stsz')!;
  for (let i = 0; i < u32At(stsz, 8); i++) sizes.push(u32At(stsz, 12 + 4 * i));
  assert.deepEqual(sizes, [50, 50, 50, 50, 50, 50]);
  for (let i = 0; i < 6; i++) {
    const frame = out.subarray(offsets[i], offsets[i] + sizes[i]);
    assert.ok(frame.every((x) => x === 16 + i), `frame ${i} bytes`);
  }
  assert.deepEqual(table(stbl, 'stss'), [1, 5]);
  assert.deepEqual([...decodeOrder([0, 125, 42, 83]).ctts], [42, 125, 1, 0]);
  assert.equal(decodeOrder([0, 125, 42, 83]).shift, 42);
  assert.deepEqual(decodeOrder([0, 125, 42, 83]).dts, [0, 42, 83, 125]);
});

test('the audio track has 9 samples of one stts run and the AAC config', async () => {
  const { out } = await remux(avMkv(), { audio: [2], subs: [] });
  const moov = find(out, 'moov')!;
  const trak = trackOf(moov, 'soun');
  const stbl = find(trak, 'mdia', 'minf', 'stbl')!;
  const stsz = find(stbl, 'stsz')!;
  const n = u32At(stsz, 8);
  assert.equal(n, 9);
  const sizes = Array.from({ length: n }, (_, i) => u32At(stsz, 12 + 4 * i));
  assert.deepEqual(sizes, [20, 20, 20, 10, 300, 7, 5, 9, 4]);
  const offsets = table(stbl, 'stco');
  for (let i = 0; i < n; i++) {
    assert.ok(out.subarray(offsets[i], offsets[i] + sizes[i]).every((x) => x === 32 + i), `audio frame ${i}`);
  }
  const stts = find(stbl, 'stts')!;
  assert.equal(u32At(stts, 4), 1);
  assert.equal(u32At(stts, 8), 9);
  assert.equal(u32At(stts, 12), 1024);
  const mdhd = find(trak, 'mdia', 'mdhd')!;
  assert.equal(u32At(mdhd, 12), 48000);
  const esds = find(stbl, 'stsd')!;
  const bytes = Array.from(esds);
  let found = false;
  for (let i = 0; i + 1 < bytes.length; i++) if (bytes[i] === 0x11 && bytes[i + 1] === 0x90) found = true;
  assert.ok(found, 'esds has the AudioSpecificConfig 0x11 0x90');
});

test('chunk offset boxes switch to co64 above 32 bits, and mdat takes 16 bytes with size field 1', () => {
  const small = chunkOffsetBox([5, 9]);
  assert.equal(new TextDecoder().decode(small.subarray(4, 8)), 'stco');
  const big = chunkOffsetBox([5, 2 ** 32 + 7]);
  assert.equal(new TextDecoder().decode(big.subarray(4, 8)), 'co64');
  // co64 entries start at byte 16 (after the box header, version and count); the second is 2 ** 32 + 7.
  assert.equal(u32At(big, 16), 0);
  assert.equal(u32At(big, 24), 1);
  assert.equal(u32At(big, 28), 7);
  const header = mdatHeader(5e9);
  assert.equal(header.length, 16);
  assert.equal(u32At(header, 0), 1);
  // No spread: a long list of offsets goes through.
  assert.equal(chunkOffsetBox(Array.from({ length: 300000 }, (_, i) => i * 10)).length > 0, true);
});

test('dac3 and dec3 read the first frame and give the MP4 box bytes', () => {
  const ac3frame = new Uint8Array([0x0b, 0x77, 0, 0, 0x50, 0x40, 0xe1, 0]);
  assert.deepEqual([...dac3(ac3frame)], [0x50, 0x3d, 0x00]);
  const ec3frame = new Uint8Array([0x0b, 0x77, 0x02, 0xff, 0x3f, 0x80, 0, 0]);
  const { body, samples } = dec3(ec3frame);
  assert.deepEqual([...body], [0x0c, 0x00, 0x20, 0x0f, 0x00]);
  assert.equal(samples, 1536);
});

test('an AC3 track in avMkv gets an ac-3 entry with 1536-sample stts', async () => {
  const ac3frame = new Uint8Array([0x0b, 0x77, 0, 0, 0x50, 0x40, 0xe1, 0]);
  const { out } = await remux(avMkv({ ac3Frame: ac3frame }), { audio: [5], subs: [] });
  const moov = find(out, 'moov')!;
  const trak = trackOf(moov, 'soun');
  const stbl = find(trak, 'mdia', 'minf', 'stbl')!;
  const stsd = find(stbl, 'stsd')!;
  // stsd data: version(1)+flags(3) at 0, entry_count at 4, first entry size at 8, type at 12
  const entryType = new TextDecoder().decode(stsd.subarray(12, 16));
  assert.equal(entryType, 'ac-3');
  const stts = find(stbl, 'stts')!;
  assert.equal(u32At(stts, 8), 1);
  assert.equal(u32At(stts, 12), 1536);
});
