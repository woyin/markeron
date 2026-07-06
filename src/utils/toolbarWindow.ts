import { LogicalSize, LogicalPosition } from '@tauri-apps/api/dpi'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import {
  clampToolbarWindowPosition,
  loadToolbarPosition,
  migratePhysicalToLogical,
  saveToolbarPosition,
  type MonitorLogicalBounds,
} from './toolbarPosition'

const TOOLBAR_PANEL_WIDTH = 272
const TOOLBAR_PANEL_HEIGHT = 500

export async function fetchOverlayMonitorBounds(): Promise<MonitorLogicalBounds | null> {
  try {
    return await invoke<MonitorLogicalBounds | null>('get_overlay_monitor_logical_bounds')
  } catch {
    return null
  }
}

export async function restoreToolbarWindowPosition(): Promise<void> {
  const saved = loadToolbarPosition(true)
  if (!saved) return
  const win = getCurrentWindow()
  const scale = await win.scaleFactor()
  const logical = migratePhysicalToLogical(saved, scale)
  const bounds = await fetchOverlayMonitorBounds()
  const position = bounds
    ? clampToolbarWindowPosition(logical.left, logical.top, TOOLBAR_PANEL_WIDTH, TOOLBAR_PANEL_HEIGHT, bounds)
    : logical
  await win.setPosition(new LogicalPosition(position.left, position.top))
  if (saved.coordSpace !== 'logical') {
    saveToolbarPosition(position.left, position.top, true)
  }
}

export async function saveToolbarWindowPosition(): Promise<void> {
  const win = getCurrentWindow()
  const [pos, scale] = await Promise.all([win.outerPosition(), win.scaleFactor()])
  const logical = pos.toLogical(scale)
  saveToolbarPosition(logical.x, logical.y, true)
}

export async function fitToolbarWindow(width: number, height: number): Promise<void> {
  if (width <= 0 || height <= 0) return
  const win = getCurrentWindow()
  await win.setSize(new LogicalSize(width, height))
}

/** Measure visible panel height for standalone toolbar window sizing. */
export function measureToolbarPanelHeight(panelEl: HTMLElement): number {
  const surface = panelEl.querySelector('.overlay-panel-surface')
  if (surface instanceof HTMLElement) {
    return Math.ceil(surface.getBoundingClientRect().height)
  }
  return Math.ceil(panelEl.getBoundingClientRect().height)
}
