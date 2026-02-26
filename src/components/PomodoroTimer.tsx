'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, Timer as TimerIcon, Volume2, VolumeX } from 'lucide-react'

type Mode = 'pomodoro' | 'short' | 'long'

const MODES: Record<Mode, { label: string; minutes: number; color: string; bg: string }> = {
    pomodoro: { label: 'Enfoque', minutes: 25, color: '#ff4d4d', bg: 'rgba(255, 77, 77, 0.1)' },
    short: { label: 'Descanso', minutes: 5, color: '#4caf50', bg: 'rgba(76, 175, 80, 0.1)' },
    long: { label: 'Pausa Larga', minutes: 15, color: '#2196f3', bg: 'rgba(33, 150, 243, 0.1)' }
}

export default function PomodoroTimer() {
    const [mode, setMode] = useState<Mode>('pomodoro')
    const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.minutes * 60)
    const [isActive, setIsActive] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const progress = (timeLeft / (MODES[mode].minutes * 60)) * 100

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            handleComplete()
        } else {
            if (timerRef.current) clearInterval(timerRef.current)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isActive, timeLeft])

    const handleComplete = () => {
        setIsActive(false)
        if (!isMuted) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
            audio.play().catch(() => { })
        }
        alert(`¡Tiempo de ${MODES[mode].label} terminado!`)
    }

    const toggleTimer = () => setIsActive(!isActive)

    const resetTimer = () => {
        setIsActive(false)
        setTimeLeft(MODES[mode].minutes * 60)
    }

    const changeMode = (newMode: Mode) => {
        setMode(newMode)
        setIsActive(false)
        setTimeLeft(MODES[newMode].minutes * 60)
    }

    return (
        <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 16,
            border: '1px solid #eee',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            margin: '8px 12px'
        }}>
            {/* Header / Modes */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {(Object.keys(MODES) as Mode[]).map(m => (
                    <button
                        key={m}
                        onClick={() => changeMode(m)}
                        style={{
                            flex: 1,
                            padding: '6px 4px',
                            borderRadius: 8,
                            fontSize: 9,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            border: 'none',
                            cursor: 'pointer',
                            background: mode === m ? MODES[m].bg : 'transparent',
                            color: mode === m ? MODES[m].color : '#999',
                            transition: 'all 0.2s'
                        }}
                    >
                        {m === 'pomodoro' && <Brain size={10} style={{ marginBottom: 2 }} />}
                        {m === 'short' && <Coffee size={10} style={{ marginBottom: 2 }} />}
                        {m === 'long' && <TimerIcon size={10} style={{ marginBottom: 2 }} />}
                        <div style={{ fontSize: 8 }}>{MODES[m].label}</div>
                    </button>
                ))}
            </div>

            {/* Timer Display */}
            <div style={{
                position: 'relative',
                height: 80,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '8px 0'
            }}>
                <svg width="70" height="70" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                    <circle
                        cx="35" cy="35" r="32"
                        fill="none"
                        stroke="#f0f0f0"
                        strokeWidth="4"
                    />
                    <circle
                        cx="35" cy="35" r="32"
                        fill="none"
                        stroke={MODES[mode].color}
                        strokeWidth="4"
                        strokeDasharray="201"
                        strokeDashoffset={201 - (201 * progress) / 100}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                    />
                </svg>
                <div style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: '#1a1a2e',
                    fontVariantNumeric: 'tabular-nums',
                    zIndex: 1
                }}>
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </div>
                <div style={{ fontSize: 8, color: '#999', fontWeight: 700, marginTop: 2, zIndex: 1 }}>
                    {isActive ? 'EN MARCHA' : 'PAUSADO'}
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4 }}
                >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                <button
                    onClick={toggleTimer}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: MODES[mode].color,
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: `0 4px 10px ${MODES[mode].color}40`,
                        transition: 'transform 0.1s active'
                    }}
                >
                    {isActive ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" style={{ marginLeft: 2 }} />}
                </button>

                <button
                    onClick={resetTimer}
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4 }}
                >
                    <RotateCcw size={14} />
                </button>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
