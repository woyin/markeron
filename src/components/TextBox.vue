<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import { isMacOS } from '../utils/platform'
import { useI18n } from '../i18n'
import type { TextOutlineStyle } from '../composables/drawingTypes'
import { getActiveTextOutline } from '../constants/textOutline'

const { t } = useI18n()

const props = defineProps<{
  x: number
  y: number
  color: string
  fontSize: number
  initialText?: string
  textOutline?: TextOutlineStyle
}>()

const emit = defineEmits<{
  commit: [text: string, x: number, y: number, width: number, fontSize: number]
  cancel: []
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fs = ref(props.fontSize)
const draftText = ref(props.initialText ?? '')
const boxWidth = ref('auto')
const boxHeight = ref('auto')
const lineHeight = computed(() => Math.round(fs.value * 1.3))
const textBoxTransform = computed(() => `translate(${props.x}px, ${props.y - lineHeight.value / 2}px)`)
const activeTextOutline = computed(() =>
  draftText.value.length > 0 ? getActiveTextOutline(props.textOutline, props.color) : null,
)
const outlineStrokeStyle = computed(() => {
  const outline = activeTextOutline.value
  return outline ? `${outline.width}px ${outline.color}` : undefined
})

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
  el.style.width = 'auto'
  el.style.width = Math.max(4, el.scrollWidth + 4) + 'px'
  boxHeight.value = el.style.height
  boxWidth.value = el.style.width
}

function onInput(e: Event) {
  draftText.value = (e.target as HTMLTextAreaElement).value
  autoResize()
}

onMounted(() => {
  autoResize()
  const el = textareaRef.value
  if (!el) return
  el.focus()
  requestAnimationFrame(() => {
    el.focus()
  })
})

function getText(): string {
  return draftText.value
}

function commitText() {
  const text = getText()
  emit('commit', text, props.x, props.y, 0, fs.value)
}

function onKeyDown(e: KeyboardEvent) {
  e.stopPropagation()
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('cancel')
  }
  if (e.key === 'Enter' && (e.ctrlKey || (isMacOS() && e.metaKey))) {
    e.preventDefault()
    commitText()
  }
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  e.stopPropagation()
  const step = e.deltaY < 0 ? 2 : -2
  fs.value = Math.max(12, Math.min(120, fs.value + step))
  nextTick(autoResize)
}

function getFontSize(): number {
  return fs.value
}

defineExpose({ commitText, getText, getFontSize })
</script>

<template>
  <div
    v-if="activeTextOutline"
    aria-hidden="true"
    class="fixed left-0 top-0 z-100001 px-0.5 py-0 pointer-events-none select-none font-text overflow-visible whitespace-pre min-w-[4px] max-w-[80vw]"
    :style="{
      transform: textBoxTransform,
      width: boxWidth,
      height: boxHeight,
      color: 'transparent',
      fontSize: fs + 'px',
      lineHeight: lineHeight + 'px',
      minHeight: lineHeight + 'px',
      WebkitTextStroke: outlineStrokeStyle,
    }"
  >
    {{ draftText }}
  </div>
  <textarea
    ref="textareaRef"
    class="textbox-input fixed left-0 top-0 z-100002 px-0.5 py-0 border-none bg-transparent outline-none resize-none font-text overflow-hidden whitespace-pre min-w-[4px] max-w-[80vw]"
    :value="draftText"
    :style="{
      transform: textBoxTransform,
      color: color,
      fontSize: fs + 'px',
      lineHeight: lineHeight + 'px',
      minHeight: lineHeight + 'px',
      caretColor: color,
    }"
    :placeholder="t('textBox.placeholder')"
    spellcheck="false"
    @keydown="onKeyDown"
    @input="onInput"
    @mousedown.stop
    @wheel="onWheel"
  />
</template>
