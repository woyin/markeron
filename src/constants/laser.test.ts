import { describe, it, expect } from 'vitest'
import { LASER_DECAY_LENGTH, LASER_DECAY_MS, easeOut, isLaserTrailGone, laserSizeFromMapping } from './laser'

describe('laserSizeFromMapping', () => {
  const now = 10_000

  it('keeps the tip fully sized when fresh', () => {
    expect(laserSizeFromMapping({ pressure: now, runningLength: 100, currentIndex: 99, totalLength: 100 }, now)).toBe(1)
  })

  it('fades monotonically toward the start of the stroke', () => {
    const tip = laserSizeFromMapping({ pressure: now, runningLength: 400, currentIndex: 200, totalLength: 201 }, now)
    const mid = laserSizeFromMapping({ pressure: now, runningLength: 200, currentIndex: 100, totalLength: 201 }, now)
    const tail = laserSizeFromMapping({ pressure: now, runningLength: 20, currentIndex: 10, totalLength: 201 }, now)
    expect(tip).toBeGreaterThan(mid)
    expect(mid).toBeGreaterThan(tail)
  })

  it('is gone beyond the point window', () => {
    expect(
      laserSizeFromMapping(
        {
          pressure: now,
          runningLength: 0,
          currentIndex: 0,
          totalLength: LASER_DECAY_LENGTH + 20,
        },
        now,
      ),
    ).toBe(0)
  })

  it('is gone after time decay', () => {
    expect(
      laserSizeFromMapping({ pressure: 0, runningLength: 100, currentIndex: 50, totalLength: 51 }, LASER_DECAY_MS),
    ).toBe(0)
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
  })

  it('is false while the tip is still visible', () => {
    expect(isLaserTrailGone([{ t: 500 }], 500 + LASER_DECAY_MS - 1)).toBe(false)
  })
})
