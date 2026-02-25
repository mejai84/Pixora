'use client'

import { useEffect, useState } from 'react'
import {
    Home,
    DollarSign,
    Image as ImageIcon,
    Layout,
    Calculator,
    Zap,
    Crown,
    ShoppingCart,
    Gift,
    History,
    LogOut,
    Plus,
    Trash2,
    CheckCircle2,
    Settings,
    Key,
    ArrowLeft
} from 'lucide-react'
import { supabase, type Analysis } from '@/lib/supabase'

interface Props {
    onLoadAnalysis: (analysis: Analysis) => void
    onNewAnalysis: () => void
    activeView: string
    onViewChange: (view: string) => void
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export default function Sidebar({ onLoadAnalysis, onNewAnalysis, activeView, onViewChange }: Props) {
    const [analyses, setAnalyses] = useState<Analysis[]>([])
    const [loading, setLoading] = useState(true)

    const loadAnalyses = async () => {
        const { data } = await supabase
            .from('analyses')
            .select('id, created_at, product_url, product_name, chosen_angle, sales_channel')
            .order('created_at', { ascending: false })
            .limit(10)
        setAnalyses((data || []) as Analysis[])
        setLoading(false)
    }

    useEffect(() => { loadAnalyses() }, [])

    const handleLoad = async (id: string) => {
        const { data } = await supabase.from('analyses').select('*').eq('id', id).single()
        if (data) {
            onViewChange('analyzer')
            onLoadAnalysis(data as Analysis)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        await supabase.from('analyses').delete().eq('id', id)
        setAnalyses(prev => prev.filter(a => a.id !== id))
    }

    return (
        <aside className="w-[320px] max-w-[90vw] flex-shrink-0 flex flex-col bg-white text-gray-700 h-full overflow-y-auto custom-scrollbar border-r border-gray-100 shadow-xl shadow-gray-200/50 z-30">
            {/* Header / Logo */}
            <div className="pl-14 pr-10 py-12 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FF6B6B] flex items-center justify-center p-1 shadow-xl shadow-red-100 rotate-3">
                    <Zap className="text-white w-7 h-7 fill-white" />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-2xl tracking-tighter text-[#1a1a2e] leading-none uppercase italic">Pixora</span>
                    <span className="text-[10px] font-black text-[#FF6B6B] tracking-[0.3em] mt-1.5 opacity-80">BY PARGO ROJO</span>
                </div>
            </div>

            {/* Modo Básico Section - Main focus */}
            <div className="flex-1 pl-12 pr-6 space-y-10">
                <div>
                    <p className="px-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8 opacity-60">SISTEMA CORE</p>
                    <div className="space-y-4">
                        <button
                            onClick={() => onViewChange('analyzer')}
                            className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeView === 'analyzer' ? 'bg-[#1a1a2e] text-white shadow-2xl shadow-slate-900/20 scale-[1.02]' : 'hover:bg-gray-50 text-gray-400 hover:text-[#1a1a2e]'}`}
                        >
                            <Home size={18} className={activeView === 'analyzer' ? 'text-[#FF6B6B]' : ''} />
                            Panel Central
                        </button>
                        <button
                            onClick={() => onViewChange('banners')}
                            className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeView === 'banners' ? 'bg-[#FF6B6B] text-white shadow-2xl shadow-red-500/20 scale-[1.02]' : 'hover:bg-gray-50 text-gray-400 hover:text-[#1a1a2e]'}`}
                        >
                            <ImageIcon size={18} />
                            Banner Studio
                        </button>
                        <button
                            onClick={() => onViewChange('landings')}
                            className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeView === 'landings' ? 'bg-[#FF6B6B] text-white shadow-2xl shadow-red-500/20 scale-[1.02]' : 'hover:bg-gray-50 text-gray-400 hover:text-[#1a1a2e]'}`}
                        >
                            <Layout size={18} />
                            Landing Factory
                        </button>
                        <button
                            onClick={() => onViewChange('simulator')}
                            className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeView === 'simulator' ? 'bg-[#FF6B6B] text-white shadow-2xl shadow-red-500/20 scale-[1.02]' : 'hover:bg-gray-50 text-gray-400 hover:text-[#1a1a2e]'}`}
                        >
                            <Calculator size={18} />
                            Profit Calc
                        </button>
                        <button
                            onClick={() => onViewChange('settings')}
                            className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeView === 'settings' ? 'bg-[#1a1a2e] text-white shadow-2xl shadow-slate-900/20 scale-[1.02]' : 'hover:bg-gray-50 text-gray-400 hover:text-[#1a1a2e] group'}`}
                        >
                            <Settings size={18} className={`${activeView === 'settings' ? 'text-[#FF6B6B]' : 'text-gray-400 group-hover:rotate-45'} transition-transform`} />
                            Ajustes IA
                        </button>
                    </div>
                </div>

                {/* History Section */}
                <div className="pt-10 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 mb-8">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Recientes</span>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            [...Array(2)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-2xl animate-pulse mx-2" />)
                        ) : (
                            analyses.map(analysis => (
                                <div
                                    key={analysis.id}
                                    onClick={() => handleLoad(analysis.id)}
                                    className="group flex items-center justify-between px-6 py-4 rounded-2xl hover:bg-red-50/50 cursor-pointer transition-all border border-transparent hover:border-red-100/50"
                                >
                                    <span className="text-[11px] font-bold uppercase tracking-tight truncate max-w-[170px] text-gray-500 group-hover:text-[#1a1a2e]">
                                        {analysis.product_name || 'Análisis S/N'}
                                    </span>
                                    <Trash2 size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all transform hover:scale-110" onClick={(e) => handleDelete(e, analysis.id)} />
                                </div>
                            ))
                        )}

                        <button
                            onClick={onNewAnalysis}
                            className="w-full mt-8 flex items-center justify-center gap-3 py-5 px-5 rounded-2xl bg-[#1a1a2e] hover:bg-[#2a2a4e] transition-all text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95"
                        >
                            <Plus size={16} className="text-[#FF6B6B]" />
                            Analizar Nuevo
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile / Logout at Bottom */}
            <div className="mt-auto p-12 border-t border-gray-100 bg-gray-50/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-lg font-black text-[#1a1a2e] border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-red-50 w-0 group-hover:w-full transition-all duration-300" />
                            <span className="relative z-10">J</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-black text-[#1a1a2e] tracking-tighter leading-none">Administrador</span>
                            <span className="text-[10px] font-black text-[#FF6B6B] uppercase tracking-widest mt-1.5 opacity-80">VERIFICADO</span>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut()
                            window.location.href = '/login'
                        }}
                        className="p-3.5 rounded-2xl hover:bg-red-500 text-gray-400 hover:text-white transition-all border border-transparent hover:shadow-lg hover:shadow-red-200 group"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>
        </aside>
    )
}
