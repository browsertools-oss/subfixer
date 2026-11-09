// Blu-ray PGS (.sup) picture subtitles. Each line is a bitmap, so the text has to be read with OCR.
// This file only turns the stream into timed images; the OCR runs in the browser (see ocr.ts).

export interface SupImage {
  start: number; // ms
  end: number; // ms
  width: number;
  height: number;
  /** One byte per pixel: 0 = paper, 255 = ink. Bright, solid pixels (the letter fill) count as ink. */
  ink: Uint8Array;
}

export const isSup = (b: Uint8Array) => b.length > 13 && b[0] === 0x50 && b[1] === 0x47 && b[10] >= 0x14 && b[10] <= 0x80;

/** VobSub .sub files (from DVDs, paired with an .idx) are MPEG program streams. */
export const isVobSub = (b: Uint8Array) => b.length > 4 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0xba;

interface Obj { w: number; h: number; data: Uint8Array; parts: Uint8Array[] }
interface Placed { id: number; x: number; y: number }
type Palette = Map<number, { y: number; a: number }>;

function rle(data: Uint8Array, w: number, h: number): Uint8Array {
  const px = new Uint8Array(w * h);
  let i = 0, x = 0, y = 0;
  const put = (len: number, c: number) => {
    for (let k = 0; k < len && x < w; k++) px[y * w + x++] = c;
  };
  while (i < data.length && y < h) {
    const b = data[i++];
    if (b) { put(1, b); continue; }
    const f = data[i++];
    if (f === 0) { x = 0; y++; continue; }
    const long = f & 0x40;
    const len = long ? ((f & 0x3f) << 8) | data[i++] : f & 0x3f;
    const c = f & 0x80 ? data[i++] : 0;
    put(len, c);
  }
  return px;
}

export function parseSup(buf: Uint8Array): SupImage[] {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const palettes = new Map<number, Palette>();
  const objects = new Map<number, Obj>();
  let placed: Placed[] = [];
  let paletteId = 0;
  let open: SupImage | null = null;
  const out: SupImage[] = [];
  let dsPts = 0;
  let dsHasPcs = false;

  const compose = (pts: number) => {
    // Close whatever is on screen; a new composition replaces it.
    if (open) { open.end = pts; out.push(open); open = null; }
    if (!placed.length) return;
    const pal = palettes.get(paletteId) ?? new Map();
    let x0 = Infinity, y0 = Infinity, x1 = 0, y1 = 0;
    for (const p of placed) {
      const o = objects.get(p.id);
      if (!o) continue;
      x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x + o.w); y1 = Math.max(y1, p.y + o.h);
    }
    if (!isFinite(x0)) return;
    const w = x1 - x0, h = y1 - y0;
    const ink = new Uint8Array(w * h);
    let any = false;
    for (const p of placed) {
      const o = objects.get(p.id);
      if (!o) continue;
      if (!o.data.length && o.parts.length) {
        const all = new Uint8Array(o.parts.reduce((n, q) => n + q.length, 0));
        let k = 0;
        for (const q of o.parts) { all.set(q, k); k += q.length; }
        o.data = rle(all, o.w, o.h);
      }
      for (let yy = 0; yy < o.h; yy++)
        for (let xx = 0; xx < o.w; xx++) {
          const e = pal.get(o.data[yy * o.w + xx]);
          if (e && e.a > 128 && e.y > 140) { ink[(p.y - y0 + yy) * w + (p.x - x0 + xx)] = 255; any = true; }
        }
    }
    if (any) open = { start: pts, end: pts + 3000, width: w, height: h, ink };
  };

  let o = 0;
  while (o + 13 <= buf.length) {
    if (buf[o] !== 0x50 || buf[o + 1] !== 0x47) { o++; continue; }
    const pts = Math.round(dv.getUint32(o + 2) / 90);
    const type = buf[o + 10];
    const size = dv.getUint16(o + 11);
    const s = o + 13;
    if (s + size > buf.length) break;
    if (type === 0x16) {
      // Presentation composition: which objects show, and where.
      const state = buf[s + 7];
      if (state & 0x80) objects.clear(); // epoch start: earlier objects are gone
      paletteId = buf[s + 9];
      const n = buf[s + 10];
      placed = [];
      let q = s + 11;
      for (let k = 0; k < n; k++) {
        const id = dv.getUint16(q);
        const cropped = buf[q + 3] & 0x40;
        placed.push({ id, x: dv.getUint16(q + 4), y: dv.getUint16(q + 6) });
        q += cropped ? 16 : 8;
      }
      dsPts = pts;
      dsHasPcs = true;
    } else if (type === 0x14) {
      const id = buf[s];
      const pal: Palette = palettes.get(id) ?? new Map();
      for (let q = s + 2; q + 5 <= s + size; q += 5) pal.set(buf[q], { y: buf[q + 1], a: buf[q + 4] });
      palettes.set(id, pal);
    } else if (type === 0x15) {
      const id = dv.getUint16(s);
      const seq = buf[s + 3];
      if (seq & 0x80) {
        const w = dv.getUint16(s + 7), h = dv.getUint16(s + 9);
        objects.set(id, { w, h, data: new Uint8Array(0), parts: [buf.subarray(s + 11, s + size)] });
      } else {
        const ob = objects.get(id);
        if (ob) ob.parts.push(buf.subarray(s + 4, s + size));
      }
    } else if (type === 0x80) {
      if (dsHasPcs) compose(dsPts);
      dsHasPcs = false;
    }
    o = s + size;
  }
  if (open) out.push(open);
  return out;
}

/** A PGS encoder for tests and samples: one object per image, white text on transparent. */
export function buildSup(images: { start: number; end: number; width: number; height: number; ink: Uint8Array }[]): Uint8Array {
  const segs: number[] = [];
  const seg = (pts: number, type: number, body: number[]) => {
    const p = Math.round(pts * 90);
    segs.push(0x50, 0x47, (p >>> 24) & 255, (p >>> 16) & 255, (p >>> 8) & 255, p & 255, 0, 0, 0, 0, type, (body.length >> 8) & 255, body.length & 255);
    for (const b of body) segs.push(b);
  };
  const u16 = (v: number) => [(v >> 8) & 255, v & 255];
  images.forEach((im, i) => {
    seg(im.start, 0x16, [...u16(1920), ...u16(1080), 0x10, ...u16(i * 2), 0x80, 0, 0, 1, ...u16(0), 0, 0, ...u16(100), ...u16(900)]);
    seg(im.start, 0x14, [0, 0, 1, 235, 128, 128, 255, 2, 16, 128, 128, 255]);
    const data: number[] = [];
    for (let y = 0; y < im.height; y++) {
      let x = 0;
      while (x < im.width) {
        const c = im.ink[y * im.width + x] ? 1 : 0;
        let n = 1;
        while (x + n < im.width && (im.ink[y * im.width + x + n] ? 1 : 0) === c && n < 16383) n++;
        if (c === 0) data.push(0, ...(n < 64 ? [n] : [0x40 | (n >> 8), n & 255]));
        else if (n < 3) for (let k = 0; k < n; k++) data.push(1);
        else data.push(0, ...(n < 64 ? [0x80 | n] : [0xc0 | (n >> 8), n & 255]), 1);
        x += n;
      }
      data.push(0, 0);
    }
    const len = data.length + 4;
    seg(im.start, 0x15, [...u16(0), 0, 0xc0, (len >> 16) & 255, (len >> 8) & 255, len & 255, ...u16(im.width), ...u16(im.height)].concat(data));
    seg(im.start, 0x80, []);
    seg(im.end, 0x16, [...u16(1920), ...u16(1080), 0x10, ...u16(i * 2 + 1), 0, 0, 0, 0]);
    seg(im.end, 0x80, []);
  });
  return new Uint8Array(segs);
}
