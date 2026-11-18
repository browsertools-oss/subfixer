import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializePreset, parsePreset, PRESETS_KEY } from '../src/lib/presets.ts';

test('preset round-trips through serialize and parse', () => {
  const p = { mode: 'shift', settings: { amount: '2.5', tooLate: true, outFmt: 'srt' } };
  const raw = serializePreset(p);
  assert.equal(typeof raw, 'string');
  assert.deepEqual(parsePreset(raw), p);
});

test('parsePreset rejects junk input', () => {
  assert.equal(parsePreset(null), null);
  assert.equal(parsePreset(''), null);
  assert.equal(parsePreset('not json'), null);
  assert.equal(parsePreset('[1,2]'), null);
  assert.equal(parsePreset('"shift"'), null);
  assert.equal(parsePreset('{"mode":"","settings":{}}'), null);
  assert.equal(parsePreset('{"mode":"shift"}'), null);
  assert.equal(parsePreset('{"mode":"shift","settings":[1]}'), null);
  assert.equal(parsePreset('{"mode":"shift","settings":{"amount":2.5}}'), null);
});

test('parsePreset accepts string and boolean setting values only', () => {
  const p = parsePreset('{"mode":"clean","settings":{"brackets":true,"outFmt":"vtt"}}');
  assert.deepEqual(p, { mode: 'clean', settings: { brackets: true, outFmt: 'vtt' } });
});

test('presets key is the subfixer.presets localStorage key', () => {
  assert.equal(PRESETS_KEY, 'subfixer.presets');
});
