import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const PRESETS = [
  { label: '25/5', focusMinutes: 25, breakMinutes: 5 },
  { label: '50/10', focusMinutes: 50, breakMinutes: 10 },
]

const TICK_MS = 250

const formatRemaining = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const chime = () => {
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.start()
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => ctx.close()
  } catch {
    // Audio is best-effort; a missing/blocked AudioContext never breaks the timer.
  }
}

const PomodoroDock = ({ reviewerId, guest }) => {
  const [preset, setPreset] = useState('25/5')
  const [customFocus, setCustomFocus] = useState(25)
  const [customBreak, setCustomBreak] = useState(5)
  const [phase, setPhase] = useState('idle')
  const [status, setStatus] = useState('idle')
  const [remainingMs, setRemainingMs] = useState(25 * 60 * 1000)
  const [muted, setMuted] = useState(false)

  const totalRef = useRef(25 * 60 * 1000)
  const startedRef = useRef(0)
  const accumulatedRef = useRef(0)
  const timerRef = useRef(null)
  const focusStartedAtRef = useRef(null)
  const focusMsRef = useRef(25 * 60 * 1000)
  const breakMsRef = useRef(5 * 60 * 1000)
  const mutedRef = useRef(false)
  const guestRef = useRef(guest)
  const reviewerRef = useRef(reviewerId)
  mutedRef.current = muted
  guestRef.current = guest
  reviewerRef.current = reviewerId

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => clearTimer, [])

  const durations = preset === 'Custom'
    ? { focusMs: Number(customFocus) * 60 * 1000, breakMs: Number(customBreak) * 60 * 1000 }
    : PRESETS.find((p) => p.label === preset)

  const validCustom = preset !== 'Custom'
    || (Number.isFinite(Number(customFocus)) && Number(customFocus) > 0
      && Number.isFinite(Number(customBreak)) && Number(customBreak) >= 0)

  const applyIdleDurations = (focusMs, breakMs) => {
    totalRef.current = focusMs
    focusMsRef.current = focusMs
    breakMsRef.current = breakMs
    setRemainingMs(focusMs)
  }

  const selectPreset = (label) => {
    setPreset(label)
    if (status !== 'idle') return
    if (label === 'Custom') {
      applyIdleDurations(Number(customFocus) * 60 * 1000, Number(customBreak) * 60 * 1000)
    } else {
      const found = PRESETS.find((p) => p.label === label)
      applyIdleDurations(found.focusMinutes * 60 * 1000, found.breakMinutes * 60 * 1000)
    }
  }

  const finishFocus = () => {
    clearTimer()
    const endedAt = new Date(Date.now())
    if (!mutedRef.current) chime()
    // Duration truth comes from timestamps, never from counted intervals.
    const focusSeconds = Math.round((endedAt.getTime() - focusStartedAtRef.current.getTime()) / 1000)
    if (!guestRef.current) {
      axios.post('/api/pomodoro/sessions', {
        reviewerId: reviewerRef.current,
        focusSeconds,
        breakSeconds: Math.round(breakMsRef.current / 1000),
        startedAt: focusStartedAtRef.current.toISOString(),
        endedAt: endedAt.toISOString(),
      }, { withCredentials: true }).catch(() => {
        // Session persistence is best-effort; the timer already completed.
      })
    }
    // Flow straight into the break countdown.
    setPhase('break')
    totalRef.current = breakMsRef.current
    accumulatedRef.current = 0
    startedRef.current = Date.now()
    setRemainingMs(breakMsRef.current)
    setStatus('running')
    timerRef.current = setInterval(() => tick('break'), TICK_MS)
  }

  const finishBreak = () => {
    clearTimer()
    if (!mutedRef.current) chime()
    setPhase('idle')
    setStatus('idle')
    setRemainingMs(focusMsRef.current)
  }

  const tick = (currentPhase) => {
    // Timestamp math: remaining derives from wall-clock elapsed time so
    // throttled/late interval callbacks cannot drift the countdown.
    const elapsed = accumulatedRef.current + (Date.now() - startedRef.current)
    const left = totalRef.current - elapsed
    if (left <= 0) {
      if (currentPhase === 'focus') finishFocus()
      else finishBreak()
      return
    }
    setRemainingMs(left)
  }

  const handleStart = () => {
    if (!validCustom) return
    const focusMs = preset === 'Custom' ? Number(customFocus) * 60 * 1000 : durations.focusMinutes * 60 * 1000
    const breakMs = preset === 'Custom' ? Number(customBreak) * 60 * 1000 : durations.breakMinutes * 60 * 1000
    focusMsRef.current = focusMs
    breakMsRef.current = breakMs
    totalRef.current = focusMs
    accumulatedRef.current = 0
    startedRef.current = Date.now()
    focusStartedAtRef.current = new Date(Date.now())
    setPhase('focus')
    setRemainingMs(focusMs)
    setStatus('running')
    clearTimer()
    timerRef.current = setInterval(() => tick('focus'), TICK_MS)
  }

  const handlePause = () => {
    accumulatedRef.current += Date.now() - startedRef.current
    clearTimer()
    setStatus('paused')
  }

  const handleResume = () => {
    startedRef.current = Date.now()
    setStatus('running')
    clearTimer()
    timerRef.current = setInterval(() => tick(phase === 'break' ? 'break' : 'focus'), TICK_MS)
  }

  const handleReset = () => {
    clearTimer()
    accumulatedRef.current = 0
    setPhase('idle')
    setStatus('idle')
    setRemainingMs(focusMsRef.current)
  }

  const phaseLabel = phase === 'focus' ? 'Focus' : phase === 'break' ? 'Break' : 'Ready'

  return (
    <div aria-label="Pomodoro timer">
      <div role="group" aria-label="Timer presets">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => selectPreset(p.label)} aria-pressed={preset === p.label}>
            {p.label}
          </button>
        ))}
        <button type="button" onClick={() => selectPreset('Custom')} aria-pressed={preset === 'Custom'}>
          Custom
        </button>
      </div>

      {preset === 'Custom' && (
        <div>
          <label htmlFor="pomodoro-custom-focus">Focus Minutes</label>
          <input
            id="pomodoro-custom-focus"
            type="number"
            min="1"
            value={customFocus}
            onChange={(e) => {
              setCustomFocus(e.target.value)
              if (status === 'idle') {
                const focusMs = Number(e.target.value) * 60 * 1000
                if (Number.isFinite(focusMs) && focusMs > 0) {
                  totalRef.current = focusMs
                  focusMsRef.current = focusMs
                  setRemainingMs(focusMs)
                }
              }
            }}
          />
          <label htmlFor="pomodoro-custom-break">Break Minutes</label>
          <input
            id="pomodoro-custom-break"
            type="number"
            min="0"
            value={customBreak}
            onChange={(e) => {
              setCustomBreak(e.target.value)
              if (status === 'idle') {
                const breakMs = Number(e.target.value) * 60 * 1000
                if (Number.isFinite(breakMs) && breakMs >= 0) breakMsRef.current = breakMs
              }
            }}
          />
        </div>
      )}

      <p aria-label="Time remaining">{phaseLabel} {formatRemaining(remainingMs)}</p>

      {status === 'idle' && (
        <button type="button" onClick={handleStart} disabled={!validCustom}>Start</button>
      )}
      {status === 'running' && (
        <button type="button" onClick={handlePause}>Pause</button>
      )}
      {status === 'paused' && (
        <button type="button" onClick={handleResume}>Resume</button>
      )}
      {status !== 'idle' && (
        <button type="button" onClick={handleReset}>Reset</button>
      )}
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? 'Unmute Chime' : 'Mute Chime'}
        aria-pressed={muted}
      >
        {muted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  )
}

export default PomodoroDock
