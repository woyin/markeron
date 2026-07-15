/** Per-point lifetime after the tip stops moving. */
export const LASER_DECAY_MS = 1000

/**
 * Visible trail window in points from the tip (Excalidraw uses 50).
 * Larger than Excalidraw so dense high-DPI sampling still yields a usable CSS length.
 */
export const LASER_DECAY_LENGTH = 180

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
 * Excalidraw-compatible size factor: time decay × monotonic point-count decay.
 * Must stay monotonic along the stroke or LaserPointer outlines tear / thin↔thick.
 */
export function laserSizeFromMapping(c: LaserSizeMappingInput, now: number): number {
  const timeFactor = Math.max(0, 1 - (now - c.pressure) / LASER_DECAY_MS)
  const pointsFromTip = Math.max(0, c.totalLength - c.currentIndex)
  const lengthFactor = (LASER_DECAY_LENGTH - Math.min(LASER_DECAY_LENGTH, pointsFromTip)) / LASER_DECAY_LENGTH
  return Math.min(easeOut(lengthFactor), easeOut(timeFactor))
}

/** True once the tip itself has fully decayed (entire trail is invisible). */
export function isLaserTrailGone(points: { t?: number }[], now: number): boolean {
  if (points.length === 0) return true
  const tip = points[points.length - 1]
  return now - (tip.t ?? 0) >= LASER_DECAY_MS
}
