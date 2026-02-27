'use client'

import React, { useState, useEffect } from 'react'
import {
    CheckCircle2,
    Circle,
    Plus,
    Trash2,
    Zap,
    TrendingUp,
    Layout,
    Search,
    Activity,
    DollarSign,
    Target,
    Clock,
    ChevronRight,
    AlertCircle,
    Copy,
    Sparkles,
    MousePointer2,
    BarChart3
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Tab = 'checklist' | 'financial' | 'kanban' | 'marketing' | 'spy'

export default function ProductivityView() {
    const [activeTab, setActiveTab] = useState<Tab>('checklist')
    const [tasks, setTasks] = useState<any[]>([])
    const [pipelineAssets, setPipelineAssets] = useState<any[]>([])
    const [competitors, setCompetitors] = useState<any[]>([])
    const [analyses, setAnalyses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: tasksData } = await supabase.from('productivity_tasks').select('*').order('created_at', { ascending: false })
        const { data: pipelineData } = await supabase.from('creative_pipeline').select('*').order('created_at', { ascending: true })
        const { data: competitorsData } = await supabase.from('competitor_monitor').select('*').order('created_at', { ascending: false })
        const { data: analysesData } = await supabase.from('analyses').select('id, product_name').order('created_at', { ascending: false })

        if (tasksData) setTasks(tasksData)
        if (pipelineData) setPipelineAssets(pipelineData)
        if (competitorsData) setCompetitors(competitorsData)
        if (analysesData) setAnalyses(analysesData)
        setLoading(false)
    }

    return (
        <div className="main-scroll custom-scrollbar" style={{ padding: 32, animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a2e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Activity color="#4CAF50" size={32} />
                    Hub de Productividad AI
                </h1>
                <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>
                    Optimiza tu tiempo, controla tus finanzas y escala tu marketing en un solo lugar.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 32,
                background: '#f8fafc',
                padding: 6,
                borderRadius: 16,
                width: 'fit-content',
                border: '1px solid #f1f5f9'
            }}>
                {[
                    { id: 'checklist', label: 'Checklist', icon: CheckCircle2 },
                    { id: 'financial', label: 'Finanzas', icon: DollarSign },
                    { id: 'kanban', label: 'Pipeline', icon: Layout },
                    { id: 'marketing', label: 'Marketing', icon: Zap },
                    { id: 'spy', label: 'Espía', icon: Search },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as Tab)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 18px',
                            borderRadius: 12,
                            fontSize: 13,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            background: activeTab === t.id ? 'white' : 'transparent',
                            color: activeTab === t.id ? '#1a1a2e' : '#94a3b8',
                            boxShadow: activeTab === t.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <t.icon size={16} color={activeTab === t.id ? '#4CAF50' : '#94a3b8'} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ animation: 'slideUp 0.4s ease-out' }}>
                {activeTab === 'checklist' && <Checklist tasks={tasks} setTasks={setTasks} />}
                {activeTab === 'financial' && <FinancialCommand />}
                {activeTab === 'kanban' && <CreativePipeline assets={pipelineAssets} setAssets={setPipelineAssets} />}
                {activeTab === 'marketing' && <AIMarketingAccelerator analyses={analyses} />}
                {activeTab === 'spy' && <CompetitorSpy competitors={competitors} setCompetitors={setCompetitors} />}
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}

function Checklist({ tasks, setTasks }: { tasks: any[], setTasks: any }) {
    const [newTask, setNewTask] = useState('')

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTask.trim()) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('productivity_tasks')
            .insert({ user_id: user.id, title: newTask, status: 'pending' })
            .select()
            .single()

        if (data) {
            setTasks([data, ...tasks])
            setNewTask('')
        }
    }

    const toggleTask = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
        const { error } = await supabase.from('productivity_tasks').update({ status: newStatus }).eq('id', id)
        if (!error) setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t))
    }

    const deleteTask = async (id: string) => {
        const { error } = await supabase.from('productivity_tasks').delete().eq('id', id)
        if (!error) setTasks(tasks.filter(t => t.id !== id))
    }

    return (
        <div style={{ maxWidth: 800 }}>
            <div style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                borderRadius: 24, padding: 32, color: 'white', marginBottom: 32, position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(76, 175, 80, 0.2)'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Rutina de Éxito Dropshipping</h3>
                    <p style={{ fontSize: 13, opacity: 0.9, maxWidth: 500, lineHeight: 1.6 }}>Completa tus tareas críticas y usa el Pomodoro para mantener el enfoque.</p>
                </div>
                <Activity size={120} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: -20, bottom: -20 }} />
            </div>

            <form onSubmit={addTask} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <input
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="Agregar nueva tarea..."
                    style={{ flex: 1, padding: '14px 20px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                />
                <button type="submit" style={{ padding: '0 24px', borderRadius: 16, background: '#1a1a2e', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    AGREGAR
                </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tasks.map(task => (
                    <div key={task.id} style={{ background: 'white', borderRadius: 20, padding: '18px 24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', opacity: task.status === 'completed' ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                            <button onClick={() => toggleTask(task.id, task.status)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                {task.status === 'completed' ? <CheckCircle2 size={24} color="#4CAF50" /> : <Circle size={24} color="#cbd5e1" />}
                            </button>
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</span>
                        </div>
                        <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.3, cursor: 'pointer' }}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function FinancialCommand() {
    const [price, setPrice] = useState(120000)
    const [cost, setCost] = useState(45000)
    const [shipping, setShipping] = useState(18000)
    const [returns, setReturns] = useState(5)

    const realShipping = returns < 100 ? Math.round(shipping / (1 - returns / 100)) : shipping
    const breakEvenCPA = price - cost - realShipping
    const roasGoal = 3.0
    const targetCPA = price / roasGoal

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            <div className="card" style={{ padding: 32, background: 'white', borderRadius: 24, border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <DollarSign size={20} color="#4CAF50" /> Calculadora Break-even
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>PRECIO VENTA</label>
                        <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} style={{ padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>COSTO PRODUCTO</label>
                        <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} style={{ padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>FLETE BASE</label>
                        <input type="number" value={shipping} onChange={e => setShipping(Number(e.target.value))} style={{ padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>% DEVOLUCIÓN</label>
                        <input type="number" value={returns} onChange={e => setReturns(Number(e.target.value))} style={{ padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    </div>
                </div>
                <div style={{ marginTop: 24, padding: 20, background: '#f8fafc', borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>CPA Break-even:</span>
                        <span style={{ fontSize: 16, fontWeight: 800 }}>${breakEvenCPA.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: 24, padding: 32, color: 'white' }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Guía de Rentabilidad</h4>
                <p style={{ fontSize: 13, opacity: 0.7 }}>Para un ROAS de {roasGoal}x, tu CPA no debe superar los ${Math.round(targetCPA).toLocaleString()}.</p>
            </div>
        </div>
    )
}

function CreativePipeline({ assets, setAssets }: { assets: any[], setAssets: any }) {
    const COLUMNS = [
        { id: 'idea', label: 'Ideas / Script', color: '#94a3b8' },
        { id: 'prod', label: 'En Producción', color: '#3b82f6' },
        { id: 'review', label: 'Revisión / Edit', color: '#f59e0b' },
        { id: 'live', label: 'Publicado / Test', color: '#4CAF50' },
        { id: 'scaling', label: 'Escalando 🔥', color: '#8b5cf6' },
    ]
    const [addingTo, setAddingTo] = useState<string | null>(null)
    const [newTitle, setNewTitle] = useState('')
    const colOrder = COLUMNS.map(c => c.id)

    const addAssetWithDetails = async (colId: string, platform: string, priority: string, author: string) => {
        if (!newTitle.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('creative_pipeline').insert({
            user_id: user.id,
            title: newTitle,
            platform,
            status: colId,
            priority,
            author,
            created_at: new Date().toISOString()
        }).select().single()
        if (data) { setAssets([...assets, data]); setNewTitle(''); setAddingTo(null); }
    }

    const moveAsset = async (id: string, dir: 'left' | 'right') => {
        const asset = assets.find(a => a.id === id)
        if (!asset) return
        const idx = colOrder.indexOf(asset.status)
        const next = dir === 'right' ? colOrder[idx + 1] : colOrder[idx - 1]
        if (!next) return
        const { error } = await supabase.from('creative_pipeline').update({ status: next }).eq('id', id)
        if (!error) setAssets(assets.map(a => a.id === id ? { ...a, status: next } : a))
    }

    const deleteAsset = async (id: string) => {
        const { error } = await supabase.from('creative_pipeline').delete().eq('id', id)
        if (!error) setAssets(assets.filter(a => a.id !== id))
    }

    return (
        <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 24, paddingRight: 24 }}>
            {COLUMNS.map(col => (
                <div key={col.id} style={{ minWidth: 300, flex: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        background: 'white', borderBottom: `4px solid ${col.color}`, padding: '16px 20px',
                        borderRadius: '16px 16px 0 0', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e' }}>{col.label}</span>
                        <span style={{ background: `${col.color}20`, color: col.color, padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 900 }}>
                            {assets.filter(a => a.status === col.id).length}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {assets.filter(a => a.status === col.id).map(asset => (
                            <div key={asset.id} style={{
                                background: 'white', padding: 20, borderRadius: 20, border: '1px solid #f1f5f9',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.02)', position: 'relative', transition: 'transform 0.2s',
                                cursor: 'pointer'
                            }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span style={{
                                            fontSize: 9, fontWeight: 900, background: asset.platform === 'TikTok' ? '#000' : asset.platform === 'Meta' ? '#0668E1' : '#f1c40f',
                                            color: 'white', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase'
                                        }}>
                                            {asset.platform || 'META'}
                                        </span>
                                        {asset.priority === 'high' && <span style={{ fontSize: 9, fontWeight: 900, background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 6 }}>URGENTE</span>}
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }} style={{ border: 'none', background: 'none', color: '#ef4444', opacity: 0.3, cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <h5 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 8, lineHeight: 1.4 }}>{asset.title}</h5>

                                {asset.author && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#3498db', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                                            {asset.author[0]}
                                        </div>
                                        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{asset.author}</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    {colOrder.indexOf(asset.status) > 0 && (
                                        <button onClick={(e) => { e.stopPropagation(); moveAsset(asset.id, 'left'); }} style={{ flex: 1, fontSize: 11, padding: '8px', borderRadius: 10, border: '1px solid #f1f5f9', background: '#fafbfc', cursor: 'pointer', fontWeight: 800 }}>←</button>
                                    )}
                                    {colOrder.indexOf(asset.status) < colOrder.length - 1 && (
                                        <button onClick={(e) => { e.stopPropagation(); moveAsset(asset.id, 'right'); }} style={{ flex: 1, fontSize: 11, padding: '8px', borderRadius: 10, background: col.color, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800 }}>AVANZAR →</button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {addingTo === col.id ? (
                            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20, border: '2px dashed #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <input
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="Nombre del contenido..."
                                    style={{ padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
                                />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <select id={`plat-${col.id}`} style={{ flex: 1, padding: 8, fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <option>Meta</option>
                                        <option>TikTok</option>
                                        <option>Google</option>
                                        <option>Organic</option>
                                    </select>
                                    <select id={`prio-${col.id}`} style={{ flex: 1, padding: 8, fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <option value="medium">Normal</option>
                                        <option value="high">Alta</option>
                                        <option value="low">Baja</option>
                                    </select>
                                </div>
                                <input id={`auth-${col.id}`} placeholder="Creador / Autor" style={{ padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => setAddingTo(null)} style={{ flex: 1, padding: 10, borderRadius: 12, border: '1px solid #cbd5e1', background: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>CANCELAR</button>
                                    <button
                                        onClick={() => {
                                            const platform = (document.getElementById(`plat-${col.id}`) as HTMLSelectElement).value
                                            const priority = (document.getElementById(`prio-${col.id}`) as HTMLSelectElement).value
                                            const author = (document.getElementById(`auth-${col.id}`) as HTMLInputElement).value
                                            addAssetWithDetails(col.id, platform, priority, author)
                                        }}
                                        style={{ flex: 1, padding: 10, background: col.color, color: 'white', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        GUARDAR
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddingTo(col.id)}
                                style={{
                                    padding: '16px', border: '2px dashed #e2e8f0', borderRadius: 20, background: 'rgba(255,255,255,0.5)',
                                    color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                }}
                            >
                                <Plus size={16} /> Agregar Asset
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

function AIMarketingAccelerator({ analyses }: { analyses: any[] }) {
    const [selected, setSelected] = useState('')
    return (
        <div style={{ maxWidth: 800 }}>
            <div style={{ background: '#1a1a2e', borderRadius: 24, padding: 32, color: 'white', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Generador de Copy AI</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select value={selected} onChange={e => setSelected(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: 12, borderRadius: 12 }}>
                        <option value="">Seleccionar Producto...</option>
                        {analyses.map(a => <option key={a.id} value={a.id}>{a.product_name}</option>)}
                    </select>
                    <button style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '0 24px', borderRadius: 12, fontWeight: 700 }}>GENERAR</button>
                </div>
            </div>
        </div>
    )
}

function CompetitorSpy({ competitors, setCompetitors }: { competitors: any[], setCompetitors: any }) {
    const [newName, setNewName] = useState('')
    const [newUrl, setNewUrl] = useState('')
    const [showForm, setShowForm] = useState(false)

    const addTracker = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName || !newUrl) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('competitor_monitor').insert({ user_id: user.id, name: newName, url: newUrl, last_status: 'Activo', color: '#4CAF50' }).select().single()
        if (data) { setCompetitors([data, ...competitors]); setNewName(''); setNewUrl(''); setShowForm(false); }
    }

    const deleteTracker = async (id: string) => {
        const { error } = await supabase.from('competitor_monitor').delete().eq('id', id)
        if (!error) setCompetitors(competitors.filter(c => c.id !== id))
    }

    return (
        <div style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Competencia</h3>
                <button onClick={() => setShowForm(!showForm)} style={{ background: '#1a1a2e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12 }}>{showForm ? 'Cancelar' : '+ Nuevo Tracker'}</button>
            </div>
            {showForm && (
                <form onSubmit={addTracker} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, padding: 24, background: 'white', borderRadius: 24, border: '1px solid #eee' }}>
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre tienda" style={{ padding: 12, borderRadius: 12, border: '1px solid #eee' }} />
                    <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL" style={{ padding: 12, borderRadius: 12, border: '1px solid #eee' }} />
                    <button type="submit" style={{ background: '#4CAF50', color: 'white', padding: 12, borderRadius: 12, border: 'none', fontWeight: 700 }}>ACTIVAR</button>
                </form>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {competitors.map(c => (
                    <div key={c.id} style={{ background: 'white', padding: 20, borderRadius: 20, border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h5 style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</h5>
                            <p style={{ fontSize: 11, color: '#999' }}>{c.url}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: c.color, background: `${c.color}10`, padding: '4px 10px', borderRadius: 20 }}>{c.last_status}</span>
                            <button onClick={() => deleteTracker(c.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
