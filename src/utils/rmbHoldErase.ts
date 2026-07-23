export const RMB_HOLD_ERASE_MS = 250

export type RmbHoldPhase = 'idle' | 'pending' | 'active'

export type RmbHoldGesture = {
  phase: RmbHoldPhase
  toolBefore: string | null
}

export const IDLE_RMB_HOLD: RmbHoldGesture = {
  phase: 'idle',
  toolBefore: null,
}

export type RmbHoldEnd = {
  next: RmbHoldGesture
  openPalette: boolean
  finishErase: boolean
  restoreTool: string | null
}

export function canStartRmbHoldErase(opts: {
  active: boolean
  penetration: boolean
  textBoxOpen: boolean
  quickColorsOpen: boolean
}): boolean {
  return opts.active && !opts.penetration && !opts.textBoxOpen && !opts.quickColorsOpen
}

export function startRmbHoldPending(): RmbHoldGesture {
  return { phase: 'pending', toolBefore: null }
}

export function activateRmbHoldErase(gesture: RmbHoldGesture, currentTool: string): RmbHoldGesture {
  if (gesture.phase !== 'pending') return gesture
  return { phase: 'active', toolBefore: currentTool }
}

export function shouldBlockQuickColors(gesture: RmbHoldGesture): boolean {
  return gesture.phase === 'pending' || gesture.phase === 'active'
}

export function releaseRmbHold(gesture: RmbHoldGesture): RmbHoldEnd {
  if (gesture.phase === 'pending') {
    return {
      next: IDLE_RMB_HOLD,
      openPalette: true,
      finishErase: false,
      restoreTool: null,
    }
  }
  if (gesture.phase === 'active') {
    return {
      next: IDLE_RMB_HOLD,
      openPalette: false,
      finishErase: true,
      restoreTool: gesture.toolBefore,
    }
  }
  return {
    next: IDLE_RMB_HOLD,
    openPalette: false,
    finishErase: false,
    restoreTool: null,
  }
}

export function cancelRmbHold(gesture: RmbHoldGesture): RmbHoldEnd {
  if (gesture.phase === 'active') {
    return {
      next: IDLE_RMB_HOLD,
      openPalette: false,
      finishErase: true,
      restoreTool: gesture.toolBefore,
    }
  }
  return {
    next: IDLE_RMB_HOLD,
    openPalette: false,
    finishErase: false,
    restoreTool: null,
  }
}
