'use client'

import React, { useState, useEffect } from 'react'
import { Calculator, TrendingUp, RefreshCcw, Info, CheckCircle2, Package, BarChart3, AlertTriangle, ArrowRight, DollarSign, Truck } from 'lucide-react'
import { COUNTRIES } from '@/constants/countries'

export default function QuickCalculatorView() {
    // Regional state
    const [regional, setRegional] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pixora_regional')
            return saved ? JSON.parse(saved) : {
                country: 'CO',
                currency: 'COP',
                language: 'es',
                taxRate: '0',
            }
        }
        return { country: 'CO', currency: 'COP', language: 'es', taxRate: '0' }
    })

    const activeCountry = COUNTRIES.find(c => c.code === regional.country) || COUNTRIES.find(c => c.code === 'CO') || COUNTRIES[0]

    const [activeTab, setActiveTab] = useState<'cod' | 'prepaid' | 'compare'>('cod')

    const updateRegional = (countryCode: string) => {
        const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]
        const newReg = {
            country: country.code,
            currency: country.currency,
            language: 'es',
            taxRate: '0'
        }
        setRegional(newReg)
        localStorage.setItem('pixora_regional', JSON.stringify(newReg))
    }

    // Inputs
    const [providerPrice, setProviderPrice] = useState<number>(15000)
    const [baseFreight, setBaseFreight] = useState<number>(13000)
    const [deliveryRate, setDeliveryRate] = useState<number>(75)
    const [adminCosts, setAdminCosts] = useState<number>(2000)
    const [fulfillment, setFulfillment] = useState<number>(1500)
    const [cpaAds, setCpaAds] = useState<number>(10000)
    const [targetProfitPercent, setTargetProfitPercent] = useState<number>(25)

    const calculateResults = (type: 'cod' | 'prepaid') => {
        const isCOD = type === 'cod'

        // 1. Delivery Rate logic
        const dr = isCOD ? deliveryRate : 100
        const drDecimal = dr / 100

        // 2. Freight with Returns
        const fWithReturns = isCOD ? (baseFreight / (drDecimal || 1)) : baseFreight

        // 3. Real Effectiveness (for UI/Calculations)
        const realEff = isCOD ? Math.max(0, deliveryRate - 20) : 100
        const realEffDecimal = realEff / 100

        // 4. CPA Costeado
        const cCpa = isCOD ? (cpaAds / (realEffDecimal || 0.01)) : cpaAds

        // 5. Gateway Commission (Only for Prepaid)
        const gatewayPct = isCOD ? 0 : 0.035 // 3.5% avg

        // 6. Total Static Costs
        const staticCosts = providerPrice + fWithReturns + adminCosts + fulfillment + cCpa

        // 7. Suggested Price
        // If Prepaid: Price = StaticCosts / (1 - profitPct - gatewayPct)
        // If COD: Price = StaticCosts / (1 - profitPct)
        const profitPctDecimal = targetProfitPercent / 100
        const divisor = 1 - profitPctDecimal - gatewayPct
        const selling = staticCosts / (divisor || 0.01)

        const total = isCOD ? staticCosts : (staticCosts + (selling * gatewayPct))
        const profit = selling - total

        return {
            freightWithReturns: fWithReturns,
            realEffectiveness: realEff,
            costedCpa: cCpa,
            totalCosts: total,
            profitAmount: profit,
            suggestedPrice: selling,
            comparisonPrice: selling / 0.5,
            gatewayFee: selling * gatewayPct
        }
    }

    const codStats = calculateResults('cod')
    const prepaidStats = calculateResults('prepaid')

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(activeCountry.code === 'ES' ? 'es-ES' : activeCountry.code === 'MX' ? 'es-MX' : 'es-CO', {
            style: 'currency',
            currency: activeCountry.currency,
            maximumFractionDigits: 0
        }).format(Math.round(val || 0))
    }

    const ResultCard = ({ stats, title, subtitle, color }: any) => (
        <div className="card shadow-hover" style={{ padding: '0', borderRadius: '32px', background: 'white', border: `1px solid ${color}20`, overflow: 'hidden', height: '100%' }}>
            <div style={{ padding: '32px 40px', borderBottom: '1px solid #f0f0f0', background: `${color}05` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{subtitle}</div>
                        <h2 style={{ fontSize: '18px', fontWeight: 950, color: '#1a1a2e', margin: 0 }}>{title}</h2>
                    </div>
                    <div style={{ background: `${color}15`, padding: '12px 20px', borderRadius: '16px', border: `1px solid ${color}30`, textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color, textTransform: 'uppercase', marginBottom: '2px' }}>Venta Recomendada</div>
                        <div style={{ fontSize: '24px', fontWeight: 950, color }}>{formatCurrency(stats.suggestedPrice)}</div>
                    </div>
                </div>

                <div className="calc-results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div style={{ padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>COSTOS TOTALES</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#1a1a1a' }}>{formatCurrency(stats.totalCosts)}</div>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '16px', background: `${color}10`, border: `1px solid ${color}20` }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color, textTransform: 'uppercase', marginBottom: '8px' }}>UTILIDAD NETA {targetProfitPercent}%</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color }}>{formatCurrency(stats.profitAmount)}</div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '24px 40px', background: 'white' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Flete Real</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a2e' }}>{formatCurrency(stats.freightWithReturns)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>CPA Costeado</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a2e' }}>{formatCurrency(stats.costedCpa)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Efectividad</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: stats.realEffectiveness > 70 ? '#22c55e' : '#f59e0b' }}>{stats.realEffectiveness}%</div>
                    </div>
                </div>
                {stats.gatewayFee > 0 && (
                    <div style={{ marginTop: '16px', padding: '10px 16px', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>COMISIÓN PASARELA (3.5%)</span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#1a1a2e' }}>{formatCurrency(stats.gatewayFee)}</span>
                    </div>
                )}
                <div style={{ marginTop: '16px', padding: '10px 16px', background: '#f0f9ff', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px dashed #00c2ff40' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#0084ff' }}>PRECIO DE COMPARACIÓN 50%</span>
                    <span style={{ fontSize: '14px', fontWeight: 950, color: '#1a1a2e', textDecoration: 'line-through', opacity: 0.6 }}>{formatCurrency(stats.comparisonPrice)}</span>
                </div>
            </div>
        </div>
    )

    return (
        <div className="main-scroll custom-scrollbar calc-padding" style={{ padding: '40px', background: '#fcfcfd', minHeight: '100%' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div className="calc-header" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00c2ff', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            <Calculator size={14} /> Simulador Financiero v2.0
                        </div>
                        <h1 style={{ fontSize: 'min(36px, 8vw)', fontWeight: 950, color: '#1a1a2e', letterSpacing: '-0.03em', lineHeight: 1.2, margin: 0 }}>
                            Calculadora <span style={{ color: '#00c2ff' }}>Express</span>
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select
                            value={regional.country}
                            onChange={(e) => updateRegional(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 800, background: 'white', color: '#1a1a2e', cursor: 'pointer', outline: 'none' }}
                        >
                            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.currency})</option>)}
                        </select>

                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '6px', borderRadius: '16px', gap: '4px' }}>
                            {[
                                { id: 'cod', label: 'Contraentrega', icon: <Truck size={14} /> },
                                { id: 'prepaid', label: 'Anticipado', icon: <CheckCircle2 size={14} /> },
                                { id: 'compare', label: 'Comparativa', icon: <TrendingUp size={14} /> }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id as any)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800, transition: 'all 0.2s',
                                        background: activeTab === t.id ? 'white' : 'transparent',
                                        color: activeTab === t.id ? '#1a1a2e' : '#64748b',
                                        boxShadow: activeTab === t.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="responsive-grid grid-cols-2-1" style={{ gap: '32px', alignItems: 'start' }}>
                    {/* INPUTS PANEL */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="card shadow-hover" style={{ padding: '36px', borderRadius: '32px', background: 'white', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '32px' }}>
                                <div style={{ width: 40, height: 40, background: '#00c2ff10', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BarChart3 size={20} color="#00c2ff" />
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1a1a2e', margin: 0 }}>Configurar Parámetros</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="input-group">
                                    <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Costo del Producto</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><DollarSign size={16} /></div>
                                        <input type="number" value={providerPrice || ''} onChange={(e) => setProviderPrice(Number(e.target.value))} className="input-field" style={{ paddingLeft: '40px', fontSize: '16px', fontWeight: 700 }} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Flete Base</label>
                                        <input type="number" value={baseFreight || ''} onChange={(e) => setBaseFreight(Number(e.target.value))} className="input-field" style={{ fontWeight: 700 }} />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#22c55e', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>% Entrega (COD)</label>
                                        <input type="number" value={deliveryRate || ''} onChange={(e) => setDeliveryRate(Number(e.target.value))} className="input-field" style={{ fontWeight: 700, borderColor: '#22c55e30' }} disabled={activeTab === 'prepaid'} />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label style={{ fontSize: '11px', fontWeight: 900, color: '#0084ff', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>CPA (Costo por Compra Ads)</label>
                                    <input type="number" value={cpaAds || ''} onChange={(e) => setCpaAds(Number(e.target.value))} className="input-field" style={{ fontWeight: 700, borderColor: '#0084ff30' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Costos Admin</label>
                                        <input type="number" value={adminCosts || ''} onChange={(e) => setAdminCosts(Number(e.target.value))} className="input-field" style={{ fontWeight: 700 }} />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Empaque / Full</label>
                                        <input type="number" value={fulfillment || ''} onChange={(e) => setFulfillment(Number(e.target.value))} className="input-field" style={{ fontWeight: 700 }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', padding: '24px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 900, color: '#1a1a2e' }}>UTILIDAD OBJETIVO: <span style={{ color: '#00c2ff' }}>{targetProfitPercent}%</span></label>
                                    </div>
                                    <input
                                        type="range" min="5" max="50" step="5"
                                        value={targetProfitPercent}
                                        onChange={(e) => setTargetProfitPercent(Number(e.target.value))}
                                        style={{ width: '100%', accentColor: '#00c2ff' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RESULTS PANEL */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {activeTab === 'cod' && (
                            <ResultCard stats={codStats} title="Simulación Contraentrega" subtitle="Modelo de Negocio Estándar" color="#0084ff" />
                        )}
                        {activeTab === 'prepaid' && (
                            <ResultCard stats={prepaidStats} title="Simulación Pago Anticipado" subtitle="Modelo de Alta Eficiencia" color="#22c55e" />
                        )}
                        {activeTab === 'compare' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                <ResultCard stats={codStats} title="COD (Contraentrega)" subtitle="Variable" color="#0084ff" />
                                <ResultCard stats={prepaidStats} title="Anticipado" subtitle="Efectividad 100%" color="#22c55e" />
                            </div>
                        )}

                        <div className="card" style={{ padding: '24px', borderRadius: '24px', background: '#1a1a2e', color: 'white' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ background: '#00c2ff20', padding: '10px', borderRadius: '12px' }}>
                                    <TrendingUp size={20} color="#00c2ff" />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '8px' }}>Visión Estratégica</h4>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
                                        El modelo de <strong>Pago Anticipado</strong> te permite reducir el precio de venta en un <span style={{ color: '#22c55e' }}>{Math.round((1 - prepaidStats.suggestedPrice / codStats.suggestedPrice) * 100)}%</span> manteniendo la misma utilidad, ideal para ofertas agresivas.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .calc-padding { padding: 40px; }
                .input-field {
                    width: 100%; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 12px 16px;
                    outline: none; transition: all 0.2s; background: white; color: #1a1a2e;
                }
                .input-field:focus { border-color: #00c2ff; box-shadow: 0 0 0 4px rgba(0, 194, 255, 0.1); }
                .shadow-hover { transition: transform 0.2s, box-shadow 0.2s; }
                .shadow-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(0,0,0,0.06); }
                @media (max-width: 768px) {
                    .calc-padding { padding: 20px; }
                    .grid-cols-2-1 { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    )
}
