/** Per-point lifetime after the tip stops moving. */
export const LASER_DECAY_MS = 1000

/**
 * Visible trail length in CSS pixels from the tip.
 * Point-count decay (Excalidraw's 50) is too short on dense high-DPI sampling.
 */
export const LASER_DECAY_PX = 240

/** Quartic ease-out used by Excalidraw for laser size mapping. */
export function easeOut(k: number): number {
  return 1 - Math.pow(1 - k, 4)
}

/** Polyline length in CSS pixels. */
export function pathLengthPx(points: Array<{ x: number; y: number }>): number {
  let len = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    len += Math.hypot(dx, dy)
  }
  return len
}

/**
 * Size / opacity factor for a laser point (0 = gone, 1 = full).
 * Oldest / farthest-from-tip shrink first — by time and by path distance in px.
 */
export function laserPointSize(pointTime: number, now: number, distFromTipPx: number): number {
  const timeFactor = Math.max(0, 1 - (now - pointTime) / LASER_DECAY_MS)
  const lengthFactor = Math.max(0, 1 - distFromTipPx / LASER_DECAY_PX)
  return Math.min(easeOut(lengthFactor), easeOut(timeFactor))
}

/** True once the tip itself has fully decayed (entire trail is invisible). */
export function isLaserTrailGone(points: { t?: number }[], now: number): boolean {
  if (points.length === 0) return true
  const tip = points[points.length - 1]
  return now - (tip.t ?? 0) >= LASER_DECAY_MS
}
