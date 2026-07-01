import { describe, expect, it } from 'vitest'
import { canStartElementDrag } from './dragInteraction'

describe('canStartElementDrag', () => {
  const base = {
    enableDragging: true,
    dragRequiresModifier: false,
    hasHoveredElement: true,
    modifierDown: false,
  }

  it('returns false when dragging is disabled', () => {
    expect(canStartElementDrag({ ...base, enableDragging: false })).toBe(false)
  })

  it('returns false when not over an element', () => {
    expect(canStartElementDrag({ ...base, hasHoveredElement: false })).toBe(false)
  })

  it('allows hover drag when modifier is not required', () => {
    expect(canStartElementDrag({ ...base, modifierDown: false })).toBe(true)
  })

  it('requires modifier when dragRequiresModifier is enabled', () => {
    expect(canStartElementDrag({ ...base, dragRequiresModifier: true, modifierDown: false })).toBe(false)
    expect(canStartElementDrag({ ...base, dragRequiresModifier: true, modifierDown: true })).toBe(true)
  })
})
