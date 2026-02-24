'use client'

import { AlertCircle, Check, Copy, ExternalLink, FileText, Plus, Target, User, Users, Zap } from 'lucide-react'
import { useState } from 'react'
import type { WizardData } from '@/app/page'

interface Props {
    data: WizardData
    onNewAnalysis: () => void
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
                background: copied ? 'rgba(16,185,129,0.2)' : 'var(--bg-card)',
                color: copied ? 'var(--success)' : 'var(--text-muted)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
            }}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? '¡Copiado!' : 'Copiar'}
        </button>
    )
}

function Section({ icon, title, color, badge, children, copyText }: {
    icon: React.ReactNode
    title: string
    color: string
    badge?: string
    children: React.ReactNode
    copyText?: string
}) {
    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                        <span style={{ color }}>{icon}</span>
                    </div>
                    <span className="font-semibold">{title}</span>
                    {badge && (
                        <span className="badge text-xs" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                            {badge}
                        </span>
                    )}
                </div>
                {copyText && <CopyButton text={copyText} />}
            </div>
            {children}
        </div>
    )
}

export default function ResultPanel({ data, onNewAnalysis }: Props) {
    const CHANNEL_LABELS: Record<string, string> = {
        instagram: '📸 Instagram',
        tiktok: '🎵 TikTok',
        whatsapp: '💬 WhatsApp',
        amazon: '🛒 Amazon',
        email: '📩 Email',
        landing: '🌐 Landing Page',
        presencial: '🤝 Presencial',
    }

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            {/* Header del resultado */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 badge badge-green mb-4">
                    <Check size={14} />
                    Análisis completado y guardado
                </div>
                <h2 className="text-3xl font-bold mb-2">
                    ¡Todo listo para vender
                    <span className="gradient-text"> {data.productInfo?.name}!</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Ángulo: <strong style={{ color: 'var(--accent-light)' }}>{data.chosenAngle?.title}</strong>
                    {data.salesChannel && <> · Canal: <strong style={{ color: 'var(--accent-light)' }}>{CHANNEL_LABELS[data.salesChannel] || data.salesChannel}</strong></>}
                </p>
            </div>

            <div className="space-y-4">
                {/* Enfoque principal */}
                {data.copy?.main_focus && (
                    <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(168,85,247,0.1))', border: '1px solid var(--border-accent)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Target size={16} style={{ color: 'var(--accent-light)' }} />
                                <span className="text-sm font-bold" style={{ color: 'var(--accent-light)' }}>ENFOQUE PRINCIPAL</span>
                            </div>
                            <CopyButton text={data.copy.main_focus} />
                        </div>
                        <p className="font-semibold">{data.copy.main_focus}</p>
                    </div>
                )}

                {/* Descripción */}
                {data.copy?.description && (
                    <Section icon={<FileText size={16} />} title="Descripción del producto" color="#7c3aed" copyText={data.copy.description}>
                        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                            {data.copy.description}
                        </p>
                    </Section>
                )}

                {/* Problemas */}
                {data.copy?.problems && data.copy.problems.length > 0 && (
                    <Section icon={<AlertCircle size={16} />} title="Problemas que resuelve" color="#ef4444"
                        copyText={data.copy.problems.map((p, i) => `${i + 1}. ${p}`).join('\n')}>
                        <ul className="space-y-2">
                            {data.copy.problems.map((p, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                                        {i + 1}
                                    </span>
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}

                {/* Copy adaptado al canal */}
                {data.adaptedCopy && (
                    <Section icon={<Zap size={16} />} title={`Copy para ${CHANNEL_LABELS[data.salesChannel] || data.salesChannel}`} color="#f59e0b"
                        badge="Listo para usar" copyText={data.adaptedCopy}>
                        <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px' }}>
                            {data.adaptedCopy}
                        </div>
                        {data.tips && data.tips.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>💡 CONSEJOS</p>
                                <ul className="space-y-1">
                                    {data.tips.map((tip, i) => (
                                        <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                                            <span style={{ color: 'var(--accent-light)' }}>›</span>{tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Section>
                )}

                {/* Avatar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.copy?.ideal_client && (
                        <Section icon={<User size={16} />} title="Cliente Ideal" color="#10b981" badge="Psicográfico" copyText={data.copy.ideal_client}>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{data.copy.ideal_client}</p>
                        </Section>
                    )}
                    {data.copy?.target_client && (
                        <Section icon={<Users size={16} />} title="Cliente Objetivo" color="#f59e0b" badge="Demográfico" copyText={data.copy.target_client}>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{data.copy.target_client}</p>
                        </Section>
                    )}
                </div>

                {/* Plantilla elegida */}
                {data.template && (
                    <div className="card p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
                            <ExternalLink size={18} style={{ color: 'var(--accent-light)' }} />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Plantilla seleccionada: {data.template.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{data.template.description}</p>
                        </div>
                    </div>
                )}

                {/* Botón nuevo análisis */}
                <div className="flex justify-center pt-4">
                    <button className="btn-primary px-10 py-3" onClick={onNewAnalysis}>
                        <Plus size={18} />
                        Analizar otro producto
                    </button>
                </div>
            </div>
        </div>
    )
}
