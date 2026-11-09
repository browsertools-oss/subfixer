// Core subtitle logic. Runs entirely in the browser (and in Node for tests).
import subsrt from 'subsrt-ts';

export type Caption = { start: number; end: number; text: string };
export type OutFormat = 'srt' | 'vtt' | 'ass' | 'ssa' | 'sbv' | 'sub';

export interface Doc {
  format: string; // detected input format
  captions: Caption[];
  raw: string; // decoded source text
}

export const FORMAT_LABEL: Record<string, string> = {
  srt: 'SubRip (.srt)',
  vtt: 'WebVTT (.vtt)',
  ass: 'Advanced SubStation (.ass)',
  ssa: 'SubStation Alpha (.ssa)',
  sbv: 'YouTube (.sbv)',
  sub: 'MicroDVD (.sub)',
  smi: 'SAMI (.smi)',
  lrc: 'Lyrics (.lrc)',
};

// ---------- decoding ----------

export const ENCODINGS = ['UTF-8', 'windows-1252', 'windows-1250', 'windows-1251', 'windows-1253', 'windows-1254', 'windows-1255', 'windows-1256', 'ISO-8859-2', 'KOI8-R', 'Shift_JIS', 'EUC-KR', 'GB18030', 'Big5', 'UTF-16LE'];

export async function decode(buf: ArrayBuffer, forced?: string): Promise<{ text: string; encoding: string }> {
  const b = new Uint8Array(buf);
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

function cleanText(c: any, format: string): string {
  let t: string = (c.text ?? c.content ?? '').replace(/\r/g, '');
  if (format === 'ass' || format === 'ssa') t = t.replace(ASS_TAGS, '').replace(/\\N/gi, '\n').replace(/\\h/g, ' ');
  return t.replace(/\s+$/g, '').replace(/^\s+/g, '');
}

export function parse(raw: string, fps = 23.976): Doc {
  const text = raw.replace(/^﻿/, '');
  const format = subsrt.detect(text) || '';
  if (!format) throw new Error("This doesn't look like a subtitle file we can read.");
  const parsed: any[] = subsrt.parse(text, { format, fps } as any);
  const captions = parsed
    .filter((c) => c.type === 'caption' || (c.start !== undefined && c.end !== undefined))
    .map((c) => ({ start: Math.round(c.start), end: Math.round(c.end), text: cleanText(c, format) }));
  if (!captions.length) throw new Error('No subtitle lines were found in this file.');
  return { format, captions, raw: text };
}

export function build(captions: Caption[], format: OutFormat, fps = 23.976): string {
  const items = captions.map((c, i) => ({
    type: 'caption',
    index: i + 1,
    start: c.start,
    end: c.end,
    duration: c.end - c.start,
    content: format === 'ass' || format === 'ssa' ? c.text.replace(/\n/g, '\\N') : c.text,
    text: c.text,
  }));
  let out = subsrt.build(items as any, { format, fps, eol: '\r\n' } as any);
  if (format === 'srt' || format === 'vtt') out = out.replace(/\r?\n/g, '\r\n');
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

export function retime(captions: Caption[], fn: TimeFn): Caption[] {
  return captions.map((c) => {
    const start = Math.max(0, Math.round(fn(c.start)));
    const end = Math.max(start, Math.round(fn(c.end)));
    return { ...c, start, end };
  });
}

/** Retime ASS/SSA in place so styles, fonts and override tags survive untouched. */
export function retimeAssRaw(raw: string, fn: TimeFn): string {
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
    (_, pre, a, b) => {
      const s = Math.max(0, fn(toMs(a)));
      const e = Math.max(s, fn(toMs(b)));
      return `${pre}${fmt(s)},${fmt(e)}`;
    },
  );
}

// ---------- cleanup ----------

export interface FixOptions {
  removeHearingImpaired?: boolean; // [music], (laughs), SPEAKER:
  removeTags?: boolean; // <i>, <font>, {\an8}
  fixOverlaps?: boolean;
  minDurationMs?: number; // 0 = off
}

export interface FixReport {
  removedEmpty: number;
  fixedOverlaps: number;
  extended: number;
  sorted: boolean;
  hiRemoved: number;
}

export function fixCommon(captions: Caption[], o: FixOptions): { captions: Caption[]; report: FixReport } {
  const r: FixReport = { removedEmpty: 0, fixedOverlaps: 0, extended: 0, sorted: false, hiRemoved: 0 };
  let list = captions.map((c) => ({ ...c }));

  const sorted = [...list].sort((a, b) => a.start - b.start);
  if (sorted.some((c, i) => c !== list[i])) r.sorted = true;
  list = sorted;

  for (const c of list) {
    let t = c.text;
    if (o.removeTags) t = t.replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '');
    if (o.removeHearingImpaired) {
      const before = t;
      t = t
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/[♪♫]+[^♪♫\n]*[♪♫]*/g, '')
        .replace(/^(?:-\s*)?[A-Z][A-Z0-9 .'-]{1,30}:\s*/gm, (m) => (m.trim().startsWith('-') ? '- ' : ''));
      if (t !== before) r.hiRemoved++;
    }
    c.text = t
      .split('\n')
      .map((l) => l.replace(/[ \t]+/g, ' ').trim())
      .filter((l) => l && l !== '-')
      .join('\n');
  }

  const kept = list.filter((c) => c.text.length > 0);
  r.removedEmpty = list.length - kept.length;
  list = kept;

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
