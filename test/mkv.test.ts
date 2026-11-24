import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanMkv } from '../src/lib/mkv.ts';
import { sampleMkv, recordingSource } from './mkv-fixture.ts';

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

test('random bytes are rejected with a plain message', async () => {
  const junk = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  await assert.rejects(() => scanMkv(recordingSource(junk, [])), { message: NOT_MKV });
});
