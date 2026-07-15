import { describe, it, expect } from 'vitest'
import {
  LASER_DECAY_MS,
  LASER_DECAY_PX,
  easeOut,
  isLaserTrailGone,
  laserPointSize,
  laserSizeFromMapping,
} from './laser'

describe('laserPointSize', () => {
  it('keeps the tip fully sized when fresh', () => {
    expect(laserPointSize(1000, 1000, 0)).toBe(1)
  })

  it('fades farther points before the tip', () => {
    const now = 2000
    const tip = laserPointSize(2000, now, 0)
    const mid = laserPointSize(2000, now, LASER_DECAY_PX / 2)
    const old = laserPointSize(2000, now, LASER_DECAY_PX)
    expect(tip).toBeGreaterThan(mid)
    expect(mid).toBeGreaterThan(old)
    expect(old).toBe(0)
  })

  it('is gone after decay window', () => {
    expect(laserPointSize(0, LASER_DECAY_MS, 0)).toBe(0)
    expect(laserPointSize(0, LASER_DECAY_MS + 50, 0)).toBe(0)
  })
})

describe('laserSizeFromMapping', () => {
  const now = 10_000

  it('keeps the tip fully sized when fresh', () => {
    // 100 points, 2px spacing, tip at index 99
    expect(laserSizeFromMapping({ pressure: now, runningLength: 198, currentIndex: 99, totalLength: 100 }, now)).toBe(1)
  })

  it('yields similar fade at the same CSS distance for dense vs sparse sampling', () => {
    // ~140px from tip, fresh timestamps
    const dense = laserSizeFromMapping(
      { pressure: now, runningLength: 200, currentIndex: 100, totalLength: 171 }, // 70pts * 2px
      now,
    )
    const sparse = laserSizeFromMapping(
      { pressure: now, runningLength: 200, currentIndex: 25, totalLength: 43 }, // 17pts * ~8px
      now,
    )
    expect(Math.abs(dense - sparse)).toBeLessThan(0.15)
    expect(dense).toBeGreaterThan(0.2)
    expect(dense).toBeLessThan(0.95)
  })
})

describe('easeOut', () => {
  it('maps 0→0 and 1→1 with a smooth curve', () => {
    expect(easeOut(0)).toBe(0)
    expect(easeOut(1)).toBe(1)
    expect(easeOut(0.5)).toBeGreaterThan(0.5)
  })
})

describe('isLaserTrailGone', () => {
  it('is true when the tip has fully decayed', () => {
    expect(isLaserTrailGone([{ t: 0 }], LASER_DECAY_MS)).toBe(true)
    expect(isLaserTrailGone([{ t: 0 }, { t: 100 }], 100 + LASER_DECAY_MS)).toBe(true)
  })

  it('is false while the tip is still visible', () => {
    expect(isLaserTrailGone([{ t: 500 }], 500 + LASER_DECAY_MS - 1)).toBe(false)
  })
})
