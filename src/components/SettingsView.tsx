'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, CheckCircle2, Settings, Trash2, ArrowLeft, Zap, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SettingsView() {
    const [apiConfigs, setApiConfigs] = useState<{ id: string, name: string, chatgpt: string, gemini: string, grok: string, active: boolean }[]>([])
    const [editingConfig, setEditingConfig] = useState<{ id: string, name: string, chatgpt: string, gemini: string, grok: string, active: boolean } | null>(null)
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchConfigs = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('user_api_configs')
            .select('*')
            .order('created_at', { ascending: true })

        if (data && data.length > 0) {
            setApiConfigs(data)
        } else {
            // Migración desde localStorage si no hay nada en la DB
            const savedConfigs = localStorage.getItem('pixora_api_configs')
            const savedKeys = localStorage.getItem('pixora_api_keys')

            if (savedConfigs) {
                const localConfigs = JSON.parse(savedConfigs)
                const toInsert = localConfigs.map((c: any) => ({
                    user_id: user.id,
                    name: c.name,
                    chatgpt: c.chatgpt,
                    gemini: c.gemini,
                    grok: c.grok,
                    active: c.active
                }))
                const { data: inserted } = await supabase.from('user_api_configs').insert(toInsert).select()
                if (inserted) setApiConfigs(inserted)
            } else if (savedKeys) {
                const keys = JSON.parse(savedKeys)
                const defaultConfig = {
                    user_id: user.id,
                    name: 'Principal (Migrado)',
                    chatgpt: keys.chatgpt || '',
                    gemini: keys.gemini || '',
                    grok: keys.grok || '',
                    active: true
                }
                const { data: inserted } = await supabase.from('user_api_configs').insert([defaultConfig]).select()
                if (inserted) setApiConfigs(inserted)
            } else {
                // Crear configuración por defecto si nada existe
                const defaultConfig = {
                    user_id: user.id,
                    name: 'Principal',
                    chatgpt: '',
                    gemini: '',
                    grok: '',
                    active: true
                }
                const { data: inserted } = await supabase.from('user_api_configs').insert([defaultConfig]).select()
                if (inserted) setApiConfigs(inserted)
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchConfigs()
    }, [])

    const handleSaveConfigs = async (config: any) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (isAddingNew) {
            const { error } = await supabase.from('user_api_configs').insert([{
                ...config,
                user_id: user.id,
                id: undefined // Dejar que la DB genere el UUID
            }])
            if (error) alert('Error al guardar: ' + error.message)
        } else {
            const { error } = await supabase.from('user_api_configs').update({
                name: config.name,
                chatgpt: config.chatgpt,
                gemini: config.gemini,
                grok: config.grok,
                active: config.active
            }).eq('id', config.id)
            if (error) alert('Error al actualizar: ' + error.message)
        }
        fetchConfigs()
    }

    const toggleActive = async (id: string) => {
        // Desactivar todos primero
        await supabase.from('user_api_configs').update({ active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
        // Activar el seleccionado
        await supabase.from('user_api_configs').update({ active: true }).eq('id', id)

        // Actualizar localStorage para compatibilidad inmediata (opcional)
        const config = apiConfigs.find(c => c.id === id)
        if (config) {
            localStorage.setItem('pixora_api_keys', JSON.stringify({
                chatgpt: config.chatgpt,
                gemini: config.gemini,
                grok: config.grok
            }))
        }
        window.dispatchEvent(new Event('storage'))
        fetchConfigs()
    }

    const deleteConfig = async (id: string) => {
        if (apiConfigs.length <= 1) {
            alert('No puedes eliminar todas las configuraciones')
            return
        }
        const { error } = await supabase.from('user_api_configs').delete().eq('id', id)
        if (error) alert('Error al eliminar')
        fetchConfigs()
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-20">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center animate-spin text-blue-600">
                    <Zap size={24} />
                </div>
            </div>
        )
    }

    if (isAddingNew || editingConfig) {
        return (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 animate-in slide-in-from-right-4 duration-300">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => { setIsAddingNew(false); setEditingConfig(null); }}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#111827] transition-all text-[10px] font-black uppercase tracking-widest mb-10"
                    >
                        <ArrowLeft size={14} /> Volver a Configuración
                    </button>

                    <h1 className="text-4xl font-black text-[#111827] mb-2 uppercase tracking-tighter italic">
                        {isAddingNew ? 'Nueva Configuración' : 'Editar Perfil'}
                    </h1>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-12 flex items-center gap-2">
                        <Key size={14} className="text-blue-500" /> Gestiona tus credenciales de IA
                    </p>

                    <div className="bg-gray-50/50 border border-gray-100 rounded-[40px] p-12 space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Perfil</label>
                            <input
                                value={editingConfig?.name || ''}
                                onChange={(e) => setEditingConfig(prev => ({ ...(prev || { id: '', chatgpt: '', gemini: '', grok: '', active: false }), name: e.target.value }))}
                                placeholder="Ej: Producción, Testing, Personal..."
                                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm font-bold text-[#111827] outline-none focus:border-blue-500/20 transition-all shadow-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ChatGPT API Key</label>
                                <input
                                    type="password"
                                    value={editingConfig?.chatgpt || ''}
                                    onChange={(e) => setEditingConfig(prev => ({ ...(prev || { id: '', name: '', gemini: '', grok: '', active: false }), chatgpt: e.target.value }))}
                                    placeholder="sk-..."
                                    className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm font-bold text-[#111827] outline-none focus:border-blue-500/20 transition-all shadow-sm"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gemini API Key</label>
                                <input
                                    type="password"
                                    value={editingConfig?.gemini || ''}
                                    onChange={(e) => setEditingConfig(prev => ({ ...(prev || { id: '', name: '', chatgpt: '', grok: '', active: false }), gemini: e.target.value }))}
                                    placeholder="AI..."
                                    className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm font-bold text-[#111827] outline-none focus:border-blue-500/20 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Grok API Key (X.AI)</label>
                            <input
                                type="password"
                                value={editingConfig?.grok || ''}
                                onChange={(e) => setEditingConfig(prev => ({ ...(prev || { id: '', name: '', chatgpt: '', gemini: '', active: false }), grok: e.target.value }))}
                                placeholder="xai-..."
                                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm font-bold text-[#111827] outline-none focus:border-blue-500/20 transition-all shadow-sm"
                            />
                        </div>

                        <button
                            onClick={() => {
                                if (!editingConfig?.name) return alert('El nombre es obligatorio')
                                handleSaveConfigs(editingConfig)
                                setIsAddingNew(false)
                                setEditingConfig(null)
                            }}
                            className="w-full py-6 rounded-3xl bg-[#111827] text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.01] active:scale-95 transition-all mt-6"
                        >
                            Guardar Configuración
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 animate-in fade-in duration-500 bg-white">
            <div className="max-w-5xl mx-auto space-y-16">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-[#111827] tracking-tighter uppercase italic">Configuración</h1>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <Settings size={14} className="text-blue-500" /> Personaliza tu experiencia en Pixora
                        </p>
                    </div>
                </div>

                {/* API Section */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                <Key size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#111827] uppercase tracking-tight">API Keys</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modelos de IA activos</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsAddingNew(true);
                                setEditingConfig({ id: '', name: '', chatgpt: '', gemini: '', grok: '', active: false });
                            }}
                            className="px-6 py-3 rounded-xl bg-gray-50 border border-gray-100 text-[#111827] font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2"
                        >
                            <Plus size={14} /> Nueva API
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {apiConfigs.map(config => (
                            <div key={config.id} className={`group relative p-8 rounded-[32px] border transition-all ${config.active ? 'bg-blue-50/30 border-blue-200 shadow-lg shadow-blue-500/5' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}>
                                {config.active && (
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-4 border-white z-10">
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div onClick={() => toggleActive(config.id)} className="cursor-pointer">
                                        <h3 className="text-lg font-black text-[#111827] uppercase tracking-tight mb-2 group-hover:text-blue-600 transition-colors">{config.name}</h3>
                                        <div className="flex gap-2">
                                            {config.chatgpt && <span className="text-[9px] font-black bg-white border border-gray-100 px-2 py-1 rounded-lg text-blue-600 shadow-sm">GPT-4</span>}
                                            {config.gemini && <span className="text-[9px] font-black bg-white border border-gray-100 px-2 py-1 rounded-lg text-purple-600 shadow-sm">GEMINI</span>}
                                            {config.grok && <span className="text-[9px] font-black bg-white border border-gray-100 px-2 py-1 rounded-lg text-black shadow-sm">GROK</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                        <button
                                            onClick={() => setEditingConfig(config)}
                                            className="flex-1 py-3 rounded-xl bg-gray-50 text-[10px] font-black uppercase text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => deleteConfig(config.id)}
                                            className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Info Card */}
                <section className="p-12 rounded-[48px] bg-gray-50/50 border border-gray-100 border-dashed flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center text-gray-200">
                        <Plus size={40} />
                    </div>
                    <div className="max-w-md">
                        <h3 className="text-xl font-black text-[#111827] uppercase tracking-tight leading-none mb-3">Expande tu ecosistema</h3>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Estamos trabajando en nuevos módulos: Gestión de equipos, analíticas avanzadas y facturación automatizada.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-blue-300" />
                        <div className="w-2 h-2 rounded-full bg-blue-100" />
                    </div>
                </section>
            </div>
        </div>
    )
}
