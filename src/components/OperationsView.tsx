'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
    Activity, TrendingUp, TrendingDown, DollarSign,
    ShoppingCart, PieChart, CheckCircle2, XCircle,
    List, Edit3, MessageSquare, Briefcase, Plus, Trash2,
    BarChart3, Box, Globe, ChevronRight, Target
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface OpQuest {
    id: string
    question: string
    answer: boolean | null
}

export default function OperationsView() {
    const [stats, setStats] = useState({
        totalInvoiced: 0,
        salesCount: 0,
        investmentTesting: 0,
        profits: 0,
        testeosTikTok: 0,
        testeosMeta: 0
    })

    const [categoryShares, setCategoryShares] = useState([
        { name: 'Hogar', count: 0 },
        { name: 'Bebes', count: 0 },
        { name: 'Belleza', count: 0 },
        { name: 'Moda', count: 0 },
        { name: 'Salud', count: 0 },
        { name: 'Gadgets', count: 0 },
        { name: 'Joyeria', count: 0 },
    ])

    const [questions, setQuestions] = useState<OpQuest[]>([
        { id: '1', question: '¿Valido a diario lo que se está vendiendo?', answer: null },
        { id: '2', question: '¿Todos los días he mejorado mi proceso?', answer: null },
        { id: '3', question: '¿Optimizo anuncios con comentarios positivos?', answer: null },
    ])

    const [foundProducts, setFoundProducts] = useState({
        platforms: [''],
        activeAds: [''],
        adLibraries: ['']
    })

    const [retrospective, setRetrospective] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const statsId = useRef<string | null>(null)

    useEffect(() => {
        const fetchOps = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data, error } = await supabase
                        .from('operation_stats')
                        .select('*')
                        .single()

                    if (data) {
                        statsId.current = data.id
                        setStats({
                            totalInvoiced: data.total_invoiced,
                            salesCount: data.sales_count,
                            investmentTesting: data.investment_testing,
                            profits: data.profits,
                            testeosTikTok: data.testeos_tiktok,
                            testeosMeta: data.testeos_meta
                        })
                        if (data.category_shares && data.category_shares.length > 0) setCategoryShares(data.category_shares)
                        if (data.questions && data.questions.length > 0) setQuestions(data.questions)
                        if (data.found_products) setFoundProducts(data.found_products)
                        setRetrospective(data.retrospective || '')
                    }
                }
            } catch (error) {
                console.error('Error fetching ops:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchOps()
    }, [])

    const syncOps = async (updates: any) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (statsId.current) {
            await supabase.from('operation_stats').update(updates).eq('id', statsId.current)
        } else {
            const { data } = await supabase.from('operation_stats').insert({ user_id: user.id, ...updates }).select()
            if (data && data[0]) statsId.current = data[0].id
        }
    }

    return (
        <div className="main-scroll custom-scrollbar" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ padding: '24px' }}>

                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Activity className="text-[#9b59b6]" size={30} /> Análisis de Operación
                    </h1>
                    <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Visión estratégica de tu negocio: Ventas, testing y retrospección.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 32 }}>

                    {/* Left Column: Questionnaire and Product Discovery */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Questionnaire */}
                        <Section title="ANÁLISIS DE MI OPERACIÓN">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {questions.map(q => (
                                    <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: '#fcfcfc', border: '1px solid #f0f0f0' }}>
                                        <span style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>{q.question}</span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                onClick={() => {
                                                    const newQ = questions.map(item => item.id === q.id ? { ...item, answer: true } : item)
                                                    setQuestions(newQ)
                                                    syncOps({ questions: newQ })
                                                }}
                                                style={{ ...btnQuestStyle, background: q.answer === true ? '#4CAF50' : '#f5f5f5', color: q.answer === true ? 'white' : '#999' }}
                                            >SI</button>
                                            <button
                                                onClick={() => {
                                                    const newQ = questions.map(item => item.id === q.id ? { ...item, answer: false } : item)
                                                    setQuestions(newQ)
                                                    syncOps({ questions: newQ })
                                                }}
                                                style={{ ...btnQuestStyle, background: q.answer === false ? '#e74c3c' : '#f5f5f5', color: q.answer === false ? 'white' : '#999' }}
                                            >NO</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Discovery Lists */}
                        <Section title="PRODUCTOS ENCONTRADOS EN PLATAFORMAS">
                            <DiscoveryList
                                items={foundProducts.platforms}
                                onChange={items => setFoundProducts({ ...foundProducts, platforms: items })}
                                placeholder="Ej: AliExpress..."
                            />
                        </Section>

                        <Section title="PRODUCTOS EN ANUNCIOS ACTIVOS (COMPETITIVIDAD)">
                            <DiscoveryList
                                items={foundProducts.activeAds}
                                onChange={items => setFoundProducts({ ...foundProducts, activeAds: items })}
                                placeholder="Ej: FB Ads..."
                            />
                        </Section>

                        <Section title="PRODUCTOS EN BIBLIOTECAS (NUEVOS MERCADOS)">
                            <DiscoveryList
                                items={foundProducts.adLibraries}
                                onChange={items => {
                                    const newFound = { ...foundProducts, adLibraries: items }
                                    setFoundProducts(newFound)
                                    syncOps({ found_products: newFound })
                                }}
                                placeholder="Ej: Meta Library..."
                            />
                        </Section>

                        <Section title="RETROSPECTIVA DE ÉXITO">
                            <textarea
                                value={retrospective}
                                onChange={e => setRetrospective(e.target.value)}
                                onBlur={e => syncOps({ retrospective: e.target.value })}
                                placeholder="¿Qué me llevó al éxito en aquel momento? ¿Qué dejé de hacer?..."
                                style={{ width: '100%', height: 120, padding: 16, border: '1px solid #eee', borderRadius: 12, fontSize: 13, resize: 'none', background: '#fcfcfc' }}
                            />
                        </Section>
                    </div>

                    {/* Right Column: Financials and Categorization */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <MetricCard
                                label="FACTURADO A LA FECHA"
                                value={`$${stats.totalInvoiced.toLocaleString()}`}
                                icon={<DollarSign size={18} color="#4CAF50" />}
                                onEdit={(v) => { const n = { ...stats, totalInvoiced: v }; setStats(n); syncOps({ total_invoiced: v }) }}
                            />
                            <MetricCard
                                label="PEDIDOS TOTALES"
                                value={stats.salesCount}
                                icon={<ShoppingCart size={18} color="#3498db" />}
                                onEdit={(v) => { const n = { ...stats, sales_count: v }; setStats(n); syncOps({ sales_count: v }) }}
                            />
                            <MetricCard
                                label="INVERSIÓN EN TEST"
                                value={`$${stats.investmentTesting.toLocaleString()}`}
                                icon={<Target size={18} color="#e67e22" />}
                                onEdit={(v) => { const n = { ...stats, investmentTesting: v }; setStats(n); syncOps({ investment_testing: v }) }}
                            />
                            <MetricCard
                                label="PÉRDIDAS / GANANCIAS"
                                value={`$${stats.profits.toLocaleString()}`}
                                icon={stats.profits >= 0 ? <TrendingUp size={18} color="#4CAF50" /> : <TrendingDown size={18} color="#e74c3c" />}
                                highlight={stats.profits >= 0 ? '#4CAF50' : '#e74c3c'}
                                onEdit={(v) => { const n = { ...stats, profits: v }; setStats(n); syncOps({ profits: v }) }}
                            />
                        </div>

                        {/* Testing Breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #eee' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>TESTEOS TIKTOK</span>
                                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{stats.testeosTikTok}</div>
                            </div>
                            <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #eee' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>TESTEOS META</span>
                                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{stats.testeosMeta}</div>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <Section title="PRODUCTOS POR CATEGORÍA">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {categoryShares.map((cat, idx) => (
                                    <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#666', width: 80 }}>{cat.name}</span>
                                        <div style={{ flex: 1, height: 8, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min(100, (cat.count / 40) * 100)}%`, height: '100%', background: '#9b59b6', transition: 'width 0.3s ease' }} />
                                        </div>
                                        <input
                                            type="number"
                                            value={cat.count}
                                            onChange={e => {
                                                const newShares = [...categoryShares]
                                                newShares[idx].count = Number(e.target.value)
                                                setCategoryShares(newShares)
                                                syncOps({ category_shares: newShares })
                                            }}
                                            style={{ width: 40, border: 'none', background: 'none', fontSize: 12, fontWeight: 800, textAlign: 'right' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Segmentation Info */}
                        <Section title="Estrategia de Segmentación">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ padding: 16, background: '#f8f9fa', borderRadius: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700 }}>Segmentación por Edades</span>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#4CAF50' }}>ACTIVO</span>
                                    </div>
                                    <p style={{ fontSize: 12, color: '#666' }}>Optimizado para el rango 25-54 años en campañas de escala.</p>
                                </div>
                                <div style={{ padding: 16, background: '#f8f9fa', borderRadius: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700 }}>Segmentación por Sexo</span>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#4CAF50' }}>MUJERES</span>
                                    </div>
                                    <p style={{ fontSize: 12, color: '#666' }}>Validado con un 85% de compradores recurrentes mujeres.</p>
                                </div>
                            </div>
                        </Section>

                    </div>
                </div>
            </div>
        </div>
    )
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid #eee', padding: 24 }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>{title}</h3>
            {children}
        </div>
    )
}

function DiscoveryList({ items, onChange, placeholder }: { items: string[], onChange: (i: string[]) => void, placeholder: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8 }}>
                    <input
                        value={item}
                        onChange={e => {
                            const newItems = [...items]
                            newItems[idx] = e.target.value
                            onChange(newItems)
                        }}
                        placeholder={placeholder}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #eee', fontSize: 12, outline: 'none' }}
                    />
                    <button onClick={() => onChange(items.filter((_, i) => i !== idx))} style={{ color: '#ccc', border: 'none', background: 'none' }}><Trash2 size={14} /></button>
                </div>
            ))}
            <button onClick={() => onChange([...items, ''])} style={{ alignSelf: 'flex-start', fontSize: 10, fontWeight: 700, color: '#4CAF50', background: 'none', border: 'none', marginTop: 4 }}>+ Agregar Producto</button>
        </div>
    )
}

function MetricCard({ label, value, icon, highlight, onEdit }: { label: string, value: string | number, icon: React.ReactNode, highlight?: string, onEdit?: (v: number) => void }) {
    const [isEditing, setIsEditing] = useState(false)
    const [val, setVal] = useState<number>(0)

    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: 16, border: '1px solid #eee', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>{label}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    {onEdit && <button onClick={() => setIsEditing(!isEditing)} style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer' }}><Edit3 size={12} /></button>}
                    {icon}
                </div>
            </div>
            {isEditing ? (
                <input
                    type="number"
                    autoFocus
                    onBlur={() => { setIsEditing(false); onEdit?.(val) }}
                    onChange={e => setVal(Number(e.target.value))}
                    style={{ fontSize: 18, fontWeight: 900, width: '100%', marginTop: 8, border: 'none', outline: 'none', borderBottom: '2px solid #eee' }}
                />
            ) : (
                <div style={{ fontSize: 22, fontWeight: 900, color: highlight || '#1a1a2e', marginTop: 8 }}>{value}</div>
            )}
        </div>
    )
}

const btnQuestStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 8,
    border: 'none',
    fontSize: 10,
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s'
}
