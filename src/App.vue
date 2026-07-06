<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent, markRaw, nextTick, shallowRef, type Component } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useUpdater } from './composables/useUpdater'

const DrawingOverlay = defineAsyncComponent(() => import('./components/DrawingOverlay.vue'))
const ToolbarWindow = defineAsyncComponent(() => import('./components/ToolbarWindow.vue'))

type AppMode = 'overlay' | 'settings' | 'toolbar'

function resolveAppMode(): AppMode {
  if (window.location.hash.startsWith('#settings')) return 'settings'
  if (window.location.hash.startsWith('#toolbar')) return 'toolbar'
  return 'overlay'
}

const mode = ref<AppMode>(resolveAppMode())
const SettingsView = shallowRef<Component | null>(null)

if (mode.value === 'settings') {
  document.documentElement.classList.add('settings')
}

function afterAnimationFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

async function revealSettingsWindow() {
  try {
    const win = getCurrentWindow()
    await win.show()
    await win.setFocus()
  } catch (error) {
    console.error('Failed to reveal settings window:', error)
  }
}

onMounted(async () => {
  if (mode.value === 'settings') {
    try {
      const module = await import('./components/SettingsView.vue')
      SettingsView.value = markRaw(module.default)
      await nextTick()
      await afterAnimationFrame()
    } finally {
      await revealSettingsWindow()
    }

    const { checkForUpdate } = useUpdater()
    checkForUpdate(true)
  }
})
</script>

<template>
  <component :is="SettingsView" v-if="mode === 'settings' && SettingsView" />
  <ToolbarWindow v-else-if="mode === 'toolbar'" />
  <DrawingOverlay v-else />
</template>
