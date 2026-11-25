import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanMp4 } from '../src/lib/mp4.ts';
import { sampleMp4 } from './mp4-fixture.ts';
import { recordingSource } from './mkv-fixture.ts';

test('mp4 tracks: the three subtitle tracks, not the video, with kind and language', async () => {
  const { tracks } = await scanMp4(recordingSource(sampleMp4(), []));
  assert.deepEqual(tracks.map((t) => t.number), [2, 3, 4]);
  assert.deepEqual(tracks.map((t) => t.kind), ['srt', 'vtt', 'other']);
  assert.deepEqual(tracks.map((t) => t.language), ['eng', 'fre', 'eng']);
  assert.deepEqual(tracks.map((t) => t.codec), ['tx3g', 'wvtt', 'c608']);
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
