import { describe, it, expect } from 'vitest'
import { LASER_DECAY_LENGTH, LASER_DECAY_MS, easeOut, isLaserTrailGone, laserPointSize } from './laser'

describe('laserPointSize', () => {
  it('keeps the tip fully sized when fresh', () => {
    expect(laserPointSize(1000, 1000, 0)).toBe(1)
  })

  it('fades older points before the tip', () => {
    const now = 2000
    const tip = laserPointSize(2000, now, 0)
    const mid = laserPointSize(1500, now, 10)
    const old = laserPointSize(1000, now, 40)
    expect(tip).toBeGreaterThan(mid)
    expect(mid).toBeGreaterThan(old)
  })

  it('is gone after decay window', () => {
    expect(laserPointSize(0, LASER_DECAY_MS, 0)).toBe(0)
    expect(laserPointSize(0, LASER_DECAY_MS + 50, 0)).toBe(0)
  })

  it('shrinks points beyond decay length even if fresh', () => {
    const far = laserPointSize(1000, 1000, LASER_DECAY_LENGTH)
    expect(far).toBe(0)
    const near = laserPointSize(1000, 1000, 0)
    expect(near).toBe(1)
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
