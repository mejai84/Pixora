'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Timer as TimerIcon } from 'lucide-react'

type Mode = 'pomodoro' | 'short' | 'long'

const MODES: Record<Mode, { label: string; minutes: number; color: string; bg: string }> = {
    pomodoro: { label: 'Enfoque', minutes: 25, color: '#ff4d4d', bg: 'rgba(255, 77, 77, 0.1)' },
    short: { label: 'Descanso', minutes: 5, color: '#4caf50', bg: 'rgba(76, 175, 80, 0.1)' },
    long: { label: 'Pausa Larga', minutes: 15, color: '#2196f3', bg: 'rgba(33, 150, 243, 0.1)' }
}

export default function PomodoroPopout() {
    const [mode, setMode] = useState<Mode>('pomodoro')
    const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.minutes * 60)
    const [isActive, setIsActive] = useState(false)
    const [startTime, setStartTime] = useState<number | null>(null)
    const [initialTimeLeft, setInitialTimeLeft] = useState(MODES.pomodoro.minutes * 60)

    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const windowId = useRef(typeof window !== 'undefined' ? Math.random().toString(36).substring(7) : 'popout').current

    // Listen for state changes in main window via localStorage
    useEffect(() => {
        const handleSync = () => {
            const saved = localStorage.getItem('pixora_pomodoro_sync')
            if (saved) {
                try {
                    const state = JSON.parse(saved)
                    // Don't sync with our own updates
                    if (state.source === windowId) return

                    setMode(state.mode)
                    setIsActive(state.isActive)
                    setStartTime(state.startTime)
                    setInitialTimeLeft(state.initialTimeLeft)
                } catch (e) { }
            }
        }

        window.addEventListener('storage', (e) => {
            if (e.key === 'pixora_pomodoro_sync') handleSync()
        })

        handleSync()
    }, [])

    useEffect(() => {
        if (isActive && startTime) {
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000)
                const newTimeLeft = Math.max(0, initialTimeLeft - elapsed)
                setTimeLeft(newTimeLeft)

                if (newTimeLeft === 0) {
                    setIsActive(false)
                    setStartTime(null)
                }
            }, 1000)
        } else {
            if (timerRef.current) clearInterval(timerRef.current)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isActive, startTime, initialTimeLeft])

    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const progress = (timeLeft / (MODES[mode].minutes * 60)) * 100

    const toggleTimer = () => {
        const newActive = !isActive
        const now = Date.now()
        const newStartTime = newActive ? now : null
        const newInitTime = timeLeft

        setIsActive(newActive)
        setStartTime(newStartTime)
        setInitialTimeLeft(newInitTime)

        // Broadcast back to main window
        localStorage.setItem('pixora_pomodoro_sync', JSON.stringify({
            mode, isActive: newActive, startTime: newStartTime, initialTimeLeft: newInitTime, lastUpdate: now, source: windowId
        }))
    }

    const resetTimer = () => {
        const resetTime = MODES[mode].minutes * 60
        setIsActive(false)
        setStartTime(null)
        setTimeLeft(resetTime)

        localStorage.setItem('pixora_pomodoro_sync', JSON.stringify({
            mode, isActive: false, startTime: null, initialTimeLeft: resetTime, lastUpdate: Date.now(), source: windowId
        }))
    }

    const changeMode = (m: Mode) => {
        const resetTime = MODES[m].minutes * 60
        setMode(m)
        setIsActive(false)
        setStartTime(null)
        setTimeLeft(resetTime)

        localStorage.setItem('pixora_pomodoro_sync', JSON.stringify({
            mode: m, isActive: false, startTime: null, initialTimeLeft: resetTime, lastUpdate: Date.now(), source: windowId
        }))
    }

    return (
        <div style={{
            height: '100vh',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: 20,
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Header / Title Bar */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 32,
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                borderBottom: '1px solid #edf2f7'
            }}>
                <TimerIcon size={14} color="#ff4d4d" style={{ marginRight: 8 }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', letterSpacing: '0.05em' }}>PIXORA FOCUS</span>
                <button
                    onClick={() => window.close()}
                    style={{ marginLeft: 'auto', background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 800, cursor: 'pointer' }}
                >
                    CERRAR
                </button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 20, width: '100%', marginTop: 24 }}>
                {(Object.keys(MODES) as Mode[]).map(m => (
                    <button
                        key={m}
                        onClick={() => changeMode(m)}
                        style={{
                            flex: 1,
                            padding: '8px 4px',
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 800,
                            border: 'none',
                            cursor: 'pointer',
                            background: mode === m ? MODES[m].bg : '#f5f5f5',
                            color: mode === m ? MODES[m].color : '#999',
                            transition: 'all 0.2s'
                        }}
                    >
                        {MODES[m].label.toUpperCase()}
                    </button>
                ))}
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="90" cy="90" r="85" fill="none" stroke="#f0f0f0" strokeWidth="6" />
                    <circle
                        cx="90" cy="90" r="85"
                        fill="none"
                        stroke={MODES[mode].color}
                        strokeWidth="6"
                        strokeDasharray="534"
                        strokeDashoffset={534 - (534 * progress) / 100}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                    />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <div style={{ fontSize: 42, fontWeight: 950, color: '#1a1a2e', fontVariantNumeric: 'tabular-nums' }}>
                        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 20, marginTop: 30 }}>
                <button
                    onClick={resetTimer}
                    style={{ background: '#f5f5f5', border: 'none', color: '#666', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <RotateCcw size={20} />
                </button>
                <button
                    onClick={toggleTimer}
                    style={{
                        width: 60, height: 60, borderRadius: '50%',
                        background: MODES[mode].color, border: 'none', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: `0 8px 20px ${MODES[mode].color}40`
                    }}
                >
                    {isActive ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" style={{ marginLeft: 4 }} />}
                </button>
                <div style={{ width: 44 }} />
            </div>

            <div style={{ marginTop: 20, fontSize: 10, color: '#ccc', fontWeight: 700 }}>PIXORA FOCUS</div>
        </div>
    )
}
