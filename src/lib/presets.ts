// Saved presets (the first Pro feature, behind ?pro=1).
// Stores the last mode and its settings in localStorage under `subfixer.presets`.
// Read only when the URL carries ?pro=1; nothing is shown to anyone else.

export type Preset = { mode: string; settings: Record<string, string | boolean> };

export const PRESETS_KEY = 'subfixer.presets';

export function serializePreset(p: Preset): string {
  return JSON.stringify({ v: 1, mode: p.mode, settings: p.settings });
}

export function parsePreset(raw: string | null | undefined): Preset | null {
  if (!raw || typeof raw !== 'string' || raw.length > 20000) return null;
  let d: unknown;
  try {
    d = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const mode = (d as { mode?: unknown }).mode;
  if (typeof mode !== 'string' || !mode.trim() || mode.length > 100) return null;
  const s = (d as { settings?: unknown }).settings;
  if (s === null || typeof s !== 'object' || Array.isArray(s)) return null;
  const settings: Record<string, string | boolean> = {};
  for (const [k, v] of Object.entries(s as Record<string, unknown>)) {
    if (!k || k.length > 100) return null;
    if (typeof v === 'string') {
      if (v.length > 2000) return null;
      settings[k] = v;
    } else if (typeof v === 'boolean') {
      settings[k] = v;
    } else {
      return null;
    }
  }
  return { mode, settings };
}
