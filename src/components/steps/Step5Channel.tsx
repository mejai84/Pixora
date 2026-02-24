'use client'

import { useState } from 'react'
import { Loader2, MessageCircle, Radio, Sparkles } from 'lucide-react'
import type { ProductInfo, SalesAngle } from '@/lib/supabase'

interface Copy {
    description: string
    main_focus: string
    problems: string[]
    ideal_client: string
    target_client: string
}

interface Props {
    selected: string
    selectedModel: 'gemini' | 'openai' | 'grok'
    apiKeys: {
        gemini?: string
        openai?: string
        grok?: string
    }
    onSelect: (channel: string) => void
    onNext: () => void
    onPrev: () => void
    onAdapted: (adaptedCopy: string, tips: string[]) => void
    productInfo: ProductInfo | null
    chosenAngle: SalesAngle | null
    copy: Copy | null
}

const CHANNELS = [
    { id: 'instagram', label: 'Instagram', icon: '📸', desc: 'Stories, Reels y Posts' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵', desc: 'Videos cortos y virales' },
    { id: 'whatsapp', label: 'WhatsApp / Telegram', icon: '💬', desc: 'Mensajes directos y grupos' },
    { id: 'amazon', label: 'Amazon / Marketplace', icon: '🛒', desc: 'Tiendas online y marketplaces' },
    { id: 'email', label: 'Email Marketing', icon: '📩', desc: 'Newsletters y secuencias de email' },
    { id: 'landing', label: 'Landing Page / Tienda', icon: '🌐', desc: 'Web propia o tienda online' },
    { id: 'presencial', label: 'Venta Presencial', icon: '🤝', desc: 'Mercadillo, feria o cara a cara' },
]

export default function Step5Channel({ selected, selectedModel, apiKeys, onSelect, onPrev, onAdapted, productInfo, chosenAngle, copy }: Props) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleAdapt = async () => {
        if (!selected) { setError('Selecciona un canal primero'); return }
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/adapt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productInfo,
                    chosenAngle,
                    copy,
                    salesChannel: selected,
                    model: selectedModel,
                    apiKeys: apiKeys
                }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error)
            onAdapted(json.adapted.adapted_copy, json.adapted.tips || [])
        } catch {
            setError('Error adaptando el copy. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 badge badge-purple mb-4">
                    <Radio size={14} />
                    Paso 5 de 6
                </div>
                <h2 className="text-3xl font-bold mb-2">
                    ¿Dónde vas a <span className="gradient-text">vender?</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    La IA adaptará el copy al tono y dialecto exacto de tu canal
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {CHANNELS.map((ch) => {
                    const isSelected = selected === ch.id
                    return (
                        <div
                            key={ch.id}
                            className="card p-4 cursor-pointer transition-all duration-200 flex items-center gap-4"
                            style={{
                                borderColor: isSelected ? 'var(--accent)' : undefined,
                                boxShadow: isSelected ? '0 0 0 2px var(--accent-glow)' : undefined,
                                background: isSelected ? 'var(--bg-card-hover)' : undefined,
                            }}
                            onClick={() => { onSelect(ch.id); setError('') }}
                        >
                            <span className="text-2xl">{ch.icon}</span>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{ch.label}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ch.desc}</p>
                            </div>
                            {isSelected && (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                                    <span className="text-xs text-white">✓</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {error && <p className="mb-4 text-sm" style={{ color: 'var(--error)' }}>⚠ {error}</p>}

            <div className="flex justify-between">
                <button className="btn-secondary" onClick={onPrev}>← Volver</button>
                <button className="btn-primary px-8" onClick={handleAdapt} disabled={loading || !selected}>
                    {loading ? (
                        <><Loader2 size={18} className="animate-spin" />Adaptando copy...</>
                    ) : (
                        <><Sparkles size={18} />Adaptar y ver plantillas →</>
                    )}
                </button>
            </div>
        </div>
    )
}
