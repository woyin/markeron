import type { Ref, ComputedRef } from 'vue'
import type { Tool } from './drawingTypes'
import { isMacOS } from '../utils/platform'
import { logActionEvent } from '../utils/diagnosticEvents'

const TOOL_KEYS: Tool[] = ['pen', 'highlighter', 'arrow', 'rect', 'ellipse', 'line', 'eraser']

/** Block keyboard copy briefly after pointer up — macOS may emit spurious Mod+C after pen-up (issue #22). */
const KEYBOARD_COPY_AFTER_POINTER_MS = 800
let lastPointerInteractionEndedAt = 0

/** Tracks whether Ctrl/Command was physically pressed before a copy chord (issue #22). */
let copyModifierPhysicallyDown = false

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
  keyboardCopyEnabled: Ref<boolean>
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
  togglePenetrationMode: () => void
  enterWhiteboardMode: () => void
  exitWhiteboardMode: () => void
  copyScreen: () => void
  copyWhiteboard: () => void
  toggleToolbarPopupVisible: () => void
  commitCurrentTextBox: (cancel?: boolean) => void
}

function modDown(e: KeyboardEvent): boolean {
  return e.ctrlKey || (isMacOS() && e.metaKey)
}

export function trackCopyModifierKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Control' || e.key === 'Meta') {
    copyModifierPhysicallyDown = true
  }
}

export function trackCopyModifierKeyUp(e: KeyboardEvent): void {
  if (e.key === 'Control' || e.key === 'Meta') {
    copyModifierPhysicallyDown = false
  }
}

export function resetCopyModifierState(): void {
  copyModifierPhysicallyDown = false
}

/** Pointer draw/drag uses the same modifier keys — disarm copy until modifier is released. */
export function invalidateCopyModifierForPointerInteraction(): void {
  copyModifierPhysicallyDown = false
}

/** Call when a pointer draw/drag gesture ends (stroke end, element drag end, abort). */
export function markPointerInteractionEnded(): void {
  lastPointerInteractionEndedAt = Date.now()
}

/** For tests: override last pointer-end timestamp. */
export function setLastPointerInteractionEndedAt(ts: number): void {
  lastPointerInteractionEndedAt = ts
}

/** For tests: read whether copy modifier is considered physically held. */
export function isCopyModifierPhysicallyDown(): boolean {
  return copyModifierPhysicallyDown
}

function shouldTriggerKeyboardCopy(e: KeyboardEvent, ctx: KeyboardContext): boolean {
  if (!ctx.keyboardCopyEnabled.value) return false
  if (ctx.isDrawing.value) return false
  if (Date.now() - lastPointerInteractionEndedAt < KEYBOARD_COPY_AFTER_POINTER_MS) return false
  if (!modDown(e) || e.shiftKey) return false
  if (e.key !== 'c' && e.key !== 'C') return false
  return true
}

function triggerKeyboardCopy(ctx: KeyboardContext, actions: KeyboardActions): void {
  if (ctx.whiteboardMode.value) {
    actions.copyWhiteboard()
  } else {
    actions.copyScreen()
  }
}

export function createKeyDownHandler(ctx: KeyboardContext, actions: KeyboardActions) {
  return function onKeyDown(e: KeyboardEvent) {
    if (!ctx.active.value) return

    trackCopyModifierKeyDown(e)

    // Prevent Alt key from triggering system menu focus
    if (e.key === 'Alt') {
      e.preventDefault()
    }

    // Quick color palette mode
    if (ctx.showQuickColors.value) {
      if (shouldTriggerKeyboardCopy(e, ctx)) {
        e.preventDefault()
        actions.copyScreen()
      } else if (e.key === 'Escape') {
        logActionEvent('quick colors closed', { reason: 'keyboard' })
        ctx.showQuickColors.value = false
      } else if (e.key === 'q' || e.key === 'Q') {
        logActionEvent('color cycled', { reason: 'keyboard', direction: -1, context: 'quick-colors' })
        actions.cycleColor(-1)
      } else if (e.key === 'e' || e.key === 'E') {
        logActionEvent('color cycled', { reason: 'keyboard', direction: 1, context: 'quick-colors' })
        actions.cycleColor(1)
      } else if (e.key === ' ') {
        e.preventDefault()
        logActionEvent('toolbar popup toggled', { reason: 'keyboard', context: 'quick-colors' })
        ctx.mousePos.value = { ...ctx.quickColorsPos.value }
        ctx.showQuickColors.value = false
        actions.toggleToolbarPopupVisible()
      }
      return
    }

    // Text box mode
    if (ctx.textBoxPos.value) {
      if (e.key === 'Escape') {
        logActionEvent('text box cancelled', { reason: 'keyboard' })
        actions.commitCurrentTextBox(true)
      }
      return
    }

    // Toolbar popup toggle (Space) — skipped when toolbar is pinned always-on
    if (e.key === ' ') {
      if (ctx.toolbarPinned.value) return
      e.preventDefault()
      logActionEvent('toolbar popup toggled', { reason: 'keyboard' })
      ctx.mousePos.value = { x: ctx.lastPointerX(), y: ctx.lastPointerY() }
      actions.toggleToolbarPopupVisible()
      return
    }

    // Color cycling
    if (e.key === 'q' || e.key === 'Q') {
      logActionEvent('color cycled', { reason: 'keyboard', direction: -1 })
      actions.cycleColor(-1)
      return
    }
    if (e.key === 'e' || e.key === 'E') {
      logActionEvent('color cycled', { reason: 'keyboard', direction: 1 })
      actions.cycleColor(1)
      return
    }

    // Text tool
    if (e.key === 't' || e.key === 'T') {
      logActionEvent('tool selected', { reason: 'keyboard', tool: 'text' })
      ctx.currentTool.value = 'text'
      actions.showToolTip('text')
      return
    }

    // Tool switching (1-7)
    if (e.key >= '1' && e.key <= '7') {
      const tool = TOOL_KEYS[parseInt(e.key) - 1]
      logActionEvent('tool selected', { reason: 'keyboard', tool, key: e.key })
      ctx.currentTool.value = tool
      actions.showToolTip(tool)
      return
    }

    // Whiteboard mode toggle
    if (e.key === 'w' || e.key === 'W') {
      if (ctx.whiteboardMode.value) {
        logActionEvent('whiteboard exit requested', { reason: 'keyboard' })
        actions.exitWhiteboardMode()
      } else {
        logActionEvent('whiteboard enter requested', { reason: 'keyboard' })
        actions.enterWhiteboardMode()
      }
      return
    }

    // Click-through (penetration) mode toggle — X (pairs with Ctrl+Shift+X); not in whiteboard
    if ((e.key === 'x' || e.key === 'X') && !modDown(e)) {
      if (ctx.whiteboardMode.value) return
      logActionEvent('toggle penetration requested', { reason: 'keyboard' })
      actions.togglePenetrationMode()
      return
    }

    // Copy whiteboard / screen — requires setting enabled + physical modifier press (issue #22)
    if (shouldTriggerKeyboardCopy(e, ctx)) {
      e.preventDefault()
      triggerKeyboardCopy(ctx, actions)
      return
    }

    // Don't process edit shortcuts when toolbar popup is open (space mode)
    if (ctx.showToolbarPopup.value && !ctx.toolbarPinned.value) return

    // Undo/Redo/Clear/Exit
    if (modDown(e) && e.shiftKey && e.key === 'Z') {
      e.preventDefault()
      logActionEvent('redo', { reason: 'keyboard', shortcut: 'mod+shift+z' })
      actions.redo()
    } else if (modDown(e) && e.key === 'z') {
      e.preventDefault()
      logActionEvent('undo', { reason: 'keyboard', shortcut: 'mod+z' })
      actions.undo()
    } else if (modDown(e) && e.key === 'y') {
      e.preventDefault()
      logActionEvent('redo', { reason: 'keyboard', shortcut: 'mod+y' })
      actions.redo()
    } else if (e.key === 'Delete') {
      logActionEvent('canvas cleared', { reason: 'keyboard', shortcut: 'delete' })
      actions.clearAll()
    } else if (e.key === 'Escape') {
      if (ctx.whiteboardMode.value) {
        logActionEvent('whiteboard exit requested', { reason: 'keyboard', shortcut: 'escape' })
        actions.exitWhiteboardMode()
      } else {
        logActionEvent('exit drawing requested', { reason: 'keyboard', shortcut: 'escape' })
        actions.exitDrawing()
      }
    }
  }
}
