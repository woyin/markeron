import { describe, it, expect, beforeEach } from 'vitest'
import { clearDiagnosticEvents, getDiagnosticEventCount, getDiagnosticEvents, logDiagnostic } from './diagnosticEvents'

describe('diagnosticEvents', () => {
  beforeEach(() => {
    clearDiagnosticEvents()
  })

  it('stores and returns events', () => {
    logDiagnostic('copy', 'copyScreen invoked', { reason: 'keyboard' })
    expect(getDiagnosticEventCount()).toBe(1)
    expect(getDiagnosticEvents()[0]?.category).toBe('copy')
  })

  it('trims buffer to max size', () => {
    for (let i = 0; i < 520; i++) {
      logDiagnostic('pointer', `event-${i}`)
    }
    expect(getDiagnosticEventCount()).toBe(500)
    expect(getDiagnosticEvents()[0]?.message).toBe('event-20')
  })
})
