import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanMkv, headerAt } from '../src/lib/mkv.ts';
import { recordingSource } from './mkv-fixture.ts';
import { editMkv, textTrack, guessLanguage } from '../src/lib/mkvwrite.ts';
import { sampleMkv, knownMkv } from './mkv-fixture.ts';

function join(parts: (Uint8Array | { start: number; end: number })[], bytes: Uint8Array): Uint8Array {
  const out: Uint8Array[] = [];
  for (const p of parts) {
    if (p instanceof Uint8Array) out.push(p);
    else out.push(bytes.subarray(p.start, p.end));
  }
  const total = out.reduce((n, x) => n + x.length, 0);
  const u8 = new Uint8Array(total);
  let at = 0;
  for (const x of out) {
    u8.set(x, at);
    at += x.length;
  }
  return u8;
}

function recordingSrc(u8: Uint8Array, reads: number[]) {
  return recordingSource(u8, reads);
}

async function scan(u8: Uint8Array) {
  return scanMkv(recordingSrc(u8, []));
}

test('mkvwrite: add an SRT track', async () => {
  const src = sampleMkv();
  const { parts, numbers } = await editMkv(recordingSrc(src, []), {
    add: [{ codec: 'S_TEXT/UTF8', codecPrivate: '', cues: [{ start: 500, end: 1500, text: 'Hola.' }, { start: 3500, end: 4000, text: 'Adiós.' }], language: 'spa', name: 'Spanish', forced: false, isDefault: false }],
    remove: [],
  });
  const out = join(parts, src);
  const { tracks, cues } = await scan(out);
  const nums = tracks.map((t) => t.number).sort((a, b) => a - b);
  assert.deepEqual(nums, [2, 3, 4, 5, 6]);
  const newTrack = tracks.find((t) => t.number === 6);
  assert.ok(newTrack);
  assert.equal(newTrack.kind, 'srt');
  assert.equal(newTrack.language, 'spa');
  assert.equal(newTrack.name, 'Spanish');
  const newCues = cues.get(6) ?? [];
  assert.equal(newCues.length, 2);
  const dec = new TextDecoder();
  assert.equal(dec.decode(newCues[0].data).trim(), 'Hola.');
  assert.equal(dec.decode(newCues[1].data).trim(), 'Adiós.');
  const old2 = cues.get(2) ?? [];
  const in2 = (await scan(src)).cues.get(2) ?? [];
  assert.equal(old2.length, in2.length);
  for (let i = 0; i < old2.length; i++) assert.equal(dec.decode(old2[i].data), dec.decode(in2[i].data));
  assert.ok(numbers.includes(6));
});

test('mkvwrite: parts under 64 KB and source ranges sum to at least 3 MB', async () => {
  const src = sampleMkv();
  const { parts } = await editMkv(recordingSrc(src, []), { add: [], remove: [] });
  let maxLen = 0;
  let sourceSum = 0;
  for (const p of parts) {
    if (p instanceof Uint8Array) maxLen = Math.max(maxLen, p.length);
    else sourceSum += p.end - p.start;
  }
  assert.ok(maxLen < 64 * 1024, `max part ${maxLen} >= 64 KB`);
  assert.ok(sourceSum >= 3 * 1024 * 1024, `source sum ${sourceSum} < 3 MB`);
});

test('mkvwrite: remove a track', async () => {
  const src = sampleMkv();
  const { parts, size } = await editMkv(recordingSrc(src, []), { add: [], remove: [3] });
  const out = join(parts, src);
  const { tracks, cues } = await scan(out);
  const nums = tracks.map((t) => t.number).sort((a, b) => a - b);
  assert.deepEqual(nums, [2, 4, 5]);
  const cues3 = cues.get(3);
  assert.ok(!cues3 || cues3.length === 0);
  const in2 = (await scan(src)).cues.get(2) ?? [];
  const out2 = cues.get(2) ?? [];
  assert.equal(out2.length, in2.length);
  for (let i = 0; i < in2.length; i++) assert.equal(new TextDecoder().decode(out2[i].data), new TextDecoder().decode(in2[i].data));
  const ins = src.length;
  assert.ok(size < ins, `output ${size} not smaller than input ${ins}`);
});

test('mkvwrite: defaultExisting picks a default', async () => {
  const src = sampleMkv();
  const { parts } = await editMkv(recordingSrc(src, []), { add: [], remove: [5], defaultExisting: 3 });
  const out = join(parts, src);
  const { tracks } = await scan(out);
  const def = tracks.filter((t) => t.type === 17).map((t) => ({ n: t.number, def: t.isDefault }));
  const def2 = def.find((d) => d.n === 2);
  const def3 = def.find((d) => d.n === 3);
  const def4 = def.find((d) => d.n === 4);
  assert.equal(def2?.def, false);
  assert.equal(def3?.def, true);
  assert.equal(def4?.def, false);
});

test('mkvwrite: added track with isDefault true', async () => {
  const src = sampleMkv();
  const { parts } = await editMkv(recordingSrc(src, []), {
    add: [{ codec: 'S_TEXT/UTF8', codecPrivate: '', cues: [{ start: 1000, end: 2000, text: 'Default track' }], language: 'eng', name: 'Default', forced: false, isDefault: true }],
    remove: [],
  });
  const out = join(parts, src);
  const { tracks } = await scan(out);
  const sub = tracks.filter((t) => t.type === 17);
  const newOne = sub.find((t) => t.name === 'Default');
  assert.ok(newOne);
  assert.equal(newOne.isDefault, true);
  for (const t of sub) {
    if (t.number === newOne.number) continue;
    assert.equal(t.isDefault, false);
  }
});

test('mkvwrite: textTrack on an ASS file', async () => {
  const ass = '[Script Info]\nScriptType: v4.00+\nPlayResX: 384\nPlayResY: 288\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize\nStyle: Default,Arial,20\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,First line\nDialogue: 1,0:00:04.00,0:00:06.00,Default,,0,0,0,,Second line\n';
  const t = textTrack(ass, 'test.ass');
  assert.equal(t.codec, 'S_TEXT/ASS');
  const { parts } = await editMkv(recordingSrc(sampleMkv(), []), { add: [{ ...t, language: 'eng', name: 'ASS', forced: false, isDefault: false }], remove: [] });
  const out = join(parts, sampleMkv());
  const { cues } = await scan(out);
  const newTrack = Array.from(cues.entries()).find(([, v]) => v.length === 2);
  assert.ok(newTrack);
  const dec = new TextDecoder();
  const texts = newTrack[1].map((c) => dec.decode(c.data));
  assert.ok(texts.some((x) => x.includes('First line')));
  assert.ok(texts.some((x) => x.includes('Second line')));
});

test('mkvwrite: a cue at 60000 ms goes into an extra cluster', async () => {
  const src = sampleMkv();
  const { parts } = await editMkv(recordingSrc(src, []), {
    add: [{ codec: 'S_TEXT/UTF8', codecPrivate: '', cues: [{ start: 60000, end: 61000, text: 'Late line' }], language: 'eng', name: 'Late', forced: false, isDefault: false }],
    remove: [],
  });
  const out = join(parts, src);
  const { cues } = await scan(out);
  const newTrack = Array.from(cues.entries()).find(([, v]) => v.some((c) => dec.decode(c.data).includes('Late line')));
  assert.ok(newTrack, 'new track not found');
  const late = newTrack[1].find((c) => dec.decode(c.data).includes('Late line'));
  assert.ok(late);
  assert.equal(late.start, 60000);
});

const dec = new TextDecoder();

test('mkvwrite: knownMkv SeekHead and Cues positions', async () => {
  const src = knownMkv();
  const { parts } = await editMkv(recordingSrc(src, []), {
    add: [{ codec: 'S_TEXT/UTF8', codecPrivate: '', cues: [{ start: 100, end: 200, text: 'New' }], language: 'eng', name: 'New', forced: false, isDefault: false }],
    remove: [],
  });
  const out = join(parts, src);
  const h = await scan(out);
  // Find the Segment element in the output (after EBML)
  let segStart = 0;
  const ebml = headerAt(out, 0, 0);
  if (ebml) segStart = ebml.dataStart + ebml.size;
  // Walk to find Segment
  let p = segStart;
  let seg: ReturnType<typeof headerAt> | null = null;
  while (p < out.length) {
    const h2 = headerAt(out, p, p);
    if (!h2) break;
    if (h2.id === 0x18538067) { seg = h2; break; }
    if (h2.unknown) break;
    p = h2.dataStart + h2.size;
  }
  assert.ok(seg, 'Segment not found in output');
  const segment = out.subarray(seg.dataStart);
  // First child of Segment should be the new SeekHead (0x114d9b74)
  const firstChild = segment.subarray(0, 20);
  assert.equal(firstChild[0], 0x11);
  assert.equal(firstChild[1], 0x4d);
  assert.equal(firstChild[2], 0x9b);
  assert.equal(firstChild[3], 0x74);
  // CueClusterPosition in Cues should point at cluster IDs (0x1f43b675)
  // The cues body should not have 0xf0 (CueRelativePosition)
  const cuesElem = segment.findIndex((v, i) => segment[i] === 0x1c && segment[i+1] === 0x53 && segment[i+2] === 0xbb && segment[i+3] === 0x6b);
  if (cuesElem >= 0) {
    const cuesBody = segment.subarray(cuesElem);
    let hasF0 = false;
    for (let i = 0; i < cuesBody.length - 1; i++) if (cuesBody[i] === 0xf0) hasF0 = true;
    assert.equal(hasF0, false);
  }
});

test('mkvwrite: recordingSource read sizes <= CHUNK', async () => {
  const src = sampleMkv();
  const reads: number[] = [];
  await editMkv(recordingSrc(src, reads), { add: [], remove: [] });
  for (const r of reads) assert.ok(r <= 1 << 20, `read ${r} > CHUNK`);
});

test('mkvwrite: guessLanguage', () => {
  assert.equal(guessLanguage('Movie.en.srt'), 'eng');
  assert.equal(guessLanguage('Film.spa.forced.srt'), 'spa');
  assert.equal(guessLanguage('x.srt'), 'und');
  assert.equal(guessLanguage('Show.fre.srt'), 'fre');
  assert.equal(guessLanguage('Video.deu.srt'), 'ger');
  assert.equal(guessLanguage('file.fra.vtt'), 'fre');
});

test('mkvwrite: remove non-subtitle track throws', async () => {
  const src = sampleMkv();
  try {
    await editMkv(recordingSrc(src, []), { add: [], remove: [1] });
    assert.fail('should throw');
  } catch (e) {
    assert.ok((e as Error).message.includes('Only subtitle tracks'));
  }
});

test('mkvwrite: unknown-size second cluster throws', async () => {
  // Build an MKV with a second cluster of unknown size
  const { el, elUnknown, uint, cat, str, trackEntry, simpleBlock, blockGroup, enc, ASS_HEADER } = await import('./mkv-fixture.ts');
  const ebml = el(0x1a45dfa3, uint(0x4286, 1), uint(0x42f7, 1), uint(0x42f2, 2), uint(0x42f3, 2), str(0x4282, 'matroska'), uint(0x4287, 2), uint(0x4285, 2));
  const info = el(0x1549a966, uint(0x2ad7b1, 1000000));
  const tracks = el(0x1654ae6b, trackEntry({ number: 1, type: 17, codec: 'S_TEXT/UTF8', language: 'eng', isDefault: true }));
  const c1 = el(0x1f43b675, uint(0xe7, 0), simpleBlock(1, 0, new Uint8Array(100)));
  const c2 = elUnknown(0x1f43b675, uint(0xe7, 3000), simpleBlock(1, 0, new Uint8Array(100)));
  const cues = el(0x1c53bb6b, uint(0xbb, 0));
  const bad = cat(ebml, elUnknown(0x18538067, info, tracks, c1, c2, cues));
  try {
    await editMkv(recordingSrc(bad, []), { add: [], remove: [] });
    assert.fail('should throw');
  } catch (e) {
    assert.ok((e as Error).message.includes('being recorded'));
  }
});

test('mkvwrite: not an MKV throws', async () => {
  const bad = new Uint8Array(64);
  bad.fill(0x42);
  try {
    await editMkv(recordingSrc(bad, []), { add: [], remove: [] });
    assert.fail('should throw');
  } catch (e) {
    assert.ok((e as Error).message.includes('not an MKV or WebM'));
  }
});