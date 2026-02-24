'use client'

import { AlertCircle, FileText, Target, User, Users } from 'lucide-react'
import type { SalesAngle } from '@/lib/supabase'

interface Copy {
    description: string
    main_focus: string
    problems: string[]
    ideal_client: string
    target_client: string
}

interface Props {
    copy: Copy | null
    chosenAngle: SalesAngle | null
    onNext: () => void
    onPrev: () => void
}

export default function Step4Copy({ copy, chosenAngle, onNext, onPrev }: Props) {
    if (!copy) return null

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 badge badge-green mb-4">
                    <FileText size={14} />
                    Paso 4 de 6
                </div>
                <h2 className="text-3xl font-bold mb-2">
                    Copy generado con el ángulo
                    <span className="gradient-text"> "{chosenAngle?.title}"</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Revisa la descripción, los problemas que resuelve y el avatar de tu cliente ideal
                </p>
            </div>

            {/* Enfoque principal — destacado */}
            <div className="mb-6 p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))', border: '1px solid var(--border-accent)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <Target size={16} style={{ color: 'var(--accent-light)' }} />
                    <span className="text-sm font-bold" style={{ color: 'var(--accent-light)' }}>ENFOQUE PRINCIPAL DE VENTA</span>
                </div>
                <p className="text-lg font-semibold">{copy.main_focus}</p>
            </div>

            <div className="space-y-4 mb-8">
                {/* Descripción del producto */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
                            <FileText size={16} style={{ color: 'var(--accent-light)' }} />
                        </div>
                        <span className="font-semibold">Descripción optimizada del producto</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                        {copy.description}
                    </p>
                </div>

                {/* Problemas que resuelve */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                            <AlertCircle size={16} style={{ color: '#ef4444' }} />
                        </div>
                        <span className="font-semibold">Problemas que resuelve</span>
                    </div>
                    <ul className="space-y-3">
                        {copy.problems?.map((problem, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                                    {i + 1}
                                </span>
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{problem}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Grid cliente ideal y objetivo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
                                <User size={16} style={{ color: 'var(--success)' }} />
                            </div>
                            <span className="font-semibold">Cliente Ideal</span>
                            <span className="badge badge-green text-xs">Psicográfico</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{copy.ideal_client}</p>
                    </div>
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)' }}>
                                <Users size={16} style={{ color: '#f59e0b' }} />
                            </div>
                            <span className="font-semibold">Cliente Objetivo</span>
                            <span className="badge text-xs" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>Demográfico</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{copy.target_client}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between">
                <button className="btn-secondary" onClick={onPrev}>← Volver</button>
                <button className="btn-primary px-8" onClick={onNext}>
                    Continuar — Elegir canal →
                </button>
            </div>
        </div>
    )
}
