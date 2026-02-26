'use client'

import React, { useState, useEffect } from 'react'
import {
    TrendingUp, Activity, BarChart3, TrendingDown,
    ArrowUpRight, ArrowDownRight, Zap, Target,
    History, ChevronRight, Plus, ExternalLink,
    PieChart, DollarSign, ShoppingCart, Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { COUNTRIES } from '@/constants/countries'

interface DailyRecord {
    id: string
    date: string
    productName: string
    shopifySales: number
    adSpend: number
    tiktokSpend: number
    otherSpend: number
    sellingPrice: number
    productCost: number
    baseShipping: number
    cancelRate: number
    returnRate: number
    adminCosts: number
}

interface CalculatedMetrics {
    effectiveness: number
    effectiveSales: number
    fleteConDev: number
    totalAdSpend: number
    cpa: number
    cpaBkven: number
    profitPerProduct: number
    totalProfit: number
    roi: number
    grossRevenue: number
    isProfitable: boolean
}

export default function DashboardView() {
    const [records, setRecords] = useState<DailyRecord[]>([])
    const [analyses, setAnalyses] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userName, setUserName] = useState('')

    const countryCode = typeof window !== 'undefined' ? localStorage.getItem('pixora_profit_country') || 'CO' : 'CO'
    const activeCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')

                    // Fetch profit records
                    const { data: profitData } = await supabase
                        .from('profit_records')
                        .select('*')
                        .order('date', { ascending: false })

                    if (profitData) {
                        setRecords(profitData.map((r: any) => ({
                            id: r.id,
                            date: r.date,
                            productName: r.product_name,
                            shopifySales: r.shopify_sales,
                            adSpend: r.ad_spend,
                            tiktokSpend: r.tiktok_spend || 0,
                            otherSpend: r.other_spend || 0,
                            sellingPrice: r.selling_price,
                            productCost: r.product_cost,
                            baseShipping: r.base_shipping,
                            cancelRate: r.cancel_rate || 0,
                            returnRate: r.return_rate || 0,
                            adminCosts: r.admin_costs || 0
                        })))
                    }

                    // Fetch latest analyses
                    const { data: analysisData } = await supabase
                        .from('winning_products')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(5)

                    if (analysisData) setAnalyses(analysisData)
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const calculateMetrics = (r: DailyRecord): CalculatedMetrics => {
        const cancelRateDec = (r.cancelRate || 0) / 100
        const returnRateDec = (r.returnRate || 0) / 100
        const fleteConDev = returnRateDec < 1 ? r.baseShipping / (1 - returnRateDec) : r.baseShipping
        const effectivenessNum = Math.max(0, 1 - cancelRateDec - returnRateDec)
        const effectiveSales = (r.shopifySales || 0) * effectivenessNum
        const totalAdSpend = (r.adSpend || 0) + (r.tiktokSpend || 0) + (r.otherSpend || 0)
        const cpa = effectiveSales > 0 ? totalAdSpend / effectiveSales : 0
        const profitPerProduct = r.sellingPrice - r.productCost - fleteConDev - (r.adminCosts || 0) - cpa
        const totalProfit = (effectiveSales * (r.sellingPrice - r.productCost - fleteConDev - (r.adminCosts || 0))) - totalAdSpend
        const roi = totalAdSpend > 0 ? (totalProfit / totalAdSpend) * 100 : 0

        return {
            effectiveness: effectivenessNum,
            effectiveSales: effectiveSales,
            fleteConDev: Math.round(fleteConDev),
            totalAdSpend: Math.round(totalAdSpend),
            cpa: Math.round(cpa),
            cpaBkven: Math.round(cpa + profitPerProduct),
            profitPerProduct: Math.round(profitPerProduct),
            totalProfit: Math.round(totalProfit),
            roi: Math.round(roi),
            grossRevenue: Math.round(effectiveSales * r.sellingPrice),
            isProfitable: totalProfit >= 0
        }
    }

    // Aggregate totals
    const totals = records.reduce((acc, r) => {
        const m = calculateMetrics(r)
        return {
            profit: acc.profit + m.totalProfit,
            adSpend: acc.adSpend + m.totalAdSpend,
            sales: acc.sales + r.shopifySales,
            effectiveSales: acc.effectiveSales + m.effectiveSales,
            revenue: acc.revenue + m.grossRevenue
        }
    }, { profit: 0, adSpend: 0, sales: 0, effectiveSales: 0, revenue: 0 })

    const avgROI = totals.adSpend > 0 ? (totals.profit / totals.adSpend) * 100 : 0

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #eee', borderTopColor: '#4CAF50', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
    )

    return (
        <div className="main-scroll custom-scrollbar" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="dashboard-padding" style={{ padding: '32px' }}>

                {/* Welcome Header */}
                <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 900, color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                            ¡Buen día, {userName}! 👋
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4, fontWeight: 500 }}>
                            Aquí tienes un resumen de tu operación logística y comercial hoy.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-secondary" style={{ height: 44, borderRadius: 14, padding: '0 20px', fontSize: 13, fontWeight: 700 }}>
                            Descargar Reporte
                        </button>
                    </div>
                </div>

                {/* Primary KPIs - Dashboard Style */}
                <div className="responsive-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                    marginBottom: 32
                }}>
                    <KPICard
                        label="Utilidad Real"
                        value={`${activeCountry.symbol}${totals.profit.toLocaleString()}`}
                        trend={totals.profit >= 0 ? '+12.5%' : '-5.2%'}
                        isPositive={totals.profit >= 0}
                        icon={<DollarSign size={20} />}
                        color={totals.profit >= 0 ? '#4CAF50' : '#ef4444'}
                    />
                    <KPICard
                        label="ROI Operativo"
                        value={`${avgROI.toFixed(1)}%`}
                        trend="+4.1%"
                        isPositive={avgROI > 0}
                        icon={<TrendingUp size={20} />}
                        color="#8b5cf6"
                    />
                    <KPICard
                        label="Ventas Efectivas"
                        value={totals.effectiveSales.toFixed(0)}
                        trend="+18"
                        isPositive={true}
                        icon={<ShoppingCart size={20} />}
                        color="#3b82f6"
                    />
                    <KPICard
                        label="Inversión en Ads"
                        value={`${activeCountry.symbol}${totals.adSpend.toLocaleString()}`}
                        trend="-2.4%"
                        isPositive={true}
                        icon={<Activity size={20} />}
                        color="#f59e0b"
                    />
                </div>

                {/* Main section: Control Total Style */}
                <div className="responsive-grid grid-cols-2-1" style={{ marginBottom: 32 }}>

                    {/* Control Total Breakdown */}
                    <div style={{
                        background: 'white',
                        borderRadius: 32,
                        border: '1px solid #efeff5',
                        padding: 32,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.03)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'linear-gradient(to left, #f8fafc, transparent)', zIndex: 0 }}></div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, background: '#f0fdf4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShieldCheck color="#22c55e" size={20} />
                                    </div>
                                    Control Operativo Total
                                </h2>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', background: '#f0fdf4', padding: '4px 12px', borderRadius: 20 }}>Auditoría Activa 🟢</span>
                            </div>

                            <div className="operative-breakdown-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <DetailRow label="Facturación Bruta" value={`${activeCountry.symbol}${totals.revenue.toLocaleString()}`} icon={<DollarSign size={14} />} />
                                    <DetailRow label="Costo de Mercancía" value={`${activeCountry.symbol}${(totals.sales * 35000).toLocaleString()}`} icon={<ShoppingCart size={14} />} />
                                    <DetailRow label="Fletes & Logística" value={`${activeCountry.symbol}${(totals.effectiveSales * 18000).toLocaleString()}`} icon={<Activity size={14} />} />
                                    <div style={{ height: 1, background: '#f1f5f9', margin: '8px 0' }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>Utilidad Neta</span>
                                        <span style={{ fontSize: 24, fontWeight: 900, color: '#22c55e' }}>{activeCountry.symbol}{totals.profit.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid #f1f5f9' }}>
                                    <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="120" height="120" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="8" />
                                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#22c55e" strokeWidth="8" strokeDasharray={`${(totals.profit / Math.max(1, totals.revenue)) * 251} 251`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                                        </svg>
                                        <div style={{ position: 'absolute', textAlign: 'center' }}>
                                            <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e' }}>{((totals.profit / Math.max(1, totals.revenue)) * 100).toFixed(0)}%</div>
                                            <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Margen</div>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 16, lineHeight: 1.5, fontWeight: 500 }}>
                                        Tu eficiencia operativa es <strong>{totals.profit >= totals.adSpend ? 'Alta' : 'Moderada'}</strong>. Recomendamos escalar productos con ROI &gt; 100%.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Analyses Card */}
                    <div style={{ background: 'white', border: '1px solid #efeff5', borderRadius: 32, padding: 32, color: '#1a1a2e', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Sparkles size={20} color="#4CAF50" />
                                Top Análisis IA
                            </h2>
                            <button className="text-[11px] font-bold text-[#4CAF50] hover:underline">Ver todos</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                            {analyses.length > 0 ? analyses.map((a, i) => (
                                <div key={a.id} style={{ background: '#f8fafc', borderRadius: 20, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <div style={{ width: 40, height: 40, background: 'rgba(76, 175, 80, 0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#4CAF50', fontSize: 16 }}>
                                        {i + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Score: {Object.values(a.technical).filter(v => v === true).length}/10</div>
                                    </div>
                                    <ChevronRight size={16} color="#cbd5e1" />
                                </div>
                            )) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #f1f5f9', borderRadius: 24 }}>
                                    <Target size={32} color="#cbd5e1" />
                                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>Sin análisis recientes</p>
                                </div>
                            )}
                        </div>

                        <button className="btn-primary" style={{ height: 48, borderRadius: 16, marginTop: 24, fontSize: 13, fontWeight: 800, width: '100%', background: '#4CAF50', border: 'none' }}>
                            <Plus size={18} /> Nuevo Análisis
                        </button>
                    </div>
                </div>

                {/* Bottom Quick Actions / Feature Cards */}
                <div className="responsive-grid grid-cols-3" style={{ marginBottom: 32 }}>
                    <ActionCard
                        title="Auditoría de Fletes"
                        desc="Cruza tus guías con las transportadoras para evitar cobros fantasmas."
                        icon={<History size={24} color="#3b82f6" />}
                        bgColor="#eff6ff"
                    />
                    <ActionCard
                        title="Simulador de Escalamiento"
                        desc="Calcula cuánta utilidad tendrías al duplicar tu presupuesto diario."
                        icon={<BarChart3 size={24} color="#8b5cf6" />}
                        bgColor="#f5f3ff"
                    />
                    <ActionCard
                        title="Smart Banner IA"
                        desc="Genera creativos optimizados para CTR basados en tus testeos."
                        icon={<Zap size={24} color="#f59e0b" />}
                        bgColor="#fffbeb"
                    />
                </div>
            </div>

            <style jsx>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 1024px) {
                    .dashboard-grid-main { grid-template-columns: 1fr !important; }
                    .dashboard-grid-bottom { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 768px) {
                    .dashboard-padding { padding: 16px !important; }
                    .dashboard-header { flex-direction: column !important; alignItems: flex-start !important; gap: 16px !important; }
                    .dashboard-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .operative-breakdown-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
                }
                @media (max-width: 480px) {
                    .dashboard-kpi-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    )
}

function KPICard({ label, value, trend, isPositive, icon, color }: any) {
    return (
        <div style={{
            background: 'white',
            borderRadius: 24,
            padding: '24px',
            border: '1px solid #efeff5',
            boxShadow: '0 10px 25px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}10`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    color: isPositive ? '#22c55e' : '#ef4444',
                    background: isPositive ? '#f0fdf4' : '#fef2f2',
                    padding: '4px 10px',
                    borderRadius: 20
                }}>
                    {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trend}
                </div>
            </div>
            <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#1a1a2e' }}>{value}</div>
            </div>
        </div>
    )
}

function DetailRow({ label, value, icon }: any) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ color: '#94a3b8' }}>{icon}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{label}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e' }}>{value}</span>
        </div>
    )
}

function ActionCard({ title, desc, icon, bgColor }: any) {
    return (
        <div style={{
            background: 'white',
            borderRadius: 28,
            padding: 24,
            border: '1px solid #efeff5',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.06)'
                e.currentTarget.style.borderColor = '#4CAF5033'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = '#efeff5'
            }}
        >
            <div style={{ width: 52, height: 52, background: bgColor, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>{desc}</p>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#4CAF50' }}>
                COMENZAR AHORA <ChevronRight size={14} />
            </div>
        </div>
    )
}

function ShieldCheck({ color, size }: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
