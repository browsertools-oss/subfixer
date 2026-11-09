// Reads the text out of picture subtitles in the browser. tesseract.js is only loaded when a .sup
// file arrives; its engine and language data come from a public CDN. The pictures never leave the page.
import type { SupImage } from './sup';
import type { Caption } from './subs';

export const OCR_LANGS: { v: string; l: string }[] = [
  { v: 'eng', l: 'English' }, { v: 'spa', l: 'Spanish' }, { v: 'fra', l: 'French' }, { v: 'deu', l: 'German' },
  { v: 'ita', l: 'Italian' }, { v: 'por', l: 'Portuguese' }, { v: 'nld', l: 'Dutch' }, { v: 'swe', l: 'Swedish' },
  { v: 'dan', l: 'Danish' }, { v: 'nor', l: 'Norwegian' }, { v: 'fin', l: 'Finnish' }, { v: 'pol', l: 'Polish' },
  { v: 'ces', l: 'Czech' }, { v: 'hun', l: 'Hungarian' }, { v: 'ron', l: 'Romanian' }, { v: 'tur', l: 'Turkish' },
  { v: 'ell', l: 'Greek' }, { v: 'rus', l: 'Russian' }, { v: 'ukr', l: 'Ukrainian' }, { v: 'heb', l: 'Hebrew' },
  { v: 'ara', l: 'Arabic' }, { v: 'chi_sim', l: 'Chinese (simplified)' }, { v: 'jpn', l: 'Japanese' }, { v: 'kor', l: 'Korean' },
];

/** Black letters on white with a margin, scaled so capitals are around 40px tall. */
function toCanvas(im: SupImage): HTMLCanvasElement {
  const pad = 16;
  const scale = im.height < 40 ? 2 : im.height > 220 ? 0.5 : 1;
  const src = document.createElement('canvas');
  src.width = im.width + pad * 2;
  src.height = im.height + pad * 2;
  const ctx = src.getContext('2d')!;
  const data = ctx.createImageData(src.width, src.height);
  data.data.fill(255);
  for (let y = 0; y < im.height; y++)
    for (let x = 0; x < im.width; x++)
      if (im.ink[y * im.width + x]) {
        const k = ((y + pad) * src.width + x + pad) * 4;
        data.data[k] = data.data[k + 1] = data.data[k + 2] = 0;
      }
  ctx.putImageData(data, 0, 0);
  if (scale === 1) return src;
  const c = document.createElement('canvas');
  c.width = Math.round(src.width * scale);
  c.height = Math.round(src.height * scale);
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

const tidy = (t: string) =>
  t
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').replace(/(^|\s)\|(?=\s|$)/g, '$1I').trim())
    .filter(Boolean)
    .join('\n');

export class Stopped extends Error {}

export async function ocrImages(
  images: SupImage[],
  lang: string,
  onProgress: (done: number, total: number, stage: 'load' | 'read') => void,
  signal: AbortSignal,
): Promise<Caption[]> {
  onProgress(0, images.length, 'load');
  // Stop answers at once; workers wind down after their current picture, so tesseract is never cut off mid-call.
  const stopped = new Promise<never>((_, rej) => {
    const go = () => rej(new Stopped('Reading stopped. Choose the file again to start over.'));
    if (signal.aborted) go();
    else signal.addEventListener('abort', go, { once: true });
  });
  stopped.catch(() => {});
  const T: any = await Promise.race([import('tesseract.js'), stopped]);
  const n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1, Math.ceil(images.length / 20)));
  const starting = Promise.all(Array.from({ length: n }, () => T.createWorker(lang, 1)));
  starting.then((ws: any[]) => signal.aborted && ws.forEach((w) => w.terminate().catch(() => {}))).catch(() => {});
  const workers: any[] = await Promise.race([starting, stopped]);
  const texts: string[] = new Array(images.length).fill('');
  let next = 0, done = 0;
  onProgress(0, images.length, 'read');
  const run = async (w: any) => {
    try {
      await w.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' });
      while (next < images.length && !signal.aborted) {
        const i = next++;
        const r = await w.recognize(toCanvas(images[i]));
        texts[i] = tidy(r.data.text ?? '');
        onProgress(++done, images.length, 'read');
      }
    } finally {
      await w.terminate().catch(() => {});
    }
  };
  await Promise.race([Promise.all(workers.map(run)), stopped]);
  return images.map((im, i) => ({ start: im.start, end: im.end, text: texts[i] })).filter((c) => c.text);
}
