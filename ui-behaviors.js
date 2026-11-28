export function normalSpawnCount(mode, kind, profile = {}) {
  if (mode !== 'normal' || kind === 'utility') return 1;
  return profile.representation === 'liquid' ? 1 : (profile.dropletCount || 1);
}

export function labelLayout(textWidth, bodyWidth) {
  return textWidth > bodyWidth * .78
    ? { inside:false, color:'#e9f4ff' }
    : { inside:true, color:'#08121c' };
}

export function normalizedControlValue(rawValue, { min, max, step = 1, fallback = min }) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return fallback;
  const clamped = Math.min(max, Math.max(min, parsed));
  const snapped = Math.round((clamped - min) / step) * step + min;
  return Number(snapped.toFixed(10));
}
