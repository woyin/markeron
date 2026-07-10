import type { AppConfig } from '../types/app'
import { isMacOS } from './platform'

/** macOS defaults off (spurious Cmd+C after pen-up); other platforms default on. */
export function defaultKeyboardCopyEnabled(): boolean {
  return !isMacOS()
}

export function resolveKeyboardCopyEnabled(general?: Partial<AppConfig['general']>): boolean {
  if (general?.keyboardCopyEnabled !== undefined) return general.keyboardCopyEnabled
  return defaultKeyboardCopyEnabled()
}
