import { describe, it, expect, vi } from 'vitest'
import { drawText } from './drawingRender'
import type { DrawAction } from './drawingTypes'

function makeTextAction(overrides: Partial<DrawAction> = {}): DrawAction {
  return {
    tool: 'text',
    color: '#FF0000',
    lineWidth: 3,
    opacity: 1,
    points: [{ x: 10, y: 20 }],
    text: 'Hello',
    fontSize: 24,
    ...overrides,
  }
}

function makeTextContext(calls: string[]) {
  return {
    font: '',
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineJoin: 'miter',
    miterLimit: 10,
    textBaseline: 'alphabetic',
    measureText: vi.fn(() => ({ fontBoundingBoxAscent: 18, fontBoundingBoxDescent: 6 })),
    strokeText: vi.fn(() => calls.push('stroke')),
    fillText: vi.fn(() => calls.push('fill')),
  } as unknown as CanvasRenderingContext2D
}

describe('drawingRender text outline', () => {
  it('draws outline before filling text when enabled', () => {
    const calls: string[] = []
    const ctx = makeTextContext(calls)

    drawText(
      ctx,
      makeTextAction({
        textOutline: { enabled: true, colorMode: 'fixed', color: '#FFFFFF', width: 4 },
      }),
    )

    expect(ctx.strokeStyle).toBe('#FFFFFF')
    expect(ctx.lineWidth).toBe(4)
    expect(ctx.strokeText).toHaveBeenCalledOnce()
    expect(ctx.fillText).toHaveBeenCalledOnce()
    expect(calls).toEqual(['stroke', 'fill'])
  })

  it('keeps legacy text rendering unchanged when outline is disabled', () => {
    const calls: string[] = []
    const ctx = makeTextContext(calls)

    drawText(ctx, makeTextAction())

    expect(ctx.strokeText).not.toHaveBeenCalled()
    expect(ctx.fillText).toHaveBeenCalledOnce()
    expect(calls).toEqual(['fill'])
  })

  it('resolves automatic outline color from text color', () => {
    const calls: string[] = []
    const ctx = makeTextContext(calls)

    drawText(
      ctx,
      makeTextAction({
        color: '#FFFFFF',
        textOutline: { enabled: true, colorMode: 'auto', color: '#FFFFFF', width: 3 },
      }),
    )

    expect(ctx.strokeStyle).toBe('#000000')
    expect(calls).toEqual(['stroke', 'fill'])
  })
})
