<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event'
import ToolToolbar from './ToolToolbar.vue'
import type { Tool } from '../composables/useDrawing'
import type { TextOutlineStyle } from '../composables/drawingTypes'
import { createDefaultTextOutline, normalizeTextOutline } from '../constants/textOutline'
import {
  OVERLAY_STATE_EVENT,
  OVERLAY_STATE_REQUEST_EVENT,
  TOOLBAR_DRAGGING_EVENT,
  TOOLBAR_WINDOW_CLOSED_EVENT,
  TOOLBAR_PANEL_HOVER_EVENT,
  TOOLBAR_POINTER_UP_EVENT,
  OVERLAY_POINTER_SCREEN_EVENT,
  emitToolbarAction,
  type OverlayStateSync,
  type OverlayPointerScreen,
} from '../composables/overlayBridge'
import {
  isToolbarPinned,
  resolveToolbarLayout,
  resolveToolbarVisibility,
  type ToolbarLayout,
  type ToolbarVisibility,
} from '../utils/toolbarSettings'
import { restoreToolbarWindowPosition } from '../utils/toolbarWindow'
import type { AppConfig } from '../types/app'

const currentTool = ref<Tool>('pen')
const currentColor = ref('#FFCC02')
const lineWidth = ref(3)
const textOutline = ref<TextOutlineStyle>(createDefaultTextOutline())
const whiteboardMode = ref(false)
const penetrationMode = ref(false)
const canUndo = ref(false)
const canRedo = ref(false)
const canClear = ref(false)
const toolbarLayout = ref<ToolbarLayout>('detailed')
const toolbarVisibility = ref<ToolbarVisibility>('space')
const toolbarPinned = computed(() => isToolbarPinned(toolbarVisibility.value))
const toolToolbarRef = ref<InstanceType<typeof ToolToolbar> | null>(null)
const pointerX = ref(0)
const pointerY = ref(0)

const unlisteners: UnlistenFn[] = []

function applyOverlayState(state: OverlayStateSync) {
  currentTool.value = state.currentTool
  currentColor.value = state.currentColor
  lineWidth.value = state.lineWidth
  textOutline.value = normalizeTextOutline(state.textOutline)
  whiteboardMode.value = state.whiteboardMode
  penetrationMode.value = state.penetrationMode
  canUndo.value = state.canUndo
  canRedo.value = state.canRedo
  canClear.value = state.canClear
  toolbarLayout.value = state.toolbarLayout
}

function onPointerMove(e: PointerEvent) {
  pointerX.value = e.clientX
  pointerY.value = e.clientY
  toolToolbarRef.value?.probePanelHoverAtScreen?.(e.screenX, e.screenY)
}

async function onToolbarClose() {
  await emit(TOOLBAR_DRAGGING_EVENT, false)
  await invoke('set_toolbar_popup', { visible: false, x: null, y: null })
  await emit(TOOLBAR_WINDOW_CLOSED_EVENT)
}

function onToolbarPointerDown() {
  void invoke('suppress_penetration', { durationMs: 1200 })
}

async function onToolbarPointerUp() {
  await emit(TOOLBAR_DRAGGING_EVENT, false)
  // Only notify overlay when a pointer was likely captured there (drawing/dragging).
  // Avoids spurious overlay events on ordinary toolbar clicks.
  await emit(TOOLBAR_POINTER_UP_EVENT)
}

async function onTogglePenetration() {
  if (whiteboardMode.value) return
  await invoke('toggle_penetration_mode')
}

async function onPanelHover(hovering: boolean) {
  await emit(TOOLBAR_PANEL_HOVER_EVENT, hovering)
}

async function onPanelDrag(dragging: boolean) {
  if (dragging) {
    void invoke('suppress_penetration', { durationMs: 1600 })
  }
  await emit(TOOLBAR_DRAGGING_EVENT, dragging)
}

function onToolbarKeyDown(e: KeyboardEvent) {
  if (e.key !== ' ' || toolbarPinned.value) return
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    e.target instanceof HTMLSelectElement
  ) {
    return
  }
  e.preventDefault()
  void onToolbarClose()
}

onMounted(async () => {
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('keydown', onToolbarKeyDown)

  try {
    await restoreToolbarWindowPosition()
  } catch (error) {
    console.error('Failed to restore toolbar window position:', error)
  }

  try {
    const cfg = await invoke<AppConfig>('get_config')
    toolbarLayout.value = resolveToolbarLayout(cfg.general)
    toolbarVisibility.value = resolveToolbarVisibility(cfg.general)
    await nextTick()
    void toolToolbarRef.value?.syncStandaloneWindowSize?.()
  } catch (error) {
    console.error('Failed to load toolbar config:', error)
  }

  unlisteners.push(
    await listen<OverlayStateSync>(OVERLAY_STATE_EVENT, (event) => {
      const prevLayout = toolbarLayout.value
      applyOverlayState(event.payload)
      if (prevLayout !== event.payload.toolbarLayout) {
        void nextTick(() => toolToolbarRef.value?.syncStandaloneWindowSize?.())
      }
    }),
  )

  unlisteners.push(
    await listen<AppConfig>('config-changed', (event) => {
      const prevLayout = toolbarLayout.value
      toolbarLayout.value = resolveToolbarLayout(event.payload.general)
      toolbarVisibility.value = resolveToolbarVisibility(event.payload.general)
      if (prevLayout !== toolbarLayout.value) {
        void nextTick(() => toolToolbarRef.value?.syncStandaloneWindowSize?.())
      }
    }),
  )

  unlisteners.push(
    await listen<OverlayPointerScreen>(OVERLAY_POINTER_SCREEN_EVENT, (event) => {
      toolToolbarRef.value?.probePanelHoverAtScreen?.(event.payload.x, event.payload.y)
    }),
  )

  unlisteners.push(
    await listen<string>('overlay-mode-changed', (event) => {
      const mode = event.payload
      const hidden = mode === 'hidden'
      document.body.style.visibility = hidden ? 'hidden' : 'visible'
      penetrationMode.value = mode === 'penetration'
    }),
  )

  void emit(OVERLAY_STATE_REQUEST_EVENT)
})

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('keydown', onToolbarKeyDown)
  unlisteners.forEach((fn) => fn())
})
</script>

<template>
  <div
    class="fixed inset-0 bg-transparent overflow-hidden"
    @pointerdown.capture="onToolbarPointerDown"
    @pointerup.capture="onToolbarPointerUp"
    @pointercancel.capture="onToolbarPointerUp"
  >
    <ToolToolbar
      ref="toolToolbarRef"
      standalone-window
      :layout="toolbarLayout"
      :pinned="toolbarPinned"
      :current-tool="currentTool"
      :current-color="currentColor"
      :line-width="lineWidth"
      :text-outline="textOutline"
      :whiteboard-mode="whiteboardMode"
      :penetration-mode="penetrationMode"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :can-clear="canClear"
      :anchor-x="pointerX"
      :anchor-y="pointerY"
      :pointer-x="pointerX"
      :pointer-y="pointerY"
      @select-tool="emitToolbarAction({ type: 'selectTool', tool: $event })"
      @select-color="emitToolbarAction({ type: 'selectColor', color: $event })"
      @update-line-width="emitToolbarAction({ type: 'updateLineWidth', width: $event })"
      @update-text-outline="emitToolbarAction({ type: 'updateTextOutline', textOutline: $event })"
      @undo="emitToolbarAction({ type: 'undo' })"
      @redo="emitToolbarAction({ type: 'redo' })"
      @clear-all="emitToolbarAction({ type: 'clearAll' })"
      @toggle-whiteboard="emitToolbarAction({ type: 'toggleWhiteboard' })"
      @copy="emitToolbarAction({ type: 'copy' })"
      @toggle-penetration="onTogglePenetration"
      @toggle-pin="emitToolbarAction({ type: 'togglePin' })"
      @exit-drawing="emitToolbarAction({ type: 'exitDrawing' })"
      @close="onToolbarClose"
      @panel-hover="onPanelHover"
      @panel-drag="onPanelDrag"
    />
  </div>
</template>
