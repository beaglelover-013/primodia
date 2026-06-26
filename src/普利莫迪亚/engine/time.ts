export const OFFLINE_LIMIT_MS = 6 * 60 * 60 * 1000;
export const REAL_MS_PER_GAME_MINUTE = 60 * 1000;

export function getBoundedElapsedMs(previous: number, now: number, offlineLimitMs = OFFLINE_LIMIT_MS) {
  return Math.max(0, Math.min(now - previous, offlineLimitMs));
}

export function getAdvancedGameMinutes(
  previous: number,
  now: number,
  options: { offlineLimitMs?: number; realMsPerGameMinute?: number } = {},
) {
  const elapsedMs = getBoundedElapsedMs(previous, now, options.offlineLimitMs ?? OFFLINE_LIMIT_MS);
  const unit = options.realMsPerGameMinute ?? REAL_MS_PER_GAME_MINUTE;
  return {
    elapsedMs,
    advancedMinutes: elapsedMs < unit ? 0 : Math.floor(elapsedMs / unit),
  };
}

