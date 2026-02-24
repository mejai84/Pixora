'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Package, Sparkles, Tag, Users, Zap } from 'lucide-react'
import type { ProductInfo, SalesAngle } from '@/lib/supabase'

interface Props {
    productInfo: ProductInfo | null
    selectedModel: 'gemini' | 'openai' | 'grok'
    apiKeys: {
        gemini?: string
        openai?: string
        grok?: string
    }
    onNext: () => void
    onPrev: () => void
    onAnglesGenerated: (angles: SalesAngle[]) => void
}

export default function Step2Analysis({ productInfo, selectedModel, apiKeys, onNext, onPrev, onAnglesGenerated }: Props) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleGenerateAngles = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/angles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productInfo,
                    model: selectedModel,
                    apiKeys: apiKeys
                }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error)
            onAnglesGenerated(json.angles)
        } catch {
            setError('Error generando ángulos de venta. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    if (!productInfo) return null

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 badge badge-green mb-4">
                    <CheckCircle2 size={14} />
                    Producto analizado
                </div>
                <h2 className="text-3xl font-bold mb-2">
                    Aquí está lo que encontré sobre
                    <span className="gradient-text"> "{productInfo.name}"</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>Revisa la información y continuamos con los ángulos de venta</p>
            </div>

            {/* Info cards */}
            <div className="space-y-4 mb-8">

                {/* Resumen */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
                            <Package size={16} style={{ color: 'var(--accent-light)' }} />
                        </div>
                        <span className="font-semibold">Descripción general</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{productInfo.summary}</p>
                    {productInfo.price && (
                        <div className="mt-3 inline-flex items-center gap-2 badge badge-purple">
                            <Tag size={12} />
                            {productInfo.price}
                        </div>
                    )}
                </div>

                {/* Grid de features y benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
                                <Zap size={16} style={{ color: 'var(--accent-light)' }} />
                            </div>
                            <span className="font-semibold">Características</span>
                        </div>
                        <ul className="space-y-2">
                            {productInfo.features?.map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="mt-0.5" style={{ color: 'var(--accent-light)' }}>›</span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
                                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                            </div>
                            <span className="font-semibold">Beneficios</span>
                        </div>
                        <ul className="space-y-2">
                            {productInfo.benefits?.map((b, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="mt-0.5" style={{ color: 'var(--success)' }}>✓</span>
                                    {b}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Público y Comercial */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
                                <Users size={16} style={{ color: 'var(--success)' }} />
                            </div>
                            <span className="font-semibold">Público objetivo</span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{productInfo.target_audience}</p>
                    </div>

                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)' }}>
                                <Tag size={16} style={{ color: 'var(--warning)' }} />
                            </div>
                            <span className="font-semibold">Precio y Envío</span>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm">
                                <span className="font-medium">Precio:</span> {productInfo.price || 'No especificado'}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Envío:</span> {productInfo.shipping || 'No especificado'}
                            </p>
                            {productInfo.colors && productInfo.colors.length > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-50">Colores:</span>
                                    {productInfo.colors.map((c, i) => (
                                        <span key={i} className="badge badge-secondary text-[10px]">{c}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Especificaciones Técnicas (Zepol Style) */}
                {productInfo.specifications && Object.keys(productInfo.specifications).length > 0 && (
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
                                <Package size={16} style={{ color: 'var(--accent-light)' }} />
                            </div>
                            <span className="font-semibold">Detalles técnicos</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {Object.entries(productInfo.specifications).map(([key, value], i) => (
                                <div key={i}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">{key}</p>
                                    <p className="text-sm font-medium">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {error && <p className="mb-4 text-sm" style={{ color: 'var(--error)' }}>⚠ {error}</p>}

            <div className="flex justify-between">
                <button className="btn-secondary" onClick={onPrev}>← Volver</button>
                <button className="btn-primary px-8" onClick={handleGenerateAngles} disabled={loading}>
                    {loading ? (
                        <><Loader2 size={18} className="animate-spin" />Generando ángulos...</>
                    ) : (
                        <><Sparkles size={18} />Ver ángulos de venta</>
                    )}
                </button>
            </div>
        </div>
    )
}
