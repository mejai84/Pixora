'use client'

import React, { useState, useEffect } from 'react'
import {
    Target, TrendingUp, BarChart3,
    Calendar, Filter, Plus, Trash2,
    Search, Globe, Share2, MoreHorizontal,
    TrendingDown, MousePointer2, AlertCircle,
    BrainCircuit, Rocket, Image as ImageIcon,
    Zap, ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Legend, Cell,
    PieChart, Pie
} from 'recharts'

interface MarketingRecord {
    id: string
    date: string
    platform: string
    campaign_name: string
    ad_account: string
    spend: number
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    cpc: number
    cpa: number
    creative_url?: string
    status?: string
}

interface ProfitSummary {
    date: string
    totalSales: number
    totalProfit: number
}

export default function MarketingView() {
    const [records, setRecords] = useState<MarketingRecord[]>([])
    const [profitData, setProfitData] = useState<ProfitSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [showSimulator, setShowSimulator] = useState(false)
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Simulator State
    const [simCpa, setSimCpa] = useState<number>(5)
    const [simBudget, setSimBudget] = useState<number>(100)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            // Fetch Marketing Records
            const { data: mData } = await supabase
                .from('marketing_spend')
                .select('*')
                .order('date', { ascending: false })

            // Fetch Profit Records for ROAS calculation
            const { data: pData } = await supabase
                .from('profit_records')
                .select('date, shopify_sales, selling_price, product_cost, base_shipping, admin_costs')

            if (mData) {
                setRecords(mData.map((r: any) => ({
                    ...r
                })))
            }

            if (pData) {
                const summary = pData.reduce((acc: any, curr: any) => {
                    const date = curr.date
                    if (!acc[date]) acc[date] = { date, totalSales: 0 }
                    acc[date].totalSales += (curr.shopify_sales || 0) * (curr.selling_price || 0)
                    return acc
                }, {})
                setProfitData(Object.values(summary))
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const addRecord = async () => {
        if (isAdding) return
        setIsAdding(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const newRecord = {
            user_id: user.id,
            date: new Date().toISOString().split('T')[0],
            platform: 'Meta',
            campaign_name: 'Nueva Campaña',
            ad_account: '',
            spend: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cpc: 0,
            cpa: 0,
            status: 'active'
        }

        const { data, error } = await supabase
            .from('marketing_spend')
            .insert([newRecord])
            .select()
            .single()

        if (error) {
            console.error('Error al crear gasto:', error)
            alert('Error al crear gasto: ' + error.message + '\n\nTIP: Asegúrate de haber ejecutado el SQL en Supabase para crear la tabla "marketing_spend".')
        } else if (data) {
            setRecords([data, ...records])
        }
        setIsAdding(false)
    }

    const updateRow = async (id: string, updates: Partial<MarketingRecord>) => {
        let updatedRow: MarketingRecord | null = null;

        setRecords(prev => prev.map(r => {
            if (r.id === id) {
                const merged = { ...r, ...updates };
                merged.ctr = merged.impressions > 0 ? (merged.clicks / merged.impressions) * 100 : 0;
                merged.cpc = merged.clicks > 0 ? merged.spend / merged.clicks : 0;
                merged.cpa = merged.conversions > 0 ? merged.spend / merged.conversions : 0;
                updatedRow = merged;
                return merged;
            }
            return r;
        }));

        if (updatedRow) {
            const { ctr, cpc, cpa } = updatedRow;
            await supabase.from('marketing_spend').update({
                ...updates,
                ctr,
                cpc,
                cpa
            }).eq('id', id);
        }
    }

    const deleteRow = async (id: string) => {
        if (confirm('¿Eliminar este registro de pauta?')) {
            await supabase.from('marketing_spend').delete().eq('id', id)
            setRecords(prev => prev.filter(r => r.id !== id))
        }
    }

    const runAiAnalysis = async () => {
        if (records.length === 0) {
            alert('Necesitas tener datos de pauta para analizar.')
            return
        }
        setIsAnalyzing(true)
        setAiAnalysis(null)

        try {
            // Try to get keys from DB first
            const { data: activeConfig } = await supabase
                .from('user_api_configs')
                .select('*')
                .eq('active', true)
                .maybeSingle()

            let apiKeys = {
                openai: activeConfig?.chatgpt,
                gemini: activeConfig?.gemini,
                grok: activeConfig?.grok
            }

            // Fallback to local storage
            if (!apiKeys.openai && !apiKeys.gemini && !apiKeys.grok) {
                const keysSaved = localStorage.getItem('pixora_api_keys')
                const parsed = keysSaved ? JSON.parse(keysSaved) : {}
                apiKeys = {
                    openai: parsed.chatgpt,
                    gemini: parsed.gemini,
                    grok: parsed.grok
                }
            }

            let model = 'openai'
            if (apiKeys.grok) model = 'grok'
            else if (apiKeys.gemini) model = 'gemini'

            const res = await fetch('/api/marketing-advice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records, profitData, model, apiKeys })
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setAiAnalysis(data.advice)
        } catch (error: any) {
            console.error('Error en análisis IA:', error)
            alert('Error al obtener sugerencias: ' + error.message)
        } finally {
            setIsAnalyzing(false)
        }
    }

    // Calculations
    const totalSpend = records.reduce((acc, r) => acc + r.spend, 0)
    const totalConversions = records.reduce((acc, r) => acc + r.conversions, 0)
    const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : 0

    // ROAS Real Calculation
    const totalSales = profitData.reduce((acc, p) => acc + p.totalSales, 0)
    const roasReal = totalSpend > 0 ? totalSales / totalSpend : 0

    const chartData = records.slice(0, 15).reverse().map(r => {
        const daySales = profitData.find(p => p.date === r.date)?.totalSales || 0
        return {
            name: r.date.split('-').slice(1).join('/'),
            gasto: r.spend,
            conversiones: r.conversions,
            ventas: daySales,
            roas: r.spend > 0 ? daySales / r.spend : 0
        }
    })

    const platformData = Array.from(
        records.reduce((acc, r) => {
            const platform = r.platform || 'Otros';
            acc.set(platform, (acc.get(platform) || 0) + r.spend);
            return acc;
        }, new Map<string, number>())
    ).map(([name, value]) => ({ name, value }))

    const COLORS = ['#3498db', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22'];

    return (
        <div className="main-scroll custom-scrollbar" style={{ animation: 'fadeIn 0.2s ease', padding: '24px' }}>

            {/* Header */}
            <div className="marketing-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 20 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ background: '#5b21b6', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Target color="white" size={20} />
                        </div>
                        Pauta & Marketing
                    </h1>
                    <p style={{ color: '#999', fontSize: 12, marginTop: 4, fontWeight: 500 }}>Optimización de presupuesto y ROAS real</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button onClick={addRecord} className="btn-primary" style={{ height: 40, borderRadius: 10, padding: '0 16px', fontSize: 12 }}>
                        <Plus size={16} /> {isAdding ? 'Creando...' : 'Agregar Gasto'}
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                <div className="card" style={{ padding: 20, border: 'none', background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)', color: 'white' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Inversión Total</div>
                    <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 900 }}>${totalSpend.toLocaleString()}</div>
                </div>
                <div className="card" style={{ padding: 20, border: 'none', background: 'white' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>ROAS Promedio</div>
                    <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 900, color: roasReal >= 2 ? '#22c55e' : '#f59e0b' }}>{roasReal.toFixed(2)}x</div>
                </div>
                <div className="card" style={{ padding: 20, border: 'none', background: 'white' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Ventas (Shopify)</div>
                    <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 900, color: '#1a1a2e' }}>${totalSales.toLocaleString()}</div>
                </div>
                <div className="card" style={{ padding: 20, border: 'none', background: 'white' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Contribución Marketing</div>
                    <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 900, color: '#1a1a2e' }}>{totalSales > 0 ? ((totalSpend / totalSales) * 100).toFixed(1) : 0}%</div>
                </div>
            </div>

            {/* AI Optimizer Section */}
            <div className="card" style={{ padding: 'clamp(16px, 4vw, 24px)', marginBottom: 32, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
                    <BrainCircuit size={150} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div style={{ background: 'rgba(52, 152, 219, 0.2)', padding: 10, borderRadius: 12 }}>
                            <BrainCircuit size={20} color="#3498db" />
                        </div>
                        <h3 style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)', fontWeight: 800 }}>IA Budget Optimizer</h3>
                        {isAnalyzing && <div style={{ fontSize: 11, background: '#3498db', padding: '2px 8px', borderRadius: 20, animation: 'pulse 1.5s infinite' }}>Analizando patrones...</div>}
                    </div>

                    {aiAnalysis ? (
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {aiAnalysis.split('\n').map((line, i) => (
                                <p key={i} style={{ marginBottom: 8 }}>{line}</p>
                            ))}
                            <button onClick={() => setAiAnalysis(null)} style={{ marginTop: 12, fontSize: 11, background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '4px 12px', borderRadius: 8, cursor: 'pointer' }}>Limpiar</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                            <p style={{ color: '#94a3b8', maxWidth: 500, fontSize: 13 }}>Deja que nuestra IA analice tus campañas, identifique fugas de dinero y te sugiera dónde escalar hoy mismo.</p>
                            <button onClick={runAiAnalysis} disabled={isAnalyzing} style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: 'fit-content' }}>
                                <Zap size={16} /> {isAnalyzing ? 'Calculando...' : 'Obtener Sugerencias IA'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content: Charts */}
            <div className="responsive-grid grid-cols-2-1" style={{ gap: 24, marginBottom: 32 }}>
                <div className="card" style={{ padding: 'clamp(16px, 4vw, 24px)', minHeight: 400 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={16} color="#3498db" /> Rendimiento & ROAS Real
                        </h3>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3498db' }} />
                                <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>GASTO</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f1c40f' }} />
                                <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>VENTAS</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3498db" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3498db" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="gasto" stroke="#3498db" strokeWidth={3} fillOpacity={1} fill="url(#colorGasto)" name="Inversión ($)" />
                                <Area type="monotone" dataKey="ventas" stroke="#f1c40f" strokeWidth={3} fillOpacity={0} name="Ventas ($)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ padding: 'clamp(16px, 4vw, 24px)', display: 'flex', flexDirection: 'column' }}>
                    <h1 style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', marginBottom: 20 }}>Eficiencia de Cuenta</h1>
                    <div style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={platformData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Gasto ($)">
                                    {platformData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>CPC Promedio</span>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>${(totalSpend / Math.max(1, records.reduce((a, r) => a + r.clicks, 0))).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>CTR Global</span>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{(records.reduce((a, r) => a + r.clicks, 0) / Math.max(1, records.reduce((a, r) => a + r.impressions, 0)) * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            </div>


            {/* Table Section */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>LIBRERÍA DE CREATIVOS & RENDIMIENTO</span>
                        <div style={{ background: '#fef2f2', color: '#ef4444', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={10} /> Alertas de CPA Breakeven Activadas
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input placeholder="Filtrar por nombre..." style={{ padding: '6px 12px 6px 32px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', width: 220 }} />
                        </div>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1200 }}>
                        <thead style={{ background: '#fafbfc' }}>
                            <tr>
                                <th style={thS}>Creativo</th>
                                <th style={thS}>Status</th>
                                <th style={thS}>Fecha</th>
                                <th style={thS}>Plataforma</th>
                                <th style={thS}>Campaña</th>
                                <th style={thS}>Gasto</th>
                                <th style={thS}>Imp.</th>
                                <th style={thS}>Clics</th>
                                <th style={thS}>Conv.</th>
                                <th style={thS}>CTR %</th>
                                <th style={thS}>CPC</th>
                                <th style={{ ...thS, color: '#e74c3c' }}>CPA (ALERTA)</th>
                                <th style={{ ...thS, width: 40 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => {
                                const isWarning = r.cpa > 15 && r.spend > 10 // Mock breakeven threshold
                                return (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: isWarning ? '#fffafa' : 'transparent' }}>
                                        <td style={tdS}>
                                            <div style={{ width: 44, height: 44, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                {r.creative_url ? (
                                                    <img src={r.creative_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : <ImageIcon size={18} color="#cbd5e1" />}
                                            </div>
                                        </td>
                                        <td style={tdS}>
                                            <select
                                                value={r.status || 'active'}
                                                onChange={e => updateRow(r.id, { status: e.target.value })}
                                                style={{ ...statusBadge(r.status || 'active'), border: 'none', cursor: 'pointer', outline: 'none' }}
                                            >
                                                <option value="active">🟢 Active</option>
                                                <option value="paused">🟡 Paused</option>
                                                <option value="warning">🔴 Error</option>
                                            </select>
                                        </td>
                                        <td style={tdS}><input type="date" value={r.date} onChange={e => updateRow(r.id, { date: e.target.value })} style={inputS} /></td>
                                        <td style={tdS}>
                                            <select value={r.platform} onChange={e => updateRow(r.id, { platform: e.target.value })} style={inputS}>
                                                <option>Meta</option>
                                                <option>TikTok</option>
                                                <option>Google</option>
                                            </select>
                                        </td>
                                        <td style={tdS}><input value={r.campaign_name} onChange={e => updateRow(r.id, { campaign_name: e.target.value })} style={{ ...inputS, width: 150, fontWeight: 700 }} /></td>
                                        <td style={tdS}><input type="number" value={r.spend} onChange={e => updateRow(r.id, { spend: Number(e.target.value) })} style={{ ...inputS, color: '#3498db', fontWeight: 800 }} /></td>
                                        <td style={tdS}><input type="number" value={r.impressions} onChange={e => updateRow(r.id, { impressions: Number(e.target.value) })} style={inputS} /></td>
                                        <td style={tdS}><input type="number" value={r.clicks} onChange={e => updateRow(r.id, { clicks: Number(e.target.value) })} style={inputS} /></td>
                                        <td style={tdS}><input type="number" value={r.conversions} onChange={e => updateRow(r.id, { conversions: Number(e.target.value) })} style={inputS} /></td>
                                        <td style={tdS}><span style={{ fontSize: 12, fontWeight: 700 }}>{(r.ctr || 0).toFixed(2)}%</span></td>
                                        <td style={tdS}><span style={{ fontSize: 12, fontWeight: 700 }}>${(r.cpc || 0).toFixed(2)}</span></td>
                                        <td style={tdS}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 13, fontWeight: 900, color: isWarning ? '#e74c3c' : '#1a1a2e' }}>
                                                    ${(r.cpa || 0).toFixed(2)}
                                                </span>
                                                {isWarning && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e74c3c', animation: 'pulse 1s infinite' }} />}
                                            </div>
                                        </td>
                                        <td style={tdS}>
                                            <button onClick={() => deleteRow(r.id)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Scaling Simulator Modal */}
            {showSimulator && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: 500, padding: 32, background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Rocket color="#3498db" /> Simulador de Escala
                            </h2>
                            <button onClick={() => setShowSimulator(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 8 }}>CPA DESEADO ($)</label>
                                <input type="number" value={simCpa} onChange={e => setSimCpa(Number(e.target.value))} style={{ ...inputS, width: '100%', background: '#f8fafc', padding: 12, border: '1px solid #e2e8f0' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 8 }}>PRESUPUESTO DIARIO ($)</label>
                                <input type="number" value={simBudget} onChange={e => setSimBudget(Number(e.target.value))} style={{ ...inputS, width: '100%', background: '#f8fafc', padding: 12, border: '1px solid #e2e8f0' }} />
                            </div>

                            <div style={{ padding: 20, background: '#f0f9ff', borderRadius: 16, border: '1px solid #bae6fd' }}>
                                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0369a1', marginBottom: 12 }}>Proyección Estimada</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#0ea5e9' }}>Ventas Diarias</div>
                                        <div style={{ fontSize: 20, fontWeight: 900 }}>{Math.floor(simBudget / Math.max(1, simCpa))}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#0ea5e9' }}>Escalabilidad</div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: simCpa < 10 ? '#10b981' : '#f59e0b' }}>
                                            {simCpa < 8 ? 'ALTA' : simCpa < 15 ? 'MEDIA' : 'RIESGO'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="btn-primary" style={{ width: '100%', padding: 14, background: '#3498db' }} onClick={() => setShowSimulator(false)}>
                                Generar Hoja de Ruta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const statusBadge = (s: string) => ({
    fontSize: 10,
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: 6,
    background: s === 'active' ? '#f0fdf4' : s === 'paused' ? '#fffbeb' : '#fef2f2',
    color: s === 'active' ? '#10b981' : s === 'paused' ? '#f59e0b' : '#ef4444',
})

const thS: React.CSSProperties = { padding: '16px 14px', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }
const tdS: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }
const inputS: React.CSSProperties = { border: '1px solid transparent', background: 'none', padding: '6px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#1a1a2e', width: 90, outline: 'none' }
