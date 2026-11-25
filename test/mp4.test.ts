import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanMp4 } from '../src/lib/mp4.ts';
import { trackFile } from '../src/lib/mkv.ts';
import { build } from '../src/lib/subs.ts';
import { sampleMp4 } from './mp4-fixture.ts';
import { recordingSource } from './mkv-fixture.ts';

const dec = new TextDecoder();
const plain = (cues: { start: number; end: number; data: Uint8Array }[]) =>
  cues.map((c) => [c.start, c.end, dec.decode(c.data)]);

test('mp4 tracks: the three subtitle tracks, not the video, with kind and language', async () => {
  const { tracks } = await scanMp4(recordingSource(sampleMp4(), []));
  assert.deepEqual(tracks.map((t) => t.number), [2, 3, 4]);
  assert.deepEqual(tracks.map((t) => t.kind), ['srt', 'vtt', 'other']);
  assert.deepEqual(tracks.map((t) => t.language), ['eng', 'fre', 'eng']);
  assert.deepEqual(tracks.map((t) => t.codec), ['tx3g', 'wvtt', 'c608']);
});

test('mp4 tx3g track: gaps skipped, UTF-8 text, times from the timescale', async () => {
  const { cues } = await scanMp4(recordingSource(sampleMp4(), []));
  const list = cues.get(2) ?? [];
  assert.deepEqual(plain(list), [
    [1000, 2500, 'Hello there.'],
    [3000, 4200, '<i>Café</i>\nsecond line'],
  ]);
  const { tracks } = await scanMp4(recordingSource(sampleMp4(), []));
  const file = trackFile(tracks[0], list, '');
  assert.ok(file.name.endsWith('.eng.srt'));
  assert.equal(file.text, build(list.map((c) => ({ start: c.start, end: c.end, text: dec.decode(c.data) })), 'srt'));
});

test('mp4 wvtt track: vttc payloads become cues, an empty vtte is no cue', async () => {
  const { cues, tracks } = await scanMp4(recordingSource(sampleMp4(), []));
  const list = cues.get(3) ?? [];
  assert.deepEqual(plain(list), [
    [1000, 2500, 'Bonjour.'],
    [2500, 3500, 'Ligne un\nLigne deux'],
  ]);
  assert.ok(trackFile(tracks[1], list, '').name.endsWith('.fre.vtt'));
});

test('mp4 other track: no cues', async () => {
  const { cues } = await scanMp4(recordingSource(sampleMp4(), []));
  assert.equal(cues.has(4), false);
});

test('mp4 reads are always under 1 MB, so the 3 MB video sample is never read', async () => {
  const reads: number[] = [];
  await scanMp4(recordingSource(sampleMp4(), reads));
  assert.ok(reads.length > 0);
  assert.ok(reads.every((n) => n < 1 << 20), `largest read ${Math.max(...reads)}`);
});

test('mp4 fragmented file is rejected with a plain message', async () => {
  await assert.rejects(scanMp4(recordingSource(sampleMp4({ fragmented: true }), [])), /fragments/);
});

test('mp4 random bytes are rejected with a plain message', async () => {
  const bytes = new Uint8Array(64).fill(0x42);
  await assert.rejects(scanMp4(recordingSource(bytes, [])), {
    message: 'This is not an MP4, MKV or WebM file.',
  });
});
