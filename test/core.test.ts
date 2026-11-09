import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse, build, retime, shiftFn, fpsFn, twoPointFn, fixCommon, retimeAssRaw, parseTime, decode, validate, checkSrtRaw, repairDoubleUtf8, encodingCandidates, ENCODINGS, REPAIR_UTF8 } from '../src/lib/subs.ts';
import { toTxt, toCsv, toDocx, toXlsx, zipFiles } from '../src/lib/export.ts';
import { unzipSync, strFromU8 } from 'fflate';

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
  assert.equal(d.captions[0].text, '<i>Hi</i>\nthere');
  const out = retimeAssRaw(ASS, shiftFn(2000));
  assert.match(out, /Dialogue: 0,0:00:03\.00,0:00:04\.50,Default,,0,0,0,,\{\\i1\}Hi/);
  const srt = build(d.captions, 'srt');
  assert.match(srt, /<i>Hi<\/i>\r\nthere/);
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

test('ass: bold kept, other tags dropped, duplicate layers merged, vtt out', () => {
  const ev = 'Dialogue: 0,0:00:03.00,0:00:04.00,Sign,,0,0,0,,{\\an8\\b1}EXIT{\\b0}\nDialogue: 1,0:00:03.00,0:00:04.00,Sign,,0,0,0,,{\\an8\\blur3}EXIT\n';
  const d = parse(ASS + ev);
  assert.equal(d.captions.length, 2);
  assert.equal(d.captions[1].text, '<b>EXIT</b>');
  const vtt = build(d.captions, 'vtt');
  assert.match(vtt, /<i>Hi<\/i>/);
  const back = build(parse(build(d.captions, 'srt')).captions, 'ass');
  assert.match(back, /\{\\i1\}Hi\{\\i0\}\\Nthere/);
});

test('shift from a line onward', () => {
  const c = retime(parse(SRT).captions, shiftFn(1000), 2400);
  assert.equal(c[0].start, 1000);
  assert.equal(c[1].start, 3400);
  assert.equal(c[2].start, 6000);
  const out = retimeAssRaw(ASS, shiftFn(1000), 5000);
  assert.match(out, /0:00:01\.00,0:00:02\.50/);
});

test('cleaner options are separate', () => {
  const srt = '1\n00:00:01,000 --> 00:00:02,000\nJOHN: Hi [sighs]\n\n2\n00:00:03,000 --> 00:00:04,000\n♪ la la la ♪\n\n3\n00:00:04,100 --> 00:00:05,000\nOkay\n\n4\n00:00:05,100 --> 00:00:06,000\nOkay\n';
  const caps = parse(srt).captions;
  const a = fixCommon(caps, { removeSpeakers: true }).captions;
  assert.equal(a[0].text, 'Hi [sighs]');
  assert.equal(a.length, 4);
  const b = fixCommon(caps, { removeBrackets: true, removeMusic: true, removeDuplicates: true });
  assert.equal(b.captions[0].text, 'JOHN: Hi');
  assert.equal(b.captions.length, 2);
  assert.equal(b.captions[1].end, 6000);
  assert.equal(b.report.merged, 1);
});

test('validate and raw srt check', () => {
  const caps = [
    { start: 1000, end: 3000, text: 'a' },
    { start: 2500, end: 2500, text: 'b' },
    { start: 2000, end: 2300, text: '' },
  ];
  const kinds = validate(caps).map((i) => `${i.index}:${i.kind}`);
  assert.deepEqual(kinds, ['0:overlap', '1:zero', '2:empty', '2:short', '2:order']);
  const raw = '1\n00:00:01,000 --> 00:00:02,000\nHi\n\n3\n00:00:03.000 --> 00:00:04,000\nThere\n\n00:00:05,000 --> 00:00:06,000\nNo number\n';
  const r = checkSrtRaw(raw).map((i) => i.line);
  assert.deepEqual(r, [5, 6, 9]);
});

test('encoding repair and candidates', () => {
  assert.equal(repairDoubleUtf8('CafÃ© and naÃ¯ve, déjà'), 'Café and naïve, déjà');
  assert.equal(repairDoubleUtf8('Café'), null);
  const bytes = Buffer.from('1\r\n00:00:01,000 --> 00:00:02,000\r\nCafÃ© crÃ¨me\r\n', 'utf8');
  const c = encodingCandidates(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), ENCODINGS);
  assert.equal(c[0].encoding, REPAIR_UTF8);
  assert.deepEqual(c[0].sample, ['Café crème']);
  const cyr = new Uint8Array([0xcf, 0xf0, 0xe8, 0xe2, 0xe5, 0xf2]); // "Привет" in windows-1251
  const cc = encodingCandidates(cyr.buffer, ['windows-1251', 'windows-1252']);
  assert.equal(cc[0].encoding, 'windows-1251');
  const ru = Buffer.from('Привет, как дела? Хорошо, спасибо.', 'utf8').toString();
  const ruBytes = new Uint8Array([...ru].map((ch) => new TextDecoder('windows-1251').decode(new Uint8Array(256).map((_, i) => i)).indexOf(ch)));
  assert.equal(encodingCandidates(ruBytes.buffer, ENCODINGS)[0].encoding, 'windows-1251');
});

test('text exports', () => {
  const caps = parse(SRT).captions;
  assert.equal(toTxt(caps).split('\r\n')[1], '[DOOR SLAMS] JOHN: World');
  assert.match(toTxt(caps, true), /^\[00:00:01,000 - 00:00:02,500\] Hello/);
  const csv = toCsv(caps);
  assert.ok(csv.startsWith('﻿Number,Start,End'));
  assert.match(csv, /2,"00:00:02,400","00:00:04,000",1\.600,"\[DOOR SLAMS\]\nJOHN: World"/);
});

test('docx and xlsx are valid zips with the text inside', async () => {
  const caps = parse(SRT).captions;
  for (const table of [false, true]) {
    const z = unzipSync(await toDocx(caps, 'night & day', table));
    const doc = strFromU8(z['word/document.xml']);
    assert.match(doc, /night &amp; day/);
    assert.match(doc, /JOHN: World/);
    assert.equal(doc.includes('<w:tbl>'), table);
  }
  const x = unzipSync(await toXlsx(caps));
  assert.match(strFromU8(x['xl/worksheets/sheet1.xml']), /<c r="E3" t="inlineStr" s="2"><is><t xml:space="preserve">\[DOOR SLAMS\]\nJOHN: World/);
  const zz = unzipSync(await zipFiles([{ name: 'a.srt', data: 'x' }, { name: 'a.srt', data: 'y' }]));
  assert.deepEqual(Object.keys(zz), ['a.srt', 'a (2).srt']);
});
