'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Target, Zap } from 'lucide-react'
import type { ProductInfo, SalesAngle } from '@/lib/supabase'

interface Props {
    angles: SalesAngle[]
    selected: SalesAngle | null
    selectedModel: 'gemini' | 'openai' | 'grok'
    apiKeys: {
        gemini?: string
        openai?: string
        grok?: string
    }
    onSelect: (angle: SalesAngle) => void
    onNext: () => void
    onPrev: () => void
    onCopyGenerated: (copy: { description: string; main_focus: string; problems: string[]; ideal_client: string; target_client: string }) => void
    productInfo: ProductInfo | null
}

const EMOTION_COLORS: Record<string, string> = {
    miedo: '#ef4444',
    deseo: '#f59e0b',
    esperanza: '#10b981',
    urgencia: '#f97316',
    orgullo: '#8b5cf6',
    default: '#7c3aed',
}

export default function Step3Angles({ angles, selected, selectedModel, apiKeys, onSelect, onPrev, onCopyGenerated, productInfo }: Props) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleGenCopy = async () => {
        if (!selected) { setError('Elige un ángulo de venta primero'); return }
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productInfo,
                    chosenAngle: selected,
                    model: selectedModel,
                    apiKeys: apiKeys
                }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error)
            onCopyGenerated(json.copy)
        } catch {
            setError('Error generando el copy. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 badge badge-purple mb-4">
                    <Target size={14} />
                    Paso 3 de 6
                </div>
                <h2 className="text-3xl font-bold mb-2">
                    Elige tu <span className="gradient-text">ángulo de venta</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Cada ángulo activa emociones diferentes. Elige el que mejor conecte con tu cliente.
                </p>
            </div>

            <div className="space-y-3 mb-8">
                {angles.map((angle) => {
                    const isSelected = selected?.id === angle.id
                    const emotionColor = EMOTION_COLORS[angle.emotion?.toLowerCase()] || EMOTION_COLORS.default

                    return (
                        <div
                            key={angle.id}
                            className="card p-5 cursor-pointer transition-all duration-200"
                            style={{
                                borderColor: isSelected ? 'var(--accent)' : undefined,
                                background: isSelected ? 'var(--bg-card-hover)' : undefined,
                                boxShadow: isSelected ? '0 0 0 2px var(--accent-glow)' : undefined,
                            }}
                            onClick={() => onSelect(angle)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div
                                        className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 transition-all"
                                        style={{
                                            borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                                            background: isSelected ? 'var(--accent)' : 'transparent',
                                        }}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-bold text-base">{angle.title}</h3>
                                            <span
                                                className="badge text-xs"
                                                style={{
                                                    background: `${emotionColor}20`,
                                                    color: emotionColor,
                                                    border: `1px solid ${emotionColor}40`,
                                                }}
                                            >
                                                {angle.emotion}
                                            </span>
                                        </div>
                                        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{angle.description}</p>
                                        <div className="card p-3" style={{ borderColor: isSelected ? 'var(--border-accent)' : undefined }}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Zap size={12} style={{ color: 'var(--accent-light)' }} />
                                                <span className="text-xs font-medium" style={{ color: 'var(--accent-light)' }}>Hook</span>
                                            </div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>"{angle.hook}"</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {error && <p className="mb-4 text-sm" style={{ color: 'var(--error)' }}>⚠ {error}</p>}

            <div className="flex justify-between">
                <button className="btn-secondary" onClick={onPrev}>← Volver</button>
                <button className="btn-primary px-8" onClick={handleGenCopy} disabled={loading || !selected}>
                    {loading ? (
                        <><Loader2 size={18} className="animate-spin" />Generando copy...</>
                    ) : (
                        <><Sparkles size={18} />Generar descripción y avatar</>
                    )}
                </button>
            </div>
        </div>
    )
}
