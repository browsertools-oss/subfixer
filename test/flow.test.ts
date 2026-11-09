import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, signedOffset, splitOffset, amountText, describeShift, downloadState, quietChange, savedMessage } from '../src/lib/flow.ts';

test('parseAmount reads seconds, decimals, commas, units and times, and ignores the sign', () => {
  assert.equal(parseAmount(''), 0);
  assert.equal(parseAmount('  '), 0);
  assert.equal(parseAmount('2'), 2000);
  assert.equal(parseAmount('2.5'), 2500);
  assert.equal(parseAmount('2,5'), 2500);
  assert.equal(parseAmount('2s'), 2000);
  assert.equal(parseAmount('2 sec'), 2000);
  assert.equal(parseAmount('-2'), 2000);
  assert.equal(parseAmount('+0.1'), 100);
  assert.equal(parseAmount('00:00:02,500'), 2500);
  assert.ok(isNaN(parseAmount('two')));
  assert.ok(isNaN(parseAmount('0-2')));
});

test('late subtitles move sooner, early ones later', () => {
  assert.equal(signedOffset('late', 2000), -2000);
  assert.equal(signedOffset('early', 2000), 2000);
  assert.equal(signedOffset('late', 0), 0);
});

test('nudges flip the direction when they cross zero and keep it at zero', () => {
  assert.deepEqual(splitOffset(-1000, 'early'), { dir: 'late', amountMs: 1000 });
  assert.deepEqual(splitOffset(500, 'late'), { dir: 'early', amountMs: 500 });
  assert.deepEqual(splitOffset(0, 'early'), { dir: 'early', amountMs: 0 });
  // late by 0.5 s, then +1 s: now 0.5 s early
  assert.deepEqual(splitOffset(signedOffset('late', 500) + 1000, 'late'), { dir: 'early', amountMs: 500 });
});

test('amountText and describeShift speak in plain seconds', () => {
  assert.equal(amountText(0), '');
  assert.equal(amountText(2500), '2.5');
  assert.equal(amountText(100), '0.1');
  assert.equal(describeShift(-2000), 'Every line will show 2 s sooner.');
  assert.equal(describeShift(1500), 'Every line will show 1.5 s later.');
  assert.match(describeShift(0), /how far off/);
});

const base = { error: false, changedLines: 0, formatChanged: false, charsetChanged: false, mode: 'shift', files: 1 };

test('download is off when the file would come out unchanged, with a reason', () => {
  const s = downloadState(base);
  assert.equal(s.disabled, true);
  assert.match(s.why, /Nothing moves yet/);
  assert.equal(downloadState({ ...base, mode: 'clean' }).disabled, true);
  assert.match(downloadState({ ...base, mode: 'clean' }).why, /already passes/);
});

test('download is off on an error and on when anything differs', () => {
  assert.deepEqual(downloadState({ ...base, changedLines: 5, error: true }), { disabled: true, label: 'Download fixed file', why: 'Fix the setting above first.' });
  assert.equal(downloadState({ ...base, changedLines: 5 }).disabled, false);
  assert.equal(downloadState({ ...base, formatChanged: true }).disabled, false);
  assert.equal(downloadState({ ...base, mode: 'encoding', charsetChanged: true }).disabled, false);
  assert.equal(downloadState({ ...base, mode: 'edit', edited: true }).disabled, false);
  assert.equal(downloadState({ ...base, mode: 'merge' }).disabled, false);
});

test('download label follows the mode and file count', () => {
  assert.equal(downloadState({ ...base, files: 3, changedLines: 1 }).label, 'Download 3 files as a zip');
  assert.equal(downloadState({ ...base, mode: 'merge', files: 2 }).label, 'Download merged file');
});

test('quietChange explains a file that changes without any line changing', () => {
  assert.equal(quietChange({ formatChanged: false, charsetFrom: 'UTF-8' }), 'No line changes.');
  assert.equal(quietChange({ formatChanged: true, charsetFrom: 'utf-8' }), 'Only the format changes.');
  assert.equal(quietChange({ formatChanged: false, charsetFrom: 'windows-1252' }), 'Read as windows-1252, saved as UTF-8, so accented letters show correctly.');
  assert.match(quietChange({ formatChanged: true, charsetFrom: 'windows-1252' }), /, and only the format changes\.$/);
});

test('savedMessage names the file and the next step', () => {
  assert.match(savedMessage('movie.fixed.srt', false), /^Saved movie\.fixed\.srt\. Put it in the same folder as the video\./);
  assert.match(savedMessage('subtitles-fixed.zip', true), /Unzip/);
  for (const m of [savedMessage('a.srt', false), savedMessage('a.zip', true)]) assert.doesNotMatch(m, /[–—]/);
});
