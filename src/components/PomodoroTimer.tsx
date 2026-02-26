'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, Timer as TimerIcon, Volume2, VolumeX, Maximize2, Move, Minimize2, Zap, X, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react'

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
    const [isExpanded, setIsExpanded] = useState(false)
    const [position, setPosition] = useState({ x: 24, y: 24 }) // bottom, right offsets
    const [isDragging, setIsDragging] = useState(false)
    const [activeTask, setActiveTask] = useState<any>(null)
    const [startTime, setStartTime] = useState<number | null>(null)
    const [initialTimeLeft, setInitialTimeLeft] = useState(MODES.pomodoro.minutes * 60)

    const dragRef = useRef<HTMLDivElement>(null)
    const dragOffset = useRef({ x: 0, y: 0 })
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const progress = (timeLeft / (MODES[mode].minutes * 60)) * 100

    useEffect(() => {
        if (isActive && startTime) {
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000)
                const newTimeLeft = Math.max(0, initialTimeLeft - elapsed)
                setTimeLeft(newTimeLeft)

                if (newTimeLeft === 0) {
                    handleComplete()
                }
            }, 1000)
        } else {
            if (timerRef.current) clearInterval(timerRef.current)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isActive, startTime, initialTimeLeft])

    // Sync state for pop-out - Use a source ID to avoid loops
    const windowId = useRef(typeof window !== 'undefined' ? Math.random().toString(36).substring(7) : 'main').current

    useEffect(() => {
        const state = {
            mode,
            isActive,
            startTime,
            initialTimeLeft,
            lastUpdate: Date.now(),
            source: windowId
        }
        localStorage.setItem('pixora_pomodoro_sync', JSON.stringify(state))
    }, [isActive, mode, startTime, initialTimeLeft])

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }

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

        const handleSync = () => {
            const saved = localStorage.getItem('pixora_pomodoro_sync')
            if (saved) {
                try {
                    const state = JSON.parse(saved)
                    // Don't sync with our own updates
                    if (state.source === windowId) return

                    // Check if the update is fresh
                    if (Date.now() - state.lastUpdate < 3000) {
                        setMode(state.mode)
                        setIsActive(state.isActive)
                        setStartTime(state.startTime)
                        setInitialTimeLeft(state.initialTimeLeft)
                        // TimeLeft will be recalculated by the interval or the next render
                    }
                } catch (e) { }
            }
        }

        checkTask()
        handleSync()
        window.addEventListener('pixora_task_focus', checkTask)
        window.addEventListener('storage', (e) => {
            if (e.key === 'pixora_active_task') checkTask()
            if (e.key === 'pixora_pomodoro_sync') handleSync()
        })

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
            setStartTime(Date.now())
            setInitialTimeLeft(timeLeft)
            playSound('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3')
        } else {
            setStartTime(null)
        }

        if (newActive && !isFloating) {
            setIsFloating(true)
        }
    }

    const handlePopOut = async () => {
        // Document Picture-in-Picture (Available in Chrome/Edge 116+)
        if ('documentPictureInPicture' in window) {
            try {
                const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
                    width: 250,
                    height: 350,
                });

                // Copy styles to PIP window
                [...document.styleSheets].forEach((styleSheet) => {
                    try {
                        const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                        const style = document.createElement('style');
                        style.textContent = cssRules;
                        pipWindow.document.head.appendChild(style);
                    } catch (e) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.type = styleSheet.type;
                        link.media = styleSheet.media.toString();
                        link.href = styleSheet.href!;
                        pipWindow.document.head.appendChild(link);
                    }
                });

                // Set title and navigate
                pipWindow.document.title = "Pixora Focus";
                pipWindow.location.href = '/pomodoro-popout';
                return;
            } catch (err) {
                console.error("PIP failed, falling back to window.open", err);
            }
        }

        // Fallback: Standard window.open
        const w = 270;
        const h = 330;
        const left = (window.screen.width / 2) - (w / 2);
        const top = (window.screen.height / 2) - (h / 2);
        window.open('/pomodoro-popout', 'Pomodoro', `width=${w},height=${h},left=${left},top=${top},menubar=no,status=no,toolbar=no`);
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

    // COLLAPSED SIDEBAR VIEW
    if (!isFloating && !isExpanded) {
        return (
            <div style={{ padding: '0 8px' }}>
                <button
                    onClick={() => setIsExpanded(true)}
                    className="sidebar-item"
                    style={{
                        justifyContent: 'space-between',
                        background: isActive ? '#fff5f5' : 'transparent',
                        borderLeft: isActive ? '3px solid #ff4d4d' : 'none',
                        width: '100%',
                        margin: '2px 0',
                        padding: '10px 12px',
                        borderRadius: 8
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TimerIcon size={16} color={isActive ? '#ff4d4d' : '#666'} />
                        <span style={{
                            color: isActive ? '#ff4d4d' : '#666',
                            fontWeight: isActive ? 700 : 500,
                            fontSize: 13
                        }}>
                            Pomodoro {isActive && `(${minutes}:${seconds.toString().padStart(2, '0')})`}
                        </span>
                    </div>
                    <ChevronRight size={14} color="#ccc" />
                </button>
            </div>
        )
    }

    return (
        <div
            ref={dragRef}
            style={{
                background: isFloating ? 'white' : '#fafafa',
                borderRadius: isFloating ? 20 : 0,
                padding: isFloating ? (isCompact ? 12 : 20) : '16px',
                border: isFloating ? '1px solid #eee' : 'none',
                borderBottom: isFloating ? 'none' : '1px solid #eee',
                boxShadow: isFloating ? '0 12px 40px rgba(0,0,0,0.18)' : 'none',
                margin: 0,
                position: isFloating ? 'fixed' : 'relative',
                bottom: isFloating ? Math.max(12, position.y) : 'auto',
                right: isFloating ? Math.max(12, position.x) : 'auto',
                zIndex: 9999,
                width: isFloating ? (isCompact ? 140 : 250) : '100%',
                transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                userSelect: isDragging ? 'none' : 'auto',
                cursor: isDragging ? 'grabbing' : 'auto',
                overflow: isFloating ? 'hidden' : 'visible'
            }}
        >
            {/* Header when in Sidebar - Collapse button */}
            {!isFloating && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TimerIcon size={14} color="#ff4d4d" />
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#333' }}>POMODORO</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePopOut() }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
                            title="Ventana independiente"
                        >
                            <ExternalLink size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsFloating(true) }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
                            title="Flotar en dashboard"
                        >
                            <Maximize2 size={14} />
                        </button>
                        <button
                            onClick={() => setIsExpanded(false)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 2, marginLeft: 4 }}
                            title="Contraer"
                        >
                            <ChevronDown size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Active Task */}
            {activeTask && !isCompact && (
                <div style={{
                    background: '#f0faf0',
                    borderRadius: 12,
                    padding: '8px 12px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #4CAF5020'
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

            {/* Header / Drag Handle (Only floating) */}
            {isFloating && (
                <div
                    onMouseDown={handleMouseDown}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: isCompact ? 0 : 12,
                        cursor: 'grab'
                    }}
                >
                    {!isCompact && (
                        <div style={{ display: 'flex', gap: 2, flex: 1, minWidth: 0 }}>
                            {(Object.keys(MODES) as Mode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => changeMode(m)}
                                    style={{
                                        flex: 1,
                                        padding: '4px 2px',
                                        borderRadius: 6,
                                        fontSize: 8,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: mode === m ? MODES[m].bg : 'transparent',
                                        color: mode === m ? MODES[m].color : '#999',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {MODES[m].label.charAt(0)}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 2, marginLeft: 'auto', alignItems: 'center', flexShrink: 0 }}>
                        {/* Drag handle button (the "cross") */}
                        <div
                            style={{
                                padding: '4px',
                                color: isDragging ? '#4CAF50' : '#cbd5e1',
                                cursor: 'grab',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 6,
                                background: isDragging ? '#f0faf0' : 'transparent',
                                transition: 'all 0.2s'
                            }}
                            title="Arrastrar pomodoro"
                        >
                            <Move size={14} />
                        </div>

                        {/* Independent window (External) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePopOut() }}
                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6 }}
                            className="hover:bg-gray-100"
                            title="Abrir en ventana independiente (Siempre visible)"
                        >
                            <ExternalLink size={14} />
                        </button>

                        {/* Compact mode toggle */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsCompact(!isCompact) }}
                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6 }}
                            className="hover:bg-gray-100"
                            title={isCompact ? "Expandir" : "Contraer"}
                        >
                            {isCompact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                        </button>

                        {/* Back to sidebar (Close floating) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsFloating(false); setIsCompact(false); }}
                            style={{
                                background: '#fee2e2',
                                border: 'none',
                                borderRadius: 6,
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 4
                            }}
                            title="Minimizar a la barra lateral"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Mode selector when in sidebar */}
            {!isFloating && !isCompact && (
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                    {(Object.keys(MODES) as Mode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => changeMode(m)}
                            style={{
                                flex: 1,
                                padding: '6px 4px',
                                borderRadius: 8,
                                fontSize: 8,
                                fontWeight: 800,
                                border: 'none',
                                cursor: 'pointer',
                                background: mode === m ? MODES[m].bg : 'white',
                                color: mode === m ? MODES[m].color : '#999',
                                borderStyle: 'solid',
                                borderWidth: 1,
                                borderColor: mode === m ? MODES[m].color + '30' : '#eee'
                            }}
                        >
                            {MODES[m].label.toUpperCase()}
                        </button>
                    ))}
                </div>
            )}

            {/* Timer Display */}
            <div style={{
                position: 'relative',
                height: isFloating ? (isCompact ? 60 : 100) : (isCompact ? 60 : 90),
                display: 'flex',
                flexDirection: isCompact && isFloating ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: isCompact && isFloating ? 'flex-start' : 'center',
                margin: isCompact && isFloating ? 0 : '0 auto',
                gap: 12
            }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <svg width={isCompact ? 50 : (isFloating ? 90 : 80)} height={isCompact ? 50 : (isFloating ? 90 : 80)} style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                            cx={isCompact ? 25 : (isFloating ? 45 : 40)} cy={isCompact ? 25 : (isFloating ? 45 : 40)} r={isCompact ? 22 : (isFloating ? 42 : 36)}
                            fill="none"
                            stroke="#f0f0f0"
                            strokeWidth="3"
                        />
                        <circle
                            cx={isCompact ? 25 : (isFloating ? 45 : 40)} cy={isCompact ? 25 : (isFloating ? 45 : 40)} r={isCompact ? 22 : (isFloating ? 42 : 36)}
                            fill="none"
                            stroke={MODES[mode].color}
                            strokeWidth="3"
                            strokeDasharray={isCompact ? 138 : (isFloating ? 264 : 226)}
                            strokeDashoffset={(isCompact ? 138 : (isFloating ? 264 : 226)) - ((isCompact ? 138 : (isFloating ? 264 : 226)) * progress) / 100}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute',
                        fontSize: isCompact ? 12 : 22,
                        fontWeight: 950,
                        color: '#1a1a2e',
                        fontVariantNumeric: 'tabular-nums',
                        zIndex: 1
                    }}>
                        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </div>
                </div>

                {!isFloating && !isCompact && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFloating(true); setIsExpanded(false) }}
                        style={{ position: 'absolute', top: 0, right: 0, border: 'none', background: 'none', color: '#ccc', cursor: 'pointer' }}
                    >
                        <Maximize2 size={12} />
                    </button>
                )}
            </div>

            {/* Controls */}
            {(!isCompact || !isFloating) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: isFloating ? 0 : 10 }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4 }}
                        >
                            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                    </div>

                    <button
                        onClick={toggleTimer}
                        style={{
                            width: 40,
                            height: 40,
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
                        {isActive ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" style={{ marginLeft: 2 }} />}
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
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
