import type { Ref, ComputedRef } from 'vue'
import type { Tool } from './drawingTypes'
import { isMacOS } from '../utils/platform'

const TOOL_KEYS: Tool[] = ['pen', 'highlighter', 'arrow', 'rect', 'ellipse', 'line', 'eraser']

export interface KeyboardContext {
  active: Ref<boolean>
  showToolbarPopup: Ref<boolean>
  toolbarPinned: Ref<boolean> | ComputedRef<boolean>
  showQuickColors: Ref<boolean>
  quickColorsPos: Ref<{ x: number; y: number }>
  textBoxPos: Ref<{ x: number; y: number } | null>
  currentTool: Ref<Tool>
  whiteboardMode: Ref<boolean>
  isDrawing: Ref<boolean>
  lastPointerX: () => number
  lastPointerY: () => number
  mousePos: Ref<{ x: number; y: number }>
}

export interface KeyboardActions {
  cycleColor: (direction: number) => void
  showToolTip: (tool: Tool) => void
  undo: () => void
  redo: () => void
  clearAll: () => void
  exitDrawing: () => void
  enterWhiteboardMode: () => void
  exitWhiteboardMode: () => void
  copyScreen: () => void
  copyWhiteboard: () => void
  setToolbarPopupVisible: (visible: boolean) => void
  toggleToolbarPopupVisible: () => void
  commitCurrentTextBox: (cancel?: boolean) => void
}

function modDown(e: KeyboardEvent): boolean {
  return e.ctrlKey || (isMacOS() && e.metaKey)
}

export function createKeyDownHandler(ctx: KeyboardContext, actions: KeyboardActions) {
  return function onKeyDown(e: KeyboardEvent) {
    if (!ctx.active.value) return

    // Prevent Alt key from triggering system menu focus
    if (e.key === 'Alt') {
      e.preventDefault()
    }

    // Quick color palette mode
    if (ctx.showQuickColors.value) {
      if (modDown(e) && !e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault()
        actions.copyScreen()
      } else if (e.key === 'Escape') {
        ctx.showQuickColors.value = false
      } else if (e.key === 'q' || e.key === 'Q') {
        actions.cycleColor(-1)
      } else if (e.key === 'e' || e.key === 'E') {
        actions.cycleColor(1)
      } else if (e.key === ' ') {
        e.preventDefault()
        ctx.mousePos.value = { ...ctx.quickColorsPos.value }
        ctx.showQuickColors.value = false
        actions.toggleToolbarPopupVisible()
      }
      return
    }

    // Text box mode
    if (ctx.textBoxPos.value) {
      if (e.key === 'Escape') {
        actions.commitCurrentTextBox(true)
      }
      return
    }

    // Toolbar popup toggle (Space) — skipped when toolbar is pinned always-on
    if (e.key === ' ') {
      if (ctx.toolbarPinned.value) return
      e.preventDefault()
      ctx.mousePos.value = { x: ctx.lastPointerX(), y: ctx.lastPointerY() }
      actions.toggleToolbarPopupVisible()
      return
    }

    // Color cycling
    if (e.key === 'q' || e.key === 'Q') {
      actions.cycleColor(-1)
      return
    }
    if (e.key === 'e' || e.key === 'E') {
      actions.cycleColor(1)
      return
    }

    // Text tool
    if (e.key === 't' || e.key === 'T') {
      ctx.currentTool.value = 'text'
      actions.showToolTip('text')
      actions.setToolbarPopupVisible(false)
      return
    }

    // Tool switching (1-7)
    if (e.key >= '1' && e.key <= '7') {
      const tool = TOOL_KEYS[parseInt(e.key) - 1]
      ctx.currentTool.value = tool
      actions.showToolTip(tool)
      actions.setToolbarPopupVisible(false)
      return
    }

    // Whiteboard mode toggle
    if (e.key === 'w' || e.key === 'W') {
      if (ctx.whiteboardMode.value) {
        actions.exitWhiteboardMode()
      } else {
        actions.enterWhiteboardMode()
      }
      return
    }

    // Copy whiteboard / screen
    if (modDown(e) && !e.shiftKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault()
      if (ctx.whiteboardMode.value) {
        actions.copyWhiteboard()
      } else {
        actions.copyScreen()
      }
      return
    }

    // Don't process edit shortcuts when toolbar popup is open (space mode)
    if (ctx.showToolbarPopup.value && !ctx.toolbarPinned.value) return

    // Undo/Redo/Clear/Exit
    if (modDown(e) && e.shiftKey && e.key === 'Z') {
      e.preventDefault()
      actions.redo()
    } else if (modDown(e) && e.key === 'z') {
      e.preventDefault()
      actions.undo()
    } else if (modDown(e) && e.key === 'y') {
      e.preventDefault()
      actions.redo()
    } else if (e.key === 'Delete') {
      actions.clearAll()
    } else if (e.key === 'Escape') {
      if (ctx.whiteboardMode.value) {
        actions.exitWhiteboardMode()
      } else {
        actions.exitDrawing()
      }
    }
  }
}
