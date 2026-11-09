// Timing and reading fixes that work on the whole file at once: gaps, durations, reading speed,
// line wrapping and find and replace. Pure functions over captions, shared by every file in a batch.
import { stripTags, type Caption } from './subs.ts';

/** Characters a viewer reads: no tags, no line breaks. */
export const visibleLen = (t: string) => stripTags(t).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().length;

/** Characters per second. */
export const cps = (c: Caption) => {
  const s = Math.max(1, c.end - c.start) / 1000;
  return visibleLen(c.text) / s;
};

export const longestLine = (t: string) => Math.max(0, ...stripTags(t).split('\n').map((l) => l.trim().length));

export interface TimingOptions {
  fixOverlaps: boolean;
  minGapMs: number;
  minDurMs: number;
  maxDurMs: number; // 0 = no limit
  /** Give lines read faster than this more time, where the next line allows. 0 = off. */
  cps: number;
}
export interface TimingReport { overlaps: number; gaps: number; lengthened: number; shortened: number; sorted: boolean }

export function fixTiming(captions: Caption[], o: TimingOptions): { captions: Caption[]; report: TimingReport } {
  const r: TimingReport = { overlaps: 0, gaps: 0, lengthened: 0, shortened: 0, sorted: false };
  const list = captions.map((c) => ({ ...c }));
  const sorted = [...list].sort((a, b) => a.start - b.start || a.end - b.end);
  r.sorted = sorted.some((c, i) => c !== list[i]);
  const gap = Math.max(0, o.minGapMs);
  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    const next = sorted[i + 1];
    // The latest this line may end without touching the next one.
    const room = next ? Math.max(c.start, next.start - gap) : Infinity;
    const end0 = c.end;
    if (o.maxDurMs && c.end - c.start > o.maxDurMs) {
      c.end = c.start + o.maxDurMs;
      r.shortened++;
    }
    let want = c.end;
    if (o.minDurMs && want - c.start < o.minDurMs) want = c.start + o.minDurMs;
    if (o.cps) want = Math.max(want, c.start + Math.ceil((visibleLen(c.text) / o.cps) * 1000));
    if (o.maxDurMs) want = Math.min(want, c.start + Math.max(o.maxDurMs, o.minDurMs));
    if (want > c.end) {
      const to = Math.min(want, room);
      if (to > c.end) { c.end = to; r.lengthened++; }
    }
    if (next && c.end > next.start && o.fixOverlaps) {
      c.end = Math.max(c.start, next.start - gap);
      if (end0 > next.start) r.overlaps++;
      else r.gaps++;
    } else if (next && gap && c.end <= next.start && next.start - c.end < gap && next.start - gap > c.start) {
      c.end = next.start - gap;
      r.gaps++;
    }
  }
  return { captions: sorted, report: r };
}

/** Re-break one subtitle's text into at most `maxLines` lines of up to `maxLen` characters, as evenly as it fits.
 *  Dialogue (lines starting with "-") keeps one speaker per line. */
export function reflowText(text: string, maxLen: number, maxLines = 2): string {
  const lines = text.split('\n');
  if (lines.length > 1 && lines.every((l) => /^\s*(<[^>]+>)*\s*-/.test(l))) return lines.map((l) => wrap(l.trim(), maxLen, maxLines).join('\n')).join('\n');
  const flat = lines.map((l) => l.trim()).filter(Boolean).join(' ');
  return wrap(flat, maxLen, maxLines).join('\n');
}

function wrap(t: string, maxLen: number, maxLines: number): string[] {
  const words = t.split(/ +/).filter(Boolean);
  const len = (ws: string[]) => visibleLen(ws.join(' '));
  if (len(words) <= maxLen || words.length < 2) return [words.join(' ')];
  if (maxLines === 2 || len(words) <= maxLen * 2) {
    // Two lines: the break that makes the longer line shortest, preferring a bottom-heavy split on ties.
    let best = 1, cost = Infinity;
    for (let k = 1; k < words.length; k++) {
      const a = len(words.slice(0, k)), b = len(words.slice(k));
      const c = Math.max(a, b) + (a > b ? 0.5 : 0) - (/[.,;:!?]$/.test(stripTags(words[k - 1])) ? 2 : 0);
      if (c < cost) { cost = c; best = k; }
    }
    const top = words.slice(0, best), bottom = words.slice(best);
    if (maxLines > 2 && len(bottom) > maxLen) return [top.join(' '), ...wrap(bottom.join(' '), maxLen, maxLines - 1)];
    return [top.join(' '), bottom.join(' ')];
  }
  const out: string[] = [];
  let line: string[] = [];
  for (const w of words) {
    if (line.length && len([...line, w]) > maxLen) { out.push(line.join(' ')); line = []; }
    line.push(w);
  }
  if (line.length) out.push(line.join(' '));
  return out;
}

export function reflow(captions: Caption[], maxLen: number, maxLines = 2): { captions: Caption[]; changed: number } {
  let changed = 0;
  const out = captions.map((c) => {
    const text = reflowText(c.text, maxLen, maxLines);
    if (text === c.text) return c;
    changed++;
    return { ...c, text };
  });
  return { captions: out, changed };
}

export interface Rule { find: string; replace: string }
export interface ReplaceOptions { regex: boolean; matchCase: boolean; wholeWord: boolean }

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Builds the patterns once so a bad expression is reported before any file is touched. */
export function compileRules(rules: Rule[], o: ReplaceOptions): { re: RegExp; replace: string }[] {
  return rules
    .filter((r) => r.find !== '')
    .map((r) => {
      let src = o.regex ? r.find : escRe(r.find);
      if (o.wholeWord) src = `(?<![\\p{L}\\p{N}_])(?:${src})(?![\\p{L}\\p{N}_])`;
      let re: RegExp;
      try {
        re = new RegExp(src, 'gu' + (o.matchCase ? '' : 'i'));
      } catch {
        throw new Error(`"${r.find}" is not a pattern this tool can read. Untick "Use patterns" to search for it as plain text.`);
      }
      // \n in the replacement box means a line break, as people type it.
      const replace = o.regex ? r.replace.replace(/\\n/g, '\n') : r.replace.replace(/\$/g, '$$$$');
      return { re, replace };
    });
}

export function findReplace(captions: Caption[], rules: { re: RegExp; replace: string }[]): { captions: Caption[]; hits: number; lines: number; emptied: number } {
  let hits = 0, lines = 0;
  const out: Caption[] = [];
  let emptied = 0;
  for (const c of captions) {
    let t = c.text;
    for (const { re, replace } of rules) {
      t = t.replace(re, (...m) => {
        hits++;
        return m[0].replace(new RegExp(re.source, re.flags.replace('g', '')), replace);
      });
    }
    if (t === c.text) { out.push(c); continue; }
    lines++;
    t = t.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter((l) => stripTags(l).trim()).join('\n');
    if (!stripTags(t).trim()) { emptied++; continue; }
    out.push({ ...c, text: t });
  }
  return { captions: out, hits, lines, emptied };
}
