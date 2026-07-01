export interface ElementDragGateOptions {
  enableDragging: boolean
  dragRequiresModifier: boolean
  hasHoveredElement: boolean
  modifierDown: boolean
}

/** Whether a pointer down should start dragging an existing element (scheme A). */
export function canStartElementDrag(opts: ElementDragGateOptions): boolean {
  if (!opts.enableDragging || !opts.hasHoveredElement) return false
  if (!opts.dragRequiresModifier) return true
  return opts.modifierDown
}
