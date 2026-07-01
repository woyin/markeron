import { describe, it, expect } from 'vitest'
import {
  createDefaultLineWidths,
  DEFAULT_LINE_WIDTH,
  eraserLineWidth,
  ERASER_WIDTH_SCALE,
  highlighterLineWidth,
  HIGHLIGHTER_WIDTH_SCALE,
  toolLineWidthGroup,
} from './tools'

describe('line width helpers', () => {
  it('defaults every width group to the middle preset', () => {
    const widths = createDefaultLineWidths()
    for (const value of Object.values(widths)) {
      expect(value).toBe(DEFAULT_LINE_WIDTH)
    }
    expect(DEFAULT_LINE_WIDTH).toBe(3)
  })

  it('maps stroke tools to shared group; others are separate', () => {
    expect(toolLineWidthGroup('pen')).toBe('stroke')
    expect(toolLineWidthGroup('arrow')).toBe('stroke')
    expect(toolLineWidthGroup('rect')).toBe('stroke')
    expect(toolLineWidthGroup('highlighter')).toBe('highlighter')
    expect(toolLineWidthGroup('eraser')).toBe('eraser')
    expect(toolLineWidthGroup('text')).toBe('text')
  })

  it('scales lineWidth for eraser and highlighter', () => {
    expect(ERASER_WIDTH_SCALE).toBe(8)
    expect(HIGHLIGHTER_WIDTH_SCALE).toBe(7)
    expect(eraserLineWidth(3)).toBe(24)
    expect(highlighterLineWidth(3)).toBe(21)
  })
})
