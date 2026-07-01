export type ToolbarVisibility = 'space' | 'always'
export type ToolbarLayout = 'simple' | 'detailed'

export const TOOLBAR_VISIBILITY_OPTIONS: ToolbarVisibility[] = ['space', 'always']
export const TOOLBAR_LAYOUT_OPTIONS: ToolbarLayout[] = ['simple', 'detailed']

export function resolveToolbarVisibility(general?: { toolbarVisibility?: ToolbarVisibility }): ToolbarVisibility {
  return general?.toolbarVisibility ?? 'space'
}

export function resolveToolbarLayout(general?: { toolbarLayout?: ToolbarLayout }): ToolbarLayout {
  return general?.toolbarLayout ?? 'detailed'
}

export function isToolbarPinned(visibility: ToolbarVisibility): boolean {
  return visibility === 'always'
}
