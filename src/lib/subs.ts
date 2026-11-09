// Core subtitle logic. Runs entirely in the browser (and in Node for tests).
import subsrt from 'subsrt-ts';
import {
  isMicroDvd, parseMicroDvd, buildMicroDvd, isSami, parseSami, buildSami, isTtml, isDfxp, parseTtml, buildTtml,
  isYouTubeXml, parseYouTubeXml, isSpruceStl, parseSpruceStl, parseTxt, txtHasTimes, type TxtOptions,
} from './formats.ts';

export type Caption = { start: number; end: number; text: string };
export type OutFormat = 'srt' | 'vtt' | 'ass' | 'ssa' | 'sbv' | 'sub' | 'smi' | 'ttml' | 'dfxp';

export interface Doc {
  format: string; // detected input format
  captions: Caption[];
  raw: string; // decoded source text
  /** Frame-based input: 'header' when the file names its rate, 'guess' when the rate came from the picker. */
  frames?: 'header' | 'guess';
  fps?: number;
  /** SAMI files can carry several languages. */
  tracks?: { id: string; label: string }[];
  track?: string;
  /** Plain text: 'times' when the file has timestamps, 'speed' when timed by reading speed. */
  txt?: 'times' | 'speed';
}

export interface ParseOptions { name?: string; track?: string; txt?: TxtOptions }

export const FORMAT_LABEL: Record<string, string> = {
  srt: 'SubRip (.srt)',
  vtt: 'WebVTT (.vtt)',
  ass: 'Advanced SubStation (.ass)',
  ssa: 'SubStation Alpha (.ssa)',
  sbv: 'YouTube (.sbv)',
  sub: 'MicroDVD (.sub)',
  smi: 'SAMI (.smi)',
  lrc: 'Lyrics (.lrc)',
  ttml: 'TTML (.ttml)',
  dfxp: 'DFXP (.dfxp)',
  ytxml: 'YouTube XML (.xml)',
  stl: 'EBU STL (.stl)',
  sup: 'Blu-ray SUP (.sup)',
  spruce: 'Spruce STL (.stl)',
  txt: 'Plain text (.txt)',
};

// ---------- decoding ----------

export const ENCODINGS = ['UTF-8', 'windows-1252', 'windows-1250', 'windows-1251', 'windows-1253', 'windows-1254', 'windows-1255', 'windows-1256', 'windows-1257', 'windows-1258', 'windows-874', 'ISO-8859-2', 'ISO-8859-15', 'KOI8-R', 'KOI8-U', 'Shift_JIS', 'EUC-JP', 'EUC-KR', 'GB18030', 'Big5', 'UTF-16LE'];

export async function decode(buf: ArrayBuffer, forced?: string): Promise<{ text: string; encoding: string }> {
  const b = new Uint8Array(buf);
  if (forced === REPAIR_UTF8) {
    const t = new TextDecoder('utf-8').decode(b).replace(/^\uFEFF/, '');
    return { text: repairDoubleUtf8(t) ?? t, encoding: REPAIR_UTF8 };
  }
  if (forced) {
    try {
      return { text: new TextDecoder(forced.toLowerCase()).decode(b).replace(/^\uFEFF/, ''), encoding: forced };
    } catch {
      /* fall through to auto */
    }
  }
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf)
    return { text: new TextDecoder('utf-8').decode(b.subarray(3)), encoding: 'UTF-8' };
  if (b[0] === 0xff && b[1] === 0xfe)
    return { text: new TextDecoder('utf-16le').decode(b.subarray(2)), encoding: 'UTF-16 LE' };
  if (b[0] === 0xfe && b[1] === 0xff)
    return { text: new TextDecoder('utf-16be').decode(b.subarray(2)), encoding: 'UTF-16 BE' };
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(b), encoding: 'UTF-8' };
  } catch {
    /* not UTF-8: guess */
  }
  const { default: jschardet } = await import('jschardet');
  let sample = '';
  const n = Math.min(b.length, 65536);
  for (let i = 0; i < n; i++) sample += String.fromCharCode(b[i]);
  const guess = jschardet.detect(sample);
  const enc = guess?.encoding && guess.encoding.toLowerCase() !== 'ascii' && (guess.confidence ?? 0) >= 0.8 ? guess.encoding : 'windows-1252';
  try {
    return { text: new TextDecoder(enc.toLowerCase()).decode(b), encoding: enc };
  } catch {
    return { text: new TextDecoder('windows-1252').decode(b), encoding: 'Windows-1252' };
  }
}

// ---------- parsing / building ----------

const ASS_TAGS = /\{[^}]*\}/g;

/** ASS override blocks -> SRT-style tags. Italic, bold and underline survive; everything else goes. */
export function assToHtml(t: string): string {
  const open = { i: false, b: false, u: false };
  let out = t.replace(ASS_TAGS, (block) => {
    let r = '';
    for (const m of block.matchAll(/\\([ibu])(\d*)(?=\\|\})/g)) {
      const k = m[1] as 'i' | 'b' | 'u';
      const on = m[2] !== '' && m[2] !== '0';
      if (on && !open[k]) { r += `<${k}>`; open[k] = true; }
      else if (!on && open[k]) { r += `</${k}>`; open[k] = false; }
    }
    if (/\\r(?=\\|\})/.test(block)) for (const k of ['u', 'b', 'i'] as const) if (open[k]) { r += `</${k}>`; open[k] = false; }
    return r;
  });
  for (const k of ['u', 'b', 'i'] as const) if (open[k]) out += `</${k}>`;
  return out.replace(/\\N/gi, '\n').replace(/\\n/g, '\n').replace(/\\h/g, ' ').replace(/<([ibu])>(\s*)<\/\1>/g, '$2');
}

/** SRT-style tags -> ASS override tags. */
export function htmlToAss(t: string): string {
  return t
    .replace(/<([ibu])>/gi, (_, k) => `{\\${k.toLowerCase()}1}`)
    .replace(/<\/([ibu])>/gi, (_, k) => `{\\${k.toLowerCase()}0}`)
    .replace(/<[^>]+>/g, '');
}

export const stripTags = (t: string) => t.replace(/<[^>]+>/g, '').replace(/\{\\[^}]*\}/g, '');

function cleanText(c: any, format: string): string {
  // subsrt's `text` has formatting stripped; `content` is what the file says. Use content so italics survive.
  let t: string = (c.content ?? c.text ?? '').replace(/\r/g, '');
  if (format === 'ass' || format === 'ssa') t = assToHtml(t);
  else if (format === 'vtt') t = t.replace(/<(?!\/?[ibu]>)[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  return t.replace(/\s+$/g, '').replace(/^\s+/g, '');
}

const done = (doc: Doc): Doc => {
  doc.captions = doc.captions.filter((c) => c.text.trim() !== '');
  if (!doc.captions.length) throw new Error('No subtitle lines were found in this file.');
  return doc;
};

export function parse(raw: string, fps = 23.976, o: ParseOptions = {}): Doc {
  const text = raw.replace(/^\uFEFF/, '');
  const name = (o.name ?? '').toLowerCase();
  if (isMicroDvd(text)) {
    const r = parseMicroDvd(text, fps);
    return done({ format: 'sub', captions: r.captions, raw: text, frames: r.fromHeader ? 'header' : 'guess', fps: r.fps });
  }
  if (isSami(text)) {
    const tracks = parseSami(text);
    if (!tracks.length) throw new Error('No subtitle lines were found in this file.');
    const t = tracks.find((x) => x.id === o.track) ?? tracks[0];
    return done({ format: 'smi', captions: t.captions, raw: text, tracks: tracks.map(({ id, label }) => ({ id, label })), track: t.id });
  }
  if (isTtml(text)) return done({ format: isDfxp(text) || name.endsWith('.dfxp') ? 'dfxp' : 'ttml', captions: parseTtml(text), raw: text });
  if (isYouTubeXml(text)) return done({ format: 'ytxml', captions: parseYouTubeXml(text), raw: text });
  if (isSpruceStl(text)) return done({ format: 'spruce', captions: parseSpruceStl(text, fps), raw: text, frames: 'guess', fps });
  const format = subsrt.detect(text) || '';
  if (!format || (name.endsWith('.txt') && format !== 'srt' && format !== 'vtt')) {
    if (name.endsWith('.txt') && text.trim()) {
      return done({ format: 'txt', captions: parseTxt(text, o.txt), raw: text, txt: txtHasTimes(text) ? 'times' : 'speed' });
    }
    throw new Error("This doesn't look like a subtitle file we can read.");
  }
  const parsed: any[] = subsrt.parse(text, { format, fps } as any);
  const captions = parsed
    .filter((c) => c.type === 'caption' || (c.start !== undefined && c.end !== undefined))
    .map((c) => ({ start: Math.round(c.start), end: Math.round(c.end), text: cleanText(c, format) }))
    .filter((c) => !(format === 'ass' || format === 'ssa') || c.text.trim() !== '');
  if (format === 'ass' || format === 'ssa') {
    // Signs and effects are often stacked on several layers with the same time and text. Keep one.
    const seen = new Set<string>();
    const unique = captions.filter((c) => {
      const k = `${c.start}|${c.end}|${stripTags(c.text)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    captions.splice(0, captions.length, ...unique.sort((a, b) => a.start - b.start));
  }
  if (!captions.length) throw new Error('No subtitle lines were found in this file.');
  return { format, captions, raw: text };
}

export function build(captions: Caption[], format: OutFormat, fps = 23.976, firstNumber = 1): string {
  if (format === 'sub') return buildMicroDvd(captions, fps);
  if (format === 'smi') return buildSami(captions.map((c) => ({ ...c, text: c.text.replace(/\{\\[^}]*\}/g, '') })));
  if (format === 'ttml' || format === 'dfxp') return buildTtml(captions, format);
  const items = captions.map((c, i) => {
    const text =
      format === 'ass' || format === 'ssa' ? htmlToAss(c.text)
      : format === 'sbv' || format === 'sub' ? stripTags(c.text)
      : format === 'vtt' ? c.text.replace(/\{\\[^}]*\}/g, '').replace(/<(?!\/?[ibu]>)[^>]+>/g, '')
      : c.text;
    return { type: 'caption', index: i + firstNumber, start: c.start, end: c.end, duration: c.end - c.start, content: text, text };
  });
  let out = subsrt.build(items as any, { format, fps, eol: '\r\n' } as any);
  if (format === 'srt' || format === 'vtt') out = out.replace(/\r?\n/g, '\r\n');
  if (format === 'srt' && firstNumber !== 1)
    out = out.replace(/(^|\r\n\r\n)(\d+)(?=\r\n\d+:\d\d:\d\d,\d{3} -->)/g, (_m, a, k) => a + (+k + firstNumber - 1));
  return out;
}

// ---------- timing ----------

export type TimeFn = (ms: number) => number;

export const shiftFn = (offsetMs: number): TimeFn => (t) => t + offsetMs;

/** Subtitles timed for `fromFps` video, played on `toFps` video. */
export const fpsFn = (fromFps: number, toFps: number): TimeFn => (t) => (t * fromFps) / toFps;

/** Map two known points (old -> new) linearly. */
export function twoPointFn(old1: number, new1: number, old2: number, new2: number): TimeFn {
  if (old2 === old1) throw new Error('The two lines must have different times.');
  const a = (new2 - new1) / (old2 - old1);
  const b = new1 - a * old1;
  return (t) => a * t + b;
}

/** Retime every line, or only lines starting at or after `fromMs` (the "fine until one scene" case). */
export function retime(captions: Caption[], fn: TimeFn, fromMs = -Infinity): Caption[] {
  return captions.map((c) => {
    if (c.start < fromMs) return c;
    const start = Math.max(0, Math.round(fn(c.start)));
    const end = Math.max(start, Math.round(fn(c.end)));
    return { ...c, start, end };
  });
}

/** Retime ASS/SSA in place so styles, fonts and override tags survive untouched. */
export function retimeAssRaw(raw: string, fn: TimeFn, fromMs = -Infinity): string {
  const toMs = (s: string) => {
    const m = s.match(/(\d+):(\d{2}):(\d{2})[.:](\d{2})/);
    if (!m) return 0;
    return ((+m[1] * 60 + +m[2]) * 60 + +m[3]) * 1000 + +m[4] * 10;
  };
  const fmt = (ms: number) => {
    ms = Math.max(0, Math.round(ms / 10) * 10);
    const cs = Math.floor((ms % 1000) / 10);
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  return raw.replace(
    /^((?:Dialogue|Comment):\s*[^,]*,)(\d+:\d{2}:\d{2}[.:]\d{2}),(\d+:\d{2}:\d{2}[.:]\d{2})/gm,
    (all, pre, a, b) => {
      if (toMs(a) < fromMs) return all;
      const s = Math.max(0, fn(toMs(a)));
      const e = Math.max(s, fn(toMs(b)));
      return `${pre}${fmt(s)},${fmt(e)}`;
    },
  );
}

// ---------- cleanup ----------

export interface FixOptions {
  removeHearingImpaired?: boolean; // shorthand for the three below
  removeBrackets?: boolean; // [door slams], (laughs)
  removeSpeakers?: boolean; // JOHN:
  removeMusic?: boolean; // ♪ lyrics ♪
  removeTags?: boolean; // <i>, <font>, {\an8}
  removeDuplicates?: boolean; // same text repeated back to back
  fixOverlaps?: boolean;
  minDurationMs?: number; // 0 = off
}

export interface FixReport {
  removedEmpty: number;
  fixedOverlaps: number;
  extended: number;
  sorted: boolean;
  hiRemoved: number;
  merged: number;
}

export function fixCommon(captions: Caption[], o: FixOptions): { captions: Caption[]; report: FixReport } {
  const r: FixReport = { removedEmpty: 0, fixedOverlaps: 0, extended: 0, sorted: false, hiRemoved: 0, merged: 0 };
  const brackets = o.removeBrackets ?? o.removeHearingImpaired;
  const speakers = o.removeSpeakers ?? o.removeHearingImpaired;
  const music = o.removeMusic ?? o.removeHearingImpaired;
  let list = captions.map((c) => ({ ...c }));

  const sorted = [...list].sort((a, b) => a.start - b.start);
  if (sorted.some((c, i) => c !== list[i])) r.sorted = true;
  list = sorted;

  for (const c of list) {
    let t = c.text;
    if (o.removeTags) t = stripTags(t);
    const before = t;
    if (brackets) t = t.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '');
    if (music) t = t.replace(/^.*[♪♫#].*$/gm, (l) => (/^\s*(?:<[^>]+>)*\s*-?\s*[♪♫#]/.test(l) || /[♪♫]\s*(?:<\/[^>]+>)*\s*$/.test(l) ? '' : l));
    if (speakers) t = t.replace(/^(\s*(?:<[^>]+>)*\s*)(-\s*)?[A-Z][A-Z0-9 .'&-]{1,30}(?:\s*\([^)]*\))?:\s*/gm, (_m, tag, dash) => tag + (dash ? '- ' : ''));
    if (t !== before) r.hiRemoved++;
    c.text = t
      .split('\n')
      .map((l) => l.replace(/[ \t]+/g, ' ').trim())
      .filter((l) => l && l !== '-' && stripTags(l).trim() !== '' && stripTags(l).trim() !== '-')
      .join('\n');
  }

  const kept = list.filter((c) => stripTags(c.text).trim().length > 0);
  r.removedEmpty = list.length - kept.length;
  list = kept;

  if (o.removeDuplicates) {
    const out: Caption[] = [];
    for (const c of list) {
      const prev = out[out.length - 1];
      const same = (p: Caption) => stripTags(p.text).trim() === stripTags(c.text).trim();
      if (prev && same(prev) && c.start <= prev.end + 500) {
        prev.end = Math.max(prev.end, c.end);
        r.merged++;
        continue;
      }
      // The same line again while an earlier copy is still on screen (a doubled cue a few lines back).
      let dup = false;
      for (let j = out.length - 2; j >= 0 && out.length - j <= 8; j--) {
        if (out[j].end > c.start && same(out[j])) { out[j].end = Math.max(out[j].end, c.end); dup = true; break; }
      }
      if (dup) r.merged++;
      else out.push(c);
    }
    list = out;
  }

  if (o.minDurationMs) {
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (c.end - c.start < o.minDurationMs) {
        const limit = i + 1 < list.length ? list[i + 1].start - 1 : Infinity;
        const target = Math.min(c.start + o.minDurationMs, limit);
        if (target > c.end) {
          c.end = target;
          r.extended++;
        }
      }
    }
  }

  if (o.fixOverlaps) {
    for (let i = 0; i + 1 < list.length; i++) {
      if (list[i].end > list[i + 1].start) {
        list[i].end = Math.max(list[i].start, list[i + 1].start - 1);
        r.fixedOverlaps++;
      }
    }
  }
  return { captions: list, report: r };
}

// ---------- checking ----------

export type IssueKind = 'empty' | 'zero' | 'negative' | 'short' | 'overlap' | 'order';
export interface Issue { index: number; kind: IssueKind; text: string }

export const ISSUE_TEXT: Record<IssueKind, string> = {
  empty: 'No text',
  zero: 'Zero length: starts and ends at the same moment',
  negative: 'Ends before it starts',
  short: 'On screen for under half a second',
  overlap: 'Overlaps the next line',
  order: 'Starts before the line above it',
};

/** Problems in the parsed lines. One entry per problem, lines can have several. */
export function validate(captions: Caption[]): Issue[] {
  const out: Issue[] = [];
  const add = (index: number, kind: IssueKind) => out.push({ index, kind, text: ISSUE_TEXT[kind] });
  captions.forEach((c, i) => {
    if (!stripTags(c.text).trim()) add(i, 'empty');
    const d = c.end - c.start;
    if (d < 0) add(i, 'negative');
    else if (d === 0) add(i, 'zero');
    else if (d < 500) add(i, 'short');
    const next = captions[i + 1];
    if (next && c.end > next.start && next.start >= c.start) add(i, 'overlap');
    if (i > 0 && c.start < captions[i - 1].start) add(i, 'order');
  });
  return out;
}

/** Problems in the SRT text itself that a parser quietly skips over. `line` is 1-based in the file. */
export function checkSrtRaw(raw: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = [];
  const lines = raw.replace(/^﻿/, '').split(/\r?\n/);
  const strict = /^\d{2,}:\d{2}:\d{2},\d{3} --> \d{2,}:\d{2}:\d{2},\d{3}(?:\s.*)?$/;
  const loose = /\d+:\d+:\d+[,.:]\d+\s*-+>\s*\d+:\d+:\d+[,.:]\d+/;
  let expect = 1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    const isBlockStart = i === 0 || !lines[i - 1].trim();
    if (!isBlockStart) continue;
    if (/^\d+$/.test(l)) {
      const n = +l;
      if (n !== expect) out.push({ line: i + 1, text: `Numbered ${n}, expected ${expect}` });
      expect = n + 1;
      const t = (lines[i + 1] ?? '').trim();
      if (!strict.test(t)) out.push({ line: i + 2, text: loose.test(t) ? `Timestamp is not in standard SRT form: ${t}` : 'Missing or unreadable timestamp' });
    } else if (loose.test(l)) {
      out.push({ line: i + 1, text: 'Line number missing before this timestamp' });
      expect++;
    }
  }
  return out;
}

// ---------- encodings ----------

export const LANG_ENCODINGS: { lang: string; encs: string[] }[] = [
  { lang: 'Western European (English, French, Spanish, German…)', encs: ['windows-1252', 'ISO-8859-15'] },
  { lang: 'Central European (Polish, Czech, Croatian, Hungarian…)', encs: ['windows-1250', 'ISO-8859-2'] },
  { lang: 'Cyrillic (Russian, Ukrainian, Bulgarian, Serbian)', encs: ['windows-1251', 'KOI8-R', 'KOI8-U', 'ISO-8859-5'] },
  { lang: 'Greek', encs: ['windows-1253', 'ISO-8859-7'] },
  { lang: 'Turkish', encs: ['windows-1254', 'ISO-8859-9'] },
  { lang: 'Hebrew', encs: ['windows-1255', 'ISO-8859-8'] },
  { lang: 'Arabic, Persian', encs: ['windows-1256', 'ISO-8859-6'] },
  { lang: 'Baltic (Lithuanian, Latvian, Estonian)', encs: ['windows-1257', 'ISO-8859-13'] },
  { lang: 'Vietnamese', encs: ['windows-1258'] },
  { lang: 'Thai', encs: ['windows-874'] },
  { lang: 'Japanese', encs: ['Shift_JIS', 'EUC-JP'] },
  { lang: 'Korean', encs: ['EUC-KR'] },
  { lang: 'Chinese, simplified', encs: ['GB18030'] },
  { lang: 'Chinese, traditional', encs: ['Big5'] },
];

export const REPAIR_UTF8 = 'UTF-8, repaired';

let cp1252: Map<string, number> | null = null;
/** Undo UTF-8 that was read as Windows-1252 and saved again ("CafÃ©" -> "Café"). Returns null if it isn't that. */
export function repairDoubleUtf8(text: string): string | null {
  if (!/[ÃÂÅÄÐÑØÙ][\u0080-¿‘-›ŒœŠšŸŽžˆ˜€™]/.test(text)) return null;
  if (!cp1252) {
    cp1252 = new Map();
    const bytes = new Uint8Array(256).map((_, i) => i);
    const chars = new TextDecoder('windows-1252').decode(bytes);
    for (let i = 0; i < 256; i++) cp1252.set(chars[i], i);
  }
  // Repair each run of non-ASCII characters on its own, so text that was already fine stays fine.
  let changed = false;
  const out = text.replace(/[^\x00-\x7f]+/g, (run) => {
    const b: number[] = [];
    for (const ch of run) {
      const v = cp1252!.get(ch);
      if (v === undefined) return run;
      b.push(v);
    }
    try {
      const fixed = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(b));
      changed = true;
      return fixed;
    } catch {
      return run;
    }
  });
  return changed ? out : null;
}

/** Rough score of how wrong decoded text looks. Lower is better. */
export function garbleScore(text: string): number {
  let s = 0;
  for (const m of text.matchAll(/�/g)) s += 10;
  for (const m of text.matchAll(/[\u0080-\u009f]/g)) s += 6;
  for (const m of text.matchAll(/[ÃÂÐÑ][\u0080-¿‘-›€]/g)) s += 4;
  for (const m of text.matchAll(/[¤¦¨¯´¸¹²³¼½¾×÷þÞðÐ]/g)) s += 1;
  // Three or more accented Latin letters in a row ("Ďđčâĺň") almost never happens in a real language.
  for (const m of text.matchAll(/[\u00c0-\u024f]{3,}/g)) s += 2;
  // Letters from two scripts glued in one word usually means the wrong code page.
  for (const m of text.matchAll(/[a-zA-Z][Ѐ-ӿ]|[Ѐ-ӿ][a-zA-Z]|[a-zA-Z][Ͱ-Ͽ]|[Ͱ-Ͽ][a-zA-Z]/g)) s += 2;
  return s;
}

/** Lines that show off the non-ASCII characters, so a person can see which reading is right. */
export function sampleLines(text: string, max = 3): string[] {
  const out: string[] = [];
  for (const l of text.split(/\r?\n/)) {
    const t = l.trim();
    if (!t || /^\d+$/.test(t) || t.includes('-->') || /^\[.*\]$/.test(t) || /^(Style|Format|Title|ScriptType|PlayRes[XY]|WrapStyle|ScaledBorderAndShadow|YCbCr Matrix|Original \w+|Script Updated By|Update Details|Collisions|Timer):/.test(t)) continue;
    const body = t.replace(/^(?:Dialogue|Comment):(?:[^,]*,){9}/, '');
    if (/[^\x00-\x7f]/.test(body)) out.push(stripTags(assToHtml(body)).slice(0, 90));
    if (out.length >= max) break;
  }
  return out;
}

export interface Candidate { encoding: string; text: string; score: number; sample: string[] }

/** Read the bytes several ways and rank them, best first. */
export function encodingCandidates(buf: ArrayBuffer, encs: string[]): Candidate[] {
  const b = new Uint8Array(buf);
  const out: Candidate[] = [];
  const tryEnc = (encoding: string, text: string) => out.push({ encoding, text, score: garbleScore(text), sample: sampleLines(text) });
  try {
    const t = new TextDecoder('utf-8', { fatal: true }).decode(b).replace(/^﻿/, '');
    tryEnc('UTF-8', t);
    const fixed = repairDoubleUtf8(t);
    if (fixed) out.push({ encoding: REPAIR_UTF8, text: fixed, score: garbleScore(fixed) - 1, sample: sampleLines(fixed) });
  } catch {
    /* not valid UTF-8 */
  }
  for (const e of encs) {
    if (e === 'UTF-8') continue;
    try {
      tryEnc(e, new TextDecoder(e.toLowerCase()).decode(b).replace(/^﻿/, ''));
    } catch {
      /* browser lacks this decoder */
    }
  }
  return out.sort((x, y) => x.score - y.score);
}

// ---------- helpers ----------

export function fmtTime(ms: number): string {
  const sign = ms < 0 ? '-' : '';
  ms = Math.abs(Math.round(ms));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  const f = ms % 1000;
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(f).padStart(3, '0')}`;
}

/** Accepts "1:02:03,500", "02:03.5", "-2.5", "1500ms". Returns ms or NaN. */
export function parseTime(input: string): number {
  const s = input.trim();
  if (!s) return NaN;
  const ms = s.match(/^(-?\d+)\s*ms$/i);
  if (ms) return +ms[1];
  const neg = s.startsWith('-');
  const body = s.replace(/^[-+]/, '').replace(',', '.');
  const parts = body.split(':');
  if (parts.length > 3 || parts.some((p) => p === '' || isNaN(+p))) return NaN;
  let total = 0;
  for (const p of parts) total = total * 60 + +p;
  return Math.round((neg ? -1 : 1) * total * 1000);
}

export const FPS_PRESETS = [
  { label: '23.976', value: 24000 / 1001 },
  { label: '24', value: 24 },
  { label: '25 (PAL)', value: 25 },
  { label: '29.97', value: 30000 / 1001 },
  { label: '30', value: 30 },
];
