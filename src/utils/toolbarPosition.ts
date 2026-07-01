const STORAGE_KEY = 'markeron-toolbar-position'

export interface ToolbarPosition {
  left: number
  top: number
}

export function loadToolbarPosition(): ToolbarPosition | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ToolbarPosition
    if (typeof parsed.left !== 'number' || typeof parsed.top !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export function saveToolbarPosition(left: number, top: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ left, top }))
  } catch {
    // ignore quota / private mode
  }
}
