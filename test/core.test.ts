import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse, build, retime, shiftFn, fpsFn, twoPointFn, fixCommon, retimeAssRaw, parseTime, decode } from '../src/lib/subs.ts';

const SRT = '1\r\n00:00:01,000 --> 00:00:02,500\r\n<i>Hello</i>\r\n\r\n2\r\n00:00:02,400 --> 00:00:04,000\r\n[DOOR SLAMS]\r\nJOHN: World\r\n\r\n3\r\n00:00:05,000 --> 00:00:05,200\r\n(laughs)\r\n';
const ASS = `[Script Info]\nScriptType: v4.00+\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:01.00,0:00:02.50,Default,,0,0,0,,{\\i1}Hi{\\i0}\\Nthere\n`;

test('parse srt', () => {
  const d = parse(SRT);
  assert.equal(d.format, 'srt');
  assert.equal(d.captions.length, 3);
  assert.equal(d.captions[1].text, '[DOOR SLAMS]\nJOHN: World');
});

test('shift', () => {
  const c = retime(parse(SRT).captions, shiftFn(-1500));
  assert.equal(c[0].start, 0); // clamped
  assert.equal(c[1].start, 900);
});

test('25 -> 23.976 stretches', () => {
  const c = retime(parse(SRT).captions, fpsFn(25, 24000 / 1001));
  assert.equal(c[2].start, 5214);
});

test('two point', () => {
  const f = twoPointFn(1000, 2000, 5000, 10000);
  assert.equal(f(1000), 2000);
  assert.equal(f(5000), 10000);
  assert.equal(f(3000), 6000);
});

test('fix common', () => {
  const { captions, report } = fixCommon(parse(SRT).captions, { removeHearingImpaired: true, removeTags: true, fixOverlaps: true, minDurationMs: 700 });
  assert.equal(captions.length, 2);
  assert.equal(captions[0].text, 'Hello');
  assert.equal(captions[1].text, 'World');
  assert.equal(captions[0].end, 2399);
  assert.equal(report.removedEmpty, 1);
});

test('build vtt and srt roundtrip', () => {
  const caps = parse(SRT).captions;
  const vtt = build(caps, 'vtt');
  assert.match(vtt, /^WEBVTT/);
  assert.match(vtt, /00:00:01\.000 --> 00:00:02\.500/);
  const back = parse(build(caps, 'srt'));
  assert.equal(back.captions.length, 3);
  assert.equal(back.captions[1].text, caps[1].text);
});

test('ass parse strips tags, raw retime keeps them', () => {
  const d = parse(ASS);
  assert.equal(d.format, 'ass');
  assert.equal(d.captions[0].text, 'Hi\nthere');
  const out = retimeAssRaw(ASS, shiftFn(2000));
  assert.match(out, /Dialogue: 0,0:00:03\.00,0:00:04\.50,Default,,0,0,0,,\{\\i1\}Hi/);
  const srt = build(d.captions, 'srt');
  assert.match(srt, /Hi\r\nthere/);
});

test('parseTime', () => {
  assert.equal(parseTime('1:02:03,500'), 3723500);
  assert.equal(parseTime('-2.5'), -2500);
  assert.equal(parseTime('1500ms'), 1500);
  assert.ok(isNaN(parseTime('abc')));
});

test('decode windows-1252', async () => {
  const bytes = new Uint8Array([...Buffer.from('1\r\n00:00:01,000 --> 00:00:02,000\r\nCaf'), 0xe9, ...Buffer.from(' na'), 0xef, ...Buffer.from('ve déj'.replace(/[^\x00-\x7f]/g,'')), 0x0d, 0x0a]);
  const r = await decode(bytes.buffer);
  assert.match(r.text, /Café naïve/);
});
