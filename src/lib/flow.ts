// Small pure helpers for the tool's flow: the shift direction control, the download button state
// and the message after a save. Kept out of Tool.astro so they can be tested.
import { parseTime } from './subs.ts';

export type Dir = 'late' | 'early';

/**
 * Read the "by how much" box. Accepts plain seconds ("2", "2.5", "2,5", "2s", "2 sec"), milliseconds ("800ms")
 * or a time ("00:00:02,500", "1:05"). The sign is ignored here: the direction buttons set it.
 * Empty means no shift yet (0). Returns NaN when the text cannot be read.
 */
export function parseAmount(raw: string): number {
  const s = raw.trim().replace(/^[-+]\s*/, '');
  if (!s) return 0;
  const secs = s.match(/^(\d+(?:[.,]\d+)?)\s*(s|sec|secs|seconds?)?$/i);
  if (secs) return Math.round(parseFloat(secs[1].replace(',', '.')) * 1000);
  const t = parseTime(s);
  return isNaN(t) ? NaN : Math.abs(t);
}

/** Late subtitles have to show sooner (negative shift); early ones later (positive). */
export function signedOffset(dir: Dir, amountMs: number): number {
  if (!amountMs) return 0;
  return dir === 'late' ? -Math.abs(amountMs) : Math.abs(amountMs);
}

/** The reverse, for the nudge buttons: a signed shift back to a direction and an amount. Zero keeps the direction. */
export function splitOffset(ms: number, keep: Dir): { dir: Dir; amountMs: number } {
  if (ms === 0) return { dir: keep, amountMs: 0 };
  return { dir: ms < 0 ? 'late' : 'early', amountMs: Math.abs(ms) };
}

/** Seconds for the amount box: "2", "2.5", "0.1". */
export function amountText(ms: number): string {
  return ms ? String(Math.round(ms) / 1000) : '';
}

/** One line under the control that says what will happen, in the viewer's terms. */
export function describeShift(signedMs: number): string {
  if (!signedMs) return 'Type how far off they are, or use the buttons.';
  const s = `${Math.round(Math.abs(signedMs)) / 1000} s`;
  return signedMs < 0 ? `Every line will show ${s} sooner.` : `Every line will show ${s} later.`;
}

export type DlState = { disabled: boolean; label: string; why: string };

/**
 * The download button. It stays usable whenever the download would differ from the file that came in,
 * and says why when it would not.
 */
export function downloadState(o: {
  error: boolean;
  changedLines: number;
  formatChanged: boolean;
  charsetChanged: boolean;
  mode: string;
  files: number;
  edited?: boolean;
}): DlState {
  const label = o.mode === 'merge' ? 'Download merged file' : o.files > 1 ? `Download ${o.files} files as a zip` : 'Download fixed file';
  if (o.error) return { disabled: true, label, why: 'Fix the setting above first.' };
  const differs = o.mode === 'merge' || o.changedLines > 0 || o.formatChanged || o.charsetChanged || !!o.edited;
  if (differs) return { disabled: false, label, why: '' };
  const why: Record<string, string> = {
    shift: 'Nothing moves yet. Say how far off the subtitles are.',
    fps: 'Both frame rates are the same, so nothing changes.',
    sync: 'Type the two times first.',
    replace: 'Type what to find first.',
    convert: 'This file is already in the format you picked. Choose a different format to convert it.',
  };
  return { disabled: true, label, why: why[o.mode] ?? 'This file already passes with these settings, so nothing changes.' };
}

/** Text for the summary line when no single line changes but the file still does. */
export function quietChange(o: { formatChanged: boolean; charsetFrom: string }): string {
  const parts: string[] = [];
  if (o.charsetFrom && !/^utf-8$/i.test(o.charsetFrom)) parts.push(`Read as ${o.charsetFrom}, saved as UTF-8, so accented letters show correctly`);
  if (o.formatChanged) parts.push('only the format changes');
  if (!parts.length) return 'No line changes.';
  const s = parts.join(', and ');
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/** What to tell the viewer after the save, including the one trick that makes players pick the file up. */
export function savedMessage(name: string, zip: boolean): string {
  if (zip) return `Saved ${name}. Unzip it into the folder with the videos.`;
  return `Saved ${name}. Put it in the same folder as the video. If the player does not pick it up, give both the same name (movie.mkv and movie.srt).`;
}

/**
 * A symptom ticket is one click. With no file yet it opens the file picker already set to that fix;
 * with a file loaded it switches straight to that fix. There is no selected state to confirm.
 */
export function ticketAction(hasFile: boolean): 'choose-file' | 'jump' {
  return hasFile ? 'jump' : 'choose-file';
}
