import { describe, expect, it } from 'vitest'
import {
  IDLE_RMB_HOLD,
  RMB_HOLD_ERASE_MS,
  activateRmbHoldErase,
  canStartRmbHoldErase,
  cancelRmbHold,
  releaseRmbHold,
  shouldBlockQuickColors,
  startRmbHoldPending,
} from './rmbHoldErase'

describe('rmbHoldErase', () => {
  it('exposes 250ms threshold', () => {
    expect(RMB_HOLD_ERASE_MS).toBe(250)
  })

  it('canStart is false when text box open or penetrating', () => {
    expect(
      canStartRmbHoldErase({
        active: true,
        penetration: false,
        textBoxOpen: true,
        quickColorsOpen: false,
      }),
    ).toBe(false)
    expect(
      canStartRmbHoldErase({
        active: true,
        penetration: true,
        textBoxOpen: false,
        quickColorsOpen: false,
      }),
    ).toBe(false)
  })

  it('canStart is true for normal annotation', () => {
    expect(
      canStartRmbHoldErase({
        active: true,
        penetration: false,
        textBoxOpen: false,
        quickColorsOpen: false,
      }),
    ).toBe(true)
  })

  it('short release opens palette and does not finish erase', () => {
    const pending = startRmbHoldPending()
    expect(shouldBlockQuickColors(pending)).toBe(true)
    const out = releaseRmbHold(pending)
    expect(out.openPalette).toBe(true)
    expect(out.finishErase).toBe(false)
    expect(out.restoreTool).toBeNull()
    expect(out.next).toEqual(IDLE_RMB_HOLD)
  })

  it('activate then release finishes erase and restores tool', () => {
    const pending = startRmbHoldPending()
    const active = activateRmbHoldErase(pending, 'pen')
    expect(active).toEqual({ phase: 'active', toolBefore: 'pen' })
    expect(shouldBlockQuickColors(active)).toBe(true)
    const out = releaseRmbHold(active)
    expect(out.openPalette).toBe(false)
    expect(out.finishErase).toBe(true)
    expect(out.restoreTool).toBe('pen')
    expect(out.next).toEqual(IDLE_RMB_HOLD)
  })

  it('activate while already eraser still restores eraser', () => {
    const active = activateRmbHoldErase(startRmbHoldPending(), 'eraser')
    const out = releaseRmbHold(active)
    expect(out.restoreTool).toBe('eraser')
  })

  it('cancel never opens palette', () => {
    const pending = startRmbHoldPending()
    expect(cancelRmbHold(pending).openPalette).toBe(false)
    const active = activateRmbHoldErase(startRmbHoldPending(), 'highlighter')
    const out = cancelRmbHold(active)
    expect(out.openPalette).toBe(false)
    expect(out.finishErase).toBe(true)
    expect(out.restoreTool).toBe('highlighter')
  })

  it('activate is no-op from idle', () => {
    expect(activateRmbHoldErase(IDLE_RMB_HOLD, 'pen')).toEqual(IDLE_RMB_HOLD)
  })
})
