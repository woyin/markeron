<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import { Undo2, Redo2, Trash2, Layout, Copy, MoreHorizontal, ChevronUp, MousePointer2, Pin, X } from '@lucide/vue'
import type { Tool } from '../composables/useDrawing'
import { isMacOS } from '../utils/platform'
import { useI18n } from '../i18n'
import { TOOL_DEFS, WIDTH_PRESETS } from '../constants/tools'
import { COLOR_ROWS } from '../constants/colors'
import { TEXT_OUTLINE_WIDTH_PRESETS, normalizeTextOutline, resolveTextOutlineColor } from '../constants/textOutline'
import { loadToolbarPosition, saveToolbarPosition } from '../utils/toolbarPosition'
import { fitToolbarWindow, measureToolbarPanelHeight } from '../utils/toolbarWindow'
import { isPointerOverPanelRect } from '../utils/toolbarPanelHover'
import { LogicalPosition } from '@tauri-apps/api/dpi'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { ToolbarLayout } from '../utils/toolbarSettings'
import type { TextOutlineStyle } from '../composables/drawingTypes'

const { t } = useI18n()

const modKeyLabel = computed(() => (isMacOS() ? 'Command' : 'Ctrl'))

const props = defineProps<{
  layout: ToolbarLayout
  pinned: boolean
  standaloneWindow?: boolean
  currentTool: Tool
  currentColor: string
  lineWidth: number
  textOutline: TextOutlineStyle
  whiteboardMode: boolean
  penetrationMode?: boolean
  canUndo: boolean
  canRedo: boolean
  canClear: boolean
  anchorX: number
  anchorY: number
  pointerX: number
  pointerY: number
}>()

const emit = defineEmits<{
  selectTool: [tool: Tool]
  selectColor: [color: string]
  updateLineWidth: [width: number]
  updateTextOutline: [textOutline: TextOutlineStyle]
  close: []
  undo: []
  redo: []
  clearAll: []
  toggleWhiteboard: []
  copy: []
  togglePenetration: []
  togglePin: []
  exitDrawing: []
  panelHover: [hovering: boolean]
  panelDrag: [dragging: boolean]
}>()

const tools = computed(() => TOOL_DEFS.map((d) => ({ ...d, label: t(`tools.${d.id}`) })))
const colors = COLOR_ROWS
const simpleColors = computed(() => colors[0] ?? [])
const widths = computed(() => WIDTH_PRESETS.map((v) => ({ value: v, label: t(`widths.${v}`) })))
const outlineWidths = computed(() => TEXT_OUTLINE_WIDTH_PRESETS.map((v) => ({ value: v, label: t(`widths.${v}`) })))
const outlinePreviewColor = computed(() => resolveTextOutlineColor(props.textOutline, props.currentColor))
const customOutlineColor = computed(() => normalizeTextOutline(props.textOutline).color)

const expanded = ref(false)
const showFullPanel = computed(() => props.layout === 'detailed' || expanded.value)

// Keep compact and expanded states the same width so the standalone toolbar never jumps sideways.
const PANEL_WIDTH = 272
const panelW = computed(() => PANEL_WIDTH)
function needsWhiteCheck(ri: number, ci: number): boolean {
  return ci >= 5 || (ri === colors.length - 1 && ci >= 3)
}

function selectTool(tool: Tool) {
  emit('selectTool', tool)
}

function selectColor(color: string) {
  emit('selectColor', color)
}

function updateWidth(width: number) {
  emit('updateLineWidth', width)
}

function updateTextOutline(patch: Partial<TextOutlineStyle>) {
  emit('updateTextOutline', normalizeTextOutline({ ...props.textOutline, ...patch }))
}

function updateCustomTextOutlineColor(color: string) {
  updateTextOutline({ enabled: true, colorMode: 'fixed', color })
}

function toggleExpanded() {
  expanded.value = !expanded.value
  // Click target is inside the panel — keep overlay custom cursor suppressed during resize.
  emit('panelHover', true)
  nextTick(() => {
    initPosition()
    scheduleSyncStandaloneWindowSize()
  })
}

const panelRef = ref<HTMLDivElement | null>(null)
const panelLeft = ref(0)
const panelTop = ref(0)
const positioned = ref(false)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

function clampPosition(left: number, top: number, panelH: number) {
  if (props.standaloneWindow) {
    return { left: 0, top: 0 }
  }
  const w = panelW.value
  return {
    left: Math.max(12, Math.min(left, window.innerWidth - w - 12)),
    top: Math.max(12, Math.min(top, window.innerHeight - panelH - 12)),
  }
}

let syncSizeGeneration = 0
let syncSizeRafId: number | null = null
let panelResizeObserver: ResizeObserver | null = null

async function syncStandaloneWindowSize() {
  if (!props.standaloneWindow || !panelRef.value) return
  const generation = ++syncSizeGeneration
  await nextTick()
  if (generation !== syncSizeGeneration || !panelRef.value) return
  const width = panelW.value
  const height = measureToolbarPanelHeight(panelRef.value)
  await fitToolbarWindow(width, height)
  syncPanelHover()
}

function probePanelHoverAtScreen(screenX: number, screenY: number) {
  if (!props.standaloneWindow || !panelRef.value || !positioned.value) return
  const r = panelRef.value.getBoundingClientRect()
  const inside = isPointerOverPanelRect(screenX, screenY, window.screenX, window.screenY, r)
  emit('panelHover', inside)
}

function scheduleSyncStandaloneWindowSize() {
  if (!props.standaloneWindow) return
  if (syncSizeRafId !== null) cancelAnimationFrame(syncSizeRafId)
  syncSizeRafId = requestAnimationFrame(() => {
    syncSizeRafId = null
    void syncStandaloneWindowSize()
  })
}

function syncPanelHover() {
  if (!panelRef.value || !positioned.value) {
    emit('panelHover', false)
    return
  }
  const r = panelRef.value.getBoundingClientRect()
  const inside =
    props.pointerX >= r.left && props.pointerX <= r.right && props.pointerY >= r.top && props.pointerY <= r.bottom
  emit('panelHover', inside)
}

function initPosition() {
  nextTick(() => {
    const panelH = panelRef.value?.offsetHeight ?? 400
    let left: number
    let top: number
    if (props.pinned) {
      if (!props.standaloneWindow) {
        const saved = loadToolbarPosition(props.standaloneWindow)
        if (saved) {
          left = saved.left
          top = saved.top
        } else {
          left = 12
          top = 12
        }
      } else {
        left = 0
        top = 0
      }
    } else {
      left = props.anchorX - panelW.value / 2
      top = props.anchorY - panelH / 2
    }
    const clamped = clampPosition(left, top, panelH)
    panelLeft.value = clamped.left
    panelTop.value = clamped.top
    positioned.value = true
    syncPanelHover()
    void syncStandaloneWindowSize()
  })
}

let cachedPanelH = 400
let lastDragX = 0
let lastDragY = 0
let lastScreenX = 0
let lastScreenY = 0
let dragRafId: number | null = null
let dragPointerId: number | null = null
let captureTarget: HTMLElement | null = null
let windowDragOffset = { x: 0, y: 0 }

function scheduleDragUpdate() {
  if (dragRafId !== null) return
  dragRafId = requestAnimationFrame(() => {
    dragRafId = null
    if (!isDragging.value) return
    if (props.standaloneWindow) {
      void getCurrentWindow().setPosition(
        new LogicalPosition(lastScreenX - windowDragOffset.x, lastScreenY - windowDragOffset.y),
      )
      return
    }
    const w = panelW.value
    panelLeft.value = Math.max(0, Math.min(lastDragX - dragOffset.value.x, window.innerWidth - w))
    panelTop.value = Math.max(0, Math.min(lastDragY - dragOffset.value.y, window.innerHeight - cachedPanelH))
  })
}

function onDrawingModeClick() {
  if (props.whiteboardMode || !props.penetrationMode) return
  emit('togglePenetration')
}

function onPenetrationModeClick() {
  if (props.whiteboardMode || props.penetrationMode) return
  emit('togglePenetration')
}

function startDrag(e: PointerEvent) {
  if (e.button !== 0) return
  isDragging.value = true
  emit('panelHover', true)
  emit('panelDrag', true)
  dragPointerId = e.pointerId
  captureTarget = e.currentTarget as HTMLElement
  captureTarget.setPointerCapture(e.pointerId)
  e.preventDefault()
  lastDragX = e.clientX
  lastDragY = e.clientY
  lastScreenX = e.screenX
  lastScreenY = e.screenY
  if (props.standaloneWindow) {
    windowDragOffset = { x: e.clientX, y: e.clientY }
    return
  }
  cachedPanelH = panelRef.value?.offsetHeight ?? 400
  dragOffset.value = {
    x: e.clientX - panelLeft.value,
    y: e.clientY - panelTop.value,
  }
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  if (dragPointerId !== null && e.pointerId !== dragPointerId) return
  lastDragX = e.clientX
  lastDragY = e.clientY
  lastScreenX = e.screenX
  lastScreenY = e.screenY
  scheduleDragUpdate()
}

function releaseDragCapture() {
  if (captureTarget && dragPointerId !== null) {
    try {
      captureTarget.releasePointerCapture(dragPointerId)
    } catch {
      // pointer already released
    }
  }
  captureTarget = null
  dragPointerId = null
}

function stopDrag(e?: PointerEvent) {
  if (!isDragging.value) return
  if (e && dragPointerId !== null && e.pointerId !== dragPointerId) return
  isDragging.value = false
  if (dragRafId !== null) {
    cancelAnimationFrame(dragRafId)
    dragRafId = null
  }
  releaseDragCapture()
  emit('panelDrag', false)
  if (props.standaloneWindow) {
    void (async () => {
      const win = getCurrentWindow()
      const [pos, scale] = await Promise.all([win.outerPosition(), win.scaleFactor()])
      const logical = pos.toLogical(scale)
      saveToolbarPosition(logical.x, logical.y, true)
      await invoke('raise_toolbar')
    })()
    syncPanelHover()
    return
  }
  if (props.pinned) {
    saveToolbarPosition(panelLeft.value, panelTop.value, props.standaloneWindow)
  }
  syncPanelHover()
}

function onPanelPointerLeave() {
  if (isDragging.value) return
  emit('panelHover', false)
}

function stopDragOnBlur() {
  stopDrag()
}

defineExpose({ syncPanelHover, syncStandaloneWindowSize, probePanelHoverAtScreen })

watch(
  () => [props.layout, props.pinned, props.standaloneWindow] as const,
  () => {
    expanded.value = false
    positioned.value = false
    initPosition()
  },
)

watch(panelW, () => {
  if (props.standaloneWindow && positioned.value) {
    scheduleSyncStandaloneWindowSize()
  }
})

watch(
  () => [props.pointerX, props.pointerY] as const,
  () => {
    syncPanelHover()
  },
)

onMounted(() => {
  initPosition()
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
  window.addEventListener('blur', stopDragOnBlur)
  if (props.standaloneWindow && typeof ResizeObserver !== 'undefined') {
    panelResizeObserver = new ResizeObserver(() => scheduleSyncStandaloneWindowSize())
    nextTick(() => {
      if (panelRef.value) panelResizeObserver?.observe(panelRef.value)
    })
  }
})

onUnmounted(() => {
  syncSizeGeneration += 1
  if (syncSizeRafId !== null) {
    cancelAnimationFrame(syncSizeRafId)
    syncSizeRafId = null
  }
  panelResizeObserver?.disconnect()
  panelResizeObserver = null
  emit('panelHover', false)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  window.removeEventListener('blur', stopDragOnBlur)
  stopDrag()
  if (dragRafId !== null) {
    cancelAnimationFrame(dragRafId)
    dragRafId = null
  }
})
</script>

<template>
  <div
    class="z-100001"
    :class="
      standaloneWindow
        ? 'block w-fit h-fit overflow-hidden'
        : ['fixed top-0 left-0 w-screen h-screen', pinned ? 'pointer-events-none' : '']
    "
    @mousedown.self="!pinned && !standaloneWindow && emit('close')"
  >
    <div
      ref="panelRef"
      :class="standaloneWindow ? 'relative' : 'absolute left-0 top-0'"
      :style="
        standaloneWindow
          ? { width: panelW + 'px' }
          : {
              width: panelW + 'px',
              transform: `translate3d(${panelLeft}px,${panelTop}px,0)`,
              willChange: isDragging ? 'transform' : 'auto',
              opacity: positioned ? 1 : 0,
            }
      "
      @mousedown.stop
      @pointerenter="emit('panelHover', true)"
      @pointerleave="onPanelPointerLeave"
    >
      <div
        class="overlay-panel-surface w-full"
        :class="standaloneWindow ? 'overlay-panel overlay-panel--standalone' : 'overlay-panel'"
      >
        <div
          class="h-2.5 cursor-grab active:cursor-grabbing"
          :class="isDragging ? 'cursor-grabbing' : ''"
          @pointerdown="startDrag"
        />

        <!-- Actions -->
        <div class="px-3 pt-1 pb-2 flex items-center gap-1 cursor-default">
          <button
            v-if="standaloneWindow"
            type="button"
            class="overlay-toolbar-action"
            :class="!penetrationMode ? 'overlay-toolbar-action--active' : ''"
            :title="t('toolbar.drawingMode')"
            :aria-label="t('toolbar.drawingMode')"
            :aria-pressed="!penetrationMode"
            :disabled="whiteboardMode"
            @click="onDrawingModeClick"
          >
            <component :is="TOOL_DEFS[0].icon" :size="15" />
          </button>
          <button
            v-if="standaloneWindow"
            type="button"
            class="overlay-toolbar-action"
            :class="penetrationMode ? 'overlay-toolbar-action--active' : ''"
            :title="t('toolbar.penetrationMode')"
            :aria-label="t('toolbar.penetrationMode')"
            :aria-pressed="!!penetrationMode"
            :disabled="whiteboardMode"
            @click="onPenetrationModeClick"
          >
            <MousePointer2 :size="15" />
          </button>
          <button
            type="button"
            class="overlay-toolbar-action"
            :disabled="!canUndo"
            :title="t('toolbar.undo')"
            :aria-label="t('toolbar.undo')"
            @click="emit('undo')"
          >
            <Undo2 :size="15" />
          </button>
          <button
            type="button"
            class="overlay-toolbar-action"
            :disabled="!canRedo"
            :title="t('toolbar.redo')"
            :aria-label="t('toolbar.redo')"
            @click="emit('redo')"
          >
            <Redo2 :size="15" />
          </button>
          <button
            type="button"
            class="overlay-toolbar-action"
            :disabled="!canClear"
            :title="t('toolbar.clear')"
            :aria-label="t('toolbar.clear')"
            @click="emit('clearAll')"
          >
            <Trash2 :size="15" />
          </button>
          <span
            class="flex-1 self-stretch min-h-7 cursor-grab active:cursor-grabbing"
            :class="isDragging ? 'cursor-grabbing' : ''"
            @pointerdown="startDrag"
          />
          <button
            type="button"
            class="overlay-toolbar-action"
            :class="whiteboardMode ? 'overlay-toolbar-action--active' : ''"
            :title="whiteboardMode ? t('toolbar.exitWhiteboard') : t('toolbar.whiteboard')"
            :aria-label="whiteboardMode ? t('toolbar.exitWhiteboard') : t('toolbar.whiteboard')"
            @click="emit('toggleWhiteboard')"
          >
            <Layout :size="15" />
          </button>
          <button
            type="button"
            class="overlay-toolbar-action"
            :title="t('toolbar.copy')"
            :aria-label="t('toolbar.copy')"
            @click="emit('copy')"
          >
            <Copy :size="15" />
          </button>
          <button
            v-if="standaloneWindow"
            type="button"
            class="overlay-toolbar-action"
            :class="pinned ? 'overlay-toolbar-action--active' : ''"
            :title="pinned ? t('toolbar.unpin') : t('toolbar.pin')"
            :aria-label="pinned ? t('toolbar.unpin') : t('toolbar.pin')"
            :aria-pressed="pinned"
            @click="emit('togglePin')"
          >
            <Pin :size="15" />
          </button>
          <button
            v-if="standaloneWindow"
            type="button"
            class="overlay-toolbar-action"
            :title="t('toolbar.exit')"
            :aria-label="t('toolbar.exit')"
            @click="emit('exitDrawing')"
          >
            <X :size="15" />
          </button>
        </div>

        <!-- Simple compact tools -->
        <div v-if="!showFullPanel" class="px-3 pb-2">
          <div class="grid grid-cols-8 gap-[3px]">
            <button
              v-for="tool in tools"
              :key="tool.id"
              :aria-label="`${tool.label} (${tool.key})`"
              :aria-pressed="currentTool === tool.id"
              class="flex min-w-0 items-center justify-center h-[30px] border-none rounded-[9px] cursor-pointer transition-all duration-150"
              :class="currentTool === tool.id ? 'overlay-tool-btn--active' : 'overlay-tool-btn'"
              :title="`${tool.label} (${tool.key})`"
              @click="selectTool(tool.id)"
            >
              <component :is="tool.icon" :size="16" />
            </button>
          </div>
        </div>

        <!-- Detailed tools -->
        <div v-else class="px-3.5 pt-0 pb-2.5">
          <div class="flex items-center justify-between mb-2 cursor-default" @pointerdown="startDrag">
            <span class="text-[11px] font-semibold overlay-text-section tracking-[0.5px] font-sans">{{
              t('panel.tools')
            }}</span>
            <span class="text-[10px] overlay-text-hint font-sans">{{ t('panel.toolsHint') }}</span>
          </div>
          <div class="grid grid-cols-4 gap-1">
            <button
              v-for="tool in tools"
              :key="tool.id"
              :aria-label="`${tool.label} (${tool.key})`"
              :aria-pressed="currentTool === tool.id"
              class="flex flex-col items-center gap-[3px] pt-2 px-1 pb-1.5 border-none rounded-[10px] cursor-pointer relative transition-all duration-150"
              :class="currentTool === tool.id ? 'overlay-tool-btn--active' : 'overlay-tool-btn'"
              :title="`${tool.label} (${tool.key})`"
              @click="selectTool(tool.id)"
            >
              <component :is="tool.icon" :size="18" />
              <span class="text-[10px] leading-none font-sans">{{ tool.label }}</span>
              <span
                class="absolute top-[3px] right-[5px] text-[8px] font-sans"
                :class="currentTool === tool.id ? 'overlay-text-key--active' : 'overlay-text-key'"
                >{{ tool.key }}</span
              >
            </button>
          </div>
        </div>

        <!-- Simple colors -->
        <div v-if="!showFullPanel" class="px-3 py-2 ui-divider-h">
          <div class="flex justify-between">
            <button
              v-for="color in simpleColors"
              :key="color"
              class="w-[30px] h-[30px] p-0 border-none rounded-full bg-transparent cursor-pointer relative flex items-center justify-center transition-transform duration-120"
              :class="currentColor === color ? 'scale-[1.18]' : 'hover:scale-[1.18]'"
              @click="selectColor(color)"
            >
              <span
                class="w-6 h-6 rounded-full color-swatch-ring transition-[border-color] duration-120"
                :class="{ 'color-swatch-ring--active': currentColor === color }"
                :style="{ backgroundColor: color }"
              />
            </button>
          </div>
        </div>

        <!-- Detailed colors -->
        <div v-else class="px-3.5 py-2.5 ui-divider-h">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-semibold overlay-text-section tracking-[0.5px] font-sans">{{
              t('panel.colors')
            }}</span>
          </div>
          <div class="flex flex-col gap-1.5">
            <div v-for="(row, ri) in colors" :key="ri" class="flex justify-between">
              <button
                v-for="(color, ci) in row"
                :key="color"
                class="w-[30px] h-[30px] p-0 border-none rounded-full bg-transparent cursor-pointer relative flex items-center justify-center transition-transform duration-120"
                :class="currentColor === color ? 'scale-[1.18]' : 'hover:scale-[1.18]'"
                @click="selectColor(color)"
              >
                <span
                  class="w-6 h-6 rounded-full color-swatch-ring transition-[border-color] duration-120"
                  :class="{ 'color-swatch-ring--active': currentColor === color }"
                  :style="{ backgroundColor: color }"
                />
                <span
                  v-if="currentColor === color"
                  class="absolute text-[11px] font-bold pointer-events-none"
                  :class="
                    needsWhiteCheck(ri, ci)
                      ? 'text-white [text-shadow:0_0_2px_rgba(0,0,0,0.5)]'
                      : 'text-black [text-shadow:0_0_2px_rgba(255,255,255,0.5)]'
                  "
                  >✓</span
                >
              </button>
            </div>
          </div>
          <label
            class="group inline-flex items-center gap-2.5 cursor-pointer py-1.5 pl-1.5 pr-2.5 rounded-lg mt-1.5 transition-[background] duration-120 settings-row-hover-strong"
          >
            <input
              type="color"
              class="absolute w-0 h-0 opacity-0 pointer-events-none"
              :value="currentColor"
              @input="selectColor(($event.target as HTMLInputElement).value)"
            />
            <span
              class="w-[20px] h-[20px] rounded-full color-picker-ring pointer-events-none flex items-center justify-center shadow-[inset_0_0_2px_rgba(0,0,0,0.5)]"
              style="
                background: conic-gradient(
                  from 90deg,
                  #ff0000,
                  #ff8000,
                  #ffff00,
                  #80ff00,
                  #00ff00,
                  #00ff80,
                  #00ffff,
                  #0080ff,
                  #0000ff,
                  #8000ff,
                  #ff00ff,
                  #ff0080,
                  #ff0000
                );
              "
            >
              <span
                class="text-white text-[14px] leading-none font-light"
                style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6)"
                >+</span
              >
            </span>
            <span class="text-[11px] overlay-text-label font-sans">{{ t('panel.customColor') }}</span>
          </label>
        </div>

        <!-- Stroke width -->
        <div class="px-3.5 py-2.5 ui-divider-h">
          <div v-if="showFullPanel" class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-semibold overlay-text-section tracking-[0.5px] font-sans">{{
              t('panel.strokeWidth')
            }}</span>
          </div>
          <div class="flex gap-1">
            <button
              v-for="w in widths"
              :key="w.value"
              class="group flex-1 flex items-center justify-center h-8 border-none rounded-lg cursor-pointer transition-all duration-120"
              :class="lineWidth === w.value ? 'overlay-width-btn--active' : 'overlay-width-btn'"
              :title="w.label"
              @click="updateWidth(w.value)"
            >
              <span
                class="w-[70%] rounded-full transition-transform duration-120 group-hover:scale-x-110"
                :class="lineWidth === w.value ? 'overlay-width-line--active' : 'overlay-width-line'"
                :style="{
                  height: Math.max(1.5, w.value * 1.2) + 'px',
                }"
              />
            </button>
          </div>
        </div>

        <!-- Text outline -->
        <div v-if="showFullPanel && currentTool === 'text'" class="px-3.5 py-2.5 ui-divider-h">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-semibold overlay-text-section tracking-[0.5px] font-sans">{{
              t('panel.textOutline')
            }}</span>
            <button
              type="button"
              class="px-2.5 py-[4px] rounded-md ui-segment text-[10.5px] leading-none transition-colors duration-120"
              :class="{ 'ui-segment--active': textOutline.enabled }"
              :aria-pressed="textOutline.enabled"
              @click="updateTextOutline({ enabled: !textOutline.enabled })"
            >
              {{ textOutline.enabled ? t('panel.textOutlineOn') : t('panel.textOutlineOff') }}
            </button>
          </div>
          <div class="flex items-center gap-1.5 mb-2">
            <button
              type="button"
              class="flex-1 h-8 rounded-md ui-segment text-[10.5px] leading-none transition-colors duration-120"
              :class="{ 'ui-segment--active': textOutline.enabled && textOutline.colorMode === 'auto' }"
              :aria-pressed="textOutline.enabled && textOutline.colorMode === 'auto'"
              :title="t('panel.textOutlineAuto')"
              @click="updateTextOutline({ enabled: true, colorMode: 'auto' })"
            >
              {{ t('panel.textOutlineAuto') }}
            </button>
            <label
              class="flex-1 h-8 rounded-md ui-segment text-[10.5px] leading-none transition-colors duration-120 cursor-pointer flex items-center justify-center gap-1.5 relative overflow-hidden"
              :class="{ 'ui-segment--active': textOutline.enabled && textOutline.colorMode === 'fixed' }"
              :title="t('panel.textOutlineCustom')"
            >
              <input
                type="color"
                class="absolute w-0 h-0 opacity-0 pointer-events-none"
                :value="customOutlineColor"
                @input="updateCustomTextOutlineColor(($event.target as HTMLInputElement).value)"
              />
              <span
                class="w-3.5 h-3.5 rounded-full color-swatch-ring color-swatch-ring--compact transition-[border-color] duration-120"
                :class="{
                  'color-swatch-ring--active': textOutline.enabled && textOutline.colorMode === 'fixed',
                }"
                :style="{ backgroundColor: customOutlineColor }"
              />
              <span>{{ t('panel.textOutlineCustom') }}</span>
            </label>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex flex-1 gap-1">
              <button
                v-for="w in outlineWidths"
                :key="w.value"
                type="button"
                class="group flex-1 flex items-center justify-center h-8 border-none rounded-lg cursor-pointer transition-all duration-120"
                :class="
                  textOutline.enabled && textOutline.width === w.value
                    ? 'overlay-width-btn--active'
                    : 'overlay-width-btn'
                "
                :title="w.label"
                @click="updateTextOutline({ enabled: true, width: w.value })"
              >
                <span
                  class="w-[70%] rounded-full transition-transform duration-120 group-hover:scale-x-110"
                  :class="
                    textOutline.enabled && textOutline.width === w.value
                      ? 'overlay-width-line--active'
                      : 'overlay-width-line'
                  "
                  :style="{
                    height: Math.max(1.5, w.value * 1.1) + 'px',
                    backgroundColor: textOutline.enabled ? outlinePreviewColor : undefined,
                  }"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- More / collapse (simple layout only) -->
        <div v-if="layout === 'simple'" class="px-3.5 pb-3">
          <button
            type="button"
            class="w-full flex items-center justify-center gap-1.5 h-8 border-none rounded-lg cursor-pointer overlay-tool-btn text-[11px] font-sans"
            @click="toggleExpanded"
          >
            <component :is="expanded ? ChevronUp : MoreHorizontal" :size="14" />
            {{ expanded ? t('toolbar.less') : t('toolbar.more') }}
          </button>
        </div>

        <!-- Shortcut hints (detailed only) -->
        <div v-if="showFullPanel" class="flex flex-col gap-1.5 pt-1 px-3.5 pb-3 ui-divider-h">
          <div class="flex items-center justify-between text-[10.5px] font-sans">
            <span class="flex items-center gap-1.5 overlay-text-body">
              <kbd class="ui-kbd">{{ modKeyLabel }}</kbd>
              <span class="overlay-text-separator text-[10px]">+</span>
              <span>{{ t('panel.drag') }}</span>
            </span>
            <span class="overlay-text-secondary text-[10.5px] text-right min-w-[48px]">{{ t('panel.rectShape') }}</span>
          </div>
          <div class="flex items-center justify-between text-[10.5px] font-sans">
            <span class="flex items-center gap-1.5 overlay-text-body">
              <kbd class="ui-kbd">Shift</kbd>
              <span class="overlay-text-separator text-[10px]">+</span>
              <span>{{ t('panel.drag') }}</span>
            </span>
            <span class="overlay-text-secondary text-[10.5px] text-right min-w-[48px]">{{
              t('panel.ellipseShape')
            }}</span>
          </div>
          <div class="flex items-center justify-between text-[10.5px] font-sans">
            <span class="flex items-center gap-1.5 overlay-text-body">
              <kbd class="ui-kbd">{{ modKeyLabel }}</kbd>
              <span class="overlay-text-separator text-[10px]">+</span>
              <kbd class="ui-kbd">Shift</kbd>
              <span class="overlay-text-separator text-[10px]">+</span>
              <span>{{ t('panel.drag') }}</span>
            </span>
            <span class="overlay-text-secondary text-[10.5px] text-right min-w-[48px]">{{
              t('panel.arrowShape')
            }}</span>
          </div>
          <div class="flex items-center justify-between text-[10.5px] font-sans">
            <span class="flex items-center gap-1.5 overlay-text-body">
              <kbd class="ui-kbd">Q</kbd>
              <span class="overlay-text-separator text-[10px]">/</span>
              <kbd class="ui-kbd">E</kbd>
              <span class="overlay-text-separator text-[10px]">/</span>
              <span>{{ t('panel.rightClick') }}</span>
            </span>
            <span class="overlay-text-secondary text-[10.5px] text-right min-w-[48px]">{{
              t('panel.switchColor')
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay-toolbar-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.06);
  transition:
    background 0.12s,
    color 0.12s;
}

.overlay-toolbar-action:hover {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 1);
}

.overlay-toolbar-action:disabled {
  opacity: 0.32;
  cursor: default;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.35);
}

.overlay-toolbar-action:disabled:hover {
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.35);
}

.overlay-toolbar-action--active {
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 1);
}
</style>
