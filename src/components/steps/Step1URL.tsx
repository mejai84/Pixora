'use client'

import { useState } from 'react'
import { Link2, Loader2, Sparkles, Settings, Brain, Globe, Cpu } from 'lucide-react'
import type { ProductInfo } from '@/lib/supabase'

interface Props {
    value: string
    selectedModel: 'gemini' | 'openai' | 'grok'
    apiKeys: {
        gemini?: string
        openai?: string
        grok?: string
    }
    onChange: (url: string) => void
    onModelChange: (model: 'gemini' | 'openai' | 'grok') => void
    onKeysChange: (keys: { gemini?: string, openai?: string, grok?: string }) => void
    onNext: () => void
    onAnalyzed: (productInfo: ProductInfo) => void
}

export default function Step1URL({
    value,
    selectedModel,
    apiKeys,
    onChange,
    onModelChange,
    onKeysChange,
    onNext,
    onAnalyzed
}: Props) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showSettings, setShowSettings] = useState(false)

    const handleAnalyze = async () => {
        if (!value.trim()) { setError('Introduce la URL del producto'); return }
        try {
            new URL(value)
        } catch {
            setError('La URL no es válida. Ejemplo: https://www.amazon.es/producto')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: value,
                    model: selectedModel,
                    apiKeys: apiKeys
                }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error al analizar')
            onAnalyzed(json.productInfo)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al analizar el producto. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    const models = [
        { id: 'openai', name: 'ChatGPT (GPT-4o)', icon: <Brain size={14} />, desc: 'Equilibrado y preciso' },
        { id: 'gemini', name: 'Google Gemini', icon: <Globe size={14} />, desc: 'Rápido y avanzado' },
        { id: 'grok', name: 'xAI Grok', icon: <Cpu size={14} />, desc: 'Creativo y audaz' },
    ]

    return (
        <div className="animate-fade-in pb-10">
            {/* Hero */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 badge badge-purple mb-6">
                    <Sparkles size={14} />
                    Paso 1 de 6
                </div>
                <h1 className="text-4xl font-bold mb-4">
                    ¿Cuál es el producto<br />
                    <span className="gradient-text">que quieres vender?</span>
                </h1>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                    Elige tu IA favorita y pega la URL del producto
                </p>
            </div>

            {/* Selector de Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {models.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => onModelChange(m.id as any)}
                        className={`card p-4 text-left transition-all ${selectedModel === m.id ? 'border-[var(--accent)] ring-2 ring-[var(--accent-glow)] bg-white' : 'opacity-70 hover:opacity-100'}`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`p-1.5 rounded-md ${selectedModel === m.id ? 'bg-[var(--accent)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {m.icon}
                            </div>
                            <span className="font-bold text-sm">{m.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">{m.desc}</p>
                    </button>
                ))}
            </div>

            {/* Input y Configuración */}
            <div className="card p-8 mb-6 relative">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        URL de la página del producto
                    </label>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${showSettings ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-black/5'}`}
                    >
                        <Settings size={14} className={showSettings ? 'animate-spin' : ''} />
                        {showSettings ? 'Guardar Config' : 'Configurar APIs'}
                    </button>
                </div>

                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Link2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="url"
                            className="input-field pl-11 h-12"
                            placeholder="https://www.amazon.es/..."
                            value={value}
                            onChange={e => { onChange(e.target.value); setError('') }}
                            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                        />
                    </div>
                </div>

                {showSettings && (
                    <div className="mt-6 pt-6 border-t space-y-4 animate-fade-in" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tus Propias API Keys (Opcional)</p>
                            <span className="badge badge-purple text-[8px]">Local Storage</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] block mb-1 font-semibold text-gray-500 uppercase">OpenAI Key</label>
                                <input
                                    type="password"
                                    className="input-field py-2 text-xs"
                                    placeholder="sk-..."
                                    value={apiKeys.openai || ''}
                                    onChange={e => onKeysChange({ ...apiKeys, openai: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] block mb-1 font-semibold text-gray-500 uppercase">Gemini Key</label>
                                <input
                                    type="password"
                                    className="input-field py-2 text-xs"
                                    placeholder="AIza..."
                                    value={apiKeys.gemini || ''}
                                    onChange={e => onKeysChange({ ...apiKeys, gemini: e.target.value })}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-[10px] block mb-1 font-semibold text-gray-500 uppercase">Grok (xAI) Key</label>
                                <input
                                    type="password"
                                    className="input-field py-2 text-xs"
                                    placeholder="xai-..."
                                    value={apiKeys.grok || ''}
                                    onChange={e => onKeysChange({ ...apiKeys, grok: e.target.value })}
                                />
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-400 italic">Si dejas estos campos vacíos, se usarán las llaves del sistema por defecto.</p>
                    </div>
                )}

                {error && (
                    <p className="mt-4 text-sm font-medium" style={{ color: 'var(--error)' }}>⚠ {error}</p>
                )}
            </div>

            {/* Ejemplos */}
            <div className="card p-6 mb-8 bg-gray-50/50">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Plataformas compatibles</p>
                <div className="flex flex-wrap gap-2">
                    {['Amazon', 'AliExpress', 'Shopify', 'Mercado Libre', 'WooCommerce', 'Tienda Nube'].map(tag => (
                        <span key={tag} className="badge badge-secondary py-1 text-[10px]">{tag}</span>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    className="btn-primary text-base px-10 py-4 h-14"
                    onClick={handleAnalyze}
                    disabled={loading || !value.trim()}
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Analizando Producto...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Comenzar Análisis
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
