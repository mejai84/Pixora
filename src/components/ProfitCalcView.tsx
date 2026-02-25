'use client'

import React, { useState, useEffect } from 'react'
import {
    Activity, TrendingUp,
    Globe, ChevronRight, AlertCircle, Plus,
    History, Calendar, Cloud,
    Save, ArrowRight, Trash2, HelpCircle, Box
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { COUNTRIES } from '@/constants/countries'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Legend, Cell
} from 'recharts'

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
    tiktokSpend: number
    otherSpend: number
    sellingPrice: number
    country?: string
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

export default function ProfitCalcView() {
    const [records, setRecords] = useState<DailyRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data } = await supabase
                        .from('profit_records')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (data) {
                        const formatted = data.map((r: any) => ({
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
                            tiktokSpend: r.tiktok_spend || 0,
                            otherSpend: r.other_spend || 0,
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
    const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0])
    const [filterMode, setFilterMode] = useState<'day' | 'range'>('day')
    const [isSyncing, setIsSyncing] = useState(false)
    const [importLoading, setImportLoading] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isReportsOpen, setIsReportsOpen] = useState(false)
    // Reports modal own filters
    const [rptDate, setRptDate] = useState(new Date().toISOString().split('T')[0])
    const [rptEndDate, setRptEndDate] = useState(new Date().toISOString().split('T')[0])
    const [rptMode, setRptMode] = useState<'day' | 'range'>('range')
    const [rptView, setRptView] = useState<'producto' | 'fecha'>('producto')

    const activeCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0]

    const activeRecord = records.find(r => r.id === selectedId) || null

    const addRecord = () => {
        // Local-first: create the record immediately in state so the UI always responds
        const tempId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
        const newRecord: DailyRecord = {
            id: tempId,
            date: filterDate,
            type: 'Testeo',
            productName: '',
            cancelRate: 0,
            returnRate: 0,
            productCost: 0,
            baseShipping: 0,
            returnShipping: 0,
            adminCosts: 0,
            shopifySales: 0,
            adSpend: 0,
            tiktokSpend: 0,
            otherSpend: 0,
            sellingPrice: 0,
            country
        }
        setRecords(prev => [newRecord, ...prev])
        setSelectedId(tempId)
        setIsEditing(false)
        setIsModalOpen(true)
    }

    const updateRecord = (id: string, updates: Partial<DailyRecord>) => {
        setRecords(records.map(r => r.id === id ? { ...r, ...updates } : r))
    }

    const syncRecordToDB = async (record: DailyRecord) => {
        setIsSyncing(true)
        try {
            const payload = {
                date: record.date,
                product_name: record.productName,
                type: record.type,
                shopify_sales: record.shopifySales,
                selling_price: record.sellingPrice,
                ad_spend: record.adSpend,
                product_cost: record.productCost,
                base_shipping: record.baseShipping,
                admin_costs: record.adminCosts,
                cancel_rate: record.cancelRate,
                return_rate: record.returnRate,
                return_shipping: record.returnShipping,
                tiktok_spend: record.tiktokSpend,
                other_spend: record.otherSpend
            }

            const isLocal = record.id.startsWith('local_')

            if (isLocal) {
                // First time saving — INSERT a new row
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { alert('Sesión expirada.'); return }

                const { data, error } = await supabase.from('profit_records').insert({
                    ...payload,
                    user_id: user.id,
                    record_id: Math.random().toString(36).substr(2, 9),
                    date: record.date,
                    country: record.country || 'CO'
                }).select().single()

                if (error) throw error

                // Replace local temp ID with real DB UUID
                setRecords(prev => prev.map(r => r.id === record.id ? { ...r, id: data.id } : r))
                setSelectedId(data.id)
                alert('¡Registro guardado correctamente!')
            } else {
                // Already in DB — UPDATE
                const { error } = await supabase.from('profit_records').update(payload).eq('id', record.id)
                if (error) throw error
                alert('¡Sincronizado correctamente!')
            }
        } catch (error: any) {
            console.error('Error syncing:', error)
            alert('Error al guardar: ' + (error.message || 'revisa la consola'))
        } finally {
            setIsSyncing(false)
        }
    }

    const deleteRecord = async (id: string) => {
        if (!confirm('¿Eliminar este registro?')) return
        // Local records just need state cleanup, no DB call
        if (!id.startsWith('local_')) {
            await supabase.from('profit_records').delete().eq('id', id)
        }
        setRecords(prev => prev.filter(r => r.id !== id))
        setSelectedId(null)
        setIsModalOpen(false)
    }

    const clearHistory = async () => {
        if (!confirm('¿Borrar TODO el historial? Esta acción no se puede deshacer.')) return
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { alert('Sesión expirada.'); return }
            const { error } = await supabase.from('profit_records').delete().eq('user_id', user.id)
            if (error) throw error
            setRecords([])
            setSelectedId(null)
            alert('¡Historial borrado!')
        } catch (err: any) {
            alert('Error al borrar. Limpiando vista local.')
            setRecords([])
        }
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImportLoading(true)
        try {
            const { read, utils } = await import('xlsx')
            const arrayBuffer = await file.arrayBuffer()
            const wb = read(arrayBuffer)
            const ws = wb.Sheets[wb.SheetNames[0]]
            const jsonData = utils.sheet_to_json(ws) as any[]
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const getVal = (row: any, keys: string[], def: any = 0) => {
                const k = Object.keys(row).find(k => keys.some(pk => k.toLowerCase().trim() === pk.toLowerCase().trim()))
                return k ? row[k] : def
            }
            const imports = jsonData.filter(row => Object.keys(row).length > 2).map(row => {
                const shopifySales = Number(getVal(row, ['Ventas', 'Ventas Shopify', 'Sales'], 0))
                const cpa = Number(getVal(row, ['CPA', 'Costo Ad'], 0))
                let adSpend = Number(getVal(row, ['Ads', 'Gasto Ads', 'ad_spend', 'Publicidad'], 0))
                if (adSpend === 0 && cpa > 0 && shopifySales > 0) adSpend = cpa * shopifySales
                return {
                    user_id: user.id,
                    record_id: Math.random().toString(36).substr(2, 9),
                    date: getVal(row, ['Fecha', 'Date'], filterDate),
                    type: getVal(row, ['Estado', 'Type'], 'Testeo'),
                    product_name: getVal(row, ['Producto', 'Product'], ''),
                    shopify_sales: shopifySales,
                    selling_price: Number(getVal(row, ['Precio', 'Price'], 0)),
                    ad_spend: adSpend,
                    tiktok_spend: 0,
                    other_spend: 0,
                    product_cost: Number(getVal(row, ['Costo', 'product_cost'], 0)),
                    base_shipping: Number(getVal(row, ['Flete', 'base_shipping'], 0)),
                    admin_costs: Number(getVal(row, ['Admin', 'admin_costs'], 0)),
                    cancel_rate: Number(getVal(row, ['Cancelados', 'cancel_rate'], 0)),
                    return_rate: Number(getVal(row, ['Devoluciones', 'return_rate'], 0)),
                    return_shipping: 0,
                    country
                }
            })
            if (imports.length === 0) {
                alert('No se encontraron datos válidos en el archivo. Revisa que las columnas tengan nombres correctos (Fecha, Producto, Ventas, etc.)')
                return
            }

            const { data: inserted, error } = await supabase.from('profit_records').insert(imports).select()

            if (error) throw error

            if (inserted) {
                const formatted = inserted.map((r: any) => ({
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
                    tiktokSpend: r.tiktok_spend || 0,
                    otherSpend: r.other_spend || 0,
                    sellingPrice: r.selling_price
                }))
                setRecords(prev => [...formatted, ...prev])
                alert(`¡${inserted.length} registros importados con éxito!`)
            }
        } catch (error) {
            alert('Error al importar')
        } finally {
            setImportLoading(false)
        }
    }

    useEffect(() => {
        localStorage.setItem('pixora_profit_country', country)
    }, [country])

    const calculateMetrics = (r: DailyRecord): CalculatedMetrics => {
        const cancelRateDec = (r.cancelRate || 0) / 100
        const returnRateDec = (r.returnRate || 0) / 100
        const fleteConDev = returnRateDec < 1 ? r.baseShipping / (1 - returnRateDec) : r.baseShipping
        const effectivenessNum = Math.max(0, 1 - cancelRateDec - returnRateDec)
        const effectiveSales = (r.shopifySales || 0) * effectivenessNum
        const totalAdSpend = (r.adSpend || 0) + (r.tiktokSpend || 0) + (r.otherSpend || 0)
        const cpa = effectiveSales > 0 ? totalAdSpend / effectiveSales : 0
        const profitPerProduct = r.sellingPrice - r.productCost - fleteConDev - (r.adminCosts || 0) - cpa
        const cpaBkven = cpa + profitPerProduct
        const totalProfit = (effectiveSales * (r.sellingPrice - r.productCost - fleteConDev - (r.adminCosts || 0))) - totalAdSpend
        const roi = totalAdSpend > 0 ? (totalProfit / totalAdSpend) * 100 : 0
        return {
            effectiveness: effectivenessNum,
            effectiveSales: effectiveSales,
            fleteConDev: Math.round(fleteConDev),
            totalAdSpend: Math.round(totalAdSpend),
            cpa: Math.round(cpa),
            cpaBkven: Math.round(cpaBkven),
            profitPerProduct: Math.round(profitPerProduct),
            totalProfit: Math.round(totalProfit),
            roi: Math.round(roi),
            grossRevenue: Math.round(effectiveSales * r.sellingPrice),
            isProfitable: totalProfit >= 0
        }
    }

    const currentMetrics = activeRecord ? calculateMetrics(activeRecord) : null
    const dayRecords = records
    const dayProfit = dayRecords.reduce((acc: number, r: DailyRecord) => acc + calculateMetrics(r).totalProfit, 0)

    return (
        <div className="main-scroll custom-scrollbar" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 40px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '32px 0 24px' }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ background: '#4CAF50', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Activity color="white" size={24} />
                            </div>
                            Control Operativo
                        </h1>
                        <p style={{ color: '#999', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
                            Rentabilidad diaria de campañas • {activeCountry.name} ({activeCountry.currency})
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="card" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Globe size={14} color="#999" />
                            <select value={country} onChange={e => setCountry(e.target.value)} style={{ border: 'none', background: 'none', fontSize: 13, fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
                                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                        </div>
                        <label className="btn-secondary" style={{ height: 44, borderRadius: 12, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'white', border: '1px solid #eee' }}>
                            {importLoading ? <History className="animate-spin" size={16} /> : <Cloud size={16} />}
                            <span style={{ fontSize: 12, fontWeight: 700 }}>Importar</span>
                            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} style={{ display: 'none' }} />
                        </label>
                        <button onClick={() => setIsReportsOpen(true)} className="btn-secondary" style={{ height: 44, borderRadius: 12, padding: '0 20px', background: 'white', border: '1px solid #dde', color: '#5b21b6', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Activity size={16} /> Informes
                        </button>
                        <button onClick={addRecord} className="btn-primary" style={{ height: 44, borderRadius: 12, padding: '0 20px', boxShadow: '0 10px 20px rgba(76, 175, 80, 0.2)' }}>
                            <Plus size={18} /> Nuevo Costeo
                        </button>
                    </div>
                </div>

                {/* History Table — main content */}
                <div className="card" style={{ padding: 0, borderRadius: 28, overflow: 'hidden', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                    {/* Table Header */}
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1a1a2e' }}>HISTORIAL DE OPERACIONES</h3>
                            <p style={{ fontSize: 11, color: '#999', fontWeight: 600, marginTop: 4 }}>
                                {dayRecords.length} registros para el periodo • Haz clic en una fila para editar
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ textAlign: 'right', borderRight: '1px solid #eee', paddingRight: 20 }}>
                                <span style={{ fontSize: 9, fontWeight: 900, color: '#999', textTransform: 'uppercase', display: 'block' }}>Utilidad Total</span>
                                <div style={{ fontSize: 22, fontWeight: 950, color: dayProfit >= 0 ? '#2ecc71' : '#e74c3c', marginTop: 2 }}>
                                    {activeCountry.symbol}{dayProfit.toLocaleString()}
                                </div>
                            </div>
                            <button onClick={clearHistory} style={{ background: 'white', border: '1px solid #ffeaea', color: '#e74c3c', padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Trash2 size={14} /> Borrar todo
                            </button>
                            <button
                                onClick={() => {
                                    const h = ['Producto', 'Fecha', 'Tipo', 'Ventas', 'Efectivas', 'Ads', 'CPA', 'Flete', 'Costo', 'Utilidad', 'ROI']
                                    const rows = dayRecords.map(r => { const m = calculateMetrics(r); return [r.productName, r.date, r.type, r.shopifySales, m.effectiveSales, m.totalAdSpend, m.cpa, m.fleteConDev, r.productCost, m.totalProfit, m.roi].join(',') })
                                    const blob = new Blob([[h.join(','), ...rows].join('\n')], { type: 'text/csv' })
                                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `costeo_${filterDate}.csv`; a.click()
                                }}
                                className="btn-secondary"
                                style={{ background: 'white', border: '1px solid #eee', fontSize: 11, fontWeight: 700 }}
                            >
                                <Cloud size={14} /> CSV
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead style={{ background: '#f9f9f9', position: 'sticky', top: 0, zIndex: 5 }}>
                                <tr>
                                    <th style={tableTh}>Producto / Estado</th>
                                    <th style={tableTh}>Canales Ads</th>
                                    <th style={tableTh}>Ventas</th>
                                    <th style={tableTh}>Flete</th>
                                    <th style={tableTh}>Costos</th>
                                    <th style={tableTh}>CPA</th>
                                    <th style={tableTh}>Util/Prod</th>
                                    <th style={tableTh}>Util Total</th>
                                    <th style={tableTh}>ROI</th>
                                    <th style={tableTh}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {dayRecords.map(r => {
                                    const m = calculateMetrics(r)
                                    const isSelected = selectedId === r.id
                                    return (
                                        <tr
                                            key={r.id}
                                            onClick={() => { setSelectedId(r.id); setIsEditing(true); setIsModalOpen(true) }}
                                            style={{ cursor: 'pointer', background: isSelected ? '#f0faf0' : 'white', transition: 'background 0.15s', borderBottom: '1px solid #f5f5f5' }}
                                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#fafafa' }}
                                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'white' }}
                                        >
                                            <td style={tableTd}>
                                                <div style={{ fontWeight: 800, color: '#1a1a2e' }}>{r.productName || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Sin nombre</span>}</div>
                                                <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{r.type} • {r.date}</div>
                                            </td>
                                            <td style={tableTd}>
                                                <div style={{ fontSize: 11 }}>Meta: <b>{activeCountry.symbol}{r.adSpend.toLocaleString()}</b></div>
                                                <div style={{ fontSize: 11 }}>TikTok: <b>{activeCountry.symbol}{r.tiktokSpend.toLocaleString()}</b></div>
                                                {r.otherSpend > 0 && <div style={{ fontSize: 11 }}>Otras: <b>{activeCountry.symbol}{r.otherSpend.toLocaleString()}</b></div>}
                                            </td>
                                            <td style={tableTd}>
                                                <div style={{ fontWeight: 700 }}>{r.shopifySales} <span style={{ color: '#ccc' }}>tot.</span></div>
                                                <div style={{ fontSize: 11, color: '#2ecc71', fontWeight: 800 }}>{m.effectiveSales.toFixed(1)} efec.</div>
                                            </td>
                                            <td style={tableTd}>
                                                <div style={{ fontWeight: 700 }}>{activeCountry.symbol}{m.fleteConDev.toLocaleString()}</div>
                                                <div style={{ fontSize: 10, color: '#bbb' }}>base {activeCountry.symbol}{r.baseShipping.toLocaleString()}</div>
                                            </td>
                                            <td style={tableTd}>
                                                <div style={{ fontSize: 11 }}>Prov: {activeCountry.symbol}{r.productCost.toLocaleString()}</div>
                                                <div style={{ fontSize: 11 }}>Fijo: {activeCountry.symbol}{r.adminCosts.toLocaleString()}</div>
                                            </td>
                                            <td style={tableTd}>
                                                <div style={{ fontWeight: 700 }}>{activeCountry.symbol}{m.cpa.toLocaleString()}</div>
                                                <div style={{ fontSize: 10, color: '#3498db' }}>BK {activeCountry.symbol}{m.cpaBkven.toLocaleString()}</div>
                                            </td>
                                            <td style={{ ...tableTd, fontWeight: 700, color: m.profitPerProduct >= 0 ? '#2ecc71' : '#e74c3c' }}>
                                                {activeCountry.symbol}{m.profitPerProduct.toLocaleString()}
                                            </td>
                                            <td style={{ ...tableTd, fontWeight: 950, fontSize: 15, color: m.isProfitable ? '#2ecc71' : '#e74c3c' }}>
                                                {activeCountry.symbol}{m.totalProfit.toLocaleString()}
                                            </td>
                                            <td style={{ ...tableTd, fontWeight: 800, color: m.roi >= 30 ? '#2ecc71' : '#f39c12' }}>
                                                {m.roi}%
                                            </td>
                                            <td style={tableTd}><ChevronRight size={16} color="#ddd" /></td>
                                        </tr>
                                    )
                                })}
                                {dayRecords.length === 0 && (
                                    <tr>
                                        <td colSpan={10} style={{ padding: 100, textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                                                <div style={{ width: 72, height: 72, background: '#f5f5f5', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <History size={36} color="#ddd" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a2e' }}>Sin operaciones para este período</div>
                                                    <p style={{ color: '#999', fontSize: 13, marginTop: 6 }}>Crea tu primer costeo del día para medir tu rentabilidad.</p>
                                                </div>
                                                <button onClick={addRecord} className="btn-primary" style={{ height: 44, borderRadius: 12, marginTop: 4 }}>
                                                    <Plus size={16} /> Crear Primer Costeo
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ===== MODAL INFORMES ===== */}
                {isReportsOpen && (() => {
                    // Filter records by reports date range
                    const rptRecords = records.filter(r => {
                        if (rptMode === 'day') return r.date === rptDate
                        return r.date >= rptDate && r.date <= rptEndDate
                    })

                    // KPI totals
                    const totalProfit = rptRecords.reduce((s: number, r: DailyRecord) => s + calculateMetrics(r).totalProfit, 0)
                    const totalAdSpend = rptRecords.reduce((s: number, r: DailyRecord) => s + calculateMetrics(r).totalAdSpend, 0)
                    const totalSales = rptRecords.reduce((s: number, r: DailyRecord) => s + (r.shopifySales || 0), 0)
                    const totalEffective = rptRecords.reduce((s: number, r: DailyRecord) => s + calculateMetrics(r).effectiveSales, 0)
                    const avgROI = rptRecords.length ? rptRecords.reduce((s: number, r: DailyRecord) => s + calculateMetrics(r).roi, 0) / rptRecords.length : 0

                    // Group by product
                    const byProduct: Record<string, { profit: number; adSpend: number; sales: number; effective: number; count: number }> = {}
                    rptRecords.forEach((r: DailyRecord) => {
                        const key = r.productName || '(Sin nombre)'
                        if (!byProduct[key]) byProduct[key] = { profit: 0, adSpend: 0, sales: 0, effective: 0, count: 0 }
                        const m = calculateMetrics(r)
                        byProduct[key].profit += m.totalProfit
                        byProduct[key].adSpend += m.totalAdSpend
                        byProduct[key].sales += r.shopifySales
                        byProduct[key].effective += m.effectiveSales
                        byProduct[key].count++
                    })

                    // Group by date
                    const byDate: Record<string, { profit: number; adSpend: number; sales: number; count: number }> = {}
                    rptRecords.forEach((r: DailyRecord) => {
                        if (!byDate[r.date]) byDate[r.date] = { profit: 0, adSpend: 0, sales: 0, count: 0 }
                        const m = calculateMetrics(r)
                        byDate[r.date].profit += m.totalProfit
                        byDate[r.date].adSpend += m.totalAdSpend
                        byDate[r.date].sales += r.shopifySales
                        byDate[r.date].count++
                    })

                    const kpiStyle: React.CSSProperties = { background: '#f8f9ff', borderRadius: 16, padding: '16px 20px', flex: 1, minWidth: 120 }
                    const thS: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#999', borderBottom: '2px solid #f0f0f0' }
                    const tdS: React.CSSProperties = { padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f5f5f5' }

                    return (
                        <div
                            style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,30,0.75)', backdropFilter: 'blur(14px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                            onClick={e => { if (e.target === e.currentTarget) setIsReportsOpen(false) }}
                        >
                            <div style={{ width: '100%', maxWidth: 1000, maxHeight: '92vh', overflowY: 'auto', borderRadius: 28, background: 'white', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', animation: 'fadeIn 0.25s ease' }}>
                                {/* Header */}
                                <div style={{ padding: '22px 32px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10, borderRadius: '28px 28px 0 0' }}>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, background: '#ede9fe', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Activity size={16} color="#5b21b6" />
                                            </div>
                                            Informes de Rentabilidad
                                        </h2>
                                        <p style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{rptRecords.length} registros en el período • {activeCountry.name}</p>
                                    </div>

                                    {/* Filters */}
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <div style={{ display: 'flex', background: '#f4f4f8', borderRadius: 10, overflow: 'hidden' }}>
                                            {(['producto', 'fecha'] as const).map(v => (
                                                <button key={v} onClick={() => setRptView(v)} style={{ padding: '7px 14px', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', background: rptView === v ? '#5b21b6' : 'transparent', color: rptView === v ? 'white' : '#888', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                                                    Por {v}
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', background: '#f4f4f8', borderRadius: 10, overflow: 'hidden' }}>
                                            {([['day', 'Día'], ['range', 'Rango']] as const).map(([v, label]) => (
                                                <button key={v} onClick={() => setRptMode(v)} style={{ padding: '7px 14px', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', background: rptMode === v ? '#1a1a2e' : 'transparent', color: rptMode === v ? 'white' : '#888', transition: 'all 0.2s' }}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                        <input type="date" value={rptDate} onChange={e => setRptDate(e.target.value)} style={{ border: '1px solid #eee', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 700, outline: 'none' }} />
                                        {rptMode === 'range' && (
                                            <>
                                                <span style={{ color: '#bbb', fontSize: 12 }}>→</span>
                                                <input type="date" value={rptEndDate} onChange={e => setRptEndDate(e.target.value)} style={{ border: '1px solid #eee', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 700, outline: 'none' }} />
                                            </>
                                        )}
                                        <button onClick={() => setIsReportsOpen(false)} style={{ width: 38, height: 38, background: '#f5f5f5', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 20, color: '#666' }}>×</button>
                                    </div>
                                </div>

                                <div style={{ padding: '28px 32px' }}>
                                    {/* KPI row */}
                                    <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
                                        {[
                                            { label: 'Utilidad Total', value: `${activeCountry.symbol}${totalProfit.toLocaleString()}`, color: totalProfit >= 0 ? '#4CAF50' : '#e74c3c' },
                                            { label: 'Gasto en Ads', value: `${activeCountry.symbol}${totalAdSpend.toLocaleString()}`, color: '#e74c3c' },
                                            { label: 'Ventas Totales', value: String(totalSales), color: '#3498db' },
                                            { label: 'Ventas Efectivas', value: String(totalEffective), color: '#2ecc71' },
                                            { label: 'ROI Promedio', value: `${avgROI.toFixed(1)}%`, color: avgROI >= 0 ? '#4CAF50' : '#e74c3c' },
                                            { label: 'Registros', value: String(rptRecords.length), color: '#5b21b6' },
                                        ].map(kpi => (
                                            <div key={kpi.label} style={kpiStyle}>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', marginBottom: 6 }}>{kpi.label}</div>
                                                <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Charts Section */}
                                    {rptRecords.length > 0 && (
                                        <div style={{ marginBottom: 32, padding: 24, background: '#fcfcfd', borderRadius: 20, border: '1px solid #efeff5' }}>
                                            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <TrendingUp size={16} color="#5b21b6" />
                                                Visualización de Rendimiento
                                            </h3>
                                            <div style={{ height: 300, width: '100%' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {rptView === 'producto' ? (
                                                        <BarChart data={Object.entries(byProduct).map(([name, d]) => ({ name, utilidad: d.profit })).sort((a, b) => b.utilidad - a.utilidad)}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(value) => `${activeCountry.symbol}${value.toLocaleString()}`} />
                                                            <Tooltip
                                                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                                                formatter={(value: any) => [`${activeCountry.symbol}${Number(value).toLocaleString()}`, 'Utilidad']}
                                                            />
                                                            <Bar dataKey="utilidad" radius={[6, 6, 0, 0]}>
                                                                {Object.entries(byProduct).map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry[1].profit >= 0 ? '#4CAF50' : '#e74c3c'} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    ) : (
                                                        <LineChart data={Object.entries(byDate).map(([date, d]) => ({ date, utilidad: d.profit, inversion: d.adSpend })).sort((a, b) => a.date.localeCompare(b.date))}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                                            <Tooltip
                                                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                                            />
                                                            <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 10 }} />
                                                            <Line type="monotone" dataKey="utilidad" stroke="#5b21b6" strokeWidth={3} dot={{ r: 4, fill: '#5b21b6' }} activeDot={{ r: 6 }} name="Utilidad Neta" />
                                                            <Line type="monotone" dataKey="inversion" stroke="#e74c3c" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Inversión Ads" />
                                                        </LineChart>
                                                    )}
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {/* Dynamic Table */}
                                    {rptRecords.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>
                                            <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                            <p style={{ fontWeight: 700 }}>Sin registros en este período</p>
                                            <p style={{ fontSize: 12, marginTop: 4 }}>Cambia el rango de fechas para ver datos</p>
                                        </div>
                                    ) : rptView === 'producto' ? (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                                <thead style={{ background: '#f9f9fc' }}>
                                                    <tr>
                                                        <th style={thS}>Producto</th>
                                                        <th style={thS}>Registros</th>
                                                        <th style={thS}>V. Totales</th>
                                                        <th style={thS}>V. Efectivas</th>
                                                        <th style={thS}>Gasto Ads</th>
                                                        <th style={thS}>Utilidad</th>
                                                        <th style={thS}>ROI</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(byProduct).sort((a, b) => b[1].profit - a[1].profit).map(([name, d]) => {
                                                        const roi = d.adSpend > 0 ? ((d.profit / d.adSpend) * 100) : 0
                                                        return (
                                                            <tr key={name} style={{ background: 'white' }}>
                                                                <td style={{ ...tdS, fontWeight: 800, color: '#1a1a2e' }}>{name}</td>
                                                                <td style={tdS}>{d.count}</td>
                                                                <td style={tdS}>{d.sales}</td>
                                                                <td style={{ ...tdS, color: '#2ecc71', fontWeight: 700 }}>{d.effective}</td>
                                                                <td style={{ ...tdS, color: '#e74c3c' }}>{activeCountry.symbol}{d.adSpend.toLocaleString()}</td>
                                                                <td style={{ ...tdS, fontWeight: 900, color: d.profit >= 0 ? '#4CAF50' : '#e74c3c' }}>{activeCountry.symbol}{d.profit.toLocaleString()}</td>
                                                                <td style={{ ...tdS, fontWeight: 800, color: roi >= 0 ? '#4CAF50' : '#e74c3c' }}>{roi.toFixed(1)}%</td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                                <thead style={{ background: '#f9f9fc' }}>
                                                    <tr>
                                                        <th style={thS}>Fecha</th>
                                                        <th style={thS}>Registros</th>
                                                        <th style={thS}>V. Totales</th>
                                                        <th style={thS}>Gasto Ads</th>
                                                        <th style={thS}>Utilidad</th>
                                                        <th style={thS}>ROI</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, d]) => {
                                                        const roi = d.adSpend > 0 ? ((d.profit / d.adSpend) * 100) : 0
                                                        return (
                                                            <tr key={date} style={{ background: 'white' }}>
                                                                <td style={{ ...tdS, fontWeight: 800, color: '#1a1a2e' }}>{date}</td>
                                                                <td style={tdS}>{d.count}</td>
                                                                <td style={tdS}>{d.sales}</td>
                                                                <td style={{ ...tdS, color: '#e74c3c' }}>{activeCountry.symbol}{d.adSpend.toLocaleString()}</td>
                                                                <td style={{ ...tdS, fontWeight: 900, color: d.profit >= 0 ? '#4CAF50' : '#e74c3c' }}>{activeCountry.symbol}{d.profit.toLocaleString()}</td>
                                                                <td style={{ ...tdS, fontWeight: 800, color: roi >= 0 ? '#4CAF50' : '#e74c3c' }}>{roi.toFixed(1)}%</td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })()}

                {/* ===== MODAL COSTEO ===== */}
                {isModalOpen && activeRecord && (() => {
                    const m = calculateMetrics(activeRecord)
                    return (
                        <div
                            style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                            onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
                        >
                            <div style={{ width: '100%', maxWidth: 1080, maxHeight: '95vh', overflowY: 'auto', borderRadius: 32, background: 'white', boxShadow: '0 32px 80px rgba(0,0,0,0.4)', animation: 'fadeIn 0.25s ease' }}>
                                {/* Modal Header */}
                                <div style={{ padding: '24px 36px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10, borderRadius: '32px 32px 0 0' }}>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 36, height: 36, background: '#f0faf0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Activity size={18} color="#4CAF50" />
                                            </div>
                                            {isEditing ? 'Editar Costeo' : 'Nuevo Costeo'}
                                        </h2>
                                        <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                                            Registro del {activeRecord.date} • Los resultados se actualizan en tiempo real
                                        </p>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} style={{ width: 44, height: 44, background: '#f5f5f5', border: 'none', borderRadius: 14, cursor: 'pointer', fontSize: 22, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        ×
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div style={{ padding: '36px 36px 40px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 36 }}>

                                    {/* Left: Inputs */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                                        {/* Product name + date + type */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 1fr', gap: 20 }}>
                                            <Field label="Nombre del Producto" icon={<Box size={12} />}>
                                                <input value={activeRecord.productName} onChange={e => updateRecord(activeRecord.id, { productName: e.target.value })} className="input-field" placeholder="Ej: Humidificador Premium..." style={{ fontSize: 15, fontWeight: 600 }} autoFocus />
                                            </Field>
                                            <Field label="Fecha del Registro" icon={<Calendar size={12} />}>
                                                <input
                                                    type="date"
                                                    value={activeRecord.date}
                                                    onChange={e => updateRecord(activeRecord.id, { date: e.target.value })}
                                                    className="input-field"
                                                    style={{ fontWeight: 700, cursor: 'pointer' }}
                                                />
                                            </Field>
                                            <Field label="Estado de la Campaña" icon={<TrendingUp size={12} />}>
                                                <select value={activeRecord.type} onChange={e => updateRecord(activeRecord.id, { type: e.target.value as any })} className="input-field" style={{ cursor: 'pointer' }}>
                                                    <option>Testeo</option><option>Estable</option><option>Escalando</option><option>Inestable</option><option>Upsell</option>
                                                </select>
                                            </Field>
                                        </div>

                                        {/* Sales */}
                                        <div style={{ padding: 24, background: '#f4faff', borderRadius: 20, border: '1px solid #ddeeff' }}>
                                            <div style={{ fontSize: 11, fontWeight: 900, color: '#3498db', textTransform: 'uppercase', marginBottom: 16 }}>📊 Métricas de Venta (Shopify)</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                                                <Field label="Ventas Shopify">
                                                    <input type="number" value={activeRecord.shopifySales === 0 ? '' : activeRecord.shopifySales} onFocus={e => e.target.select()} onChange={e => updateRecord(activeRecord.id, { shopifySales: Number(e.target.value) })} className="input-field" style={{ fontWeight: 800, color: '#3498db' }} />
                                                </Field>
                                                <Field label="% Cancelados">
                                                    <input type="number" value={activeRecord.cancelRate === 0 ? '' : activeRecord.cancelRate} onFocus={e => e.target.select()} onChange={e => updateRecord(activeRecord.id, { cancelRate: Number(e.target.value) })} className="input-field" style={{ color: '#e74c3c' }} />
                                                </Field>
                                                <Field label="% Devolución">
                                                    <input type="number" value={activeRecord.returnRate === 0 ? '' : activeRecord.returnRate} onFocus={e => e.target.select()} onChange={e => updateRecord(activeRecord.id, { returnRate: Number(e.target.value) })} className="input-field" style={{ color: '#e74c3c' }} />
                                                </Field>
                                                <Field label="Ventas Efectivas">
                                                    <div className="input-field" style={{ background: '#e8f5ff', fontWeight: 900, color: '#2980b9' }}>{m.effectiveSales.toFixed(1)}</div>
                                                </Field>
                                            </div>
                                        </div>

                                        {/* Logistics */}
                                        <div style={{ padding: 24, background: '#fffaf4', borderRadius: 20, border: '1px solid #ffe8cc' }}>
                                            <div style={{ fontSize: 11, fontWeight: 900, color: '#e67e22', textTransform: 'uppercase', marginBottom: 16 }}>🚚 Logística y Precio</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                                <Field label="Precio de Venta">
                                                    <input type="number" value={activeRecord.sellingPrice === 0 ? '' : activeRecord.sellingPrice} onFocus={e => e.target.select()} onChange={e => updateRecord(activeRecord.id, { sellingPrice: Number(e.target.value) })} className="input-field" style={{ fontWeight: 800, color: '#2ecc71' }} />
                                                </Field>
                                                <Field label="Flete Base">
                                                    <input type="number" value={activeRecord.baseShipping === 0 ? '' : activeRecord.baseShipping} onFocus={e => e.target.select()} onChange={e => updateRecord(activeRecord.id, { baseShipping: Number(e.target.value) })} className="input-field" />
                                                </Field>
                                                <Field label="Flete c/ Dev" help="= Flete / (1 - %Dev)">
                                                    <div className="input-field" style={{ background: '#f5f5f5', fontWeight: 800 }}>{activeCountry.symbol}{m.fleteConDev.toLocaleString()}</div>
                                                </Field>
                                            </div>
                                        </div>

                                        {/* Ads + Fixed Costs */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                            <div style={{ padding: 24, background: '#fdf9ff', borderRadius: 20, border: '1px solid #f0e0ff' }}>
                                                <div style={{ fontSize: 11, fontWeight: 900, color: '#9b59b6', textTransform: 'uppercase', marginBottom: 16 }}>📢 Pauta Publicitaria</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    <Field label="Meta Ads"><input type="number" value={activeRecord.adSpend === 0 ? '' : activeRecord.adSpend} onFocus={e => e.target.select()} onChange={e => updateRecord(activeRecord.id, { adSpend: Number(e.target.value) })} className="input-field" /></Field>
                                                    <Field label="TikTok Ads"><input type="number" value={activeRecord.tiktokSpend === 0 ? '' : activeRecord.tiktokSpend} onFocus={e => e.target.select()} onChange={e => updateRecord(activeRecord.id, { tiktokSpend: Number(e.target.value) })} className="input-field" /></Field>
                                                    <Field label="Otras Redes"><input type="number" value={activeRecord.otherSpend === 0 ? '' : activeRecord.otherSpend} onFocus={e => e.target.select()} onChange={e => updateRecord(activeRecord.id, { otherSpend: Number(e.target.value) })} className="input-field" /></Field>
                                                </div>
                                            </div>
                                            <div style={{ padding: 24, background: '#f9f9f9', borderRadius: 20, border: '1px solid #eee' }}>
                                                <div style={{ fontSize: 11, fontWeight: 900, color: '#666', textTransform: 'uppercase', marginBottom: 16 }}>📦 Costos Fijos</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    <Field label="Costo Proveedor"><input type="number" value={activeRecord.productCost === 0 ? '' : activeRecord.productCost} onFocus={e => e.target.select()} onChange={e => updateRecord(activeRecord.id, { productCost: Number(e.target.value) })} className="input-field" /></Field>
                                                    <Field label="Gastos Operativos"><input type="number" value={activeRecord.adminCosts === 0 ? '' : activeRecord.adminCosts} onFocus={e => e.target.select()} onChange={e => updateRecord(activeRecord.id, { adminCosts: Number(e.target.value) })} className="input-field" /></Field>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Results */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        {/* KPI Card */}
                                        <div style={{ background: 'linear-gradient(150deg, #1a1a2e 0%, #16213e 100%)', borderRadius: 28, padding: 32, color: 'white' }}>
                                            <div style={{ fontSize: 10, fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rentabilidad Neta</div>
                                            <div style={{ fontSize: 46, fontWeight: 950, marginTop: 10, color: m.isProfitable ? '#4CAF50' : '#ff4d4d', lineHeight: 1 }}>
                                                {activeCountry.symbol}{m.totalProfit.toLocaleString()}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>
                                                {[
                                                    { label: 'ROI', value: `${m.roi}%`, color: m.roi > 30 ? '#4CAF50' : '#ff9800' },
                                                    { label: 'CPA', value: `${activeCountry.symbol}${m.cpa.toLocaleString()}` },
                                                    { label: 'Efectividad', value: `${(m.effectiveness * 100).toFixed(0)}%` },
                                                    { label: 'Util/Prod', value: `${activeCountry.symbol}${m.profitPerProduct.toLocaleString()}`, color: m.profitPerProduct >= 0 ? '#4CAF50' : '#ff4d4d' },
                                                ].map(kpi => (
                                                    <div key={kpi.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px' }}>
                                                        <div style={{ fontSize: 9, fontWeight: 900, opacity: 0.5, textTransform: 'uppercase' }}>{kpi.label}</div>
                                                        <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4, color: kpi.color || 'white' }}>{kpi.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, fontSize: 12, opacity: 0.6 }}>
                                                Recaudo bruto: <b style={{ color: 'white', opacity: 1 }}>{activeCountry.symbol}{m.grossRevenue.toLocaleString()}</b>
                                                &ensp;|&ensp; CPA BK: <b style={{ color: '#3498db', opacity: 1 }}>{activeCountry.symbol}{m.cpaBkven.toLocaleString()}</b>
                                            </div>
                                        </div>

                                        {/* Insight */}
                                        <div style={{ padding: 20, background: '#f0faf0', borderRadius: 20, border: '1px solid #c8edca' }}>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <AlertCircle size={18} color="#4CAF50" style={{ flexShrink: 0, marginTop: 2 }} />
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#2d5a27' }}>Pixora Suggest</div>
                                                    <p style={{ fontSize: 11, color: '#4a7a44', marginTop: 4, lineHeight: 1.6 }}>
                                                        {m.roi > 40
                                                            ? 'ROI saludable. Puedes escalar el presupuesto de Meta Ads un 15–20% sin riesgo.'
                                                            : 'Margen bajo el objetivo. Revisa creativos, CPA o negocia mejor con tu proveedor.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <button onClick={() => syncRecordToDB(activeRecord)} disabled={isSyncing} className="btn-primary" style={{ height: 60, borderRadius: 18, background: '#1a1a2e', fontSize: 15, fontWeight: 800, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
                                            {isSyncing ? <History className="animate-spin" size={20} /> : <History size={20} />}
                                            Guardar en Base de Datos
                                        </button>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <button onClick={() => deleteRecord(activeRecord.id)} style={{ height: 48, borderRadius: 14, background: 'white', border: '1px solid #ffd5d5', color: '#e74c3c', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <Trash2 size={15} /> Eliminar
                                            </button>
                                            <button onClick={() => setIsModalOpen(false)} style={{ height: 48, borderRadius: 14, background: '#f5f5f5', border: 'none', color: '#666', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                                Cerrar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })()}
            </div>
        </div>
    )
}

const tableTh: React.CSSProperties = { padding: '14px 20px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9f9f9', borderBottom: '1px solid #eee' }
const tableTd: React.CSSProperties = { padding: '14px 20px', fontSize: 13, color: '#333', verticalAlign: 'middle' }

function Field({ label, icon, children, help }: { label: string, icon?: React.ReactNode, children: React.ReactNode, help?: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                {icon} {label}
                {help && (
                    <div style={{ cursor: 'help' }} title={help}>
                        <HelpCircle size={10} color="#ccc" />
                    </div>
                )}
            </label>
            {children}
        </div>
    )
}
