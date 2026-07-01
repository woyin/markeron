import type { Component } from 'vue'
import { Pen, Highlighter, ArrowUpRight, Square, Circle, Minus, Eraser, Type } from '@lucide/vue'
import type { Tool } from '../composables/drawingTypes'

export interface ToolDef {
  id: Tool
  icon: Component
  key: string
}

export const TOOL_DEFS: ToolDef[] = [
  { id: 'pen', icon: Pen, key: '1' },
  { id: 'highlighter', icon: Highlighter, key: '2' },
  { id: 'arrow', icon: ArrowUpRight, key: '3' },
  { id: 'rect', icon: Square, key: '4' },
  { id: 'ellipse', icon: Circle, key: '5' },
  { id: 'line', icon: Minus, key: '6' },
  { id: 'eraser', icon: Eraser, key: '7' },
  { id: 'text', icon: Type, key: 'T' },
]

export const TOOL_ICON_MAP: Record<Tool, Component> = Object.fromEntries(
  TOOL_DEFS.map((d) => [d.id, d.icon]),
) as Record<Tool, Component>

export const WIDTH_PRESETS: number[] = [1, 2, 3, 5, 8]

/** Middle preset — default line width for every width group. */
export const DEFAULT_LINE_WIDTH = WIDTH_PRESETS[2]

/** Pen + shapes share one preset; highlighter / eraser / text are separate. */
export type LineWidthGroup = 'stroke' | 'highlighter' | 'eraser' | 'text'

export interface ToolLineWidths {
  stroke: number
  highlighter: number
  eraser: number
  text: number
}

const STROKE_TOOLS = new Set<Tool>(['pen', 'arrow', 'rect', 'ellipse', 'line'])

export function toolLineWidthGroup(tool: Tool): LineWidthGroup {
  if (tool === 'highlighter') return 'highlighter'
  if (tool === 'eraser') return 'eraser'
  if (tool === 'text') return 'text'
  return 'stroke'
}

export function isStrokeTool(tool: Tool): boolean {
  return STROKE_TOOLS.has(tool)
}

export function createDefaultLineWidths(): ToolLineWidths {
  const w = DEFAULT_LINE_WIDTH
  return {
    stroke: w,
    highlighter: w,
    eraser: w,
    text: w,
  }
}

/** Highlighter stroke width = lineWidth × scale (default 3 → 21px). */
export const HIGHLIGHTER_WIDTH_SCALE = 7

export function highlighterLineWidth(lineWidth: number): number {
  return lineWidth * HIGHLIGHTER_WIDTH_SCALE
}

/** Eraser stroke width = lineWidth × scale (default 3 → 24px, close to legacy 25px). */
export const ERASER_WIDTH_SCALE = 8

export function eraserLineWidth(lineWidth: number): number {
  return lineWidth * ERASER_WIDTH_SCALE
}
