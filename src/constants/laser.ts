/** How long each point stays fully visible after it was drawn. */
export const LASER_DECAY_MS = 1200

/**
 * Soft length cap in points from the tip (comet shape while drawing).
 * Time decay is what makes first-drawn segments disappear first.
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
 * Size factor: older points (earlier timestamps) shrink first.
 * Length window only soft-caps the comet; time creates the chase / stagger.
 */
export function laserSizeFromMapping(c: LaserSizeMappingInput, now: number): number {
  const age = now - c.pressure
  const timeFactor = Math.max(0, 1 - age / LASER_DECAY_MS)
  const pointsFromTip = Math.max(0, c.totalLength - c.currentIndex)
  const lengthFactor = (LASER_DECAY_LENGTH - Math.min(LASER_DECAY_LENGTH, pointsFromTip)) / LASER_DECAY_LENGTH
  // Prefer time so first-drawn → first-gone is obvious; length still tapers the tip.
  return easeOut(timeFactor) * (0.25 + 0.75 * easeOut(lengthFactor))
}

/** Drop points that have fully aged out (keeps the chase visible as the trail shortens). */
export function pruneAgedLaserPoints<T extends { t?: number }>(points: T[], now: number): T[] {
  let start = 0
  while (start < points.length && now - (points[start].t ?? 0) >= LASER_DECAY_MS) {
    start++
  }
  return start === 0 ? points : points.slice(start)
}

/** True once no points remain visible. */
export function isLaserTrailGone(points: { t?: number }[], now: number): boolean {
  if (points.length === 0) return true
  return points.every((p) => now - (p.t ?? 0) >= LASER_DECAY_MS)
}
