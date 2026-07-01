export type DragMode = 'off' | 'hover' | 'modifier'

export interface AppConfig {
  shortcuts: {
    toggleDrawing: string
    clearDrawing: string
  }
  general: {
    dragMode?: DragMode
    /** @deprecated Read for migration only; use dragMode */
    enableDragging?: boolean
    /** @deprecated Read for migration only; use dragMode */
    dragRequiresModifier?: boolean
    locale?: string
    preserveDrawings: boolean
    whiteboardPreserveDrawings: boolean
    angleSnapStep?: 15 | 30 | 45
  }
}

export interface SaveResult {
  ok: boolean
  failed?: string[]
}
