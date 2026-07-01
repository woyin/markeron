import { describe, expect, it } from 'vitest'
import { isToolbarPinned, resolveToolbarLayout, resolveToolbarVisibility } from './toolbarSettings'

describe('toolbarSettings', () => {
  it('defaults to space visibility and detailed layout', () => {
    expect(resolveToolbarVisibility()).toBe('space')
    expect(resolveToolbarLayout()).toBe('detailed')
  })

  it('reads explicit toolbar settings', () => {
    expect(resolveToolbarVisibility({ toolbarVisibility: 'always' })).toBe('always')
    expect(resolveToolbarLayout({ toolbarLayout: 'simple' })).toBe('simple')
  })

  it('detects pinned toolbar', () => {
    expect(isToolbarPinned('always')).toBe(true)
    expect(isToolbarPinned('space')).toBe(false)
  })
})
