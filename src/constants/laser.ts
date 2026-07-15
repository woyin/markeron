/** Per-point lifetime — matches Excalidraw laser decay window. */
export const LASER_DECAY_MS = 1000

/** Visible trail length in points from the tip (Excalidraw uses 50). */
export const LASER_DECAY_LENGTH = 50

/** Quartic ease-out used by Excalidraw for laser size mapping. */
export function easeOut(k: number): number {
  return 1 - Math.pow(1 - k, 4)
}

/**
 * Size / opacity factor for a laser point (0 = gone, 1 = full).
 * Oldest / farthest-from-tip points shrink first — same model as Excalidraw.
 *
 * @param pointTime - performance.now() when the point was added
 * @param now - current time
 * @param indexFromTip - 0 = newest tip point
 */
export function laserPointSize(pointTime: number, now: number, indexFromTip: number): number {
  const timeFactor = Math.max(0, 1 - (now - pointTime) / LASER_DECAY_MS)
  const lengthFactor = Math.max(0, (LASER_DECAY_LENGTH - indexFromTip) / LASER_DECAY_LENGTH)
  return Math.min(easeOut(lengthFactor), easeOut(timeFactor))
}

/** True once the tip itself has fully decayed (entire trail is invisible). */
export function isLaserTrailGone(points: { t?: number }[], now: number): boolean {
  if (points.length === 0) return true
  const tip = points[points.length - 1]
  return now - (tip.t ?? 0) >= LASER_DECAY_MS
}
