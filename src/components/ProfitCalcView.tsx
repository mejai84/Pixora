'use client'

import React, { useState, useEffect } from 'react'
import {
    Calculator, Plus, Trash2, TrendingUp, TrendingDown,
    Calendar, Target, Percent, ArrowRight, Globe, Info,
    Cloud, History, Settings, Package, ShoppingCart, DollarSign,
    Save, ChevronRight, AlertCircle, BarChart3
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DailyRecord {
    id: string
    date: string
    type: 'Testeo' | 'Estable' | 'Escalando' | 'Inestable' | 'Upsell'
    productName: string
    cancelRate: number
    returnRate: number
    productCost: number
    baseShipping: number
    returnShipping: number
    adminCosts: number
    shopifySales: number
    adSpend: number
    sellingPrice: number
}

const COUNTRIES = [
    { code: 'CO', name: 'Colombia', currency: 'COP', symbol: '$' },
    { code: 'MX', name: 'México', currency: 'MXN', symbol: '$' },
    { code: 'ES', name: 'España', currency: 'EUR', symbol: '€' },
    { code: 'US', name: 'USA', currency: 'USD', symbol: '$' },
]

export default function ProfitCalcView() {
    const [records, setRecords] = useState<DailyRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data, error } = await supabase
                        .from('profit_records')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (data) {
                        const formatted = data.map((r: any) => ({
                            id: r.id,
                            record_id: r.record_id,
                            date: r.date,
                            type: r.type,
                            productName: r.product_name,
                            cancelRate: r.cancel_rate,
                            returnRate: r.return_rate,
                            productCost: r.product_cost,
                            baseShipping: r.base_shipping,
                            returnShipping: r.return_shipping,
                            adminCosts: r.admin_costs,
                            shopifySales: r.shopify_sales,
                            adSpend: r.ad_spend,
                            sellingPrice: r.selling_price
                        }))
                        setRecords(formatted)
                    }
                }
            } catch (error) {
                console.error('Error fetching records:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchRecords()
    }, [])

    const [country, setCountry] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('pixora_profit_country') || 'CO'
        }
        return 'CO'
    })

    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
    const activeCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0]

    // Form Stats (for the professional card look)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const activeRecord = records.find(r => r.id === selectedId) || records.filter(r => r.date === filterDate)[0] || null

    useEffect(() => {
        if (activeRecord && !selectedId) setSelectedId(activeRecord.id)
    }, [activeRecord, selectedId])

    const addRecord = async () => {
        const newRecordData = {
            date: filterDate,
            type: 'Testeo' as any,
            productName: 'Nuevo Producto',
            cancelRate: 10,
            returnRate: 25,
            productCost: country === 'CO' ? 12000 : 5,
            baseShipping: country === 'CO' ? 16500 : 10,
            returnShipping: country === 'CO' ? 22000 : 12,
            adminCosts: 0,
            shopifySales: 0,
            adSpend: 0,
            sellingPrice: country === 'CO' ? 65000 : 25,
            country
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data, error } = await supabase
                    .from('profit_records')
                    .insert({
                        user_id: user.id,
                        record_id: Math.random().toString(36).substr(2, 9),
                        date: newRecordData.date,
                        type: newRecordData.type,
                        product_name: newRecordData.productName,
                        cancel_rate: newRecordData.cancelRate,
                        return_rate: newRecordData.returnRate,
                        product_cost: newRecordData.productCost,
                        base_shipping: newRecordData.baseShipping,
                        return_shipping: newRecordData.returnShipping,
                        admin_costs: newRecordData.adminCosts,
                        shopify_sales: newRecordData.shopifySales,
                        ad_spend: newRecordData.adSpend,
                        selling_price: newRecordData.sellingPrice,
                        country: newRecordData.country
                    })
                    .select()

                if (data && data[0]) {
                    const r = data[0]
                    const formatted: DailyRecord = {
                        id: r.id,
                        date: r.date,
                        type: r.type,
                        productName: r.product_name,
                        cancelRate: r.cancel_rate,
                        returnRate: r.return_rate,
                        productCost: r.product_cost,
                        baseShipping: r.base_shipping,
                        returnShipping: r.return_shipping,
                        adminCosts: r.admin_costs,
                        shopifySales: r.shopify_sales,
                        adSpend: r.ad_spend,
                        sellingPrice: r.selling_price
                    }
                    setRecords([formatted, ...records])
                    setSelectedId(formatted.id)
                }
            }
        } catch (error) {
            console.error('Error adding record:', error)
        }
    }

    const updateRecord = async (id: string, updates: Partial<DailyRecord>) => {
        setRecords(records.map(r => r.id === id ? { ...r, ...updates } : r))

        // Sync with DB (de-coupled to not block UI)
        const dbUpdates: any = {}
        if (updates.productName !== undefined) dbUpdates.product_name = updates.productName
        if (updates.type !== undefined) dbUpdates.type = updates.type
        if (updates.shopifySales !== undefined) dbUpdates.shopify_sales = updates.shopifySales
        if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice
        if (updates.adSpend !== undefined) dbUpdates.ad_spend = updates.adSpend
        if (updates.productCost !== undefined) dbUpdates.product_cost = updates.productCost
        if (updates.baseShipping !== undefined) dbUpdates.base_shipping = updates.baseShipping
        if (updates.adminCosts !== undefined) dbUpdates.admin_costs = updates.adminCosts
        if (updates.cancelRate !== undefined) dbUpdates.cancel_rate = updates.cancelRate
        if (updates.returnRate !== undefined) dbUpdates.return_rate = updates.returnRate
        if (updates.returnShipping !== undefined) dbUpdates.return_shipping = updates.returnShipping

        await supabase.from('profit_records').update(dbUpdates).eq('id', id)
    }

    const deleteRecord = async (id: string) => {
        if (confirm('¿Eliminar este registro?')) {
            await supabase.from('profit_records').delete().eq('id', id)
            setRecords(records.filter(r => r.id !== id))
            if (selectedId === id) setSelectedId(null)
        }
    }

    useEffect(() => {
        localStorage.setItem('pixora_profit_country', country)
    }, [country])

    const calculateMetrics = (r: DailyRecord) => {
        const effectiveness = Math.max(0, 1 - (r.cancelRate / 100) - (r.returnRate / 100))
        const effectiveSales = Math.max(0.1, r.shopifySales * effectiveness) // Avoid division by zero
        const dispatched = r.shopifySales * (1 - (r.cancelRate / 100))
        const returned = dispatched * (r.returnRate / 100)

        const grossRevenue = effectiveSales * r.sellingPrice
        const productTotalCost = effectiveSales * r.productCost
        const shippingTotalCost = (dispatched * r.baseShipping) + (returned * r.returnShipping)
        const adminTotalCost = effectiveSales * r.adminCosts

        const totalCost = productTotalCost + shippingTotalCost + adminTotalCost + r.adSpend
        const profit = grossRevenue - totalCost
        const roi = r.adSpend > 0 ? (profit / r.adSpend) * 100 : 0

        // Video-specific logic: CPA and Freight per Delivered unit
        const cpaAdsManager = r.shopifySales > 0 ? r.adSpend / r.shopifySales : 0
        const cpaCosteado = r.adSpend / effectiveSales
        const fleteReal = shippingTotalCost / effectiveSales

        return {
            effectiveness: (effectiveness * 100).toFixed(0) + '%',
            effectiveSales: effectiveSales.toFixed(1),
            dispatched: dispatched.toFixed(1),
            returned: returned.toFixed(1),
            profit: Math.round(profit),
            roi: Math.round(roi),
            cpaAdsManager: Math.round(cpaAdsManager),
            cpaCosteado: Math.round(cpaCosteado),
            fleteReal: Math.round(fleteReal),
            grossRevenue: Math.round(grossRevenue),
            isProfitable: profit >= 0
        }
    }

    const currentMetrics = activeRecord ? calculateMetrics(activeRecord) : null
    const dayRecords = records.filter(r => r.date === filterDate)
    const dayProfit = dayRecords.reduce((acc, r) => acc + calculateMetrics(r).profit, 0)

    return (
        <div className="main-scroll custom-scrollbar" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 40px' }}>

                {/* Global Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '32px 0 24px' }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ background: '#4CAF50', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calculator color="white" size={24} />
                            </div>
                            Control Operativo
                        </h1>
                        <p style={{ color: '#999', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
                            Gestión de rentabilidad diaria • {activeCountry.name} ({activeCountry.currency})
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div className="card" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
                            <Globe size={14} color="#999" />
                            <select value={country} onChange={e => setCountry(e.target.value)} style={{ border: 'none', background: 'none', fontSize: 13, fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
                                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="card" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.8)' }}>
                            <Calendar size={14} color="#4CAF50" />
                            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ border: 'none', background: 'none', fontSize: 13, fontWeight: 700, outline: 'none' }} />
                        </div>
                        <button onClick={addRecord} className="btn-primary" style={{ height: 44, borderRadius: 12, padding: '0 20px', boxShadow: '0 10px 20px rgba(76, 175, 80, 0.2)' }}>
                            <Plus size={18} /> Nuevo Costeo
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: 32 }}>

                    {/* Left Side: Inputs and Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Selected Record Inputs */}
                        {activeRecord ? (
                            <div className="card" style={{ padding: 0, borderRadius: 20, overflow: 'hidden', border: '1px solid #eee' }}>
                                <div style={{ background: '#fcfcfc', padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: 14, fontWeight: 800, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Package size={16} color="#4CAF50" /> ENTRADAS DEL PRODUCTO
                                    </h2>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#999', background: '#eee', padding: '4px 8px', borderRadius: 6 }}>ID: {activeRecord.id}</div>
                                </div>
                                <div style={{ padding: 24 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        <Field label="Nombre del Producto" icon={<ShoppingCart size={12} />}>
                                            <input value={activeRecord.productName} onChange={e => updateRecord(activeRecord.id, { productName: e.target.value })} className="input-field" placeholder="Ej: Humidificador..." />
                                        </Field>
                                        <Field label="Categoría / Estado" icon={<Target size={12} />}>
                                            <select value={activeRecord.type} onChange={e => updateRecord(activeRecord.id, { type: e.target.value as any })} className="input-field" style={{ cursor: 'pointer' }}>
                                                <option>Testeo</option><option>Estable</option><option>Escalando</option><option>Inestable</option><option>Upsell</option>
                                            </select>
                                        </Field>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 20 }}>
                                        <Field label="Ventas Shopify" icon={<DollarSign size={12} />}>
                                            <input type="number" value={activeRecord.shopifySales} onChange={e => updateRecord(activeRecord.id, { shopifySales: Number(e.target.value) })} className="input-field" style={{ fontWeight: 700, color: '#3498db' }} />
                                        </Field>
                                        <Field label="Precio Venta" icon={<DollarSign size={12} />}>
                                            <input type="number" value={activeRecord.sellingPrice} onChange={e => updateRecord(activeRecord.id, { sellingPrice: Number(e.target.value) })} className="input-field" style={{ fontWeight: 700, color: '#2ecc71' }} />
                                        </Field>
                                        <Field label="Gasto Publicidad" icon={<Target size={12} />}>
                                            <input type="number" value={activeRecord.adSpend} onChange={e => updateRecord(activeRecord.id, { adSpend: Number(e.target.value) })} className="input-field" style={{ fontWeight: 700, color: '#e74c3c' }} />
                                        </Field>
                                    </div>

                                    {/* Advanced Options */}
                                    <div style={{ marginTop: 32, padding: 24, background: '#f9f9f9', borderRadius: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                                            <Settings size={14} color="#666" />
                                            <span style={{ fontSize: 12, fontWeight: 800, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opciones Avanzadas de Costeo</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                            <Field label="Costo Prov ($)">
                                                <input type="number" value={activeRecord.productCost} onChange={e => updateRecord(activeRecord.id, { productCost: Number(e.target.value) })} className="input-field" />
                                            </Field>
                                            <Field label="Flete Base ($)">
                                                <input type="number" value={activeRecord.baseShipping} onChange={e => updateRecord(activeRecord.id, { baseShipping: Number(e.target.value) })} className="input-field" />
                                            </Field>
                                            <Field label="Admin / Otros ($)">
                                                <input type="number" value={activeRecord.adminCosts} onChange={e => updateRecord(activeRecord.id, { adminCosts: Number(e.target.value) })} className="input-field" />
                                            </Field>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                                            <Field label="% Cancelados">
                                                <input type="number" value={activeRecord.cancelRate} onChange={e => updateRecord(activeRecord.id, { cancelRate: Number(e.target.value) })} className="input-field" />
                                            </Field>
                                            <Field label="% Devolución">
                                                <input type="number" value={activeRecord.returnRate} onChange={e => updateRecord(activeRecord.id, { returnRate: Number(e.target.value) })} className="input-field" />
                                            </Field>
                                            <Field label="Flete Dev ($)">
                                                <input type="number" value={activeRecord.returnShipping} onChange={e => updateRecord(activeRecord.id, { returnShipping: Number(e.target.value) })} className="input-field" />
                                            </Field>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 64, textAlign: 'center', border: '2px dashed #eee', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <History size={48} color="#ddd" style={{ marginBottom: 16 }} />
                                <h3 style={{ color: '#999', fontWeight: 600 }}>Selecciona un registro o crea uno nuevo</h3>
                                <button onClick={addRecord} style={{ marginTop: 20, color: '#4CAF50', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }}>+ Empezar Costeo</button>
                            </div>
                        )}

                        {/* Summary List */}
                        <div className="card" style={{ padding: 0, borderRadius: 20 }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: '#333' }}>REGISTROS DEL DÍA ({dayRecords.length})</span>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#4CAF50' }}>Total: {activeCountry.symbol}{dayProfit.toLocaleString()}</div>
                            </div>
                            <div style={{ maxHeight: 300, overflowY: 'auto' }} className="custom-scrollbar">
                                {dayRecords.map(r => {
                                    const m = calculateMetrics(r)
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => setSelectedId(r.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', padding: '16px 24px',
                                                borderBottom: '1px solid #f8f8f8', cursor: 'pointer',
                                                background: selectedId === r.id ? '#f0faf0' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{r.productName || 'Producto sin nombre'}</div>
                                                <div style={{ fontSize: 10, color: '#999', marginTop: 2, fontWeight: 800, textTransform: 'uppercase' }}>{r.type} • {r.shopifySales} VENTAS</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 14, fontWeight: 900, color: m.isProfitable ? '#4CAF50' : '#e74c3c' }}>
                                                    {activeCountry.symbol}{m.profit.toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: 10, color: '#999', fontWeight: 700 }}>{m.roi}% ROI</div>
                                            </div>
                                            <ChevronRight size={16} color="#eee" style={{ marginLeft: 16 }} />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Results Card */}
                    <div style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
                        {currentMetrics ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                                {/* Professional Result Card */}
                                <div className="card" style={{
                                    padding: 0, borderRadius: 24, overflow: 'hidden',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f9fbf9 100%)',
                                    boxShadow: '0 30px 60px rgba(0,0,0,0.06)',
                                    border: '1px solid #f0f0f0'
                                }}>
                                    <div style={{ background: '#fcfcfc', padding: 24, textAlign: 'center', borderBottom: '1px dotted #eee' }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RESULTADOS DEL DÍA</span>
                                        <div style={{ marginTop: 16 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block' }}>RECAUDO BRUTO EFECTIVO</span>
                                            <div style={{ fontSize: 40, fontWeight: 950, color: '#1a1a2e', marginTop: 4 }}>
                                                {activeCountry.symbol}{currentMetrics.grossRevenue.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <ResultBox label="UTILIDAD NETA" value={`${activeCountry.symbol}${currentMetrics.profit.toLocaleString()}`} color={currentMetrics.isProfitable ? '#4CAF50' : '#e74c3c'} />
                                        <ResultBox label="ROI FINAL" value={`${currentMetrics.roi}%`} color="#1a1a2e" />
                                        <ResultBox label="CPA ADS MGR" value={`${activeCountry.symbol}${currentMetrics.cpaAdsManager.toLocaleString()}`} detail="Lo que ves en FB/TT" />
                                        <ResultBox label="CPA COSTEADO" value={`${activeCountry.symbol}${currentMetrics.cpaCosteado.toLocaleString()}`} detail="Con 'Seguro' inefect." highlight />
                                    </div>

                                    <div style={{ padding: '0 24px 24px' }}>
                                        <div style={{ background: '#f5f5f5', borderRadius: 16, padding: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: '#999' }}>EFECTIVIDAD REAL</span>
                                                <span style={{ fontSize: 13, fontWeight: 900, color: '#1a1a2e' }}>{currentMetrics.effectiveness}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                                                <MiniStat label="PEDIDO" val={activeRecord.shopifySales} />
                                                <MiniStat label="ENVIADO" val={currentMetrics.dispatched} />
                                                <MiniStat label="ENTREGADO" val={currentMetrics.effectiveSales} color="#4CAF50" />
                                            </div>
                                            <div style={{ borderTop: '1px solid #ddd', paddingTop: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#666' }}>FLETE REAL x ENTREGA:</span>
                                                    <span style={{ fontSize: 11, fontWeight: 900, color: '#1a1a2e' }}>{activeCountry.symbol}{currentMetrics.fleteReal.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="btn-primary" style={{ width: '100%', marginTop: 20, height: 54, borderRadius: 16, background: '#1a1a2e', fontSize: 14, fontWeight: 800 }}>
                                            <Cloud size={18} /> Guardar en Nube
                                        </button>
                                        <button onClick={() => deleteRecord(activeRecord.id)} style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: '#e74c3c', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                            ELIMINAR REGISTRO ACTUAL
                                        </button>
                                    </div>
                                </div>

                                {/* Tips / Analytics Card */}
                                <div className="card" style={{ padding: 20, borderRadius: 20, background: '#f0faf0', border: '1px solid #defaca' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <AlertCircle size={20} color="#4CAF50" style={{ flexShrink: 0 }} />
                                        <div>
                                            <h4 style={{ fontSize: 13, fontWeight: 800, color: '#2d5a27' }}>Recomendación IA</h4>
                                            <p style={{ fontSize: 11, color: '#4a7a44', marginTop: 4, lineHeight: 1.5 }}>
                                                {currentMetrics.roi > 50
                                                    ? 'El ROI es excelente. Considera escalar el presupuesto diario en Meta Ads un 20% manteniendo creativos.'
                                                    : 'El ROI está bajo el margen objetivo. Revisa el costo por flete o intenta negociar el precio con el proveedor.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Field({ label, icon, children }: { label: string, icon?: React.ReactNode, children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                {icon} {label}
            </label>
            {children}
        </div>
    )
}

function ResultBox({ label, value, color, highlight, detail }: { label: string, value: string, color?: string, highlight?: boolean, detail?: string }) {
    return (
        <div style={{
            background: highlight ? '#f0f4ff' : 'white',
            border: `1px solid ${highlight ? '#dce4ff' : '#eee'}`,
            padding: '16px', borderRadius: 16
        }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</span>
            <span style={{ fontSize: 18, fontWeight: 950, color: color || (highlight ? '#3498db' : '#1a1a2e') }}>{value}</span>
            {detail && <span style={{ fontSize: 9, fontWeight: 700, color: '#bbb', display: 'block', marginTop: 4 }}>{detail}</span>}
        </div>
    )
}

function MiniStat({ label, val, color }: { label: string, val: string | number, color?: string }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: '#999', textTransform: 'uppercase', display: 'block' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 950, color: color || '#1a1a2e', marginTop: 2 }}>{val}</span>
        </div>
    )
}

function Badge({ val, color }: { val: string, color: string }) {
    return (
        <span style={{
            background: color + '15', color: color, padding: '4px 10px',
            borderRadius: 8, fontSize: 10, fontWeight: 900, border: `1px solid ${color}20`
        }}>
            {val}
        </span>
    )
}
