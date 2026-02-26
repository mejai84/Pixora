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
    const [newTask, setNewTask] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = async () => {
        const { data } = await supabase
            .from('productivity_tasks')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setTasks(data)
        setLoading(false)
    }

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTask.trim()) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('productivity_tasks')
            .insert({
                user_id: user.id,
                title: newTask,
                status: 'pending'
            })
            .select()
            .single()

        if (data) {
            setTasks([data, ...tasks])
            setNewTask('')
        }
    }

    const toggleTask = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
        const { error } = await supabase
            .from('productivity_tasks')
            .update({ status: newStatus })
            .eq('id', id)

        if (!error) {
            setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t))
        }
    }

    const deleteTask = async (id: string) => {
        const { error } = await supabase
            .from('productivity_tasks')
            .delete()
            .eq('id', id)

        if (!error) {
            setTasks(tasks.filter(t => t.id !== id))
        }
    }

    const startFocus = (task: any) => {
        // Communication with Pomodoro through localStorage
        localStorage.setItem('pixora_active_task', JSON.stringify(task))
        // Trigger a custom event for the Pomodoro component to catch
        window.dispatchEvent(new Event('pixora_task_focus'))
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
                {activeTab === 'checklist' && (
                    <div style={{ maxWidth: 800 }}>
                        {/* Daily Routine Intro */}
                        <div style={{
                            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                            borderRadius: 24,
                            padding: 32,
                            color: 'white',
                            marginBottom: 32,
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(76, 175, 80, 0.2)'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Rutina de Éxito Dropshipping</h3>
                                <p style={{ fontSize: 13, opacity: 0.9, maxWidth: 500, lineHeight: 1.6 }}>
                                    "El éxito es la suma de pequeños esfuerzos repetidos día tras día."
                                    Completa tus tareas críticas y usa el Pomodoro para mantener el enfoque.
                                </p>
                            </div>
                            <Activity
                                size={120}
                                color="rgba(255,255,255,0.1)"
                                style={{ position: 'absolute', right: -20, bottom: -20 }}
                            />
                        </div>

                        {/* Task Form */}
                        <form onSubmit={addTask} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                            <input
                                value={newTask}
                                onChange={e => setNewTask(e.target.value)}
                                placeholder="Agregar nueva tarea (ej: Revisar ROAS en Facebook Ads)..."
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    borderRadius: 16,
                                    border: '1px solid #e2e8f0',
                                    fontSize: 14,
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = '#4CAF50'}
                                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: '0 24px',
                                    borderRadius: 16,
                                    background: '#1a1a2e',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                            >
                                <Plus size={18} /> AGREGAR
                            </button>
                        </form>

                        {/* Task List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {loading ? (
                                <div style={{ color: '#94a3b8', fontSize: 14 }}>Cargando tareas...</div>
                            ) : tasks.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                    <CheckCircle2 size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                                    <p>No tienes tareas pendientes. ¡Buen trabajo!</p>
                                </div>
                            ) : (
                                tasks.map(task => (
                                    <div
                                        key={task.id}
                                        style={{
                                            background: 'white',
                                            borderRadius: 20,
                                            padding: '18px 24px',
                                            border: '1px solid #f1f5f9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.2s',
                                            opacity: task.status === 'completed' ? 0.6 : 1
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                                            <button
                                                onClick={() => toggleTask(task.id, task.status)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            >
                                                {task.status === 'completed' ? (
                                                    <CheckCircle2 size={24} color="#4CAF50" />
                                                ) : (
                                                    <Circle size={24} color="#cbd5e1" />
                                                )}
                                            </button>
                                            <span style={{
                                                fontSize: 15,
                                                fontWeight: 600,
                                                color: '#1a1a2e',
                                                textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                                            }}>
                                                {task.title}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {task.status !== 'completed' && (
                                                <button
                                                    onClick={() => startFocus(task)}
                                                    style={{
                                                        padding: '8px 14px',
                                                        borderRadius: 10,
                                                        background: '#f0faf0',
                                                        color: '#4CAF50',
                                                        border: 'none',
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6
                                                    }}
                                                >
                                                    <Clock size={14} /> ENFOCAR
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                style={{
                                                    padding: 8,
                                                    borderRadius: 10,
                                                    background: 'none',
                                                    color: '#ef4444',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    opacity: 0.3
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '0.3'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && <FinancialCommand />}
                {activeTab === 'kanban' && <CreativePipeline />}
                {activeTab === 'marketing' && <AIMarketingAccelerator />}
                {activeTab === 'spy' && <CompetitorSpy />}
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes progress {
                    0% { width: 0; }
                    100% { width: 100%; }
                }
            `}</style>
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
            <div className="card" style={{ padding: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <DollarSign size={20} color="#4CAF50" />
                    Calculadora de Punto de Equilibrio
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <InputGroup label="Precio de Venta" value={price} onChange={setPrice} sym="$" />
                    <InputGroup label="Costo del Producto" value={cost} onChange={setCost} sym="$" />
                    <InputGroup label="Flete Base" value={shipping} onChange={setShipping} sym="$" />
                    <InputGroup label="% Devolución Estimado" value={returns} onChange={setReturns} sym="%" />
                </div>

                <div style={{ marginTop: 32, background: '#f8fafc', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>CPA Break-even</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e' }}>${breakEvenCPA.toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                        Este es el costo máximo por compra (CPA) que puedes pagar en ads para terminar con exactitud en $0 de utilidad.
                    </p>

                    <div style={{ height: 1, background: '#e2e8f0', margin: '20px 0' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Objetivo ROAS (3.0x)</span>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#4CAF50' }}>CPA Target: ${Math.round(targetCPA).toLocaleString()}</div>
                        </div>
                        <TrendingUp size={24} color="#4CAF50" />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{
                    background: 'white',
                    borderRadius: 32,
                    padding: 32,
                    border: '1px solid #efeff5',
                    textAlign: 'center'
                }}>
                    <BarChart3 size={40} color="#8b5cf6" style={{ marginBottom: 16 }} />
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>Monitor de Escalabilidad</h4>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                        Si tienes un ROAS actual de <strong>4.2x</strong>, puedes aumentar tu presupuesto un 20% manteniendo rentabilidad.
                    </p>
                </div>
                {/* Visual indicator of profit margins */}
                <div style={{ flex: 1, background: '#1a1a2e', borderRadius: 32, padding: 32, color: 'white' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Simulación de Profit Diario</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { label: '5 Ventas', profit: breakEvenCPA * 5 * 0.4 },
                            { label: '10 Ventas', profit: breakEvenCPA * 10 * 0.4 },
                            { label: '25 Ventas', profit: breakEvenCPA * 25 * 0.4 },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, opacity: 0.6 }}>{s.label}</span>
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#4CAF50' }}>+${Math.round(s.profit).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function InputGroup({ label, value, onChange, sym }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#cbd5e1' }}>{sym}</span>
                <input
                    type="number"
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    style={{
                        width: '100%',
                        padding: '12px 14px 12px 32px',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#1a1a2e',
                        outline: 'none'
                    }}
                />
            </div>
        </div>
    )
}

function CreativePipeline() {
    const columns = [
        { id: 'idea', label: 'Ideas / Script', color: '#94a3b8', count: 3 },
        { id: 'prod', label: 'En Producción', color: '#3b82f6', count: 1 },
        { id: 'review', label: 'Revisión / Edit', color: '#f59e0b', count: 0 },
        { id: 'live', label: 'Publicado / Test', color: '#4CAF50', count: 5 },
        { id: 'scaling', label: 'Escalando 🔥', color: '#8b5cf6', count: 1 },
    ]

    return (
        <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 16 }}>
            {columns.map(col => (
                <div key={col.id} style={{ minWidth: 260, flex: 1 }}>
                    <div style={{ borderBottom: `3px solid ${col.color}`, paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e' }}>{col.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 10 }}>{col.count}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {col.id === 'idea' && (
                            <>
                                <KanbanCard title="Video UGC Comedor" tag="Meta Ads" author="Ana" />
                                <KanbanCard title="Static Angle: Dolor" tag="TikTok" author="Luis" />
                            </>
                        )}
                        {col.id === 'scaling' && (
                            <KanbanCard title="Hook: 'No lo creerás'" tag="Ganador" author="Pixora AI" premium />
                        )}
                        <button style={{
                            padding: 12,
                            borderRadius: 12,
                            border: '1px dashed #cbd5e1',
                            background: 'transparent',
                            color: '#94a3b8',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                        }}>
                            <Plus size={14} /> Nuevo Asset
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

function KanbanCard({ title, tag, author, premium }: any) {
    return (
        <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 16,
            border: premium ? '1px solid #4CAF5033' : '1px solid #f1f5f9',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            cursor: 'grab'
        }}>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>{title}</h5>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: premium ? '#4CAF50' : '#3b82f6',
                    background: premium ? '#f0faf0' : '#eff6ff',
                    padding: '3px 8px',
                    borderRadius: 6
                }}>
                    {tag}
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{author}</span>
            </div>
        </div>
    )
}

function AIMarketingAccelerator() {
    const [products, setProducts] = useState<any[]>([])
    const [selectedProduct, setSelectedProduct] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchProducts() {
            const { data } = await supabase
                .from('analyses')
                .select('id, product_name')
                .order('created_at', { ascending: false })
            if (data) setProducts(data)
            setLoading(false)
        }
        fetchProducts()
    }, [])

    return (
        <div style={{ maxWidth: 900 }}>
            <div style={{ background: '#1a1a2e', borderRadius: 24, padding: 32, color: 'white', marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Sparkles size={24} color="#4CAF50" />
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>Generador de Copy de Alta Conversión</h3>
                </div>
                <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 24 }}>
                    Elige un producto analizado y generaremos copy publicitario basado en psicología de ventas.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select
                        value={selectedProduct}
                        onChange={e => setSelectedProduct(e.target.value)}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 14 }}
                    >
                        <option value="">{loading ? 'Cargando productos...' : 'Seleccionar Producto...'}</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.product_name || 'Producto sin nombre'}</option>
                        ))}
                    </select>
                    <button
                        disabled={!selectedProduct}
                        style={{
                            background: selectedProduct ? '#4CAF50' : '#4b5563',
                            color: 'white',
                            border: 'none',
                            padding: '0 24px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: selectedProduct ? 'pointer' : 'not-allowed'
                        }}
                    >
                        GENERAR COPY
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                <CopyResultCard type="Facebook Hook" content="¿Cansado de que tus cuchillos no corten? Descubre el afilador usado por profesionales..." />
                <CopyResultCard type="TikTok Script" content="[ESCENA 1] Muestra el cuchillo sin filo. [TEXTO] 'Mi cocina cambió hoy'..." />
                <CopyResultCard type="Angle: Ahorro" content="Deja de gastar en cuchillos nuevos. Este afilador te ahorra hasta $500 al año..." />
            </div>
        </div>
    )
}

function CopyResultCard({ type, content }: any) {
    return (
        <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 900, background: '#f8fafc', color: '#64748b', padding: '4px 10px', borderRadius: 20 }}>{type}</span>
                <button style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><Copy size={14} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, fontWeight: 500 }}>{content}</p>
        </div>
    )
}

function CompetitorSpy() {
    const [competitors, setCompetitors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [newName, setNewName] = useState('')
    const [newUrl, setNewUrl] = useState('')

    useEffect(() => {
        fetchCompetitors()
    }, [])

    async function fetchCompetitors() {
        const { data } = await supabase
            .from('competitor_monitor')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setCompetitors(data)
        setLoading(false)
    }

    async function addTracker(e: React.FormEvent) {
        e.preventDefault()
        if (!newName || !newUrl) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('competitor_monitor')
            .insert({
                user_id: user.id,
                name: newName,
                url: newUrl,
                last_status: 'Iniciando monitoreo...',
                color: '#94a3b8'
            })
            .select()
            .single()

        if (data) {
            setCompetitors([data, ...competitors])
            setNewName('')
            setNewUrl('')
            setShowForm(false)
        }
    }

    async function deleteTracker(id: string) {
        const { error } = await supabase
            .from('competitor_monitor')
            .delete()
            .eq('id', id)
        if (!error) {
            setCompetitors(competitors.filter(c => c.id !== id))
        }
    }

    return (
        <div style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>Monitor de Competencia</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: '10px 24px',
                        borderRadius: 12,
                        background: showForm ? '#f1f5f9' : '#1a1a2e',
                        color: showForm ? '#1a1a2e' : 'white',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    {showForm ? 'CANCELAR' : '+ NUEVO TRACKER'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={addTracker} style={{
                    background: 'white',
                    padding: 24,
                    borderRadius: 20,
                    border: '1px solid #e2e8f0',
                    marginBottom: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Nombre de la Tienda (ej: Tienda Pro Kitchen)"
                        style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14 }}
                    />
                    <input
                        value={newUrl}
                        onChange={e => setNewUrl(e.target.value)}
                        placeholder="URL de la Tienda (ej: kitchenpro.com)"
                        style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14 }}
                    />
                    <button type="submit" style={{
                        padding: '12px',
                        borderRadius: 12,
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}>
                        ACTIVAR MONITOREO
                    </button>
                </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {loading ? (
                    <div style={{ color: '#94a3b8', fontSize: 14 }}>Cargando competidores...</div>
                ) : competitors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <Search size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p>No tienes tiendas en seguimiento. ¡Agrega una para empezar!</p>
                    </div>
                ) : (
                    competitors.map(comp => (
                        <div key={comp.id} style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 44, height: 44, background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Search size={20} color="#cbd5e1" />
                                </div>
                                <div>
                                    <h5 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{comp.name}</h5>
                                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{comp.url}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: comp.color || '#94a3b8',
                                    background: `${comp.color || '#94a3b8'}10`,
                                    padding: '4px 12px',
                                    borderRadius: 20
                                }}>
                                    {comp.last_status}
                                </span>
                                <button
                                    onClick={() => deleteTracker(comp.id)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.3, cursor: 'pointer' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '0.3'}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
