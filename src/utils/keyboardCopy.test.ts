import { describe, it, expect, vi } from 'vitest'
import { defaultKeyboardCopyEnabled, resolveKeyboardCopyEnabled } from './keyboardCopy'

vi.mock('./platform', () => ({
  isMacOS: vi.fn(() => false),
}))

describe('keyboardCopy', () => {
  it('defaults to enabled on non-macOS', () => {
    expect(defaultKeyboardCopyEnabled()).toBe(true)
  })

  it('resolveKeyboardCopyEnabled uses explicit config value', () => {
    expect(resolveKeyboardCopyEnabled({ keyboardCopyEnabled: false })).toBe(false)
    expect(resolveKeyboardCopyEnabled({ keyboardCopyEnabled: true })).toBe(true)
  })

  it('resolveKeyboardCopyEnabled falls back to platform default', () => {
    expect(resolveKeyboardCopyEnabled(undefined)).toBe(true)
    expect(resolveKeyboardCopyEnabled({})).toBe(true)
  })
})
