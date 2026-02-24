'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, History, Plus, Trash2 } from 'lucide-react'
import { supabase, type Analysis } from '@/lib/supabase'

interface Props {
    onLoadAnalysis: (analysis: Analysis) => void
    onNewAnalysis: () => void
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Sidebar({ onLoadAnalysis, onNewAnalysis }: Props) {
    const [analyses, setAnalyses] = useState<Analysis[]>([])
    const [loading, setLoading] = useState(true)

    const loadAnalyses = async () => {
        const { data } = await supabase
            .from('analyses')
            .select('id, created_at, product_url, product_name, chosen_angle, sales_channel')
            .order('created_at', { ascending: false })
            .limit(30)
        setAnalyses((data || []) as Analysis[])
        setLoading(false)
    }

    useEffect(() => { loadAnalyses() }, [])

    const handleLoad = async (id: string) => {
        const { data } = await supabase.from('analyses').select('*').eq('id', id).single()
        if (data) onLoadAnalysis(data as Analysis)
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        await supabase.from('analyses').delete().eq('id', id)
        setAnalyses(prev => prev.filter(a => a.id !== id))
    }

    return (
        <aside className="w-[280px] max-w-[85vw] flex-shrink-0 flex flex-col border-r h-full sidebar-scroll glass" style={{ borderColor: 'var(--border)' }}>
            {/* Nueva análisis */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <button className="btn-primary w-full justify-center text-sm py-2.5" onClick={onNewAnalysis}>
                    <Plus size={16} />
                    Nuevo análisis
                </button>
            </div>

            {/* Historial */}
            <div className="flex items-center gap-2 px-4 py-3">
                <History size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Historial</span>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton h-16 rounded-lg" />
                    ))
                ) : analyses.length === 0 ? (
                    <div className="text-center py-8">
                        <Clock size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Aún no tienes análisis guardados
                        </p>
                    </div>
                ) : (
                    analyses.map(analysis => (
                        <div
                            key={analysis.id}
                            className="group card p-3 cursor-pointer transition-all duration-200 relative"
                            onClick={() => handleLoad(analysis.id)}
                        >
                            <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {analysis.product_name || 'Producto sin nombre'}
                                    </p>
                                    {analysis.chosen_angle && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <CheckCircle2 size={10} style={{ color: 'var(--accent-light)' }} />
                                            <span className="text-xs truncate" style={{ color: 'var(--accent-light)' }}>
                                                {analysis.chosen_angle}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                        {formatDate(analysis.created_at)}
                                    </p>
                                </div>
                                <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                                    style={{ color: 'var(--error)' }}
                                    onClick={e => handleDelete(e, analysis.id)}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    )
}
