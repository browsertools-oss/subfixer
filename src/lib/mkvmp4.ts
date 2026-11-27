// Turns the tracks of an MKV into the parts of an MP4 without decoding them. The video and audio
// frames are copied byte for byte (a remux), so the picture and sound do not change. Text subtitles
// are read with the MKV reader and written as mov_text (tx3g) samples.

import { Reader, children, headerAt, uintOf, ID, type MkvSource } from './mkv.ts';

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
