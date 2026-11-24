import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanMkv, trackFile, assToSrt } from '../src/lib/mkv.ts';
import { build } from '../src/lib/subs.ts';
import { zlibSync } from 'fflate';
import {
  sampleMkv,
  recordingSource,
  cat,
  el,
  elUnknown,
  uint,
  str,
  simpleBlock,
  trackEntry,
} from './mkv-fixture.ts';

const NOT_MKV = 'This is not an MKV or WebM file.';

test('mkv tracks: four subtitle tracks 2 to 5 with kind, language, name and default', async () => {
  const { tracks } = await scanMkv(recordingSource(sampleMkv(), []));
  assert.deepEqual(tracks.map((t) => t.number), [2, 3, 4, 5]);
  assert.deepEqual(tracks.map((t) => t.kind), ['srt', 'ass', 'picture', 'srt']);
  assert.deepEqual(tracks.map((t) => t.language), ['eng', 'fre', 'eng', 'ger']);
  assert.equal(tracks[1].name, 'French');
  assert.deepEqual(tracks.map((t) => t.isDefault), [true, false, false, false]);
  assert.ok(tracks.every((t) => !t.encrypted));
});

test('mkv zlib track: decompressed "Hallo." from 1000 to 4000', async () => {
  const { cues } = await scanMkv(recordingSource(sampleMkv(), []));
  const list = cues.get(5) ?? [];
  assert.equal(list.length, 1);
  assert.equal(list[0].start, 1000);
  assert.equal(list[0].end, 4000);
  assert.equal(new TextDecoder().decode(list[0].data), 'Hallo.');
});

test('mkv picture track has no cues', async () => {
  const { cues } = await scanMkv(recordingSource(sampleMkv(), []));
  assert.equal((cues.get(4) ?? []).length, 0);
  assert.equal((cues.get(1) ?? []).length, 0);
});

test('mkv reads never ask for more than one chunk, so the 3 MB video block is skipped', async () => {
  const reads: number[] = [];
  const bytes = sampleMkv();
  await scanMkv(recordingSource(bytes, reads));
  assert.ok(bytes.length > 3 * 1024 * 1024);
  assert.ok(reads.length > 0);
  assert.ok(Math.max(...reads) <= 1 << 20, `longest read ${Math.max(...reads)}`);
});

test('mkv zlib block that inflates past 8 MB is skipped and counted, not kept', async () => {
  const big = zlibSync(new Uint8Array(9 * 1024 * 1024));
  const small = zlibSync(new TextEncoder().encode('Short.'));
  const bytes = cat(
    el(0x1a45dfa3, uint(0x4287, 4), str(0x4282, 'matroska')),
    elUnknown(
      0x18538067,
      el(0x1654ae6b, trackEntry({ number: 2, type: 17, codec: 'S_TEXT/UTF8', language: 'eng', isDefault: true, zlib: true })),
      el(0x1f43b675, uint(0xe7, 0), simpleBlock(2, 0, big), simpleBlock(2, 2000, small)),
    ),
  );
  const { cues, skipped } = await scanMkv(recordingSource(bytes, []));
  assert.equal(skipped, 1);
  const list = cues.get(2) ?? [];
  assert.equal(list.length, 1);
  assert.equal(new TextDecoder().decode(list[0].data), 'Short.');
});

test('random bytes are rejected with a plain message', async () => {
  const junk = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  await assert.rejects(() => scanMkv(recordingSource(junk, [])), { message: NOT_MKV });
});

test('mkv SRT track: captions, trackFile text equals build(captions, srt), name ends .eng.srt', async () => {
  const { tracks, cues, codecPrivate } = await scanMkv(recordingSource(sampleMkv(), []));
  const track = tracks.find((t) => t.number === 2);
  assert.ok(track);
  const captions = [
    { start: 1000, end: 2500, text: 'Hello there.' },
    { start: 3000, end: 4200, text: '<i>Café</i>\nsecond line' },
  ];
  const file = trackFile(track, cues.get(2) ?? [], codecPrivate.get(2) ?? '');
  assert.equal(file.text, build(captions, 'srt'));
  assert.ok(file.name.endsWith('.eng.srt'), file.name);
});

test('mkv ASS track: header kept, two Dialogue lines with their times and override tags', async () => {
  const { tracks, cues, codecPrivate } = await scanMkv(recordingSource(sampleMkv(), []));
  const track = tracks.find((t) => t.number === 3);
  assert.ok(track);
  const file = trackFile(track, cues.get(3) ?? [], codecPrivate.get(3) ?? '');
  assert.ok(file.name.endsWith('.fre.ass'), file.name);
  assert.ok(file.text.includes('[Script Info]'));
  assert.ok(file.text.includes('Style: Default,Arial,20'));
  assert.ok(file.text.includes('[Events]\r\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'));
  const dialogue = file.text.split('\r\n').filter((l) => l.startsWith('Dialogue: '));
  assert.equal(dialogue.length, 2);
  assert.ok(dialogue[0].includes('0:00:01.00,0:00:02.50'), dialogue[0]);
  assert.ok(dialogue[0].endsWith(',Bonjour.'), dialogue[0]);
  assert.ok(dialogue[1].includes('0:00:03.00,0:00:04.20'), dialogue[1]);
  assert.ok(dialogue[1].endsWith('{\\an8}En haut'), dialogue[1]);
  const srt = assToSrt(file.text);
  assert.ok(srt.includes('00:00:01,000 --> 00:00:02,500'), srt);
  assert.ok(srt.includes('Bonjour.'), srt);
});
