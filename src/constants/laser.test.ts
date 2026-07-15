import { describe, it, expect } from 'vitest'
import { LASER_DECAY_MS, LASER_DECAY_PX, easeOut, isLaserTrailGone, laserPointSize, pathLengthPx } from './laser'

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

describe('pathLengthPx', () => {
  it('sums segment lengths', () => {
    expect(pathLengthPx([])).toBe(0)
    expect(pathLengthPx([{ x: 0, y: 0 }])).toBe(0)
    expect(
      pathLengthPx([
        { x: 0, y: 0 },
        { x: 30, y: 40 },
      ]),
    ).toBe(50)
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
