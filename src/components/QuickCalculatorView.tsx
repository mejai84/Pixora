'use client'

import React, { useState, useEffect } from 'react'
import { Calculator, DollarSign, PieChart, TrendingUp, RefreshCcw, Info, CheckCircle2 } from 'lucide-react'

export default function QuickCalculatorView() {
    const [cost, setCost] = useState<number>(0)
    const [price, setPrice] = useState<number>(0)
    const [shipping, setShipping] = useState<number>(15000)
    const [adSpend, setAdSpend] = useState<number>(0)
    const [cancelRate, setCancelRate] = useState<number>(15)

    // Results
    const [grossProfit, setGrossProfit] = useState(0)
    const [netProfit, setNetProfit] = useState(0)
    const [margin, setMargin] = useState(0)
    const [breakevenRoas, setBreakevenRoas] = useState(0)

    useEffect(() => {
        // Simple fast calculation
        const effectivePrice = price > 0 ? price : 0
        const effectiveCost = cost > 0 ? cost : 0
        const effectiveShipping = shipping > 0 ? shipping : 0

        // Bruto per unit delivered
        const unitGross = effectivePrice - effectiveCost - effectiveShipping

        // Expected Profit considering cancellations (simplified)
        // Expected Revenue = Price * (1 - CancelRate/100)
        // Expected Cost = (Cost + Shipping) * (1 - CancelRate/100) + AdSpend

        const deliveredRate = (100 - cancelRate) / 100
        const totalGross = (effectivePrice - effectiveCost - effectiveShipping) * deliveredRate
        const totalNet = totalGross - adSpend

        setGrossProfit(totalGross)
        setNetProfit(totalNet)
        setMargin(effectivePrice > 0 ? (totalNet / (effectivePrice * deliveredRate)) * 100 : 0)
        setBreakevenRoas(unitGross > 0 ? effectivePrice / unitGross : 0)
    }, [cost, price, shipping, adSpend, cancelRate])

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(val)
    }

    return (
        <div className="main-scroll custom-scrollbar" style={{ padding: '40px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                        Calculadora <span style={{ color: '#ff4d4d' }}>Express</span>
                    </h1>
                    <p style={{ color: '#666', fontSize: '15px' }}>Calcula la viabilidad de tu producto en segundos.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', alignItems: 'start' }}>
                    {/* Inputs Card */}
                    <div className="card shadow-hover" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: '#fff5f5', padding: '10px', borderRadius: '12px' }}>
                                <Calculator size={20} color="#ff4d4d" />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Variables del Producto</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Costo del Producto</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        value={cost || ''}
                                        onChange={(e) => setCost(Number(e.target.value))}
                                        className="input-field"
                                        placeholder="0"
                                        style={{ paddingLeft: '40px', fontSize: '16px', fontWeight: 600 }}
                                    />
                                    <DollarSign size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Precio de Venta</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        value={price || ''}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                        className="input-field"
                                        placeholder="0"
                                        style={{ paddingLeft: '40px', fontSize: '16px', fontWeight: 600, border: '2px solid #ff4d4d20' }}
                                    />
                                    <TrendingUp size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ff4d4d' }} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Costo de Flete (Promedio)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        value={shipping || ''}
                                        onChange={(e) => setShipping(Number(e.target.value))}
                                        className="input-field"
                                        placeholder="15000"
                                        style={{ paddingLeft: '40px' }}
                                    />
                                    <RefreshCcw size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Inversión Diaria Ads</label>
                                    <input
                                        type="number"
                                        value={adSpend || ''}
                                        onChange={(e) => setAdSpend(Number(e.target.value))}
                                        className="input-field"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>% Cancelación</label>
                                    <input
                                        type="number"
                                        value={cancelRate || ''}
                                        onChange={(e) => setCancelRate(Number(e.target.value))}
                                        className="input-field"
                                        placeholder="15"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
                            padding: '40px',
                            borderRadius: '32px',
                            color: 'white',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                <div>
                                    <h4 style={{ fontSize: '12px', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Utilidad Estimada</h4>
                                    <div style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.03em' }}>
                                        {formatCurrency(netProfit)}
                                    </div>
                                </div>
                                <div style={{ background: netProfit > 0 ? '#4CAF50' : '#ff4d4d', padding: '8px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 900 }}>
                                    {margin.toFixed(1)}% MARGEN
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', marginBottom: '4px' }}>Breakeven ROAS</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800 }}>{breakevenRoas.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', marginBottom: '4px' }}>CPA Ideal</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800 }}>{formatCurrency(grossProfit / (adSpend > 0 ? adSpend / 1000 : 1))}</div>
                                    <div style={{ fontSize: '9px', opacity: 0.4 }}>Basado en inversión actual</div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Tips */}
                        <div className="card" style={{ padding: '24px', borderRadius: '24px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <Info size={16} color="#3b82f6" />
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Analizador de Viabilidad</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {breakevenRoas > 3 ? (
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <CheckCircle2 size={16} color="#4CAF50" style={{ marginTop: '2px' }} />
                                        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                                            <strong style={{ color: '#334155' }}>Excelente margen.</strong> Tienes campo suficiente para escalar agresivamente. Tu costo de adquisición puede ser alto y seguirás siendo rentable.
                                        </p>
                                    </div>
                                ) : breakevenRoas > 2 ? (
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <CheckCircle2 size={16} color="#fbbf24" style={{ marginTop: '2px' }} />
                                        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                                            <strong style={{ color: '#334155' }}>Margen saludable.</strong> Es un producto estándar viable. Asegúrate de optimizar tus creativos para mantener un ROAS por encima de {breakevenRoas.toFixed(2)}.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <Info size={16} color="#ff4d4d" style={{ marginTop: '2px' }} />
                                        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                                            <strong style={{ color: '#334155' }}>Margen ajustado.</strong> Requiere una operación muy eficiente. Considera subir el precio o negociar costos con el proveedor para mayor seguridad.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="card" style={{ padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px' }}>
                                    <PieChart size={16} color="#22c55e" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Eficiencia Operativa</div>
                                    <div style={{ fontSize: '14px', fontWeight: 800 }}>{((1 - (cost + shipping) / (price || 1)) * 100).toFixed(0)}%</div>
                                </div>
                            </div>
                            <div className="card" style={{ padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px' }}>
                                    <RefreshCcw size={16} color="#ef4444" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Costo Real / Entrega</div>
                                    <div style={{ fontSize: '14px', fontWeight: 800 }}>{formatCurrency((cost + shipping) / ((100 - cancelRate) / 100))}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
