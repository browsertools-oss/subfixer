// Turns the tracks of an MKV into the parts of an MP4 without decoding them. The video and audio
// frames are copied byte for byte (a remux), so the picture and sound do not change. Text subtitles
// are read with the MKV reader and written as mov_text (tx3g) samples.

import { CHUNK, Reader, assToSrt, children, headerAt, readVint, scanMkv, trackFile, uintOf, ID, type MkvSource } from './mkv.ts';
import { parse } from './subs.ts';
import type { Part } from './mkvwrite.ts';

const VIDEO = 0xe0;
const PIXEL_WIDTH = 0xb0;
const PIXEL_HEIGHT = 0xba;
const DISPLAY_WIDTH = 0x54b0;
const DISPLAY_HEIGHT = 0x54ba;
const AUDIO = 0xe1;
const SAMPLING_FREQUENCY = 0xb5;
const CHANNELS = 0x9f;
const DEFAULT_DURATION = 0x23e383;
const REFERENCE_BLOCK = 0xfb;

const TRACK_VIDEO = 1;
const TRACK_AUDIO = 2;
const TRACK_SUBTITLE = 17;

export interface RemuxTrack {
  number: number;
  type: 'video' | 'audio' | 'subtitle';
  codec: string;
  label: string;
  language: string;
  name: string;
  isDefault: boolean;
  forced: boolean;
  ok: boolean;
  reason: string;
  note: string;
}

export interface RemuxOptions {
  audio: number[];
  subs: number[];
  defaultAudio?: number;
  defaultSub?: number | null;
}

// What the writer needs beyond the public fields.
interface Parsed extends RemuxTrack {
  mp4: string;
  priv: Uint8Array;
  rate: number;
  channels: number;
  width: number;
  height: number;
  displayWidth: number;
  displayHeight: number;
  defaultDuration: number;
}

const VIDEO_NAMES: Record<string, string> = {
  V_VP9: 'VP9',
  V_VP8: 'VP8',
  V_AV1: 'AV1',
  V_MPEG2: 'MPEG-2',
  'V_MPEG4/ISO/ASP': 'MPEG-4 Part 2 (DivX or Xvid)',
  'V_MS/VFW/FOURCC': 'an old Windows format (often DivX or Xvid)',
};

const AUDIO_NAMES: Record<string, string> = {
  A_AC3: 'AC3',
  A_EAC3: 'E-AC3',
  A_DTS: 'DTS',
  A_TRUEHD: 'Dolby TrueHD',
  A_FLAC: 'FLAC',
  A_OPUS: 'Opus',
  A_VORBIS: 'Vorbis',
};

const SUB_LABELS: Record<string, string> = {
  'S_TEXT/UTF8': 'SRT',
  'S_TEXT/ASS': 'ASS',
  'S_TEXT/SSA': 'SSA',
  'S_TEXT/WEBVTT': 'WebVTT',
};

const AAC_RATES = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
const AAC_OBJECT: Record<string, number> = { MAIN: 1, LC: 2, SSR: 3, LTP: 4, 'LC/SBR': 2 };

// The two-byte AudioSpecificConfig for an AAC track whose CodecPrivate is missing, such as
// A_AAC/MPEG4/LC. Returns null when the profile or the sampling rate is not one MP4 can hold.
export function aacConfig(codec: string, rate: number, channels: number): Uint8Array | null {
  const m = /^A_AAC\/MPEG[24]\/(.+)$/.exec(codec);
  const ot = m ? AAC_OBJECT[m[1]] : undefined;
  const sf = AAC_RATES.indexOf(rate);
  if (!ot || sf < 0) return null;
  return new Uint8Array([(ot << 3) | (sf >> 1), ((sf & 1) << 7) | (channels << 3)]);
}

function floatOf(b: Uint8Array | undefined): number {
  if (!b) return 0;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b.length === 8) return v.getFloat64(0);
  if (b.length === 4) return v.getFloat32(0);
  return 0;
}

// Reads one TrackEntry and decides whether MP4 can hold it, and why not if it cannot.
function readTrack(entry: Uint8Array): Parsed {
  const kids = children(entry);
  const field = (id: number) => kids.find((k) => k.id === id)?.data;
  const num = (id: number, dflt: number) => {
    const f = field(id);
    return f ? uintOf(f) : dflt;
  };
  const text = (id: number) => {
    const f = field(id);
    return f ? new TextDecoder().decode(f).replace(/\0+$/, '') : '';
  };
  const innerNum = (list: { id: number; data: Uint8Array }[], id: number, dflt: number) => {
    const f = list.find((k) => k.id === id)?.data;
    return f ? uintOf(f) : dflt;
  };

  const type = num(ID.TRACK_TYPE, 0);
  const codec = text(ID.CODEC_ID);
  const priv = field(ID.CODEC_PRIVATE) ?? new Uint8Array(0);
  const encoded = kids.some((k) => k.id === ID.CONTENT_ENCODINGS);
  const videoFields = children(field(VIDEO) ?? new Uint8Array(0));
  const audioFields = children(field(AUDIO) ?? new Uint8Array(0));

  const out: Parsed = {
    number: num(ID.TRACK_NUMBER, 0),
    type: 'subtitle',
    codec,
    label: codec,
    language: text(ID.LANGUAGE) || 'eng',
    name: text(ID.NAME),
    isDefault: (() => {
      const f = field(ID.FLAG_DEFAULT);
      return f ? uintOf(f) === 1 : true;
    })(),
    forced: num(ID.FLAG_FORCED, 0) === 1,
    ok: false,
    reason: '',
    note: '',
    mp4: '',
    priv,
    rate: 0,
    channels: 1,
    width: innerNum(videoFields, PIXEL_WIDTH, 0),
    height: innerNum(videoFields, PIXEL_HEIGHT, 0),
    displayWidth: innerNum(videoFields, DISPLAY_WIDTH, 0),
    displayHeight: innerNum(videoFields, DISPLAY_HEIGHT, 0),
    defaultDuration: num(DEFAULT_DURATION, 0),
  };

  if (type === TRACK_VIDEO) {
    out.type = 'video';
    if (codec === 'V_MPEG4/ISO/AVC' && priv.length >= 7 && !encoded) {
      out.ok = true;
      out.label = 'H.264';
      out.mp4 = 'avc1';
      if ([110, 122, 244].includes(priv[1])) {
        out.note = 'This video is 10-bit H.264. It copies fine, but most phones and TVs cannot play it in any container.';
      }
    } else if (codec === 'V_MPEGH/ISO/HEVC' && priv.length >= 23 && !encoded) {
      out.ok = true;
      out.label = 'H.265';
      out.mp4 = 'hvc1';
    } else {
      const name = VIDEO_NAMES[codec] ?? codec;
      out.reason = `This video is ${name}. MP4 players need H.264 or H.265, so it would have to be re-encoded, which this page does not do.`;
    }
    return out;
  }

  if (type === TRACK_AUDIO) {
    out.type = 'audio';
    out.rate = floatOf(audioFields.find((k) => k.id === SAMPLING_FREQUENCY)?.data) || 8000;
    out.channels = innerNum(audioFields, CHANNELS, 1);
    if (codec === 'A_AAC' && priv.length >= 2 && !encoded) {
      out.ok = true;
      out.label = 'AAC';
      out.mp4 = 'mp4a';
    } else if (codec.startsWith('A_AAC/') && !encoded) {
      const cfg = aacConfig(codec, Math.round(out.rate), out.channels);
      if (cfg) {
        out.ok = true;
        out.label = 'AAC';
        out.mp4 = 'mp4a';
        out.priv = cfg;
      } else {
        out.reason = 'This audio track is stored in a way MP4 cannot hold, so it is left out.';
      }
    } else if (codec === 'A_MPEG/L3' && !encoded) {
      out.ok = true;
      out.label = 'MP3';
      out.mp4 = 'mp3';
    } else if ((codec === 'A_AC3' || codec === 'A_EAC3') && !encoded) {
      out.ok = true;
      out.label = codec === 'A_AC3' ? 'AC3' : 'E-AC3';
      out.mp4 = 'mp4a';
    } else if (encoded || out.rate > 65535) {
      out.reason = 'This audio track is stored in a way MP4 cannot hold, so it is left out.';
    } else {
      const name = AUDIO_NAMES[codec] ?? (codec.startsWith('A_PCM') ? 'PCM' : codec);
      out.reason = `${name} audio is left out. MP4 players on phones and TVs do not play it.`;
    }
    return out;
  }

  if (type === TRACK_SUBTITLE) {
    out.type = 'subtitle';
    if (SUB_LABELS[codec]) {
      out.ok = true;
      out.label = SUB_LABELS[codec];
      out.mp4 = 'tx3g';
    } else if (codec === 'S_HDMV/PGS') {
      out.label = 'PGS';
      out.reason = 'Picture subtitles cannot go into an MP4. Save this track as .sup with the MKV subtitle extractor, then read it into text with SUP to SRT.';
    } else if (codec === 'S_VOBSUB' || codec === 'S_DVBSUB') {
      out.label = codec === 'S_VOBSUB' ? 'VobSub' : 'DVB';
      out.reason = 'Picture subtitles cannot go into an MP4, so this track is left out.';
    } else {
      out.reason = 'This subtitle format is left out.';
    }
    return out;
  }

  out.reason = 'This track type is left out.';
  return out;
}

// Reads the track list, and keeps only the first video track that MP4 can hold.
async function readTracks(src: MkvSource): Promise<Parsed[]> {
  const r = new Reader(src);
  const head = await r.get(0, 12);
  if (head.length < 4 || head[0] !== 0x1a || head[1] !== 0x45 || head[2] !== 0xdf || head[3] !== 0xa3) {
    throw new Error('This is not an MKV or WebM file.');
  }
  const ebml = headerAt(head, 0, 0);
  if (!ebml || ebml.unknown) throw new Error('This is not an MKV or WebM file.');
  const segAt = ebml.dataStart + ebml.size;
  const seg = headerAt(await r.get(segAt, 12), 0, segAt);
  if (!seg || seg.id !== ID.SEGMENT) throw new Error('This MKV has no Segment.');
  const segEnd = seg.unknown ? src.size : Math.min(src.size, seg.dataStart + seg.size);

  let p = seg.dataStart;
  while (p < segEnd) {
    const h = headerAt(await r.get(p, 12), 0, p);
    if (!h || h.id === ID.CLUSTER) break;
    if (h.id === ID.TRACKS) {
      if (h.unknown || h.size > 1 << 20) throw new Error('This MKV track list is damaged.');
      const body = await r.get(h.dataStart, h.size);
      const tracks = children(body)
        .filter((c) => c.id === ID.TRACK_ENTRY)
        .map((c) => readTrack(c.data));
      const chosen = tracks.find((t) => t.type === 'video' && t.ok);
      if (chosen) {
        for (const t of tracks) {
          if (t.type === 'video' && t !== chosen) {
            t.ok = false;
            t.reason = 'Only the first video track is kept.';
          }
        }
      }
      return tracks;
    }
    if (h.unknown) break;
    p = h.dataStart + h.size;
  }
  throw new Error('This MKV has no track list.');
}

// Lists the tracks of an MKV and what MP4 can do with each one.
export async function listRemux(src: MkvSource): Promise<RemuxTrack[]> {
  return readTracks(src);
}

// ---- Writing the MP4 ----

type Bytes = Uint8Array;

function cat(...parts: Bytes[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

function u8(n: number): Bytes {
  return new Uint8Array([n & 0xff]);
}

function u16(n: number): Bytes {
  return new Uint8Array([(n >> 8) & 0xff, n & 0xff]);
}

function u24(n: number): Bytes {
  return new Uint8Array([(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]);
}

function u32(n: number): Bytes {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0);
  return b;
}

function u64(n: number): Bytes {
  return cat(u32(Math.floor(n / 2 ** 32)), u32(n % 2 ** 32));
}

function ascii(s: string): Bytes {
  return new TextEncoder().encode(s);
}

function zeros(n: number): Bytes {
  return new Uint8Array(n);
}

function box(type: string, ...parts: Bytes[]): Bytes {
  const body = cat(...parts);
  return cat(u32(8 + body.length), ascii(type), body);
}

// A full box: version and flags come before the body.
function full(type: string, version: number, flags: number, ...parts: Bytes[]): Bytes {
  return box(type, u8(version), u24(flags), ...parts);
}

// The 64-bit mdat header, so a body of 4 GB and up works too.
export function mdatHeader(bodySize: number): Bytes {
  return cat(u32(1), ascii('mdat'), u64(16 + bodySize));
}

// An MPEG-4 descriptor: tag, a 4-byte length (written as 0x80 0x80 0x80 n), then the body.
function desc(tag: number, ...body: Bytes[]): Bytes {
  const b = cat(...body);
  return cat(u8(tag), new Uint8Array([0x80, 0x80, 0x80, b.length]), b);
}

// A table box whose entries are written into one preallocated buffer. Large tables never go
// through spread or push(...list).
function table(type: string, head: Bytes, n: number, stride: number, put: (dv: DataView, at: number, i: number) => void): Bytes {
  const body = new Uint8Array(head.length + stride * n);
  body.set(head, 0);
  const dv = new DataView(body.buffer);
  for (let i = 0; i < n; i++) put(dv, head.length + stride * i, i);
  return full(type, 0, 0, body);
}

// Chunk offsets: stco with 32-bit entries, or co64 when an offset does not fit in 32 bits.
export function chunkOffsetBox(offsets: number[]): Bytes {
  const big = offsets.some((o) => o >= 2 ** 32);
  if (!big) {
    return table('stco', u32(offsets.length), offsets.length, 4, (dv, at, i) => dv.setUint32(at, offsets[i]));
  }
  return table('co64', u32(offsets.length), offsets.length, 8, (dv, at, i) => {
    dv.setUint32(at, Math.floor(offsets[i] / 2 ** 32));
    dv.setUint32(at + 4, offsets[i] % 2 ** 32);
  });
}

// Run-length encodes values as [count, value] pairs.
function runs(values: number[]): [number, number][] {
  const out: [number, number][] = [];
  for (const v of values) {
    const last = out[out.length - 1];
    if (last && last[1] === v) last[0]++;
    else out.push([1, v]);
  }
  return out;
}

// Presentation times (in 90 kHz ticks) in file order. Decode times are the sorted list; each
// frame's offset ctts[i] puts its picture at p[i] once the shift is taken off.
export function decodeOrder(p: number[]): { dts: number[]; ctts: number[]; shift: number } {
  const sorted = Float64Array.from(p);
  sorted.sort();
  const dts = Array.from(sorted);
  let shift = 0;
  for (let i = 0; i < dts.length; i++) shift = Math.max(shift, dts[i] - p[i]);
  const ctts = p.map((v, i) => v - dts[i] + shift);
  return { dts, ctts, shift };
}

// AC3 (dac3) box: 3 bytes from the first frame.
export function dac3(f: Uint8Array): Uint8Array {
  const fscod = f[4] >> 6;
  const frmsizecod = f[4] & 0x3f;
  const bsid = f[5] >> 3;
  const bsmod = f[5] & 7;
  const acmod = f[6] >> 5;
  const x = (f[6] << 8) | f[7];
  let pos = 3;
  if ((acmod & 1) && acmod !== 1) pos += 2;
  if (acmod & 4) pos += 2;
  if (acmod === 2) pos += 2;
  const lfeon = (x >> (15 - pos)) & 1;
  const v = (fscod << 22) | (bsid << 17) | (bsmod << 14) | (acmod << 11) | (lfeon << 10) | ((frmsizecod >> 1) << 5);
  return new Uint8Array([v >> 16 & 0xff, v >> 8 & 0xff, v & 0xff]);
}

// E-AC3 (dec3) box: 5 bytes from the first frame.
export function dec3(f: Uint8Array): { body: Uint8Array; samples: number } {
  const frmsiz = ((f[2] & 7) << 8) | f[3];
  const fscod = f[4] >> 6;
  const numblkscod = (f[4] >> 4) & 3;
  const acmod = (f[4] >> 1) & 7;
  const lfeon = f[4] & 1;
  const bsid = f[5] >> 3;
  let rate: number;
  let blocks: number;
  if (fscod === 3) {
    rate = [24000, 22050, 16000][numblkscod];
    blocks = 6;
  } else {
    rate = [48000, 44100, 32000][fscod];
    blocks = [1, 2, 3, 6][numblkscod];
  }
  const samples = blocks * 256;
  const dataRate = Math.round((frmsiz + 1) * 2 * 8 * rate / samples / 1000);
  const v = (fscod << 22) | (bsid << 17) | (acmod << 9) | (lfeon << 8);
  const body = new Uint8Array([dataRate >> 5, (dataRate << 3) & 0xff, v >> 16 & 0xff, v >> 8 & 0xff, v & 0xff]);
  return { body, samples };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function packLanguage(code: string): number {
  const c = /^[a-z]{3}$/.test(code) ? code : 'und';
  return ((c.charCodeAt(0) - 0x60) << 10) | ((c.charCodeAt(1) - 0x60) << 5) | (c.charCodeAt(2) - 0x60);
}

const MATRIX = cat(u32(0x10000), u32(0), u32(0), u32(0), u32(0x10000), u32(0), u32(0), u32(0), u32(0x40000000));

interface Frames {
  offset: number[];
  size: number[];
  pts: number[];
  key: boolean[];
  sourceOffset?: number;
}

interface Edit {
  duration: number; // movie timescale (ms)
  mediaTime: number; // media timescale, -1 for an empty edit
}

interface TrackOut {
  kind: 'video' | 'audio' | 'sub';
  id: number;
  flags: number;
  group: number;
  language: string;
  timescale: number;
  mediaDuration: number;
  movieDuration: number;
  edits: Edit[];
  entry: Bytes;
  stts: [number, number][];
  ctts: [number, number][];
  stss: number[];
  sizes: number[];
  offsets: number[];
  width: number;
  height: number;
  volume: number;
  handler: string;
  handlerName: string;
  mediaHeader: Bytes;
}

function trackBox(t: TrackOut): Bytes {
  const tkhd = full(
    'tkhd',
    0,
    t.flags,
    u32(0),
    u32(0),
    u32(t.id),
    u32(0),
    u32(t.movieDuration),
    zeros(8),
    u16(0),
    u16(t.group),
    u16(t.volume),
    u16(0),
    MATRIX,
    u32(t.width * 65536),
    u32(t.height * 65536),
  );
  const parts = [tkhd];
  if (t.edits.length) {
    const elst = full(
      'elst',
      0,
      0,
      u32(t.edits.length),
      ...t.edits.map((e) => cat(u32(e.duration), u32(e.mediaTime >>> 0), u16(1), u16(0))),
    );
    parts.push(box('edts', elst));
  }
  const mdhd = full('mdhd', 0, 0, u32(0), u32(0), u32(t.timescale), u32(t.mediaDuration), u16(packLanguage(t.language)), u16(0));
  const hdlr = full('hdlr', 0, 0, u32(0), ascii(t.handler), zeros(12), ascii(`${t.handlerName}\0`));
  const dinf = box('dinf', full('dref', 0, 0, u32(1), full('url ', 0, 1)));
  const stts = table('stts', u32(t.stts.length), t.stts.length, 8, (dv, at, i) => {
    dv.setUint32(at, t.stts[i][0]);
    dv.setUint32(at + 4, t.stts[i][1]);
  });
  const stbl = [
    full('stsd', 0, 0, u32(1), t.entry),
    stts,
  ];
  if (t.ctts.length) {
    stbl.push(table('ctts', u32(t.ctts.length), t.ctts.length, 8, (dv, at, i) => {
      dv.setUint32(at, t.ctts[i][0]);
      dv.setUint32(at + 4, t.ctts[i][1]);
    }));
  }
  if (t.stss.length) {
    stbl.push(table('stss', u32(t.stss.length), t.stss.length, 4, (dv, at, i) => dv.setUint32(at, t.stss[i])));
  }
  stbl.push(full('stsc', 0, 0, u32(1), u32(1), u32(1), u32(1)));
  stbl.push(table('stsz', cat(u32(0), u32(t.sizes.length)), t.sizes.length, 4, (dv, at, i) => dv.setUint32(at, t.sizes[i])));
  stbl.push(chunkOffsetBox(t.offsets));
  const minf = box('minf', t.mediaHeader, dinf, box('stbl', ...stbl));
  return box('trak', ...parts, box('mdia', mdhd, hdlr, minf));
}

// One sample of a text track: a 16-bit length and the UTF-8 text (the tx3g layout).
function textSample(text: string): Bytes {
  const bytes = new TextEncoder().encode(text);
  return cat(u16(bytes.length), bytes);
}

// Converts the MKV in src into MP4 parts. The first video track and the kept audio tracks are copied
// frame by frame, text subtitles are written as tx3g samples, and moov is last.
export async function remuxMkv(
  src: MkvSource,
  opts: RemuxOptions,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<{ parts: Part[]; size: number; notes: string[] }> {
  const tracks = await readTracks(src);
  const video = tracks.find((t) => t.type === 'video' && t.ok);
  if (!video) {
    const first = tracks.find((t) => t.type === 'video');
    throw new Error(first?.reason || 'This file has no video track.');
  }
  const audioKept = tracks.filter((t) => t.type === 'audio' && t.ok && opts.audio.includes(t.number));
  const subKept = tracks.filter((t) => t.type === 'subtitle' && t.ok && opts.subs.includes(t.number));
  const notes: string[] = tracks.filter((t) => !t.ok && t.reason).map((t) => t.reason);

  // Subtitle text first. It reads the file once, so the copy below reports half the progress.
  const scaled = subKept.length > 0;
  const lines = new Map<number, { start: number; end: number; text: string }[]>();
  if (scaled) {
    const scan = await scanMkv(src, (d, t) => onProgress?.(d, 2 * t), signal);
    for (const t of subKept) {
      const info = scan.tracks.find((x) => x.number === t.number);
      if (!info) continue;
      let { text } = trackFile(info, scan.cues.get(t.number) ?? [], scan.codecPrivate.get(t.number) ?? '');
      if (info.kind === 'ass') text = assToSrt(text);
      const captions = parse(text, 23.976, { name: info.kind === 'vtt' ? 'track.vtt' : 'track.srt' }).captions;
      lines.set(
        t.number,
        captions
          .map((c) => ({
            start: c.start,
            end: c.end,
            text: c.text.replace(/<[^>]+>/g, '').replace(/\{\\[^}]*\}/g, '').trim(),
          }))
          .filter((c) => c.text !== ''),
      );
    }
  }

  // The copy walk. Every cluster is copied whole as one slice; frames keep their offset in the new file.
  const ftyp = box('ftyp', ascii('isom'), u32(512), ascii('isom'), ascii('iso2'), ascii('avc1'), ascii('mp41'));
  const base = ftyp.length + 16;
  const r = new Reader(src);
  const size = src.size;
  const head = await r.get(0, 12);
  if (head.length < 4 || head[0] !== 0x1a || head[1] !== 0x45 || head[2] !== 0xdf || head[3] !== 0xa3) {
    throw new Error('This is not an MKV or WebM file.');
  }
  const ebml = headerAt(head, 0, 0);
  if (!ebml || ebml.unknown) throw new Error('This is not an MKV or WebM file.');
  const segAt = ebml.dataStart + ebml.size;
  const seg = headerAt(await r.get(segAt, 12), 0, segAt);
  if (!seg || seg.id !== ID.SEGMENT) throw new Error('This MKV has no Segment.');
  if (seg.unknown) throw new Error('This file was saved while it was being recorded, so its parts have no stated size. This page cannot convert it.');
  const segEnd = Math.min(size, seg.dataStart + seg.size);

  const keep = new Map<number, Frames>();
  for (const t of [video, ...audioKept]) keep.set(t.number, { offset: [], size: [], pts: [], key: [] });
  let scale = 1000000;
  const ranges: { start: number; end: number }[] = [];
  let copied = 0;
  let delta = 0;
  const walkBase = scaled ? size : 0;
  const total = scaled ? 2 * size : size;
  let lastReport = -CHUNK;

  // Reads the blocks of one cluster and records the frames of the kept tracks.
  async function addBlock(dataStart: number, blockEnd: number, ts: number, key?: boolean): Promise<void> {
    const b = await r.get(dataStart, Math.min(blockEnd - dataStart, 4096));
    const tn = readVint(b, 0, false);
    if (!tn) throw new Error('This MKV is damaged.');
    const f = keep.get(tn.value);
    if (!f) return;
    const q = tn.length;
    if (q + 3 > b.length) throw new Error('This MKV is damaged.');
    const rr = (b[q] << 8) | b[q + 1];
    const rel = rr >= 0x8000 ? rr - 0x10000 : rr;
    const flags = b[q + 2];
    const isKey = key ?? (flags & 0x80) !== 0;
    const lacing = (flags & 0x06) >> 1;
    let p = q + 3;
    const starts: number[] = [];
    const sizes: number[] = [];
    if (lacing === 0) {
      starts.push(dataStart + p);
      sizes.push(blockEnd - (dataStart + p));
    } else {
      if (p >= b.length) throw new Error('This MKV is damaged.');
      const count = b[p] + 1;
      p++;
      const lens: number[] = [];
      if (lacing === 1) {
        for (let i = 0; i < count - 1; i++) {
          let s = 0;
          let v: number;
          do {
            if (p >= b.length) throw new Error('This MKV is damaged.');
            v = b[p++];
            s += v;
          } while (v === 255);
          lens.push(s);
        }
      } else if (lacing === 2) {
        const each = (blockEnd - (dataStart + p)) / count;
        if (!Number.isInteger(each)) throw new Error('This MKV is damaged.');
        for (let i = 0; i < count - 1; i++) lens.push(each);
      } else {
        let prev = 0;
        for (let i = 0; i < count - 1; i++) {
          const v = readVint(b, p, false);
          if (!v) throw new Error('This MKV is damaged.');
          p += v.length;
          prev = i === 0 ? v.value : prev + (v.value - (2 ** (7 * v.length - 1) - 1));
          lens.push(prev);
        }
      }
      let cursor = dataStart + p;
      for (const n of lens) {
        starts.push(cursor);
        sizes.push(n);
        cursor += n;
      }
      if (cursor > blockEnd) throw new Error('This MKV is damaged.');
      starts.push(cursor);
      sizes.push(blockEnd - cursor);
    }
    const pts = ((ts + rel) * scale) / 1e6;
    for (let i = 0; i < starts.length; i++) {
      f.offset.push(starts[i] + delta);
      f.size.push(sizes[i]);
      f.pts.push(pts);
      f.key.push(isKey);
      if (f.sourceOffset === undefined) f.sourceOffset = starts[i];
    }
  }

  async function readCluster(dataStart: number, end: number): Promise<void> {
    let ts = 0;
    let at = dataStart;
    while (at < end) {
      const c = headerAt(await r.get(at, 16), 0, at);
      if (!c || c.unknown || c.dataStart + c.size > end) throw new Error('This MKV is damaged.');
      const cEnd = c.dataStart + c.size;
      if (c.id === ID.TIMESTAMP) {
        ts = uintOf(await r.get(c.dataStart, c.size));
      } else if (c.id === ID.SIMPLE_BLOCK) {
        await addBlock(c.dataStart, cEnd, ts);
      } else if (c.id === ID.BLOCK_GROUP) {
        let q = c.dataStart;
        let blk: { dataStart: number; size: number } | null = null;
        let ref = false;
        while (q < cEnd) {
          const g = headerAt(await r.get(q, 16), 0, q);
          if (!g || g.unknown || g.dataStart + g.size > cEnd) throw new Error('This MKV is damaged.');
          if (g.id === ID.BLOCK) blk = g;
          if (g.id === REFERENCE_BLOCK) ref = true;
          q = g.dataStart + g.size;
        }
        if (blk) await addBlock(blk.dataStart, blk.dataStart + blk.size, ts, !ref);
      }
      at = cEnd;
    }
  }

  let p = seg.dataStart;
  while (p < segEnd) {
    if (p - lastReport >= CHUNK) {
      signal?.throwIfAborted();
      onProgress?.(walkBase + p, total);
      lastReport = p;
    }
    const h = headerAt(await r.get(p, 12), 0, p);
    if (!h) break;
    if (h.unknown) {
      throw new Error('This file was saved while it was being recorded, so its parts have no stated size. This page cannot convert it.');
    }
    const end = h.dataStart + h.size;
    if (end > segEnd) throw new Error('This MKV is damaged.');
    if (h.id === ID.INFO) {
      for (const c of children(await r.get(h.dataStart, h.size))) {
        if (c.id === ID.TIMESTAMP_SCALE) scale = uintOf(c.data) || scale;
      }
    } else if (h.id === ID.CLUSTER) {
      const last = ranges[ranges.length - 1];
      if (!last || last.end !== p) {
        delta = base + copied - p;
        ranges.push({ start: p, end });
      } else {
        last.end = end;
      }
      copied += end - p;
      await readCluster(h.dataStart, end);
    }
    p = end;
  }

  // Post-walk: read the first frame of each kept AC3 or E-AC3 track to verify it.
  for (const a of audioKept) {
    const af = keep.get(a.number)!;
    if ((a.codec === 'A_AC3' || a.codec === 'A_EAC3') && af.sourceOffset !== undefined) {
      const frame = await r.get(af.sourceOffset, 8);
      if (frame.length < 2 || frame[0] !== 0x0b || frame[1] !== 0x77) {
        a.ok = false;
        a.reason = 'This Dolby track could not be read, so it was left out.';
        notes.push(`Audio track ${a.number} (${a.label}): ${a.reason}`);
      }
    }
  }

  const vf = keep.get(video.number)!;
  if (vf.offset.length === 0) throw new Error('This MKV has no video data.');

  // Timing. t0 is the first kept frame; all times start there.
  let t0 = Infinity;
  for (const n of keep.keys()) {
    for (const v of keep.get(n)!.pts) if (v < t0) t0 = v;
  }

  const out: TrackOut[] = [];
  const subBytes: Bytes[] = [];

  // Video: decode order from the presentation times.
  const vp = vf.pts.map((v) => Math.round((v - t0) * 90));
  const { dts, ctts, shift } = decodeOrder(vp);
  const vdur: number[] = [];
  for (let i = 0; i < dts.length - 1; i++) vdur.push(dts[i + 1] - dts[i]);
  const defDur = video.defaultDuration ? Math.round((video.defaultDuration * 90) / 1e6) : 0;
  vdur.push(defDur || (vdur.length ? vdur[vdur.length - 1] : 3754));
  const mediaDur = vdur.reduce((a, b) => a + b, 0);
  if (mediaDur / 90 > 0xffffffff) throw new Error('This film is too long for this page.');
  const vEdits: Edit[] = [];
  if (dts[0] > 0) vEdits.push({ duration: Math.round(dts[0] / 90), mediaTime: -1 });
  vEdits.push({ duration: Math.round(mediaDur / 90), mediaTime: shift });
  const keys: number[] = [];
  vf.key.forEach((k, i) => {
    if (k) keys.push(i + 1);
  });
  const videoEntry = box(
    video.mp4,
    zeros(6),
    u16(1),
    u16(0),
    u16(0),
    zeros(12),
    u16(video.width),
    u16(video.height),
    u32(0x00480000),
    u32(0x00480000),
    u32(0),
    u16(1),
    zeros(32),
    u16(0x18),
    u16(0xffff),
    box(video.mp4 === 'hvc1' ? 'hvcC' : 'avcC', video.priv),
    ...(video.displayWidth && video.displayHeight && video.displayWidth * video.height !== video.displayHeight * video.width
      ? [
          (() => {
            const a = video.displayWidth * video.height;
            const b = video.displayHeight * video.width;
            const g = gcd(a, b);
            return box('pasp', u32(a / g), u32(b / g));
          })(),
        ]
      : []),
  );
  const displayOn = video.displayWidth && video.displayHeight;
  const displayW = displayOn ? Math.round((video.height * video.displayWidth) / video.displayHeight) : video.width;
  out.push({
    kind: 'video',
    id: 1,
    flags: 3,
    group: 0,
    language: video.language,
    timescale: 90000,
    mediaDuration: mediaDur,
    movieDuration: Math.round(mediaDur / 90),
    edits: vEdits,
    entry: videoEntry,
    stts: runs(vdur),
    // ctts and stss are written only when some frame needs them.
    ctts: ctts.some((c) => c !== 0) ? runs(ctts) : [],
    stss: keys.length === vf.key.length ? [] : keys,
    sizes: vf.size,
    offsets: vf.offset,
    width: displayW,
    height: video.height,
    volume: 0,
    handler: 'vide',
    handlerName: 'VideoHandler',
    mediaHeader: full('vmhd', 0, 1, zeros(8)),
  });

  // Audio: one sample per frame, every frame lasts the same time.
  let firstAudio = true;
  for (const a of audioKept) {
    const af = keep.get(a.number)!;
    if (af.offset.length === 0) continue;
    const isAc3 = a.codec === 'A_AC3';
    const isEc3 = a.codec === 'A_EAC3';
    const isMp3 = a.mp4 === 'mp3';
    const delta = isMp3 ? (a.rate < 32000 ? 576 : 1152) : isAc3 || isEc3 ? 1536 : 1024;
    const n = af.offset.length;
    const first = Math.round(af.pts[0] - t0);
    const durMs = Math.round((n * delta * 1000) / a.rate);
    const edits: Edit[] = [];
    if (first > 0) edits.push({ duration: first, mediaTime: -1 });
    edits.push({ duration: durMs, mediaTime: 0 });
    const timescale = Math.round(a.rate);
    const id = out.length + 1;
    let samplesEntry: Bytes;
    if (isAc3) {
      const f = await r.get(af.sourceOffset!, 8);
      const dac3box = box('dac3', dac3(f));
      samplesEntry = box(
        'ac-3',
        zeros(6),
        u16(1),
        zeros(8),
        u16(a.channels),
        u16(16),
        u16(0),
        u16(0),
        u32(timescale * 65536),
        dac3box,
      );
    } else if (isEc3) {
      const f = await r.get(af.sourceOffset!, 8);
      const { body, samples } = dec3(f);
      const dec3box = box('dec3', body);
      samplesEntry = box(
        'ec-3',
        zeros(6),
        u16(1),
        zeros(8),
        u16(a.channels),
        u16(16),
        u16(0),
        u16(0),
        u32(timescale * 65536),
        dec3box,
      );
    } else {
      const decoder = isMp3
        ? desc(4, u8(0x6b), u8(0x15), u24(0), u32(0), u32(0))
        : desc(4, u8(0x40), u8(0x15), u24(0), u32(0), u32(0), desc(5, a.priv));
      const esds = full('esds', 0, 0, desc(3, u16(id), u8(0), decoder, desc(6, u8(2))));
      samplesEntry = box(
        'mp4a',
        zeros(6),
        u16(1),
        zeros(8),
        u16(a.channels),
        u16(16),
        u16(0),
        u16(0),
        u32(timescale * 65536),
        esds,
      );
    }
    // Only the first kept audio track is marked on by default unless the options name another one.
    const on = opts.defaultAudio !== undefined ? opts.defaultAudio === a.number : firstAudio;
    out.push({
      kind: 'audio',
      id,
      flags: on ? 3 : 2,
      group: 1,
      language: a.language,
      timescale,
      mediaDuration: n * delta,
      movieDuration: durMs + (first > 0 ? first : 0),
      edits,
      entry: samplesEntry,
      stts: [[n, delta]],
      ctts: [],
      stss: [],
      sizes: af.size,
      offsets: af.offset,
      width: 0,
      height: 0,
      volume: 0x0100,
      handler: 'soun',
      handlerName: 'SoundHandler',
      mediaHeader: full('smhd', 0, 0, zeros(4)),
    });
    firstAudio = false;
  }

  // Subtitles: one tx3g sample per caption, with empty samples in the gaps.
  let subCopied = 0;
  for (const t of subKept) {
    const captions = (lines.get(t.number) ?? []).map((c) => ({ start: c.start - t0, end: c.end - t0, text: c.text })).sort((a, b) => a.start - b.start);
    const samples: { dur: number; bytes: Bytes }[] = [];
    let cursor = 0;
    for (let i = 0; i < captions.length; i++) {
      const c = captions[i];
      const nextStart = i + 1 < captions.length ? captions[i + 1].start : Infinity;
      const start = Math.max(c.start, cursor);
      const end = Math.min(c.end, nextStart);
      if (end <= start) continue;
      if (start > cursor) samples.push({ dur: start - cursor, bytes: u16(0) });
      samples.push({ dur: end - start, bytes: textSample(c.text) });
      cursor = end;
    }
    if (samples.length === 0) {
      notes.push(`Subtitle track ${t.number} had no lines, so it was left out.`);
      continue;
    }
    const bodyLen = samples.reduce((n, s) => n + s.bytes.length, 0);
    const bodyBytes = new Uint8Array(bodyLen);
    const sizes: number[] = [];
    const offsets: number[] = [];
    const durs: number[] = [];
    let at = 0;
    for (const s of samples) {
      bodyBytes.set(s.bytes, at);
      sizes.push(s.bytes.length);
      offsets.push(base + copied + subCopied + at);
      durs.push(s.dur);
      at += s.bytes.length;
    }
    subBytes.push(bodyBytes);
    subCopied += bodyLen;
    const movieDur = durs.reduce((a, b) => a + b, 0);
    const tx3g = box(
      'tx3g',
      zeros(6),
      u16(1),
      u32(0),
      u8(1),
      u8(0xff),
      zeros(4),
      zeros(8),
      u16(0),
      u16(0),
      u16(1),
      u8(0),
      u8(18),
      new Uint8Array([255, 255, 255, 255]),
      box('ftab', u16(1), u16(1), u8(5), ascii('Serif')),
    );
    const on = opts.defaultSub !== undefined && opts.defaultSub === t.number;
    out.push({
      kind: 'sub',
      id: out.length + 1,
      flags: on ? 3 : 2,
      group: 2,
      language: 'und',
      timescale: 1000,
      mediaDuration: movieDur,
      movieDuration: movieDur,
      edits: [],
      entry: tx3g,
      stts: runs(durs),
      ctts: [],
      stss: [],
      sizes,
      offsets,
      width: 0,
      height: 0,
      volume: 0,
      handler: 'sbtl',
      handlerName: 'SubtitleHandler',
      mediaHeader: full('nmhd', 0, 0),
    });
  }
  const nextId = out.length + 1;

  const movieDuration = out.reduce((m, t) => Math.max(m, t.movieDuration), 0);
  if (movieDuration > 0xffffffff) throw new Error('This film is too long for this page.');
  const mvhd = full(
    'mvhd',
    0,
    0,
    u32(0),
    u32(0),
    u32(1000),
    u32(movieDuration),
    u32(0x00010000),
    u16(0x0100),
    zeros(10),
    MATRIX,
    zeros(24),
    u32(nextId),
  );
  const moov = box('moov', mvhd, ...out.map((t) => trackBox(t)));

  const mdatBody = copied + subCopied;
  const parts: Part[] = [cat(ftyp, mdatHeader(mdatBody))];
  for (const rg of ranges) parts.push({ start: rg.start, end: rg.end });
  for (const sb of subBytes) parts.push(sb);
  parts.push(moov);
  const outSize = parts.reduce((n, part) => n + (part instanceof Uint8Array ? part.length : part.end - part.start), 0);
  return { parts, size: outSize, notes };
}
