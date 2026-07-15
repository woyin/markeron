/** Per-point lifetime after the tip stops moving. */
export const LASER_DECAY_MS = 1000

/**
 * Target visible trail length in CSS pixels from the tip.
 * Converted from point-index using LaserPointer's own runningLength so it
 * stays consistent across sampling density / DPI (unlike a raw point count).
 */
export const LASER_DECAY_PX = 280

/** Quartic ease-out used by Excalidraw for laser size mapping. */
export function easeOut(k: number): number {
  return 1 - Math.pow(1 - k, 4)
}

export interface LaserSizeMappingInput {
  pressure: number
  runningLength: number
  currentIndex: number
  totalLength: number
}

/**
 * Size factor from LaserPointer sizeMapping details (0 = gone, 1 = full).
 * Uses only LaserPointer-internal metrics — do not mix with pre-streamline path length.
 */
export function laserSizeFromMapping(c: LaserSizeMappingInput, now: number): number {
  const timeFactor = Math.max(0, 1 - (now - c.pressure) / LASER_DECAY_MS)
  const pointsFromTip = Math.max(0, c.totalLength - 1 - c.currentIndex)
  const avgSpacing = c.currentIndex > 0 ? c.runningLength / c.currentIndex : 4
  const distFromTipPx = pointsFromTip * avgSpacing
  const lengthFactor = Math.max(0, 1 - distFromTipPx / LASER_DECAY_PX)
  return Math.min(easeOut(lengthFactor), easeOut(timeFactor))
}

/**
 * Size / opacity factor when distance-from-tip in CSS px is already known.
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
