'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, Timer as TimerIcon, Volume2, VolumeX, Maximize2, Move, Minimize2, Zap, X } from 'lucide-react'

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
    const [volume, setVolume] = useState(0.5)
    const [isFloating, setIsFloating] = useState(false)
    const [isCompact, setIsCompact] = useState(false)
    const [position, setPosition] = useState({ x: 24, y: 24 }) // bottom, right offsets
    const [isDragging, setIsDragging] = useState(false)
    const [activeTask, setActiveTask] = useState<any>(null)

    const dragRef = useRef<HTMLDivElement>(null)
    const dragOffset = useRef({ x: 0, y: 0 })
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

    useEffect(() => {
        // Request notification permission
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }

        // Load persisted settings
        const saved = localStorage.getItem('pixora_pomodoro_settings')
        if (saved) {
            try {
                const settings = JSON.parse(saved)
                if (settings.volume !== undefined) setVolume(settings.volume)
                if (settings.position) setPosition(settings.position)
                if (settings.isFloating !== undefined) setIsFloating(settings.isFloating)
                if (settings.isCompact !== undefined) setIsCompact(settings.isCompact)
            } catch (e) { }
        }

        const checkTask = () => {
            const savedTask = localStorage.getItem('pixora_active_task')
            if (savedTask) {
                try {
                    setActiveTask(JSON.parse(savedTask))
                } catch (e) { }
            } else {
                setActiveTask(null)
            }
        }

        checkTask()
        window.addEventListener('pixora_task_focus', checkTask)
        window.addEventListener('storage', checkTask) // Listen for changes in other tabs/components

        return () => {
            window.removeEventListener('pixora_task_focus', checkTask)
            window.removeEventListener('storage', checkTask)
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('pixora_pomodoro_settings', JSON.stringify({
            volume, position, isFloating, isCompact
        }))
    }, [volume, position, isFloating, isCompact])

    const playSound = (url: string) => {
        if (isMuted) return
        const audio = new Audio(url)
        audio.volume = volume
        audio.play().catch(() => { })
    }

    const handleComplete = () => {
        setIsActive(false)
        playSound('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Pixora Pomodoro', { body: `¡Tiempo de ${MODES[mode].label} terminado!` })
        }
        alert(`¡Tiempo de ${MODES[mode].label} terminado!`)
    }

    const toggleTimer = () => {
        const newActive = !isActive
        setIsActive(newActive)

        if (newActive) {
            playSound('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3')
        }

        if (newActive && !isFloating) {
            setIsFloating(true)
        }
    }

    const resetTimer = () => {
        setIsActive(false)
        setTimeLeft(MODES[mode].minutes * 60)
    }

    const clearTask = (e: React.MouseEvent) => {
        e.stopPropagation()
        localStorage.removeItem('pixora_active_task')
        setActiveTask(null)
    }

    const changeMode = (newMode: Mode) => {
        setMode(newMode)
        setIsActive(false)
        setTimeLeft(MODES[newMode].minutes * 60)
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isFloating) return
        setIsDragging(true)
        dragOffset.current = {
            x: e.clientX + position.x,
            y: window.innerHeight - e.clientY - position.y
        }
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            setPosition({
                x: dragOffset.current.x - e.clientX,
                y: window.innerHeight - e.clientY - dragOffset.current.y
            })
        }
        const handleMouseUp = () => setIsDragging(false)

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    return (
        <div
            ref={dragRef}
            style={{
                background: 'white',
                borderRadius: 20,
                padding: isFloating ? (isCompact ? 12 : 20) : 16,
                border: '1px solid #eee',
                boxShadow: isFloating ? '0 12px 40px rgba(0,0,0,0.18)' : '0 4px 12px rgba(0,0,0,0.05)',
                margin: isFloating ? 0 : '8px 12px',
                position: isFloating ? 'fixed' : 'relative',
                bottom: isFloating ? Math.max(12, position.y) : 'auto',
                right: isFloating ? Math.max(12, position.x) : 'auto',
                zIndex: 9999,
                width: isFloating ? (isCompact ? 140 : 250) : 'auto',
                transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: isFloating ? 'scale(1)' : 'scale(1)',
                userSelect: isDragging ? 'none' : 'auto',
                cursor: isDragging ? 'grabbing' : 'auto',
                overflow: 'hidden'
            }}
        >
            {/* Active Task (If any) */}
            {activeTask && !isCompact && (
                <div style={{
                    background: '#f0faf0',
                    borderRadius: 12,
                    padding: '8px 12px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #4CAF5020',
                    animation: 'fadeIn 0.3s'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <Zap size={10} color="#4CAF50" className="fill-green-500" />
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#4CAF50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {activeTask.title.toUpperCase()}
                        </span>
                    </div>
                    <button onClick={clearTask} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: 2 }}>
                        <X size={10} />
                    </button>
                </div>
            )}

            {/* Header / Drag Handle */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: isCompact && isFloating ? 0 : 12,
                    cursor: isFloating ? 'grab' : 'default'
                }}
            >
                {!isCompact && (
                    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
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
                                <div style={{ fontSize: 8 }}>{MODES[m].label}</div>
                            </button>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                    {isFloating && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsCompact(!isCompact) }}
                            style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4 }}
                        >
                            {isCompact ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFloating(!isFloating); setIsCompact(false); if (isFloating) setPosition({ x: 24, y: 24 }) }}
                        style={{
                            background: isFloating ? '#f0f0f0' : 'none',
                            border: 'none',
                            borderRadius: 6,
                            color: isFloating ? '#4CAF50' : '#ccc',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title={isFloating ? "Anclar a Sidebar" : "Hacer flotante"}
                    >
                        {isFloating ? <Move size={12} /> : <Maximize2 size={12} />}
                    </button>
                </div>
            </div>

            {/* Timer Display */}
            <div style={{
                position: 'relative',
                height: isFloating ? (isCompact ? 60 : 100) : 80,
                display: 'flex',
                flexDirection: isCompact && isFloating ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: isCompact && isFloating ? 'flex-start' : 'center',
                margin: isCompact && isFloating ? 0 : '8px 0',
                gap: 12
            }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <svg width={isFloating ? (isCompact ? 50 : 90) : 70} height={isFloating ? (isCompact ? 50 : 90) : 70} style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                            cx={isFloating ? (isCompact ? 25 : 45) : 35} cy={isFloating ? (isCompact ? 25 : 45) : 35} r={isFloating ? (isCompact ? 22 : 42) : 32}
                            fill="none"
                            stroke="#f0f0f0"
                            strokeWidth="3"
                        />
                        <circle
                            cx={isFloating ? (isCompact ? 25 : 45) : 35} cy={isFloating ? (isCompact ? 25 : 45) : 35} r={isFloating ? (isCompact ? 22 : 42) : 32}
                            fill="none"
                            stroke={MODES[mode].color}
                            strokeWidth="3"
                            strokeDasharray={isFloating ? (isCompact ? 138 : 264) : 201}
                            strokeDashoffset={(isFloating ? (isCompact ? 138 : 264) : 201) - ((isFloating ? (isCompact ? 138 : 264) : 201) * progress) / 100}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute',
                        fontSize: isFloating ? (isCompact ? 12 : 24) : 18,
                        fontWeight: 900,
                        color: '#1a1a2e',
                        fontVariantNumeric: 'tabular-nums',
                        zIndex: 1
                    }}>
                        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </div>
                </div>

                {(!isCompact || !isFloating) && (
                    <div style={{ fontSize: 8, color: '#999', fontWeight: 700, marginTop: 2, zIndex: 1 }}>
                        {isActive ? (isFloating ? 'IN FOCUS' : 'EN MARCHA') : 'PAUSADO'}
                    </div>
                )}

                {isCompact && isFloating && (
                    <button
                        onClick={toggleTimer}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: MODES[mode].color,
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: `0 4px 8px ${MODES[mode].color}30`
                        }}
                    >
                        {isActive ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" style={{ marginLeft: 2 }} />}
                    </button>
                )}
            </div>

            {/* Controls */}
            {(!isCompact || !isFloating) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4 }}
                        >
                            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                        {!isMuted && (
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                style={{
                                    width: 40,
                                    height: 3,
                                    accentColor: MODES[mode].color,
                                    marginLeft: 4,
                                    cursor: 'pointer'
                                }}
                            />
                        )}
                    </div>

                    <button
                        onClick={toggleTimer}
                        style={{
                            width: isFloating ? 44 : 36,
                            height: isFloating ? 44 : 36,
                            borderRadius: '50%',
                            background: MODES[mode].color,
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: `0 4px 10px ${MODES[mode].color}40`,
                            transition: 'all 0.1s'
                        }}
                    >
                        {isActive ? <Pause size={isFloating ? 22 : 18} fill="white" /> : <Play size={isFloating ? 22 : 18} fill="white" style={{ marginLeft: 2 }} />}
                    </button>

                    <button
                        onClick={resetTimer}
                        style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4 }}
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            )}

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                input[type='range'] {
                    -webkit-appearance: none;
                    background: #eee;
                    border-radius: 5px;
                }
                input[type='range']::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 8px;
                    height: 8px;
                    background: #ccc;
                    border-radius: 50%;
                }
            `}</style>
        </div>
    )
}
