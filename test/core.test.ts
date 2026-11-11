import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse, build, retime, shiftFn, fpsFn, twoPointFn, fixCommon, retimeAssRaw, rebuildAss, parseTime, decode, validate, checkSrtRaw, repairDoubleUtf8, encodingCandidates, ENCODINGS, REPAIR_UTF8 } from '../src/lib/subs.ts';
import { toTxt, toCsv, toDocx, toXlsx, zipFiles } from '../src/lib/export.ts';
import { unzipSync, strFromU8 } from 'fflate';

const SRT = '1\r\n00:00:01,000 --> 00:00:02,500\r\n<i>Hello</i>\r\n\r\n2\r\n00:00:02,400 --> 00:00:04,000\r\n[DOOR SLAMS]\r\nJOHN: World\r\n\r\n3\r\n00:00:05,000 --> 00:00:05,200\r\n(laughs)\r\n';
const ASS = `[Script Info]\nScriptType: v4.00+\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:01.00,0:00:02.50,Default,,0,0,0,,{\\i1}Hi{\\i0}\\Nthere\n`;

test('lrc parses into timed captions and builds srt', () => {
  const d = parse('[00:12.50]first line\n[00:24.00]second line\n', 23.976, { name: 'song.lrc' });
  assert.equal(d.format, 'lrc');
  assert.equal(d.captions.length, 2);
  assert.equal(d.captions[0].start, 12500);
  assert.equal(d.captions[0].text, 'first line');
  assert.ok(d.captions[0].end > d.captions[0].start);
  const srt = build(d.captions, 'srt');
  assert.match(srt, /00:00:12,500 --> /);
  assert.match(srt, /first line/);
});

test('parse srt', () => {
  const d = parse(SRT);
  assert.equal(d.format, 'srt');
  assert.equal(d.captions.length, 3);
  assert.equal(d.captions[1].text, '[DOOR SLAMS]\nJOHN: World');
});

test('srt to ass keeps each line with its times, and italics become ASS tags', () => {
  const ass = build(parse(SRT).captions, 'ass');
  assert.match(ass, /Dialogue: .*0:00:01\.00,0:00:02\.50/);
  assert.match(ass, /\{\\i1\}Hello\{\\i0\}/);
  assert.match(ass, /\[DOOR SLAMS\]\\NJOHN: World/);
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

test('vtt parse keeps i and b tags, and they become ass tags on build', () => {
  const vtt = 'WEBVTT\r\n\r\n00:00:01.000 --> 00:00:02.500\r\n<i>Hello</i> and <b>bold</b> <u>under</u>\r\n\r\n00:00:03.000 --> 00:00:04.000\r\n<font color="red">plain</font>\r\n\r\n';
  const d = parse(vtt, 23.976, { name: 'movie.vtt' });
  assert.equal(d.format, 'vtt');
  assert.equal(d.captions[0].text, '<i>Hello</i> and <b>bold</b> <u>under</u>');
  assert.equal(d.captions[1].text, 'plain');
  const ass = build(d.captions, 'ass');
  assert.match(ass, /\{\\i1\}Hello\{\\i0\} and \{\\b1\}bold\{\\b0\} \{\\u1\}under\{\\u0\}/);
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

// ---------- phase 2 formats ----------
import { parseEbuStl, mergeStack, mergeTop, mergeParts, autoOffsets, parseTxt } from '../src/lib/formats.ts';

test('microdvd with fps header, italics and line breaks', () => {
  const d = parse('{1}{1}23.976\r\n{24}{72}{y:i}Hello|there\r\n{100}{150}Plain\r\n', 25);
  assert.equal(d.format, 'sub');
  assert.equal(d.frames, 'header');
  assert.equal(d.captions[0].start, 1001);
  assert.equal(d.captions[0].end, 3003);
  assert.equal(d.captions[0].text, '<i>Hello</i>\n<i>there</i>');
  const d2 = parse('{25}{50}Hi\r\n', 25);
  assert.equal(d2.frames, 'guess');
  assert.equal(d2.captions[0].start, 1000);
  assert.equal(build(d2.captions, 'sub', 25), '{25}{50}Hi\r\n');
  assert.equal(build([{ start: 1001, end: 3003, text: '<i>A</i>\nB' }], 'sub', 24000 / 1001), '{24}{72}{y:i}A|B\r\n');
});

test('sami with two languages', () => {
  const smi = `<SAMI><HEAD><STYLE TYPE="text/css"><!--
.ENCC { Name: English; lang: en-US; }
.FRCC { Name: French; lang: fr-FR; }
--></STYLE></HEAD><BODY>
<SYNC Start=1000><P Class=ENCC>Hello<br>world<P Class=FRCC>Bonjour &amp; salut
<SYNC Start=3000><P Class=ENCC>&nbsp;<P Class=FRCC>&nbsp;
<SYNC Start=4000><P Class=ENCC><i>Bye</i>
</BODY></SAMI>`;
  const d = parse(smi);
  assert.equal(d.format, 'smi');
  assert.deepEqual(d.tracks!.map((t) => t.label), ['English (en-US)', 'French (fr-FR)']);
  assert.deepEqual(d.captions.map((c) => [c.start, c.end, c.text]), [[1000, 3000, 'Hello\nworld'], [4000, 7000, '<i>Bye</i>']]);
  const fr = parse(smi, 25, { track: 'frcc' });
  assert.equal(fr.captions[0].text, 'Bonjour & salut');
  const back = parse(build(d.captions, 'smi'));
  assert.deepEqual(back.captions.map((c) => [c.start, c.end, c.text]), [[1000, 3000, 'Hello\nworld'], [4000, 7000, '<i>Bye</i>']]);
});

test('ttml and dfxp: clock, offset and frame times, italics by style, round trip', () => {
  const ttml = `<?xml version="1.0"?><tt xmlns="http://www.w3.org/ns/ttml" xmlns:tts="http://www.w3.org/ns/ttml#styling" xmlns:ttp="http://www.w3.org/ns/ttml#parameter" ttp:frameRate="25" ttp:tickRate="10000000">
<head><styling><style xml:id="it" tts:fontStyle="italic"/></styling></head><body><div>
<p begin="00:00:01.500" end="00:00:03.000">Line one<br/>line   two</p>
<p begin="40000000t" dur="2s"><span style="it">Leaning</span> words</p>
<p begin="00:00:06:12" end="00:00:07:00">Frames &amp; more</p>
</div></body></tt>`;
  const d = parse(ttml);
  assert.equal(d.format, 'ttml');
  assert.deepEqual(d.captions.map((c) => [c.start, c.end, c.text]), [[1500, 3000, 'Line one\nline two'], [4000, 6000, '<i>Leaning</i> words'], [6480, 7000, 'Frames & more']]);
  const out = build([{ start: 1500, end: 3000, text: '<i>Hi</i>\nA & B' }], 'dfxp');
  assert.match(out, /ttaf1/);
  assert.match(out, /<p begin="00:00:01.500" end="00:00:03.000"><span tts:fontStyle="italic">Hi<\/span><br\/>A &amp; B<\/p>/);
  const back = parse(out, 25, { name: 'x.dfxp' });
  assert.equal(back.format, 'dfxp');
  assert.equal(back.captions[0].text, '<i>Hi</i>\nA & B');
});

test('youtube xml, both flavors', () => {
  const d = parse('<?xml version="1.0"?><transcript><text start="1.5" dur="2">It&amp;#39;s ok</text><text start="3" dur="2.5">Next</text></transcript>');
  assert.equal(d.format, 'ytxml');
  assert.deepEqual(d.captions.map((c) => [c.start, c.end, c.text]), [[1500, 3000, "It's ok"], [3000, 5500, 'Next']]);
  const d3 = parse('<timedtext format="3"><body><p t="1000" d="1500">Hey <s>you</s></p></body></timedtext>');
  assert.deepEqual(d3.captions.map((c) => [c.start, c.end, c.text]), [[1000, 2500, 'Hey you']]);
});

test('spruce stl', () => {
  const d = parse('$FontName = Arial\r\n00:00:01:00 , 00:00:02:12 , ^IHello^I|World\r\n', 25);
  assert.equal(d.format, 'spruce');
  assert.deepEqual(d.captions[0], { start: 1000, end: 2480, text: '<i>Hello</i>\nWorld' });
});

test('ebu stl binary: ISO 6937 accents, italics, newline, programme start', () => {
  const buf = new Uint8Array(1024 + 128 * 2).fill(0x20);
  const put = (o: number, s: string) => [...s].forEach((c, i) => (buf[o + i] = c.charCodeAt(0)));
  put(0, '850STL25.01'); put(12, '00'); put(256, '10000000');
  const tti = (o: number, sn: number, tci: number[], tco: number[], text: number[]) => {
    buf.fill(0x8f, o, o + 128);
    buf[o] = 0; buf[o + 1] = sn; buf[o + 2] = 0; buf[o + 3] = 0xff; buf[o + 4] = 0;
    buf.set(tci, o + 5); buf.set(tco, o + 9); buf[o + 13] = 20; buf[o + 14] = 2; buf[o + 15] = 0;
    buf.set(text, o + 16);
  };
  // "Café" with acute as 0xC2 + e, newline 0x8A, italic "oui"
  tti(1024, 1, [10, 0, 1, 0], [10, 0, 3, 12], [0x43, 0x61, 0x66, 0xc2, 0x65, 0x8a, 0x80, 0x6f, 0x75, 0x69, 0x81]);
  tti(1152, 2, [10, 0, 4, 0], [10, 0, 5, 0], [0x4f, 0x6b]);
  const r = parseEbuStl(buf);
  assert.equal(r.fps, 25);
  assert.deepEqual(r.captions, [{ start: 1000, end: 3480, text: 'Café\n<i>oui</i>' }, { start: 4000, end: 5000, text: 'Ok' }]);
});

test('txt: reading speed, embedded times and our own export round trip', () => {
  const d = parse('Hello there. This is a test of plain text.\n\nSecond paragraph here.', 25, { name: 'a.txt', txt: { cps: 15, startMs: 2000 } });
  assert.equal(d.format, 'txt');
  assert.equal(d.txt, 'speed');
  assert.equal(d.captions[0].start, 2000);
  assert.ok(d.captions.every((c) => c.end - c.start >= 1000 && c.end - c.start <= 7000));
  assert.ok(d.captions.every((c) => c.text.split('\n').every((l) => l.length <= 42)));
  for (let i = 1; i < d.captions.length; i++) assert.ok(d.captions[i].start >= d.captions[i - 1].end);
  const t = parse('[00:00:01,000 - 00:00:03,000] One\r\n[00:00:04,000 - 00:00:05,500] Two\r\n', 25, { name: 'b.txt' });
  assert.equal(t.txt, 'times');
  assert.deepEqual(t.captions.map((c) => [c.start, c.end, c.text]), [[1000, 3000, 'One'], [4000, 5500, 'Two']]);
  const s = parseTxt('0:05 Hi\n0:07 There\nmore\n');
  assert.deepEqual(s.map((c) => [c.start, c.end, c.text]), [[5000, 6000, 'Hi'], [7000, 8000, 'There\nmore']]);
  assert.throws(() => parse('just words', 25, { name: 'x.bin' }));
});

test('merge: stack, top and parts', () => {
  const a = [{ start: 0, end: 2000, text: 'A1' }, { start: 3000, end: 4000, text: 'A2' }];
  const b = [{ start: 1000, end: 3500, text: 'B1' }];
  assert.deepEqual(mergeStack(a, b).map((c) => [c.start, c.end, c.text]), [[0, 1000, 'A1'], [1000, 2000, 'A1\nB1'], [2000, 3000, 'B1'], [3000, 3500, 'A2\nB1'], [3500, 4000, 'A2']]);
  assert.equal(mergeTop(a, b)[1].text, '{\\an8}B1');
  const offs = autoOffsets([a, [{ start: 500, end: 900, text: 'C' }]]);
  assert.deepEqual(offs, [0, 5000]);
  assert.deepEqual(mergeParts([a, [{ start: 500, end: 900, text: 'C' }]], offs).at(-1), { start: 5500, end: 5900, text: 'C' });
});

test('sup: PGS images round trip with timing and ink', async () => {
  const { buildSup, parseSup, isSup, isVobSub } = await import('../src/lib/sup.ts');
  const ink = (w: number, h: number) => Uint8Array.from({ length: w * h }, (_, i) => ((i % w) % 7 < 3 && (i / w) % 5 < 3 ? 255 : 0));
  const imgs = [
    { start: 1000, end: 2500, width: 200, height: 40, ink: ink(200, 40) },
    { start: 4000, end: 6000, width: 90, height: 20, ink: ink(90, 20) },
  ];
  const sup = buildSup(imgs);
  assert.ok(isSup(sup));
  assert.ok(!isVobSub(sup));
  const out = parseSup(sup);
  assert.deepEqual(out.map((o) => [o.start, o.end, o.width, o.height]), [[1000, 2500, 200, 40], [4000, 6000, 90, 20]]);
  assert.deepEqual([...out[0].ink], [...imgs[0].ink]);
  assert.deepEqual([...out[1].ink], [...imgs[1].ink]);
});

test('tidy: timing, reading speed, reflow, find and replace, numbering, duplicates', async () => {
  const { fixTiming, reflowText, compileRules, findReplace, cps } = await import('../src/lib/tidy.ts');
  const caps = [
    { start: 1000, end: 3000, text: 'One' },
    { start: 2900, end: 4000, text: 'Overlap here' },
    { start: 4020, end: 4300, text: 'This line is far too quick to read in time' },
    { start: 9000, end: 30000, text: 'Hangs on' },
  ];
  const { captions: t, report } = fixTiming(caps, { fixOverlaps: true, minGapMs: 83, minDurMs: 1000, maxDurMs: 7000, cps: 17 });
  assert.equal(t[0].end, 2900 - 83);
  assert.equal(report.overlaps, 1);
  assert.equal(t[1].end, 4020 - 83);
  assert.ok(t[2].end > 6000 && t[2].end <= 9000 - 83, String(t[2].end));
  assert.ok(cps(t[2]) <= 17.01);
  assert.equal(t[3].end, 16000);
  assert.equal(caps[0].end, 3000, 'input untouched');

  assert.equal(reflowText('Short one', 42), 'Short one');
  const r = reflowText('I never said I would be there at ten o clock tonight, did I?', 42);
  assert.equal(r.split('\n').length, 2);
  assert.ok(r.split('\n').every((l) => l.length <= 42));
  assert.equal(reflowText('- Who is it?\n- Me.', 42), '- Who is it?\n- Me.');
  assert.equal(reflowText('<i>Over\nhere</i>', 42), '<i>Over here</i>');

  const rules = compileRules([{ find: 'colour', replace: 'color' }, { find: 'jon', replace: 'John' }], { regex: false, matchCase: false, wholeWord: true });
  const fr = findReplace([{ start: 0, end: 1, text: 'Jon likes Colour.\nJonathan too.' }], rules);
  assert.equal(fr.captions[0].text, 'John likes color.\nJonathan too.');
  assert.equal(fr.hits, 2);
  const re = compileRules([{ find: '^(\\w+):\\s*', replace: '' }, { find: '\\s*\\|\\s*', replace: '\\n' }], { regex: true, matchCase: true, wholeWord: false });
  assert.equal(findReplace([{ start: 0, end: 1, text: 'BOB: Hi | there' }], re).captions[0].text, 'Hi\nthere');
  assert.throws(() => compileRules([{ find: '(', replace: '' }], { regex: true, matchCase: false, wholeWord: false }), /not a pattern/);
  assert.equal(findReplace([{ start: 0, end: 1, text: '[MUSIC]' }], compileRules([{ find: '[MUSIC]', replace: '' }], { regex: false, matchCase: true, wholeWord: false })).emptied, 1);
  assert.equal(findReplace([{ start: 0, end: 1, text: 'cost' }], compileRules([{ find: 'cost', replace: '$5' }], { regex: false, matchCase: true, wholeWord: false })).captions[0].text, '$5');

  assert.match(build([{ start: 0, end: 1000, text: 'a' }, { start: 1000, end: 2000, text: 'b' }], 'srt', 25, 101), /^101\r\n[\s\S]*\r\n102\r\n/);
  const dup = fixCommon([
    { start: 0, end: 4000, text: 'Same' }, { start: 1000, end: 2000, text: 'Other' }, { start: 1500, end: 3000, text: 'Same' },
  ], { removeDuplicates: true });
  assert.equal(dup.captions.length, 2);
  assert.equal(dup.report.merged, 1);
});

test('ass rebuild keeps styles, layers and positions', () => {
  const raw = readFileSync(new URL('./fixtures/layers.ass', import.meta.url), 'utf8');
  const d = parse(raw);
  assert.equal(d.captions.length, 3);
  const caps = d.captions.map((c, i) => ({ ...c, _i: i }) as any);
  caps[0] = { ...caps[0], text: '<i>Are you</i> leaving?' };
  caps[1] = { ...caps[1], start: caps[1].start + 1000, end: caps[1].end + 1000 };
  const out = rebuildAss(raw, d.captions, [...caps, { start: 9000, end: 10000, text: 'New\nline' }]);
  assert.ok(out.includes('Style: Sign,Georgia'));
  assert.ok(out.includes('Comment: 0,0:00:00.00,0:00:00.50,Default,,0,0,0,,typeset notes'));
  assert.ok(out.includes('Dialogue: 0,0:00:01.00,0:00:03.00,Default,Ann,0,0,0,,{\\i1}Are you{\\i0} leaving?'));
  assert.ok(out.includes('Dialogue: 1,0:00:03.00,0:00:07.00,Sign,,0,0,0,,{\\pos(960,120)\\fad(200,200)}CLOSED'));
  assert.ok(out.includes('Dialogue: 0,0:00:03.00,0:00:07.00,Sign,,0,0,0,,{\\pos(962,122)\\blur4\\c&H000000&}CLOSED'));
  assert.ok(out.includes('Dialogue: 0,0:00:09.00,0:00:10.00,Default,,0,0,0,,New\\Nline'));
  assert.equal(parse(out).captions.length, 4);
});

test('ttml keeps italics inside a line', () => {
  const caps = [{ start: 1000, end: 2000, text: '<i>Fine.</i> Come in & sit' }];
  for (const f of ['ttml', 'dfxp'] as const) assert.deepEqual(parse(build(caps, f)).captions, caps);
});

test('ssa in, ass out: v4.00+ with a default style, times kept', () => {
  const raw = [
    '[Script Info]',
    'Title: Probe SSA',
    'ScriptType: v4.00',
    'Collisions: Normal',
    '',
    '[V4 Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, TertiaryColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, AlphaLevel, Encoding',
    'Style: Default, Arial,28,11861244,11861244,11861244,-2147483640,-1,0,1,1,2,2,30,30,30,0,0',
    '',
    '[Events]',
    'Format: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    'Dialogue: Marked=0,0:00:01.00,0:00:03.50,Default, NTP,0000,0000,0000,,{\\i1}Hello{\\i0} world',
    'Dialogue: Marked=0,0:00:04.00,0:00:06.00,Default, NTP,0000,0000,0000,,Second line',
  ].join('\r\n');
  const d = parse(raw);
  assert.equal(d.format, 'ssa');
  const ass = build(d.captions, 'ass');
  assert.match(ass, /ScriptType: v4\.00\+/);
  assert.match(ass, /\[V4\+ Styles\]/);
  assert.match(ass, /\{\\i1\}Hello\{\\i0\} world/);
  assert.equal((ass.match(/^Style:/gm) ?? []).length, 1);
  assert.deepEqual(parse(ass).captions.map((c) => [c.start, c.end]), [[1000, 3500], [4000, 6000]]);
});

test('ass to ssa writes v4.00 with a default style and keeps text and times', () => {
  const raw = [
    '[Script Info]',
    'Title: Probe',
    'ScriptType: v4.00+',
    'PlayResX: 640',
    'PlayResY: 360',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    'Dialogue: 0,0:00:01.00,0:00:03.50,Default,,0,0,0,,{\\i1}Hello{\\i0} world',
    'Dialogue: 0,0:00:04.00,0:00:06.00,Default,,0,0,0,,Second line',
  ].join('\n');
  const d = parse(raw);
  assert.equal(d.format, 'ass');
  const ssa = build(d.captions, 'ssa');
  assert.match(ssa, /ScriptType: v4\.00\r?\n/);
  assert.match(ssa, /\[V4 Styles\]/);
  assert.match(ssa, /Dialogue: Marked=0,0:00:01\.00,0:00:03\.50/);
  assert.match(ssa, /Dialogue: Marked=0,0:00:04\.00,0:00:06\.00/);
  assert.match(ssa, /\{\\i1\}Hello\{\\i0\} world/);
  // The fresh file is written with one default style, not the source's.
  assert.equal((ssa.match(/^Style:/gm) ?? []).length, 1);
  assert.deepEqual(parse(ssa).captions.map((c) => [c.start, c.end]), [[1000, 3500], [4000, 6000]]);
});
