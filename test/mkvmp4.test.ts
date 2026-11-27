import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listRemux, aacConfig } from '../src/lib/mkvmp4.ts';
import { avMkv, recordingSource } from './mkv-fixture.ts';

function sourceOf(bytes: Uint8Array) {
  return recordingSource(bytes, []);
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
