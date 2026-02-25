'use client'

import React, { useState, useEffect } from 'react'
import { Calculator, Percent, TrendingUp, RefreshCcw, Info, CheckCircle2, DollarSign, Package, UserCheck, BarChart3 } from 'lucide-react'

export default function QuickCalculatorView() {
    // Inputs
    const [providerPrice, setProviderPrice] = useState<number>(12000)
    const [baseFreight, setBaseFreight] = useState<number>(16500)
    const [deliveryRate, setDeliveryRate] = useState<number>(75)
    const [confirmationRate, setConfirmationRate] = useState<number>(85)
    const [adminCosts, setAdminCosts] = useState<number>(0)
    const [fulfillment, setFulfillment] = useState<number>(0)
    const [cpaAds, setCpaAds] = useState<number>(15000)
    const [targetProfitPercent, setTargetProfitPercent] = useState<number>(30)
    const [customSellingPrice, setCustomSellingPrice] = useState<number>(0)

    // Calculated Results
    const [realEffectiveness, setRealEffectiveness] = useState(0)
    const [freightWithReturns, setFreightWithReturns] = useState(0)
    const [costedCpa, setCostedCpa] = useState(0)
    const [totalCosts, setTotalCosts] = useState(0)
    const [suggestedPrice, setSuggestedPrice] = useState(0)
    const [profitAmount, setProfitAmount] = useState(0)
    const [currentMargin, setCurrentMargin] = useState(0)

    useEffect(() => {
        // 1. Real Effectiveness = Confirmation * Delivery
        const eff = (confirmationRate / 100) * (deliveryRate / 100)
        setRealEffectiveness(eff * 100)

        // 2. Freight with returns = Base Freight / (Delivery Rate / 100)
        const fFreight = baseFreight / (deliveryRate / 100)
        setFreightWithReturns(fFreight)

        // 3. Costed CPA = CPA Ads / Real Effectiveness
        const cCpa = cpaAds / eff
        setCostedCpa(cCpa)

        // 4. Total Costs = Provider + Freight Returns + Admin + Fulfillment + Costed CPA
        const total = providerPrice + fFreight + adminCosts + fulfillment + cCpa
        setTotalCosts(total)

        // 5. Suggested Price for target profit %
        // Formula: Price = Costs / (1 - Margin%)
        const suggested = total / (1 - targetProfitPercent / 100)
        setSuggestedPrice(suggested)

        // 6. Current Stats based on selling price
        const activePrice = customSellingPrice > 0 ? customSellingPrice : suggested
        const profit = activePrice - total
        setProfitAmount(profit)
        setCurrentMargin((profit / activePrice) * 100)

    }, [providerPrice, baseFreight, deliveryRate, confirmationRate, adminCosts, fulfillment, cpaAds, targetProfitPercent, customSellingPrice])

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(val || 0)
    }

    return (
        <div className="main-scroll custom-scrollbar" style={{ padding: '40px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                            Estrategia <span style={{ color: '#00c2ff' }}>Ivan Caicedo</span>
                        </h1>
                        <p style={{ color: '#666', fontSize: '15px' }}>Cálculo basado en efectividad real y escala de costos.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', alignItems: 'start' }}>
                    {/* INPUTS COLUMN */}
                    <div className="card shadow-hover" style={{ padding: '32px', borderRadius: '24px', background: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '12px' }}>
                                <Calculator size={20} color="#00c2ff" />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Variables de Operación</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Producto y Flete */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Precio Proveedor</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" value={providerPrice || ''} onChange={(e) => setProviderPrice(Number(e.target.value))} className="input-field" style={{ paddingLeft: '32px' }} />
                                        <Package size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Flete Base (CO)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" value={baseFreight || ''} onChange={(e) => setBaseFreight(Number(e.target.value))} className="input-field" style={{ paddingLeft: '32px' }} />
                                        <RefreshCcw size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Eficiencia */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>% Entrega (Transporte)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" value={deliveryRate || ''} onChange={(e) => setDeliveryRate(Number(e.target.value))} className="input-field" style={{ paddingLeft: '32px', color: '#4CAF50', fontWeight: 700 }} />
                                        <TrendingUp size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4CAF50' }} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>% Confirmación (CallCenter)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" value={confirmationRate || ''} onChange={(e) => setConfirmationRate(Number(e.target.value))} className="input-field" style={{ paddingLeft: '32px', color: '#7c3aed', fontWeight: 700 }} />
                                        <UserCheck size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7c3aed' }} />
                                    </div>
                                </div>
                            </div>

                            {/* CPA Ads */}
                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>CPA ADS MANAGER (Facebook/TikTok)</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="number" value={cpaAds || ''} onChange={(e) => setCpaAds(Number(e.target.value))} className="input-field" style={{ paddingLeft: '32px', background: '#f5f9ff', border: '1px solid #d0e3ff' }} />
                                    <BarChart3 size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3b82f6' }} />
                                </div>
                            </div>

                            {/* Otros Gastos */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Gastos Administración</label>
                                    <input type="number" value={adminCosts || ''} onChange={(e) => setAdminCosts(Number(e.target.value))} className="input-field" />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Fullfillment/Bolsas</label>
                                    <input type="number" value={fulfillment || ''} onChange={(e) => setFulfillment(Number(e.target.value))} className="input-field" />
                                </div>
                            </div>

                            {/* Meta de Utilidad */}
                            <div className="input-group" style={{ paddingTop: '16px', borderTop: '1px solid #eee' }}>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '12px' }}>Deseo ganar el <span style={{ color: '#00c2ff' }}>{targetProfitPercent}%</span> del precio final</label>
                                <input
                                    type="range" min="10" max="60" step="5"
                                    value={targetProfitPercent}
                                    onChange={(e) => setTargetProfitPercent(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#00c2ff', cursor: 'pointer' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* RESULTS COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{
                            background: '#111827',
                            padding: '40px',
                            borderRadius: '32px',
                            color: 'white',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Accent blur */}
                            <div style={{ position: 'absolute', top: -100, right: -100, width: 250, height: 250, background: '#00c2ff', opacity: 0.15, filter: 'blur(80px)', borderRadius: '50%' }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>Vende este producto a:</div>
                                        <div style={{ fontSize: '48px', fontWeight: 900, color: '#00c2ff', letterSpacing: '-0.04em' }}>
                                            {formatCurrency(suggestedPrice)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Efectividad Real</div>
                                            <div style={{ fontSize: '18px', fontWeight: 900 }}>{realEffectiveness.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', padding: '32px 0', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div>
                                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>CPA Costeado (Real)</div>
                                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#f87171' }}>{formatCurrency(costedCpa)}</div>
                                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>No medir en {cpaAds.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Flete con Devoluciones</div>
                                        <div style={{ fontSize: '20px', fontWeight: 800 }}>{formatCurrency(freightWithReturns)}</div>
                                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>Base: {formatCurrency(baseFreight)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', paddingTop: '32px' }}>
                                    <div>
                                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Costos Totales</div>
                                        <div style={{ fontSize: '20px', fontWeight: 800 }}>{formatCurrency(totalCosts)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Utilidad Proyectada</div>
                                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#4ade80' }}>{formatCurrency(profitAmount)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Custom Price Check */}
                        <div className="card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <TrendingUp size={16} color="#6366f1" />
                                <span style={{ fontSize: '13px', fontWeight: 700 }}>¿Y si lo vendo a este precio?</span>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    placeholder="Ingresa un precio..."
                                    className="input-field"
                                    style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}
                                    onChange={(e) => setCustomSellingPrice(Number(e.target.value))}
                                />
                                <div style={{ minWidth: '100px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Margen Real</div>
                                    <div style={{ fontSize: '16px', fontWeight: 900, color: currentMargin > 20 ? '#10b981' : '#f59e0b' }}>
                                        {currentMargin.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tips Table Clone */}
                        <div className="card" style={{ padding: '24px', borderRadius: '24px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <Info size={16} color="#3b82f6" />
                                <span style={{ fontSize: '13px', fontWeight: 700 }}>Resumen para Catálogo</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Precio de Venta Sugerido</span>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>{formatCurrency(suggestedPrice)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Precio Comparación (50% OFF)</span>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textDecoration: 'line-through' }}>{formatCurrency(suggestedPrice * 2)}</span>
                                </div>

                                <div style={{ marginTop: '12px', padding: '16px', background: '#eff6ff', borderRadius: '16px', display: 'flex', gap: '12px' }}>
                                    <CheckCircle2 size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                                    <p style={{ fontSize: '11px', color: '#1e40af', lineHeight: '1.5' }}>
                                        <strong>Regla de Oro:</strong> No midas tus resultados basándote en el CPA de Facebook ({formatCurrency(cpaAds)}). Tu CPA real después de devoluciones y pauta es de <strong>{formatCurrency(costedCpa)}</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
