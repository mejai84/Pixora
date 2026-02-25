'use client'

import React, { useState, useEffect } from 'react'
import { Calculator, TrendingUp, RefreshCcw, Info, CheckCircle2, Package, BarChart3, AlertTriangle, ArrowRight, DollarSign } from 'lucide-react'
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

    // Inputs (Matching B-column sequence)
    const [providerPrice, setProviderPrice] = useState<number>(0) // B6
    const [baseFreight, setBaseFreight] = useState<number>(0)    // B7
    const [deliveryRate, setDeliveryRate] = useState<number>(0)     // C9
    const [adminCosts, setAdminCosts] = useState<number>(0)          // B10
    const [fulfillment, setFulfillment] = useState<number>(0)        // B11
    const [cpaAds, setCpaAds] = useState<number>(0)              // B12
    const [targetProfitPercent, setTargetProfitPercent] = useState<number>(0) // C15

    // Calculated Results
    const [freightWithReturns, setFreightWithReturns] = useState(0)  // B8
    const [realEffectiveness, setRealEffectiveness] = useState(55)   // C13
    const [costedCpa, setCostedCpa] = useState(0)                   // B13
    const [totalCosts, setTotalCosts] = useState(0)                 // B14
    const [profitAmount, setProfitAmount] = useState(0)             // B15
    const [suggestedPrice, setSuggestedPrice] = useState(0)         // B16
    const [comparisonPrice, setComparisonPrice] = useState(0)       // B17

    useEffect(() => {
        // 1. Flete con devoluciones (B8) = B7 / C9 
        const deliveryRateDecimal = deliveryRate / 100
        const fWithReturns = baseFreight / (deliveryRateDecimal || 1)
        setFreightWithReturns(fWithReturns)

        // 2. % de efectividad real (C13) = C9 - 20%
        // En Excel, si C9 es 75%, C9-20% es 55%.
        const realEff = Math.max(0, deliveryRate - 20)
        setRealEffectiveness(realEff)
        const realEffDecimal = realEff / 100

        // 3. CPA costeado (B13) = B12 / C13
        const cCpa = cpaAds / (realEffDecimal || 0.01)
        setCostedCpa(cCpa)

        // 4. Costos totales (B14) = B6 + B8 + B10 + B11 + B13
        const total = providerPrice + fWithReturns + adminCosts + fulfillment + cCpa
        setTotalCosts(total)

        // 5. Utilidad (B15) = B14 / (1 - C15) - B14
        const profitPctDecimal = targetProfitPercent / 100
        const profit = (total / (1 - profitPctDecimal)) - total
        setProfitAmount(profit)

        // 6. Precio de venta (B16) = B14 + B15
        const selling = total + profit
        setSuggestedPrice(selling)

        // 7. Precio de Comparación 50% (B17) = B16 / 50%
        setComparisonPrice(selling / 0.5)

    }, [providerPrice, baseFreight, deliveryRate, adminCosts, fulfillment, cpaAds, targetProfitPercent])

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(activeCountry.code === 'ES' ? 'es-ES' : 'es-CO', {
            style: 'currency',
            currency: activeCountry.currency,
            maximumFractionDigits: 0
        }).format(Math.round(val || 0))
    }

    return (
        <div className="main-scroll custom-scrollbar" style={{ padding: '40px', background: '#fcfcfd', minHeight: '100%' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00c2ff', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                        <Calculator size={14} /> Inteligencia de Negocios
                    </div>
                    <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.03em' }}>
                        Simulador de <span style={{ background: 'linear-gradient(90deg, #00c2ff, #0084ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Escala Real</span>
                    </h1>
                    <p style={{ color: '#666', fontSize: '15px', marginTop: '8px' }}>Calcula tu punto de equilibrio y rentabilidad neta proyectada considerando la efectividad real de tu operación.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '32px', alignItems: 'start' }}>

                    {/* COLUMNA DE ENTRADAS (B) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="card shadow-hover" style={{ padding: '32px', borderRadius: '24px', background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '24px', color: '#1a1a1a', opacity: 0.8 }}>DATOS DE OPERACIÓN</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="input-group">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Precio Proveedor</label>
                                        <div title="Ingresa el costo neto que pagas a tu proveedor por el producto. Sirve para conocer tu punto de partida antes de gastos operativos." style={{ cursor: 'help', color: '#ccc' }}><Info size={12} /></div>
                                    </div>
                                    <input type="number" value={providerPrice === 0 ? '' : providerPrice} onChange={(e) => setProviderPrice(Number(e.target.value))} className="input-field shadow-sm" style={{ fontSize: '15px' }} />
                                </div>

                                <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="input_group">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Flete Base</label>
                                            <div title="Ingresa el valor acordado con la transportadora por un envío. Es la base para proyectar el costo total de logística." style={{ cursor: 'help', color: '#ccc' }}><Info size={12} /></div>
                                        </div>
                                        <input type="number" value={baseFreight === 0 ? '' : baseFreight} onChange={(e) => setBaseFreight(Number(e.target.value))} className="input-field shadow-sm" />
                                    </div>
                                    <div className="input-group">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: 800, color: '#2ecc71', textTransform: 'uppercase' }}>% Entrega</label>
                                            <div title="Este es el % de efectividad sin incluir cancelados y rechazados, ósea solo tomando en cuenta lo que despachamos ya que solo estos pedidos pagan flete" style={{ cursor: 'help', color: '#ccc' }}><Info size={12} /></div>
                                        </div>
                                        <input type="number" value={deliveryRate === 0 ? '' : deliveryRate} onChange={(e) => setDeliveryRate(Number(e.target.value))} className="input-field shadow-sm" style={{ borderColor: 'rgba(46, 204, 113, 0.2)' }} />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 800, color: '#0084ff', textTransform: 'uppercase' }}>CPA Ads Manager</label>
                                        <div title="Ingresa el costo por compra que te muestra Facebook o TikTok. Se usará para calcular tu CPA Costeado Real (que siempre es mayor)." style={{ cursor: 'help', color: '#ccc' }}><Info size={12} /></div>
                                    </div>
                                    <input type="number" value={cpaAds === 0 ? '' : cpaAds} onChange={(e) => setCpaAds(Number(e.target.value))} className="input-field shadow-sm" style={{ borderColor: 'rgba(0, 132, 255, 0.2)' }} />
                                </div>

                                <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="input-group">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Administrativos</label>
                                            <div title="Ingresa gastos de personal, herramientas o servicios divididos por venta estimada. Ayuda a llegar a una utilidad neta real, no bruta." style={{ cursor: 'help', color: '#ccc' }}><Info size={12} /></div>
                                        </div>
                                        <input type="number" value={adminCosts === 0 ? '' : adminCosts} onChange={(e) => setAdminCosts(Number(e.target.value))} className="input-field shadow-sm" />
                                    </div>
                                    <div className="input-group">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Fullfillment</label>
                                            <div title="Ingresa el costo de bolsas, cinta, etiquetas y el pago por preparar el paquete. Es vital para no perder dinero en la operación." style={{ cursor: 'help', color: '#ccc' }}><Info size={12} /></div>
                                        </div>
                                        <input type="number" value={fulfillment === 0 ? '' : fulfillment} onChange={(e) => setFulfillment(Number(e.target.value))} className="input-field shadow-sm" />
                                    </div>
                                </div>

                                <div style={{ marginTop: '12px', padding: '20px', background: '#f8f9fa', borderRadius: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#1a1a1a' }}>MÁRGEN DE UTILIDAD DESEADO: <span style={{ color: '#00c2ff' }}>{targetProfitPercent}%</span></label>
                                        <div title="Define qué porcentaje del PRECIO FINAL quieres que sea tu ganancia neta. La calculadora ajustará el precio de venta para cumplir esta meta." style={{ cursor: 'help', color: '#ccc' }}><Info size={12} /></div>
                                    </div>
                                    <input
                                        type="range" min="1" max="50" step="1"
                                        value={targetProfitPercent}
                                        onChange={(e) => setTargetProfitPercent(Number(e.target.value))}
                                        style={{ width: '100%', accentColor: '#00c2ff', cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DE RESULTADOS - DISEÑO PREMIUM CLARO */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* PANEL DE RESULTADOS PRINCIPAL */}
                        <div className="card shadow-hover" style={{ padding: '0', borderRadius: '32px', background: 'white', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <div style={{ padding: '40px', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Vende este producto a</div>
                                        <div style={{ fontSize: '52px', fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.04em' }}>
                                            {formatCurrency(suggestedPrice)}
                                        </div>
                                    </div>
                                    <div style={{ background: '#f0f9ff', padding: '16px 24px', borderRadius: '20px', border: '1px solid #d0e3ff', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#0084ff', textTransform: 'uppercase' }}>Efectividad Real</div>
                                            <div title="Este es el % de efectividad incluyendo cancelados y rechazados, ósea solo tomando en cuenta todo lo que contamos como venta en Shopify, es un 10% más pues es el promedio que manejamos, pero se debe ajustar según tu operación" style={{ cursor: 'help', color: '#0084ff' }}><Info size={10} /></div>
                                        </div>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#0084ff' }}>{realEffectiveness}%</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                    <div style={{ padding: '16px', borderRadius: '16px', background: '#fff9f0', border: '1px solid #fee6c4' }}>
                                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', marginBottom: '8px' }}>Flete c/ Dev.</div>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a' }}>{formatCurrency(freightWithReturns)}</div>
                                    </div>
                                    <div style={{ padding: '16px', borderRadius: '16px', background: '#f5f7ff', border: '1px solid #dbe1ff' }}>
                                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '8px' }}>CPA Costeado</div>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6' }}>{formatCurrency(costedCpa)}</div>
                                    </div>
                                    <div style={{ padding: '16px', borderRadius: '16px', background: '#f5fff9', border: '1px solid #dbffe8' }}>
                                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginBottom: '8px' }}>Utilidad Proy.</div>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>{formatCurrency(profitAmount)}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Costos Totales</div>
                                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#1a1a1a' }}>{formatCurrency(totalCosts)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Comparación 50%</div>
                                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#94a3b8', textDecoration: 'line-through' }}>{formatCurrency(comparisonPrice)}</div>
                                </div>
                            </div>
                        </div>

                        {/* MENSAJES DE ESTRATEGIA */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="card shadow-hover" style={{ padding: '24px', borderRadius: '24px', background: '#fff1f2', border: '1px solid #ffe4e6' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ background: '#f43f5e', padding: '8px', borderRadius: '10px' }}>
                                        <AlertTriangle size={16} color="white" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#9f1239', marginBottom: '8px' }}>Regla de Escala</h4>
                                        <p style={{ fontSize: '11px', color: '#be123c', lineHeight: '1.6', fontWeight: 500 }}>
                                            Si tu CPA en Apps es mayor a <strong>{formatCurrency(cpaAds)}</strong>, tu utilidad caerá por debajo del {targetProfitPercent}%.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="card shadow-hover" style={{ padding: '24px', borderRadius: '24px', background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ background: '#22c55e', padding: '8px', borderRadius: '10px' }}>
                                        <CheckCircle2 size={16} color="white" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#166534', marginBottom: '8px' }}>Efectividad Real</h4>
                                        <p style={{ fontSize: '11px', color: '#15803d', lineHeight: '1.6', fontWeight: 500 }}>
                                            Tu efectividad es {realEffectiveness}%. No te engañes con el Ads Manager, este es tu costo real.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RESUMEN EXPLICATIVO */}
                        <div className="card shadow-hover" style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <Info size={16} color="#0084ff" />
                                <span style={{ fontSize: '13px', fontWeight: 800 }}>¿Cómo se calcula esto?</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '11px', color: '#666', display: 'flex', gap: '8px' }}>
                                    <div style={{ width: '4px', height: '16px', background: '#00c2ff', borderRadius: '2px', flexShrink: 0 }} />
                                    <span><strong>Flete con Devoluciones:</strong> Toma tu flete base y lo divide por tu tasa de entrega para cubrir lo que pierdes en fletes fallidos.</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#666', display: 'flex', gap: '8px' }}>
                                    <div style={{ width: '4px', height: '16px', background: '#22c55e', borderRadius: '2px', flexShrink: 0 }} />
                                    <span><strong>Utilidad:</strong> Calculada sobre el precio final después de cubrir todos los costos operativos reales.</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#666', display: 'flex', gap: '8px' }}>
                                    <div style={{ width: '4px', height: '16px', background: '#f43f5e', borderRadius: '2px', flexShrink: 0 }} />
                                    <span><strong>CPA Costeado:</strong> Es lo que realmente puedes pagar por cliente considerando que no todos los pedidos se entregan.</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
