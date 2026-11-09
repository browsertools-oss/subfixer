// Readers and writers for the formats subsrt-ts gets wrong or does not know:
// MicroDVD, SAMI, TTML/DFXP, YouTube XML, EBU STL (binary), Spruce STL and plain text.
// Caption text uses the same convention as subs.ts: <i>/<b>/<u> tags and \n line breaks.
import type { Caption } from './subs';

const NTSC: [number, number][] = [[23.976, 24000 / 1001], [29.97, 30000 / 1001], [59.94, 60000 / 1001]];
export const snapFps = (f: number) => NTSC.find(([a]) => Math.abs(a - f) < 0.01)?.[1] ?? f;

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENT[e.toLowerCase()] ?? m;
  });
}
const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const keepBasic = (s: string) => s.replace(/<(?!\/?[ibu]>)[^>]*>/gi, '').replace(/<(\/?)([IBU])>/g, (_, a, b) => `<${a}${b.toLowerCase()}>`);
const tidy = (s: string) => s.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter((l, i, a) => l || (i > 0 && i < a.length - 1)).join('\n').trim();
const stripAll = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\{\\[^}]*\}/g, '');

// ---------- MicroDVD ----------

export const isMicroDvd = (t: string) => /^\s*\{\d+\}\{\d*\}/.test(t);

export function parseMicroDvd(text: string, fps: number): { captions: Caption[]; fps: number; fromHeader: boolean } {
  let rate = snapFps(fps);
  let fromHeader = false;
  const caps: Caption[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const m = line.match(/^\s*\{(\d+)\}\{(\d*)\}(.*)$/);
    if (!m) return;
    const body = m[3].trim();
    // {1}{1}23.976 on the first line names the frame rate.
    if (i < 3 && !caps.length && +m[1] <= 1 && +(m[2] || 0) <= 1 && /^\d+(\.\d+)?$/.test(body)) {
      rate = snapFps(parseFloat(body));
      fromHeader = true;
      return;
    }
    const start = +m[1], end = m[2] === '' ? start : +m[2];
    let allItalic = /^\{[yY]:i\}/.test(body);
    const out = body.replace(/^\{[yY]:[^}]*\}/, '').split('|').map((l) => {
      const it = allItalic || /^\{y:i\}/i.test(l) || /^\//.test(l);
      const t = l.replace(/\{[^}]*\}/g, '').replace(/^\//, '').trim();
      return it && t ? `<i>${t}</i>` : t;
    });
    caps.push({ start, end, text: out.join('\n') });
  });
  return { captions: caps.map((c) => ({ start: Math.round((c.start * 1000) / rate), end: Math.round((c.end * 1000) / rate), text: c.text })), fps: rate, fromHeader };
}

export function buildMicroDvd(caps: Caption[], fps: number): string {
  const rate = snapFps(fps);
  return caps
    .map((c) => {
      const lines = c.text.split('\n').map((l) => {
        const it = /^\s*<i>.*<\/i>\s*$/i.test(l);
        const t = stripAll(l).trim();
        return it ? `{y:i}${t}` : t;
      });
      return `{${Math.round((c.start * rate) / 1000)}}{${Math.round((c.end * rate) / 1000)}}${lines.join('|')}`;
    })
    .join('\r\n') + '\r\n';
}

// ---------- SAMI ----------

export const isSami = (t: string) => /<SAMI[\s>]/i.test(t);
export interface SamiTrack { id: string; label: string; captions: Caption[] }

export function parseSami(text: string): SamiTrack[] {
  const meta: Record<string, { name?: string; lang?: string }> = {};
  const style = text.match(/<STYLE[^>]*>([\s\S]*?)<\/STYLE>/i)?.[1] ?? '';
  for (const m of style.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
    const name = m[2].match(/Name\s*:\s*([^;]+)/i)?.[1].trim();
    const lang = m[2].match(/lang\s*:\s*([^;]+)/i)?.[1].trim();
    meta[m[1].toLowerCase()] = { name, lang };
  }
  const body = text.replace(/<!--[\s\S]*?-->/g, '');
  const events: Record<string, { t: number; text: string }[]> = {};
  const parts = body.split(/(<SYNC\b[^>]*>)/i);
  for (let i = 1; i < parts.length; i += 2) {
    const t = parts[i].match(/Start\s*=\s*["']?(-?\d+)/i);
    if (!t) continue;
    const time = +t[1];
    const seg = parts[i + 1] ?? '';
    const ps = [...seg.matchAll(/<P\b([^>]*)>([\s\S]*?)(?=<P\b|<\/P>|<\/BODY>|$)/gi)];
    const items = ps.length ? ps.map((p) => ({ cls: (p[1].match(/Class\s*=\s*["']?([\w-]+)/i)?.[1] ?? '').toLowerCase(), html: p[2] })) : [{ cls: '', html: seg }];
    for (const it of items) {
      let s = it.html.replace(/\r?\n/g, ' ').replace(/<br\s*\/?>/gi, '\n');
      s = tidy(decodeEntities(keepBasic(s)).replace(/ /g, ' '));
      (events[it.cls] ??= []).push({ t: time, text: s });
    }
  }
  const tracks: SamiTrack[] = [];
  for (const [cls, evs] of Object.entries(events)) {
    evs.sort((a, b) => a.t - b.t);
    const caps: Caption[] = [];
    evs.forEach((e, i) => {
      if (!e.text) return;
      const next = evs.slice(i + 1).find((x) => x.t > e.t);
      caps.push({ start: e.t, end: next ? next.t : e.t + 3000, text: e.text });
    });
    if (!caps.length) continue;
    const m = meta[cls] ?? {};
    const label = [m.name, m.lang && m.name ? `(${m.lang})` : m.lang].filter(Boolean).join(' ') || cls.toUpperCase() || 'Subtitles';
    tracks.push({ id: cls, label, captions: caps });
  }
  return tracks;
}

export function buildSami(caps: Caption[], lang = 'en-US'): string {
  const out = [
    '<SAMI>', '<HEAD>', '<TITLE>Subtitles</TITLE>', '<STYLE TYPE="text/css">', '<!--',
    'P { margin-left: 8pt; margin-right: 8pt; margin-bottom: 2pt; margin-top: 2pt; text-align: center; font-size: 20pt; font-family: Arial, sans-serif; font-weight: normal; color: white; }',
    `.SUBTTL { Name: Subtitles; lang: ${lang}; SAMIType: CC; }`, '-->', '</STYLE>', '</HEAD>', '<BODY>',
  ];
  caps.forEach((c, i) => {
    const html = c.text.split('\n').map((l) => keepBasic(l).replace(/&(?!(\w+|#\d+);)/g, '&amp;')).join('<br>');
    out.push(`<SYNC Start=${Math.round(c.start)}><P Class=SUBTTL>${html}`);
    const next = caps[i + 1];
    if (!next || next.start > c.end) out.push(`<SYNC Start=${Math.round(c.end)}><P Class=SUBTTL>&nbsp;`);
  });
  out.push('</BODY>', '</SAMI>');
  return out.join('\r\n') + '\r\n';
}

// ---------- TTML / DFXP ----------

export const isTtml = (t: string) => /<(\w+:)?tt[\s>]/.test(t) && /<(\w+:)?p[\s>]/.test(t);
export const isDfxp = (t: string) => /ttaf1/.test(t);

function ttmlTime(v: string | undefined, fps: number, tick: number): number | null {
  if (!v) return null;
  v = v.trim();
  let m = v.match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (m) return (+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000 + (m[4] ? Math.round(+`0.${m[4]}` * 1000) : 0);
  m = v.match(/^(\d+):(\d{2}):(\d{2}):(\d+)(?:\.\d+)?$/);
  if (m) return (+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000 + Math.round((+m[4] * 1000) / fps);
  m = v.match(/^([\d.]+)(h|ms|m|s|f|t)$/);
  if (m) {
    const n = parseFloat(m[1]);
    return Math.round({ h: n * 3600000, m: n * 60000, s: n * 1000, ms: n, f: (n * 1000) / fps, t: (n * 1000) / tick }[m[2] as 'h']);
  }
  return null;
}

export function parseTtml(text: string): Caption[] {
  const tt = text.match(/<(\w+:)?tt\b[^>]*>/)?.[0] ?? '';
  const fr = parseFloat(tt.match(/frameRate="(\d+)"/)?.[1] ?? '30');
  const mult = tt.match(/frameRateMultiplier="(\d+)\s+(\d+)"/);
  const fps = mult ? (fr * +mult[1]) / +mult[2] : fr;
  const tick = parseFloat(tt.match(/tickRate="(\d+)"/)?.[1] ?? '1') || 1;
  const italic = new Set<string>();
  for (const m of text.matchAll(/<(?:\w+:)?style\b([^>]*)\/?>/g)) {
    const id = m[1].match(/xml:id="([^"]+)"/)?.[1];
    if (id && /fontStyle="italic"/.test(m[1])) italic.add(id);
  }
  const isIt = (attrs: string) => /fontStyle="italic"/.test(attrs) || (attrs.match(/\bstyle="([^"]+)"/)?.[1].split(/\s+/).some((s) => italic.has(s)) ?? false);
  const caps: Caption[] = [];
  for (const m of text.matchAll(/<(\w+:)?p\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?p>)/g)) {
    const attrs = m[2];
    const begin = ttmlTime(attrs.match(/\bbegin="([^"]+)"/)?.[1], fps, tick);
    let end = ttmlTime(attrs.match(/\bend="([^"]+)"/)?.[1], fps, tick);
    const dur = ttmlTime(attrs.match(/\bdur="([^"]+)"/)?.[1], fps, tick);
    if (begin === null) continue;
    if (end === null) end = dur !== null ? begin + dur : begin + 3000;
    let inner = (m[3] ?? '').replace(/\s+/g, ' ').replace(/<(\w+:)?br\s*\/?>/g, '\n');
    inner = inner.replace(/<(\w+:)?span\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?span>/g, (_, _n, a, t) => (isIt(a) ? `<i>${t}</i>` : t));
    let t = tidy(decodeEntities(keepBasic(inner)));
    if (isIt(attrs) && t) t = t.split('\n').map((l) => `<i>${l}</i>`).join('\n');
    if (t) caps.push({ start: begin, end, text: t.replace(/<\/i>(\s*)<i>/g, '$1') });
  }
  return caps.sort((a, b) => a.start - b.start);
}

const clock = (ms: number) => {
  ms = Math.max(0, Math.round(ms));
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`;
};

export function buildTtml(caps: Caption[], flavor: 'ttml' | 'dfxp' = 'ttml', lang = 'en'): string {
  const ns = flavor === 'dfxp' ? 'http://www.w3.org/2006/10/ttaf1' : 'http://www.w3.org/ns/ttml';
  const span = (l: string) => escXml(stripAll(l)).trim();
  const body = caps.map((c) => {
    const lines = c.text.split('\n').map((l) => (/^\s*<i>.*<\/i>\s*$/i.test(l) ? `<span tts:fontStyle="italic">${span(l)}</span>` : span(l)));
    return `      <p begin="${clock(c.start)}" end="${clock(c.end)}">${lines.join('<br/>')}</p>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<tt xmlns="${ns}" xmlns:tts="${ns}#styling" xml:lang="${lang}">`,
    '  <head>', '    <styling>', '      <style xml:id="s1" tts:textAlign="center" tts:color="white"/>', '    </styling>', '  </head>',
    '  <body>', '    <div style="s1">', ...body, '    </div>', '  </body>', '</tt>', '',
  ].join('\r\n');
}

// ---------- YouTube XML ----------

export const isYouTubeXml = (t: string) => /<transcript[\s>]/.test(t) || /<timedtext[\s>]/.test(t);

export function parseYouTubeXml(text: string): Caption[] {
  const caps: Caption[] = [];
  const clean = (s: string) => tidy(decodeEntities(decodeEntities(s)).replace(/<[^>]+>/g, '').replace(/\r?\n/g, '\n'));
  for (const m of text.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const start = parseFloat(m[1].match(/start="([\d.]+)"/)?.[1] ?? 'NaN');
    const dur = parseFloat(m[1].match(/dur="([\d.]+)"/)?.[1] ?? '3');
    if (isNaN(start)) continue;
    const t = clean(m[2]);
    if (t) caps.push({ start: Math.round(start * 1000), end: Math.round((start + dur) * 1000), text: t });
  }
  // format 3: <p t="ms" d="ms">
  for (const m of text.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)) {
    const t0 = m[1].match(/\bt="(\d+)"/), d = m[1].match(/\bd="(\d+)"/);
    if (!t0) continue;
    const t = clean(m[2]);
    if (t) caps.push({ start: +t0[1], end: +t0[1] + (d ? +d[1] : 3000), text: t });
  }
  // Auto-captions overlap the next line by design. Trim each to the next start.
  caps.sort((a, b) => a.start - b.start);
  caps.forEach((c, i) => { const n = caps[i + 1]; if (n && c.end > n.start) c.end = Math.max(c.start + 1, n.start); });
  return caps;
}

// ---------- EBU STL (binary) ----------

export function isEbuStl(buf: Uint8Array): boolean {
  if (buf.length < 1024 + 128) return false;
  return String.fromCharCode(...buf.slice(3, 6)) === 'STL';
}

const DIACRITIC: Record<number, string> = { 0xc1: '̀', 0xc2: '́', 0xc3: '̂', 0xc4: '̃', 0xc5: '̄', 0xc6: '̆', 0xc7: '̇', 0xc8: '̈', 0xca: '̊', 0xcb: '̧', 0xcd: '̋', 0xce: '̨', 0xcf: '̌' };
const ISO6937: Record<number, string> = {
  0xa0: ' ', 0xa1: '¡', 0xa2: '¢', 0xa3: '£', 0xa4: '$', 0xa5: '¥', 0xa6: '#', 0xa7: '§', 0xa8: '¤', 0xa9: '‘', 0xaa: '“', 0xab: '«', 0xac: '←', 0xad: '↑', 0xae: '→', 0xaf: '↓',
  0xb0: '°', 0xb1: '±', 0xb2: '²', 0xb3: '³', 0xb4: '×', 0xb5: 'µ', 0xb6: '¶', 0xb7: '·', 0xb8: '÷', 0xb9: '’', 0xba: '”', 0xbb: '»', 0xbc: '¼', 0xbd: '½', 0xbe: '¾', 0xbf: '¿',
  0xd0: '―', 0xd1: '¹', 0xd2: '®', 0xd3: '©', 0xd4: '™', 0xd5: '♪', 0xd6: '¬', 0xd7: '¦', 0xdc: '⅛', 0xdd: '⅜', 0xde: '⅝', 0xdf: '⅞',
  0xe0: 'Ω', 0xe1: 'Æ', 0xe2: 'Đ', 0xe3: 'ª', 0xe4: 'Ħ', 0xe6: 'Ĳ', 0xe7: 'Ŀ', 0xe8: 'Ł', 0xe9: 'Ø', 0xea: 'Œ', 0xeb: 'º', 0xec: 'Þ', 0xed: 'Ŧ', 0xee: 'Ŋ', 0xef: 'ŉ',
  0xf0: 'ĸ', 0xf1: 'æ', 0xf2: 'đ', 0xf3: 'ð', 0xf4: 'ħ', 0xf5: 'ı', 0xf6: 'ĳ', 0xf7: 'ŀ', 0xf8: 'ł', 0xf9: 'ø', 0xfa: 'œ', 0xfb: 'ß', 0xfc: 'þ', 0xfd: 'ŧ', 0xfe: 'ŋ', 0xff: '',
};
const CCT_ENC: Record<string, string> = { '01': 'iso-8859-5', '02': 'iso-8859-6', '03': 'iso-8859-7', '04': 'iso-8859-8' };

function stlText(bytes: Uint8Array, cct: string): string {
  let out = '';
  let italic = false;
  let pend = '';
  const dec = CCT_ENC[cct] ? new TextDecoder(CCT_ENC[cct]) : null;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0x8f) continue; // unused space
    if (b === 0x8a) { if (italic) out += '</i>'; out += '\n'; if (italic) out += '<i>'; continue; }
    if (b === 0x80) { if (!italic) out += '<i>'; italic = true; continue; }
    if (b === 0x81) { if (italic) out += '</i>'; italic = false; continue; }
    if (b < 0x20 || (b >= 0x82 && b <= 0x9f)) { out += ' '; continue; } // colour and box codes take a space
    if (dec) { out += b < 0x80 ? String.fromCharCode(b) : dec.decode(new Uint8Array([b])); continue; }
    if (DIACRITIC[b]) { pend = DIACRITIC[b]; continue; }
    const ch = b < 0x80 ? String.fromCharCode(b) : ISO6937[b] ?? '';
    out += pend ? (ch + pend).normalize('NFC') : ch;
    pend = '';
  }
  if (italic) out += '</i>';
  return tidy(out.replace(/<i>(\s*)<\/i>/g, '$1')).replace(/\n{2,}/g, '\n');
}

export function parseEbuStl(buf: Uint8Array): { captions: Caption[]; fps: number } {
  const gsi = (a: number, b: number) => String.fromCharCode(...buf.slice(a, b));
  const dfc = gsi(3, 11); // STL25.01 or STL30.01
  const fps = snapFps(parseInt(dfc.slice(3, 5), 10) || 25);
  const cct = gsi(12, 14);
  const tcp = gsi(256, 264);
  const tc = (h: number, m: number, s: number, f: number) => Math.round((h * 3600 + m * 60 + s) * 1000 + (f * 1000) / fps);
  const tcpMs = /^\d{8}$/.test(tcp) ? tc(+tcp.slice(0, 2), +tcp.slice(2, 4), +tcp.slice(4, 6), +tcp.slice(6, 8)) : 0;
  const caps: Caption[] = [];
  let acc: Uint8Array[] = [];
  for (let o = 1024; o + 128 <= buf.length; o += 128) {
    const blk = buf.subarray(o, o + 128);
    const ebn = blk[3];
    if (ebn === 0xfe) continue; // user data
    acc.push(blk.subarray(16, 128));
    if (ebn !== 0xff) continue;
    const cf = blk[15];
    const text = cf === 1 ? '' : stlText(concat(acc), cct);
    acc = [];
    if (!text) continue;
    caps.push({ start: tc(blk[5], blk[6], blk[7], blk[8]), end: tc(blk[9], blk[10], blk[11], blk[12]), text });
  }
  // Most broadcast files start the programme at 10:00:00:00. Count from there when every line is after it.
  const shift = tcpMs && caps.every((c) => c.start >= tcpMs) ? tcpMs : caps.length && caps[0].start >= 36000000 ? 36000000 : 0;
  return { captions: caps.map((c) => ({ ...c, start: c.start - shift, end: c.end - shift })), fps };
}
function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of parts) { out.set(p, i); i += p.length; }
  return out;
}

// ---------- Spruce STL (text) ----------

export const isSpruceStl = (t: string) => /^\s*\d{2}:\d{2}:\d{2}:\d{2}\s*,\s*\d{2}:\d{2}:\d{2}:\d{2}\s*,/m.test(t);

export function parseSpruceStl(text: string, fps: number): Caption[] {
  const rate = snapFps(fps);
  const tc = (s: string) => { const [h, m, se, f] = s.split(':').map(Number); return Math.round((h * 3600 + m * 60 + se) * 1000 + (f * 1000) / rate); };
  const caps: Caption[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(\d{2}:\d{2}:\d{2}:\d{2})\s*,\s*(\d{2}:\d{2}:\d{2}:\d{2})\s*,\s?(.*)$/);
    if (!m) continue;
    let it = false, b = false, u = false;
    const t = m[3].split('|').map((l) =>
      l.replace(/\^([IBU])/g, (_, k) => {
        if (k === 'I') return (it = !it) ? '<i>' : '</i>';
        if (k === 'B') return (b = !b) ? '<b>' : '</b>';
        return (u = !u) ? '<u>' : '</u>';
      }).trim(),
    ).join('\n');
    const closed = t + (u ? '</u>' : '') + (b ? '</b>' : '') + (it ? '</i>' : '');
    if (stripAll(closed).trim()) caps.push({ start: tc(m[1]), end: tc(m[2]), text: closed });
  }
  return caps;
}

// ---------- plain text ----------

export interface TxtOptions { cps?: number; startMs?: number; maxLine?: number }
const TS = /^\s*\[?\s*((?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\s*(?:(?:-|–|-->)\s*((?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?))?\s*\]?\s*[-:]?\s*(.*)$/;
const tsMs = (s: string) => {
  const parts = s.replace(',', '.').split(':').map(Number);
  return Math.round(parts.reduce((a, p) => a * 60 + p, 0) * 1000);
};

/** True when most non-empty lines start with a timestamp, so times come from the file. */
export function txtHasTimes(text: string): boolean {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.length > 0 && lines.filter((l) => TS.test(l)).length / lines.length >= 0.5;
}

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}
const readMs = (t: string, cps: number) => Math.min(7000, Math.max(1000, Math.round((t.replace(/\s+/g, '').length / cps) * 1000)));

export function parseTxt(text: string, o: TxtOptions = {}): Caption[] {
  const cps = o.cps && o.cps > 0 ? o.cps : 15;
  const max = o.maxLine ?? 42;
  const caps: Caption[] = [];
  if (txtHasTimes(text)) {
    const rows: { start: number; end: number | null; text: string }[] = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const m = line.match(TS);
      if (m) rows.push({ start: tsMs(m[1]), end: m[2] ? tsMs(m[2]) : null, text: m[3].trim() });
      else if (rows.length) rows[rows.length - 1].text += '\n' + line.trim();
    }
    rows.forEach((r, i) => {
      const next = rows[i + 1];
      const end = r.end ?? Math.min(next ? next.start : Infinity, r.start + readMs(r.text, cps));
      if (r.text) caps.push({ start: r.start, end: Math.max(end, r.start + 1), text: r.text });
    });
    return caps;
  }
  // No times: cut the text into lines of up to two rows and time them by reading speed.
  let t = o.startMs ?? 0;
  const paras = text.replace(/\r/g, '').split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
  for (const p of paras) {
    const sentences = p.match(/[^.!?…]+[.!?…]+["'”’)]*|[^.!?…]+$/g) ?? [p];
    let rows: string[] = [];
    const flush = () => {
      if (!rows.length) return;
      const txt = rows.join('\n');
      const d = readMs(txt, cps);
      caps.push({ start: t, end: t + d, text: txt });
      t += d + 100;
      rows = [];
    };
    for (const s of sentences) {
      const lines = wrap(s.trim(), max);
      for (const l of lines) {
        if (rows.length === 2) flush();
        // Prefer starting a new cue at a sentence start when the current one already has a line.
        rows.push(l);
      }
      if (rows.length === 2 || (rows.length && rows.join(' ').length > max * 0.6)) flush();
    }
    flush();
  }
  return caps;
}

// ---------- merging ----------

/** Two languages on screen together. Where lines overlap, the times are cut into slices and both texts stacked. */
export function mergeStack(a: Caption[], b: Caption[]): Caption[] {
  const cuts = [...new Set([...a, ...b].flatMap((c) => [c.start, c.end]))].sort((x, y) => x - y);
  const out: Caption[] = [];
  const at = (list: Caption[], s: number, e: number) => list.filter((c) => c.start < e && c.end > s).map((c) => c.text);
  for (let i = 0; i < cuts.length - 1; i++) {
    const s = cuts[i], e = cuts[i + 1];
    const texts = [...at(a, s, e), ...at(b, s, e)];
    if (!texts.length) continue;
    const text = texts.join('\n');
    const prev = out[out.length - 1];
    if (prev && prev.end === s && prev.text === text) prev.end = e;
    else out.push({ start: s, end: e, text });
  }
  return out;
}

/** Second language as its own lines at the top of the screen. */
export function mergeTop(a: Caption[], b: Caption[]): Caption[] {
  return [...a, ...b.map((c) => ({ ...c, text: `{\\an8}${c.text}` }))].sort((x, y) => x.start - y.start || x.end - y.end);
}

/** Parts in a row (CD1, CD2). offsets[i] is added to every line of part i. */
export function mergeParts(parts: Caption[][], offsets: number[]): Caption[] {
  return parts.flatMap((p, i) => p.map((c) => ({ ...c, start: c.start + (offsets[i] ?? 0), end: c.end + (offsets[i] ?? 0) })));
}

/** Default offsets: a part that starts back near zero goes after the end of the part before it. */
export function autoOffsets(parts: Caption[][]): number[] {
  const offs: number[] = [];
  let end = 0;
  parts.forEach((p, i) => {
    const first = p[0]?.start ?? 0;
    const off = i > 0 && first + 0 < end ? end + 1000 : 0;
    offs.push(off);
    end = Math.max(end, ...p.map((c) => c.end + off));
  });
  return offs;
}
