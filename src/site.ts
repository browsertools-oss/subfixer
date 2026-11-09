export const SITE = {
  name: 'SubFixer',
  tagline: 'Fix subtitle timing in your browser',
  url: 'https://subfixer.example', // replaced once the domain is bought
};

export type Mode = 'shift' | 'fps' | 'sync' | 'convert' | 'clean';

export interface ToolPage {
  slug: string; // '' = home
  mode: Mode;
  title: string; // <title>
  h1: string;
  lede: string;
  description: string; // meta description
  preset?: { from?: number; to?: number; out?: string };
  steps: string[];
  faq: { q: string; a: string }[];
}

const PRIVACY_FAQ = {
  q: 'Is my subtitle file uploaded anywhere?',
  a: 'No. The file is read and fixed by your browser. Nothing is sent to a server, so it works with private files and even offline once the page has loaded.',
};

export const PAGES: ToolPage[] = [
  {
    slug: '',
    mode: 'shift',
    title: 'Subtitle Fixer: shift, resync and convert SRT files online, free',
    h1: 'Fix out-of-sync subtitles',
    lede: 'Shift timing, fix frame-rate drift, resync to two points, clean up and convert SRT, VTT and ASS files. Free, private, and nothing leaves your browser.',
    description:
      'Free online subtitle fixer. Shift SRT timing, convert 25 fps to 23.976, resync by two points, fix encoding and convert SRT, VTT, ASS. Runs in your browser.',
    steps: [
      'Drop your .srt, .vtt, .ass or .sub file onto the box.',
      'Pick what is wrong: subtitles early or late, drifting, garbled characters, or the wrong format.',
      'Check the preview, then download the fixed file. It is always saved as clean UTF-8.',
    ],
    faq: [
      {
        q: 'My subtitles start in sync and drift further off. Which fix do I need?',
        a: 'That is a frame-rate mismatch, usually a 25 fps (PAL) subtitle on a 23.976 fps video. Use "Change frame rate" with 25 → 23.976. If you do not know the frame rates, use "Sync two points" with one line near the start and one near the end.',
      },
      {
        q: 'Subtitles are a fixed amount early or late the whole way through.',
        a: 'Use "Shift timing" and enter the offset. A positive number makes them appear later, a negative number earlier.',
      },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'shift-subtitle-timing',
    mode: 'shift',
    title: 'Shift subtitle timing online: delay or advance an SRT file',
    h1: 'Shift subtitle timing',
    lede: 'Move every line earlier or later by the same amount. Works with SRT, VTT, ASS and SSA, and keeps ASS styling intact.',
    description:
      'Delay or advance all subtitles in an SRT, VTT or ASS file by a fixed number of seconds. Free, instant and private: the file never leaves your browser.',
    steps: [
      'Drop in your subtitle file.',
      'Enter the offset: 2.5 delays by two and a half seconds, -1.2 shows them 1.2 seconds sooner. You can also type 00:01:05,300 or 1500ms.',
      'Download the shifted file.',
    ],
    faq: [
      {
        q: 'How do I find the right offset?',
        a: 'Play the video to the first spoken line and note the time it is said. Compare it with that line’s time in the preview here. The difference is your offset.',
      },
      {
        q: 'The offset is right at the start but wrong at the end.',
        a: 'Then it is not a constant offset. Use the frame-rate or two-point sync tool instead.',
      },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'convert-25-fps-to-23976',
    mode: 'fps',
    preset: { from: 25, to: 24000 / 1001 },
    title: 'Convert subtitles from 25 fps to 23.976 fps (PAL to NTSC film)',
    h1: 'Convert subtitles from 25 to 23.976 fps',
    lede: 'Subtitles made for a 25 fps (PAL) release drift ahead on a 23.976 fps file, about 2.5 seconds per minute. This stretches every timestamp by the exact ratio so they line up again.',
    description:
      'Fix subtitles that drift out of sync because they were timed for 25 fps PAL video. Convert SRT, VTT and ASS timing to 23.976 fps free in your browser.',
    steps: [
      'Drop in the subtitle file that drifts.',
      'Leave the preset at 25 → 23.976, or swap it if your subtitles drift the other way (they lag further behind).',
      'Download, then nudge with "Shift timing" if the first line is still slightly off.',
    ],
    faq: [
      {
        q: 'How do I know it is a frame-rate problem?',
        a: 'If the first lines are close but the gap grows steadily, roughly 4% of the running time, it is 25 vs 23.976. Lines that are off by the same amount throughout need a shift instead.',
      },
      {
        q: 'What exactly does the conversion do?',
        a: 'It multiplies every time by 25 ÷ 23.976 (≈1.0427). A line at 40:00 moves to about 41:42.',
      },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'change-subtitle-frame-rate',
    mode: 'fps',
    title: 'Change subtitle frame rate online: 23.976, 24, 25, 29.97, 30 fps',
    h1: 'Change subtitle frame rate',
    lede: 'Convert subtitle timing between any two frame rates: 23.976, 24, 25, 29.97 or 30 fps, or type your own.',
    description:
      'Convert SRT, VTT, ASS and MicroDVD subtitle timing between 23.976, 24, 25, 29.97 and 30 fps. Free online tool, runs locally in your browser.',
    steps: [
      'Drop in your subtitle file.',
      'Choose the frame rate the subtitles were made for, and the frame rate of your video.',
      'Download the converted file.',
    ],
    faq: [
      {
        q: 'Where do I find my video’s frame rate?',
        a: 'In VLC open Tools → Codec Information, or in most players look at the media info panel. Files ripped from European discs are often 25 fps, film releases 23.976.',
      },
      {
        q: 'Does this work for frame-based .sub (MicroDVD) files?',
        a: 'Yes. MicroDVD files store frame numbers, so the tool reads them at the source frame rate and writes the result with real timestamps.',
      },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'sync-subtitles',
    mode: 'sync',
    title: 'Sync subtitles by two points: fix drifting SRT subtitles online',
    h1: 'Sync subtitles to two points',
    lede: 'Tell us when one early line and one late line should appear. Every line in between is stretched and moved to match. Fixes any mix of offset and drift.',
    description:
      'Resync drifting subtitles by matching two lines to the video. Fixes offset and frame-rate drift at once for SRT, VTT and ASS. Free, private, in-browser.',
    steps: [
      'Drop in your subtitle file.',
      'Pick a line near the start and type when it is actually spoken in the video. Do the same for a line near the end.',
      'Download. Every line is mapped onto the corrected timeline.',
    ],
    faq: [
      {
        q: 'Which lines should I pick?',
        a: 'The further apart the better: one in the first few minutes and one in the last few. Choose short lines that start right when someone speaks.',
      },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'srt-to-vtt',
    mode: 'convert',
    preset: { out: 'vtt' },
    title: 'SRT to VTT converter: convert subtitles to WebVTT online',
    h1: 'Convert SRT to VTT',
    lede: 'Turn SubRip .srt files into WebVTT .vtt for HTML5 video, YouTube, Vimeo and most web players.',
    description: 'Convert SRT subtitles to WebVTT (.vtt) instantly. Free, no upload, no sign-up. Also converts ASS, SSA and SBV.',
    steps: ['Drop in your .srt file.', 'Output is preset to WebVTT.', 'Download the .vtt file.'],
    faq: [
      { q: 'What changes between SRT and VTT?', a: 'VTT adds a WEBVTT header and uses a dot instead of a comma before milliseconds. The text and timing stay the same.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'vtt-to-srt',
    mode: 'convert',
    preset: { out: 'srt' },
    title: 'VTT to SRT converter: convert WebVTT subtitles to SRT online',
    h1: 'Convert VTT to SRT',
    lede: 'Turn WebVTT captions, like ones downloaded from a web player, into SRT files that work in VLC, Plex, TVs and video editors.',
    description: 'Convert WebVTT (.vtt) captions to SRT for VLC, Plex, Premiere and TVs. Free, private, runs in your browser.',
    steps: ['Drop in your .vtt file.', 'Output is preset to SRT.', 'Download the .srt file.'],
    faq: [
      { q: 'Will positioning and styling carry over?', a: 'SRT has no positioning, so cue settings like position and alignment are dropped. Italic and bold tags are kept unless you strip them.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'ass-to-srt',
    mode: 'convert',
    preset: { out: 'srt' },
    title: 'ASS to SRT converter: convert SSA/ASS subtitles to SRT online',
    h1: 'Convert ASS or SSA to SRT',
    lede: 'Convert Advanced SubStation (.ass) and SubStation Alpha (.ssa) subtitles, common with anime releases, into plain SRT that every player supports.',
    description: 'Convert ASS and SSA subtitles to SRT online. Removes styling tags, keeps line breaks and timing. Free and private.',
    steps: ['Drop in your .ass or .ssa file.', 'Output is preset to SRT. Styling tags are removed and line breaks kept.', 'Download the .srt file.'],
    faq: [
      { q: 'Why are signs and karaoke lines doubled or out of place?', a: 'ASS files often layer several lines at once for signs and effects. SRT cannot position text, so those lines show at the bottom. Turn on "Clean up" to remove empty or effect-only lines.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'fix-subtitle-encoding',
    mode: 'clean',
    title: 'Fix subtitle encoding: repair garbled characters (Ã©, ð, ?) in SRT',
    h1: 'Fix garbled subtitle characters',
    lede: 'Accents showing as Ã© or Ä‡, or letters replaced by question marks? The file is in an old encoding. Pick the right one and save it as UTF-8 that every player reads correctly.',
    description:
      'Repair SRT subtitles with broken accents and symbols. Detects Windows-1250/1251/1252, ISO-8859 and more, and saves as UTF-8. Free and private.',
    steps: [
      'Drop in the file. The encoding is detected automatically.',
      'If the preview still looks wrong, choose another encoding from the list until the text reads correctly.',
      'Download. The fixed file is UTF-8.',
    ],
    faq: [
      { q: 'Which encoding should I pick?', a: 'Western European languages are usually Windows-1252. Polish, Czech, Croatian and Hungarian are usually Windows-1250. Russian and Bulgarian are Windows-1251, Greek is 1253, Turkish 1254.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'remove-hearing-impaired-subtitles',
    mode: 'clean',
    title: 'Remove SDH / hearing impaired text from subtitles online',
    h1: 'Remove hearing-impaired text',
    lede: 'Strip [MUSIC], (laughs), ♪ lyrics and speaker names like "JOHN:" from SDH subtitles, and delete lines left empty.',
    description: 'Remove hearing impaired (SDH) tags, sound descriptions and speaker names from SRT, VTT and ASS subtitles. Free online, runs in your browser.',
    steps: ['Drop in your subtitle file.', 'Keep "Remove hearing-impaired text" ticked, plus any other cleanups you want.', 'Download the cleaned file.'],
    faq: [
      { q: 'Will it remove real dialogue in brackets?', a: 'Anything in [square] or (round) brackets is removed, which is nearly always a sound description. Check the preview before downloading.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'sbv-to-srt',
    mode: 'convert',
    preset: { out: 'srt' },
    title: 'SBV to SRT converter: YouTube captions to SRT',
    h1: 'Convert YouTube SBV to SRT',
    lede: 'YouTube exports captions as SBV (YouTube format). Convert them to SRT for use in VLC, Plex and video editors.',
    description: 'Convert YouTube SBV captions to SRT. YouTube uses SBV format; SRT works in most subtitle players and editors. Free online conversion, runs in your browser.',
    steps: ['Drop in your .sbv file.', 'Output is preset to SRT.', 'Download the .srt file.'],
    faq: [
      { q: 'Where do I get an SBV file from YouTube?', a: 'In YouTube Studio open Subtitles, pick the video and language, then use the menu next to the track to download it as .sbv.' },
      { q: 'How is SBV different from SRT?', a: 'SBV puts the start and end time on one line separated by a comma and has no line numbers. SRT numbers each line and uses an arrow between the times. The text is the same.' },
      PRIVACY_FAQ,
    ],
  },
];
