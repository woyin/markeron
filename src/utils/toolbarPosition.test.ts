import { describe, expect, it } from 'vitest'
import { clampToolbarWindowPosition, migratePhysicalToLogical } from './toolbarPosition'

describe('clampToolbarWindowPosition', () => {
  const monitor = { left: 0, top: 0, width: 1920, height: 1080 }

  it('keeps position inside monitor', () => {
    expect(clampToolbarWindowPosition(100, 200, 272, 400, monitor)).toEqual({ left: 100, top: 200 })
  })

  it('clamps panel dragged past right edge', () => {
    expect(clampToolbarWindowPosition(2000, 200, 272, 400, monitor).left).toBe(1920 - 272 - 8)
  })

  it('clamps panel dragged past bottom edge', () => {
    expect(clampToolbarWindowPosition(100, 900, 272, 400, monitor).top).toBe(1080 - 400 - 8)
  })
})

describe('migratePhysicalToLogical', () => {
  it('passes through logical coords unchanged', () => {
    const input = { left: 120, top: 80, coordSpace: 'logical' as const }
    expect(migratePhysicalToLogical(input, 1.25)).toEqual(input)
  })

  it('converts physical coords using scale factor', () => {
    expect(migratePhysicalToLogical({ left: 1250, top: 500, coordSpace: 'physical' }, 1.25)).toEqual({
      left: 1000,
      top: 400,
      coordSpace: 'logical',
    })
  })

  it('treats missing coordSpace as physical (legacy v1)', () => {
    expect(migratePhysicalToLogical({ left: 1500, top: 600 }, 1.5)).toEqual({
      left: 1000,
      top: 400,
      coordSpace: 'logical',
    })
  })

  it('falls back to scale 1 when scale factor is invalid', () => {
    expect(migratePhysicalToLogical({ left: 200, top: 100, coordSpace: 'physical' }, 0)).toEqual({
      left: 200,
      top: 100,
      coordSpace: 'logical',
    })
  })
})
