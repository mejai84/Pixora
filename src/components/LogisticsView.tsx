'use client'
import React, { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Truck, Upload, Calendar, History, X, CheckCircle2, XCircle, Clock, Activity, Save, Search, Download, Loader2, Trash2, Package, FileText, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type SubView = 'menu' | 'dashboard' | 'history' | 'detail'
type ModalType = 'delivery' | 'transit' | 'returns' | null

interface OrderData {
    id: string; fecha: string; cliente: string; producto: string; cantidad: number
    estado_dropi: string; valor_recaudo: number; valor_proveedor: number
    flete: number; guia: string; dias_mov: number; transportadora: string
    departamento: string; ciudad: string; con_recaudo: boolean
}

interface LogisticsStats {
    totalOrders: number; guiasGeneradas: number; entregados: number; enTransito: number
    devoluciones: number; cancelados: number; rechazados: number
    pendienteConf: number; pendienteEnvio: number; enNovedad: number; reclamarOficina: number
    ventasBrutas: number; costoProveedor: number; fletesEntregados: number; fletesDevolucion: number
    pagoAnticipado: number; transitoTotalVal: number
    entregadosVal: number; devolucionesVal: number; canceladosVal: number; rechazadosVal: number
    pendienteConfVal: number; novedadVal: number; oficinaVal: number
}

interface SavedReport { id: string; date: string; name: string; stats: LogisticsStats; rawData: OrderData[] }

const ORANGE = '#e67e22'
const th: React.CSSProperties = { padding: '12px 16px', fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', textAlign: 'left', background: '#f9f9f9', borderBottom: '1px solid #eee' }
const td: React.CSSProperties = { padding: '12px 16px', fontSize: 12, color: '#333', borderBottom: '1px solid #f5f5f5' }

function classifyEstado(e: string) {
    const s = e.toUpperCase()
    return {
        entregado: s.includes('ENTREGADO'),
        transito: s.includes('TRANSITO') || s.includes('REPARTO') || s.includes('TRÁNSITO'),
        devolucion: s.includes('DEVOLUCION') || s.includes('DEVOLUCIÓN'),
        rechazado: s.includes('RECHAZADO'),
        cancelado: s.includes('CANCELADO'),
        novedad: s.includes('NOVEDAD'),
        oficina: s.includes('OFICINA'),
        pendienteConf: s.includes('CONFIRMACION') || s.includes('CONFIRMACIÓN') || s.includes('PEND. CONF'),
        pendienteEnvio: s.includes('PENDIENTE ENVIO') || s.includes('PENDIENTE GUIA') || s.includes('PEND. ENV'),
        anticipado: s.includes('ANTICIPADO') || s.includes('SIN RECAUDO'),
    }
}

export default function LogisticsView() {
    const [subView, setSubView] = useState<SubView>('menu')
    const [isLoading, setIsLoading] = useState(false)
    const [rawData, setRawData] = useState<OrderData[]>([])
    const [stats, setStats] = useState<LogisticsStats | null>(null)
    const [fileName, setFileName] = useState('')
    const [history, setHistory] = useState<SavedReport[]>([])
    const [adSpend, setAdSpend] = useState(0)
    const [modalType, setModalType] = useState<ModalType>(null)
    const [detailTitle, setDetailTitle] = useState('')
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailFilter, setDetailFilter] = useState<'all' | 'con_recaudo' | 'sin_recaudo'>('all')
    const [productPauta, setProductPauta] = useState<Record<string, number>>({})
    const [carrierDetail, setCarrierDetail] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000) }

    useEffect(() => {
        const load = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                const { data } = await supabase.from('logistics_reports').select('*').order('created_at', { ascending: false }).limit(15)
                if (data) setHistory(data.map((h: any) => ({ id: h.id, date: h.report_date, name: h.name, stats: h.stats, rawData: h.raw_data })))
            } catch (e) { console.error(e) }
        }
        load()
    }, [])

    const processExcel = (data: any[], name: string) => {
        const gv = (row: any, keys: string[], def: any = '') => {
            const k = Object.keys(row).find(k => keys.some(pk => k.toLowerCase().trim().includes(pk.toLowerCase().trim())))
            return k !== undefined ? row[k] : def
        }
        const orders: OrderData[] = data.map((row: any) => {
            const estado = String(gv(row, ['estado', 'status'], '')).toUpperCase()
            return {
                id: String(gv(row, ['id pedido', 'id', '#'], '')),
                fecha: String(gv(row, ['fecha'], '')),
                cliente: String(gv(row, ['nombre cliente', 'cliente', 'nombre'], '')),
                producto: String(gv(row, ['producto', 'nombre del producto'], '')),
                cantidad: Number(gv(row, ['cantidad', 'unidades'], 1)),
                estado_dropi: estado,
                valor_recaudo: Number(gv(row, ['precio venta', 'valor recaudo', 'total', 'total pedido'], 0)),
                valor_proveedor: Number(gv(row, ['costo mayorista', 'costo proveedor', 'costo producto', 'precio proveedor'], 0)),
                flete: Number(gv(row, ['flete', 'costo flete'], 0)),
                guia: String(gv(row, ['guía', 'guia', 'numero de guía', 'numero guia'], '')),
                dias_mov: Number(gv(row, ['días movimiento', 'dias movimiento', 'dias_movimiento', 'dias mov'], 0)),
                transportadora: String(gv(row, ['logística', 'transportadora', 'logistica', 'logistica transportadora'], 'SIN ASIGNAR')).toUpperCase(),
                departamento: String(gv(row, ['departamento'], '')),
                ciudad: String(gv(row, ['ciudad'], '')),
                con_recaudo: !estado.includes('SIN RECAUDO') && !estado.includes('ANTICIPADO'),
            }
        }).filter(o => o.id && o.id !== 'undefined' && o.id !== '')

        const cls = (o: OrderData) => classifyEstado(o.estado_dropi)
        const sum = (arr: OrderData[], f: (o: OrderData) => number) => arr.reduce((a, o) => a + f(o), 0)
        const delivered = orders.filter(o => cls(o).entregado)
        const transit = orders.filter(o => cls(o).transito)
        const returned = orders.filter(o => cls(o).devolucion)
        const rejected = orders.filter(o => cls(o).rechazado)
        const cancelled = orders.filter(o => cls(o).cancelado)
        const novedad = orders.filter(o => cls(o).novedad)
        const oficina = orders.filter(o => cls(o).oficina)
        const pendConf = orders.filter(o => cls(o).pendienteConf)
        const pendEnvio = orders.filter(o => cls(o).pendienteEnvio)
        const anticipado = orders.filter(o => cls(o).anticipado)

        const s: LogisticsStats = {
            totalOrders: orders.length,
            guiasGeneradas: orders.filter(o => o.guia && o.guia !== '').length,
            entregados: delivered.length, enTransito: transit.length,
            devoluciones: returned.length, cancelados: cancelled.length, rechazados: rejected.length,
            pendienteConf: pendConf.length, pendienteEnvio: pendEnvio.length,
            enNovedad: novedad.length, reclamarOficina: oficina.length,
            ventasBrutas: sum(delivered, o => o.valor_recaudo),
            costoProveedor: sum(delivered, o => o.valor_proveedor),
            fletesEntregados: sum(delivered, o => o.flete),
            fletesDevolucion: sum(returned, o => o.flete),
            pagoAnticipado: sum(anticipado, o => o.valor_recaudo),
            transitoTotalVal: sum(transit, o => o.valor_recaudo),
            entregadosVal: sum(delivered, o => o.valor_recaudo),
            devolucionesVal: sum(returned, o => o.valor_recaudo),
            canceladosVal: sum(cancelled, o => o.valor_recaudo),
            rechazadosVal: sum(rejected, o => o.valor_recaudo),
            pendienteConfVal: sum(pendConf, o => o.valor_recaudo),
            novedadVal: sum(novedad, o => o.valor_recaudo),
            oficinaVal: sum(oficina, o => o.valor_recaudo),
        }
        setRawData(orders); setStats(s); setFileName(name)

        const save = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                const { data: ins, error } = await supabase.from('logistics_reports').insert({ user_id: user.id, report_date: new Date().toLocaleString(), name, stats: s, raw_data: orders }).select()
                if (error) throw error
                if (ins?.[0]) setHistory(prev => [{ id: ins[0].id, date: ins[0].report_date, name: ins[0].name, stats: ins[0].stats, rawData: ins[0].raw_data }, ...prev].slice(0, 15))
                showToast(`✅ ${orders.length} pedidos procesados y guardados`)
            } catch (e: any) { showToast('❌ Error guardando: ' + e.message, false) }
        }
        save()
        setSubView('dashboard')
    }

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return
        setIsLoading(true)
        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target?.result, { type: 'binary' })
                const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
                processExcel(data, file.name)
            } catch { showToast('❌ Error leyendo el archivo', false) }
            finally { setIsLoading(false); e.target.value = '' }
        }
        reader.readAsBinaryString(file)
    }

    const openDetail = (title: string) => { setDetailTitle(title); setDetailFilter('all'); setDetailOpen(true) }

    const getDetailData = () => {
        const t = detailTitle.toLowerCase()
        let filtered = rawData.filter(o => {
            const c = classifyEstado(o.estado_dropi)
            if (t.includes('confirmación') || t.includes('confirmacion')) return c.pendienteConf
            if (t.includes('envío') || t.includes('envio')) return c.pendienteEnvio
            if (t.includes('novedad')) return c.novedad
            if (t.includes('oficina')) return c.oficina
            if (t.includes('tránsito') || t.includes('transito')) return c.transito
            if (t.includes('entregados')) return c.entregado
            if (t.includes('devoluciones')) return c.devolucion
            if (t.includes('cancelados')) return c.cancelado
            if (t.includes('rechazados')) return c.rechazado
            return true
        })
        if (detailFilter === 'con_recaudo') filtered = filtered.filter(o => o.con_recaudo)
        if (detailFilter === 'sin_recaudo') filtered = filtered.filter(o => !o.con_recaudo)
        return filtered
    }

    return (
        <div className="main-scroll custom-scrollbar" style={{ animation: 'fadeIn 0.2s ease' }}>
            <input type="file" ref={fileRef} onChange={handleFile} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.ok ? '#0f5132' : '#842029', color: 'white', padding: '14px 20px', borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.2)', display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, fontWeight: 700, maxWidth: 400, animation: 'fadeIn 0.3s ease' }}>
                    <span style={{ flex: 1 }}>{toast.msg}</span>
                    <button onClick={() => setToast(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', fontSize: 14 }}>×</button>
                </div>
            )}

            {isLoading ? <LoadingSpinner /> :
                subView === 'menu' ? <Menu onUpload={() => fileRef.current?.click()} onHistory={() => setSubView('history')} /> :
                    subView === 'history' ? <HistoryView history={history} onBack={() => setSubView('menu')} onSelect={(r: SavedReport) => { setStats(r.stats); setRawData(r.rawData); setFileName(r.name); setSubView('dashboard') }} onDelete={async (id: string) => { await supabase.from('logistics_reports').delete().eq('id', id); setHistory(p => p.filter(h => h.id !== id)) }} /> :
                        stats ? <Dashboard stats={stats} rawData={rawData} fileName={fileName} adSpend={adSpend} setAdSpend={setAdSpend} productPauta={productPauta} setProductPauta={setProductPauta} onBack={() => setSubView('menu')} onUpload={() => fileRef.current?.click()} onModal={setModalType} onDetail={openDetail} onCarrier={setCarrierDetail} /> : null
            }
            {modalType && <EfficiencyModal type={modalType} data={rawData} onClose={() => setModalType(null)} />}
            {detailOpen && <DetailModal title={detailTitle} data={getDetailData()} filter={detailFilter} setFilter={setDetailFilter} onClose={() => setDetailOpen(false)} />}
            {carrierDetail && <CarrierDetailModal carrier={carrierDetail} data={rawData} onClose={() => setCarrierDetail(null)} />}
        </div>
    )
}

// ─── MENU ───────────────────────────────────────────────────────────
function Menu({ onUpload, onHistory }: any) {
    return (
        <div style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: `${ORANGE}20`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Truck size={32} color={ORANGE} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>Auditor Logístico</h1>
            <p style={{ color: '#999', fontSize: 14, marginBottom: 48 }}>Analiza tus reportes de Dropi e identifica oportunidades para reducir devoluciones</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                {[
                    { title: 'Subir Reporte', desc: 'Carga tu Excel de Dropi', icon: <Upload color={ORANGE} size={28} />, action: onUpload, color: ORANGE },
                    { title: 'Diario de Pauta', desc: 'Próximamente', icon: <Calendar color="#5b21b6" size={28} />, action: null, color: '#5b21b6' },
                    { title: 'Ver Historial', desc: 'Reportes guardados', icon: <Clock color="#3498db" size={28} />, action: onHistory, color: '#3498db' },
                ].map(c => (
                    <div key={c.title} onClick={c.action || undefined} className="card shadow-hover" style={{ padding: 32, cursor: c.action ? 'pointer' : 'default', opacity: c.action ? 1 : 0.5 }}>
                        <div style={{ width: 56, height: 56, background: `${c.color}15`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{c.icon}</div>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>{c.title}</h3>
                        <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>{c.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── DASHBOARD ──────────────────────────────────────────────────────
function Dashboard({ stats, rawData, fileName, adSpend, setAdSpend, productPauta, setProductPauta, onBack, onUpload, onModal, onDetail, onCarrier }: any) {
    const s: LogisticsStats = stats
    const guias = s.guiasGeneradas || 1
    const confRate = ((s.guiasGeneradas / (s.totalOrders || 1)) * 100).toFixed(1)
    const cancelRate = ((s.cancelados / (s.totalOrders || 1)) * 100).toFixed(1)
    const delivRate = ((s.entregados / guias) * 100).toFixed(1)
    const transitRate = ((s.enTransito / guias) * 100).toFixed(1)
    const retRate = ((s.devoluciones / guias) * 100).toFixed(1)
    const netProfit = s.ventasBrutas - s.costoProveedor - s.fletesEntregados - s.fletesDevolucion - adSpend
    const projectionRates = [1, 0.9, 0.8, 0.7, 0.6, 0.5]

    // Group by transportadora
    const byCarrier: Record<string, { sent: number; transit: number; dev: number; cancel: number; rechazado: number; entregado: number }> = {}
    rawData.forEach((o: OrderData) => {
        const t = o.transportadora || 'SIN ASIGNAR'
        if (!byCarrier[t]) byCarrier[t] = { sent: 0, transit: 0, dev: 0, cancel: 0, rechazado: 0, entregado: 0 }
        const c = classifyEstado(o.estado_dropi)
        byCarrier[t].sent++
        if (c.transito) byCarrier[t].transit++
        if (c.devolucion) byCarrier[t].dev++
        if (c.cancelado) byCarrier[t].cancel++
        if (c.rechazado) byCarrier[t].rechazado++
        if (c.entregado) byCarrier[t].entregado++
    })

    const statusCards1 = [
        { label: 'Pend. Confirmación', count: s.pendienteConf, val: s.pendienteConfVal, color: '#f39c12', detail: 'Pendiente Confirmación' },
        { label: 'Pendiente Envío', count: s.pendienteEnvio, val: 0, color: '#8e44ad', detail: 'Pendiente Envío' },
        { label: 'En Novedad', count: s.enNovedad, val: s.novedadVal, color: '#e74c3c', detail: 'En Novedad' },
        { label: 'Reclamar en Oficina', count: s.reclamarOficina, val: s.oficinaVal, color: '#c0392b', detail: 'Reclamar Oficina' },
        { label: 'Tránsito Total', count: s.enTransito, val: s.transitoTotalVal, color: '#3498db', detail: 'En Tránsito' },
    ]
    const statusCards2 = [
        { label: 'Entregados', count: s.entregados, val: s.entregadosVal, color: '#27ae60', detail: 'Entregados' },
        { label: 'Devoluciones', count: s.devoluciones, val: s.devolucionesVal, color: '#e74c3c', detail: 'Devoluciones' },
        { label: 'Cancelados', count: s.cancelados, val: s.canceladosVal, color: '#95a5a6', detail: 'Cancelados' },
        { label: 'Rechazados', count: s.rechazados, val: s.rechazadosVal, color: '#e74c3c', detail: 'Rechazados' },
    ]

    return (
        <div style={{ padding: '24px 32px 60px' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={onBack} style={{ width: 38, height: 38, background: '#f5f5f5', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e' }}>Análisis de Informe Real</h1>
                        <div style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <FileText size={11} />{fileName}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onUpload} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: ORANGE, color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                        <Upload size={14} /> Cargar Nuevo
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Total Pedidos', val: s.totalOrders, icon: <Package size={16} />, color: '#1a1a2e' },
                    { label: 'Total Guías', val: s.guiasGeneradas, icon: <FileText size={16} />, color: '#3498db' },
                    { label: '% Confirmación', val: `${confRate}%`, icon: <CheckCircle2 size={16} />, color: '#27ae60', bg: '#f0faf0' },
                    { label: '% Cancelación', val: `${cancelRate}%`, icon: <XCircle size={16} />, color: '#e74c3c', bg: '#fff5f5' },
                ].map(k => (
                    <div key={k.label} className="card" style={{ padding: '16px 20px', background: k.bg }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 6 }}>{k.label}</div>
                                <div style={{ fontSize: 26, fontWeight: 950, color: k.color }}>{k.val}</div>
                            </div>
                            <div style={{ color: k.color, opacity: 0.5 }}>{k.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Finanzas Reales */}
            <div style={{ background: ORANGE, borderRadius: 24, padding: 28, color: 'white', marginBottom: 24, boxShadow: `0 20px 40px ${ORANGE}40` }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, opacity: 0.85, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    💰 Finanzas Reales — Entregados
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                            {[
                                { l: 'Ventas Totales (+)', v: s.ventasBrutas },
                                { l: 'Costo Prov. (-)', v: s.costoProveedor },
                                { l: 'Fletes Ent. (+)', v: s.fletesEntregados },
                                { l: 'Fletes Dev. (-)', v: s.fletesDevolucion },
                            ].map(f => (
                                <div key={f.l}>
                                    <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.75 }}>{f.l}</div>
                                    <div style={{ fontSize: 15, fontWeight: 900, marginTop: 4 }}>${f.v.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>✅ Pedidos sin Recaudo (Anticipado)</span>
                            <span style={{ fontSize: 15, fontWeight: 900 }}>${s.pagoAnticipado.toLocaleString()}</span>
                        </div>
                        {/* Proyección tránsito */}
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 16px' }}>
                            <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.8, marginBottom: 10 }}>📦 Proyección de lo que viene en Tránsito — ${s.transitoTotalVal.toLocaleString()}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                {[1, 0.9, 0.8, 0.7, 0.6].map(r => (
                                    <div key={r} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.75 }}>Si entrega {r * 100}%</div>
                                        <div style={{ fontSize: 13, fontWeight: 900, marginTop: 4 }}>${Math.round(s.transitoTotalVal * r).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Ads + Ganancia */}
                    <div style={{ background: 'white', borderRadius: 20, padding: 22, color: '#1a1a2e' }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: '#999', textTransform: 'uppercase' }}>Gasto en Pauta (Ads)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '8px 0 4px', borderBottom: '2px solid #eee', paddingBottom: 6 }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: '#999' }}>$</span>
                            <input className="input-field" style={{ border: 'none', background: 'none', padding: 0, fontSize: 18, fontWeight: 900, width: '100%', outline: 'none' }} value={adSpend} onChange={e => setAdSpend(Number(e.target.value))} />
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Ganancia Neta Real</div>
                            <div style={{ fontSize: 30, fontWeight: 950, color: netProfit >= 0 ? '#27ae60' : '#e74c3c', marginTop: 4, letterSpacing: '-0.02em' }}>${netProfit.toLocaleString()}</div>
                            <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>* Incluye pago anticipado</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Efficiency Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
                {[
                    { label: 'Efectividad Entrega', val: `${delivRate}%`, icon: <CheckCircle2 size={20} />, color: '#27ae60', type: 'delivery' as ModalType },
                    { label: 'En Tránsito Global', val: `${transitRate}%`, icon: <Truck size={20} />, color: '#3498db', type: 'transit' as ModalType },
                    { label: 'Tasa Devolución', val: `${retRate}%`, icon: <RefreshCw size={20} />, color: '#f39c12', type: 'returns' as ModalType },
                ].map(e => (
                    <div key={e.label} className="card shadow-hover" onClick={() => onModal(e.type)} style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 6 }}>{e.label}</div>
                            <div style={{ fontSize: 32, fontWeight: 950, color: e.color }}>{e.val}</div>
                        </div>
                        <div style={{ color: e.color, opacity: 0.3 }}>{e.icon}</div>
                    </div>
                ))}
            </div>

            {/* Status Cards Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 12 }}>
                {statusCards1.map(c => (
                    <div key={c.label} className="card shadow-hover" onClick={() => onDetail(c.detail)} style={{ padding: '16px', cursor: 'pointer', borderBottom: `3px solid ${c.color}` }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 950, color: c.color }}>{c.count}</div>
                        {c.val > 0 && <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>${c.val.toLocaleString()}</div>}
                    </div>
                ))}
            </div>

            {/* Status Cards Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
                {statusCards2.map(c => (
                    <div key={c.label} className="card shadow-hover" onClick={() => onDetail(c.detail)} style={{ padding: '16px', cursor: 'pointer', borderBottom: `3px solid ${c.color}` }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 950, color: c.color }}>{c.count}</div>
                        {c.val > 0 && <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>${c.val.toLocaleString()}</div>}
                    </div>
                ))}
            </div>

            {/* Transportadora Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Truck size={16} color={ORANGE} />
                    <h3 style={{ fontSize: 14, fontWeight: 900, color: '#1a1a2e' }}>Efectividad por Transportadora</h3>
                    <span style={{ fontSize: 11, color: '#bbb', marginLeft: 4 }}>— Haz clic en una fila para ver detalles</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>{['Empresa', 'Enviados', 'Tránsito', 'Devoluciones', 'Cancelados', 'Rechazados', 'Entregados'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                        <tbody>
                            {Object.entries(byCarrier).sort((a, b) => b[1].sent - a[1].sent).map(([name, c]) => (
                                <tr key={name} onClick={() => onCarrier(name)} style={{ background: 'white', cursor: 'pointer' }} className="shadow-hover">
                                    <td style={{ ...td, fontWeight: 800, color: '#1a1a2e' }}>{name}</td>
                                    <td style={td}>{c.sent}</td>
                                    <td style={{ ...td, color: '#3498db', fontWeight: 700 }}>{c.transit} <span style={{ color: '#bbb', fontWeight: 400 }}>({((c.transit / c.sent) * 100).toFixed(0)}%)</span></td>
                                    <td style={{ ...td, color: '#e74c3c', fontWeight: 700 }}>{c.dev} <span style={{ color: '#bbb', fontWeight: 400 }}>({((c.dev / c.sent) * 100).toFixed(0)}%)</span></td>
                                    <td style={td}>{c.cancel}</td>
                                    <td style={td}>{c.rechazado}</td>
                                    <td style={{ ...td, color: '#27ae60', fontWeight: 800 }}>{c.entregado} <span style={{ color: '#bbb', fontWeight: 400 }}>({((c.entregado / c.sent) * 100).toFixed(0)}%)</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rentabilidad por Producto */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Activity size={16} color={ORANGE} />
                        <h3 style={{ fontSize: 14, fontWeight: 900, color: '#1a1a2e' }}>Rentabilidad por Producto</h3>
                    </div>
                    <span style={{ fontSize: 11, color: ORANGE, fontWeight: 700 }}>Haz clic en una fila para añadir tu gasto en pauta</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>
                            <th style={th}>Producto</th>
                            <th style={{ ...th, color: '#27ae60' }}>Entr.</th><th style={{ ...th, color: '#27ae60' }}>% Efec.</th>
                            <th style={{ ...th, color: '#3498db' }}>Trán.</th><th style={{ ...th, color: '#3498db' }}>% Trán.</th>
                            <th style={{ ...th, color: '#e74c3c' }}>Dev.</th><th style={{ ...th, color: '#e74c3c' }}>% Dev.</th>
                            <th style={th}>Ventas</th><th style={{ ...th, color: ORANGE }}>Pauta</th><th style={th}>Utilidad</th>
                        </tr></thead>
                        <tbody>
                            {(() => {
                                const byProd: Record<string, { sent: number; entr: number; tran: number; dev: number; ventas: number; costos: number; fletes: number }> = {}
                                rawData.forEach((o: OrderData) => {
                                    const p = o.producto || 'Sin producto'
                                    if (!byProd[p]) byProd[p] = { sent: 0, entr: 0, tran: 0, dev: 0, ventas: 0, costos: 0, fletes: 0 }
                                    const c = classifyEstado(o.estado_dropi)
                                    byProd[p].sent++
                                    if (c.entregado) { byProd[p].entr++; byProd[p].ventas += o.valor_recaudo; byProd[p].costos += o.valor_proveedor; byProd[p].fletes += o.flete }
                                    if (c.transito) byProd[p].tran++
                                    if (c.devolucion) byProd[p].dev++
                                })
                                return Object.entries(byProd).sort((a, b) => b[1].ventas - a[1].ventas).map(([prod, p]) => {
                                    const pauta = productPauta[prod] || 0
                                    const utilidad = p.ventas - p.costos - p.fletes - pauta
                                    return (
                                        <tr key={prod} style={{ cursor: 'pointer' }}>
                                            <td style={{ ...td, fontWeight: 700, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod}</td>
                                            <td style={{ ...td, color: '#27ae60', fontWeight: 800 }}>{p.entr}</td>
                                            <td style={{ ...td, color: '#27ae60' }}>{p.sent ? ((p.entr / p.sent) * 100).toFixed(0) : 0}%</td>
                                            <td style={{ ...td, color: '#3498db' }}>{p.tran}</td>
                                            <td style={{ ...td, color: '#3498db' }}>{p.sent ? ((p.tran / p.sent) * 100).toFixed(0) : 0}%</td>
                                            <td style={{ ...td, color: '#e74c3c' }}>{p.dev}</td>
                                            <td style={{ ...td, color: '#e74c3c' }}>{p.sent ? ((p.dev / p.sent) * 100).toFixed(0) : 0}%</td>
                                            <td style={{ ...td, fontWeight: 700 }}>${p.ventas.toLocaleString()}</td>
                                            <td style={td}>
                                                <input
                                                    style={{ border: '1px solid #eee', borderRadius: 8, padding: '4px 8px', width: 90, fontSize: 12, fontWeight: 700, color: ORANGE, outline: 'none' }}
                                                    value={pauta || ''}
                                                    placeholder="$ pauta"
                                                    onChange={e => setProductPauta((prev: Record<string, number>) => ({ ...prev, [prod]: Number(e.target.value) }))}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            </td>
                                            <td style={{ ...td, fontWeight: 900, color: utilidad >= 0 ? '#27ae60' : '#e74c3c' }}>${utilidad.toLocaleString()}</td>
                                        </tr>
                                    )
                                })
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// ─── EFFICIENCY MODAL ────────────────────────────────────────────────
function EfficiencyModal({ type, data, onClose }: any) {
    const title = type === 'delivery' ? 'Efectividad de Entrega' : type === 'transit' ? 'Porcentaje en Tránsito' : 'Tasa de Devolución'
    const color = type === 'delivery' ? '#27ae60' : type === 'transit' ? '#3498db' : '#e74c3c'

    const byCarrier: Record<string, { sent: number; del: number; transit: number; ret: number }> = {}
    const byProduct: Record<string, { sent: number; del: number; transit: number; ret: number }> = {}

    data.forEach((o: OrderData) => {
        const c = classifyEstado(o.estado_dropi)
        const carrier = o.transportadora || 'SIN ASIGNAR'
        const prod = o.producto || 'Sin producto'
        if (!byCarrier[carrier]) byCarrier[carrier] = { sent: 0, del: 0, transit: 0, ret: 0 }
        if (!byProduct[prod]) byProduct[prod] = { sent: 0, del: 0, transit: 0, ret: 0 }
        byCarrier[carrier].sent++; byProduct[prod].sent++
        if (c.entregado) { byCarrier[carrier].del++; byProduct[prod].del++ }
        if (c.transito) { byCarrier[carrier].transit++; byProduct[prod].transit++ }
        if (c.devolucion) { byCarrier[carrier].ret++; byProduct[prod].ret++ }
    })

    const getRate = (item: any) => type === 'delivery' ? item.del / item.sent : type === 'transit' ? item.transit / item.sent : item.ret / item.sent

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
            <div style={{ position: 'relative', width: '90%', maxWidth: 760, background: 'white', borderRadius: 24, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
                <div style={{ padding: '22px 28px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e' }}>{title}</h2>
                    <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>×</button>
                </div>
                <div style={{ padding: '24px 28px' }}>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 16 }}>Por Transportadora</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
                        {Object.entries(byCarrier).map(([name, c]) => {
                            const rate = getRate(c)
                            return (
                                <div key={name} style={{ background: '#f8f9ff', borderRadius: 14, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#555', marginBottom: 6 }}>{name}</div>
                                    <div style={{ fontSize: 22, fontWeight: 950, color }}>{(rate * 100).toFixed(1)}%</div>
                                    <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{Math.round(rate * c.sent)} de {c.sent} envíos</div>
                                </div>
                            )
                        })}
                    </div>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 16 }}>Por Producto</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Object.entries(byProduct).sort((a, b) => getRate(b[1]) - getRate(a[1])).map(([name, c]) => {
                            const rate = getRate(c)
                            return (
                                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 180, fontSize: 12, fontWeight: 600, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                                    <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ width: `${rate * 100}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                                    </div>
                                    <div style={{ width: 44, fontSize: 12, fontWeight: 800, color, textAlign: 'right' }}>{(rate * 100).toFixed(1)}%</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}


// ─── DETAIL MODAL ────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
    'pendiente confirmación': '#e67e22', 'pendiente envío': '#8e44ad',
    'en novedad': '#e67e22', 'reclamar en oficina': '#8e44ad',
    'tránsito total': '#2980b9', 'tránsito global': '#2980b9',
    'entregados': '#27ae60', 'devoluciones': '#c0392b',
    'cancelados': '#7f8c8d', 'rechazados': '#c0392b',
}
function getStatusColor(title: string): string {
    const low = title.toLowerCase()
    for (const [k, v] of Object.entries(STATUS_COLORS)) { if (low.includes(k)) return v }
    return '#e67e22'
}
function getStateColor(estado: string): string {
    const e = estado.toLowerCase()
    if (e.includes('entregad')) return '#27ae60'
    if (e.includes('devolu') || e.includes('rechazo')) return '#e74c3c'
    if (e.includes('transit') || e.includes('bodega') || e.includes('reparto')) return '#3498db'
    if (e.includes('novedad')) return '#f39c12'
    if (e.includes('oficina')) return '#8e44ad'
    if (e.includes('cancel')) return '#7f8c8d'
    return '#f39c12'
}

function DetailModal({ title, data, filter, setFilter, onClose }: any) {
    const [search, setSearch] = useState('')
    const headerColor = getStatusColor(title)
    const filtered = data.filter((o: OrderData) =>
        (o.id || '').includes(search) || (o.guia || '').includes(search) ||
        (o.cliente || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.producto || '').toLowerCase().includes(search.toLowerCase())
    )
    const conRecaudo = data.filter((o: OrderData) => o.con_recaudo).length
    const sinRecaudo = data.filter((o: OrderData) => !o.con_recaudo).length

    const downloadCSV = () => {
        const headers = ['ID', 'Guia', 'Cliente', 'Producto', 'Estado', 'Transportadora', 'Ciudad', 'Departamento', 'Dias Mov', 'Total', 'Flete', 'Proveedor', 'Utilidad']
        const rows = filtered.map((o: OrderData) => {
            const util = o.valor_recaudo - o.flete - o.valor_proveedor
            return [o.id, o.guia, o.cliente, o.producto, o.estado_dropi, o.transportadora, o.ciudad, o.departamento, o.dias_mov, o.valor_recaudo, o.flete, o.valor_proveedor, util].join(',')
        })
        const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' })
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${title}.csv`; a.click()
    }

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
            <div style={{ position: 'relative', width: '95%', maxWidth: 900, background: 'white', borderRadius: 24, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
                {/* Colored header */}
                <div style={{ background: headerColor, padding: '22px 28px', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: 'white', margin: 0 }}>{title}</h2>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Mostrando {filtered.length} de {data.length} pedidos</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 12, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
                {/* Filters */}
                <div style={{ padding: '16px 28px', borderBottom: '1px solid #eee', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: 'white', position: 'sticky', top: 70, zIndex: 9 }}>
                    <div style={{ display: 'flex', background: '#f4f4f8', borderRadius: 10, overflow: 'hidden' }}>
                        {([['all', `Todos ${data.length}`], ['con_recaudo', `Con Recaudo ${conRecaudo}`], ['sin_recaudo', `Sin Recaudo ${sinRecaudo}`]] as const).map(([v, l]) => (
                            <button key={v} onClick={() => setFilter(v)} style={{ padding: '7px 13px', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: filter === v ? headerColor : 'transparent', color: filter === v ? 'white' : '#888', transition: 'all 0.2s', borderRadius: 10 }}>{l}</button>
                        ))}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f8f8f8', border: '1px solid #eee', borderRadius: 10, padding: '0 14px' }}>
                        <Search size={13} color="#bbb" />
                        <input placeholder="Buscar ID, Guía, Nombre..." style={{ border: 'none', outline: 'none', fontSize: 13, padding: '9px 0', width: '100%', background: 'transparent' }} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#27ae60', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer', color: 'white' }}>
                        <Download size={14} /> Descargar
                    </button>
                </div>
                {/* Order List */}
                <div style={{ padding: '0 28px 28px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>Sin pedidos para este filtro</div>
                    ) : filtered.map((o: OrderData) => {
                        const utilidad = o.valor_recaudo - o.flete - o.valor_proveedor
                        const stateColor = getStateColor(o.estado_dropi)
                        return (
                            <div key={o.id} style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 0', display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1.4fr 1.4fr 1.2fr', gap: 12, alignItems: 'center' }}>
                                {/* ID + Guía + Carrier + Badge */}
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 900, color: '#1a1a2e' }}>{o.id}</div>
                                    <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{o.guia}</div>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#555', marginTop: 4 }}>{o.transportadora}</div>
                                    <span style={{ display: 'inline-block', marginTop: 5, fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 6, background: o.con_recaudo ? '#eafaf1' : '#f0f0f0', color: o.con_recaudo ? '#27ae60' : '#999', border: `1px solid ${o.con_recaudo ? '#27ae60' : '#ddd'}` }}>
                                        {o.con_recaudo ? 'CON RECAUDO' : 'SIN RECAUDO'}
                                    </span>
                                </div>
                                {/* Cliente + Ubicación */}
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{o.cliente}</div>
                                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>{o.ciudad}, {o.departamento}</div>
                                </div>
                                {/* Producto + Cantidad */}
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{o.producto}</div>
                                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>Cant: {o.cantidad}</div>
                                </div>
                                {/* Estado + Días */}
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 900, color: stateColor }}>{o.estado_dropi}</div>
                                    <div style={{ fontSize: 10, color: o.dias_mov > 7 ? '#e74c3c' : '#aaa', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {o.dias_mov > 7 && <span>⚠️</span>}{o.dias_mov} días en movimiento
                                    </div>
                                </div>
                                {/* VALORES */}
                                <div style={{ textAlign: 'right', fontSize: 12 }}>
                                    <div style={{ color: '#555' }}>Total: <b>${o.valor_recaudo.toLocaleString()}</b></div>
                                    <div style={{ color: '#e74c3c', marginTop: 2 }}>Flete: -${o.flete.toLocaleString()}</div>
                                    <div style={{ color: '#e74c3c', marginTop: 2 }}>Proveedor: -${o.valor_proveedor.toLocaleString()}</div>
                                    <div style={{ color: utilidad >= 0 ? '#27ae60' : '#e74c3c', fontWeight: 900, marginTop: 4, fontSize: 13 }}>UTILIDAD ${utilidad.toLocaleString()}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ─── CARRIER DETAIL MODAL ───────────────────────────────────────────
function CarrierDetailModal({ carrier, data, onClose }: any) {
    const orders = (data as OrderData[]).filter(o => o.transportadora === carrier)
    const delivered = orders.filter(o => classifyEstado(o.estado_dropi).entregado)
    const returned = orders.filter(o => classifyEstado(o.estado_dropi).devolucion)

    const topBy = (arr: OrderData[], field: keyof OrderData, n = 8) => {
        const counts: Record<string, number> = {}
        arr.forEach(o => { const v = String(o[field] || 'N/A'); counts[v] = (counts[v] || 0) + 1 })
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n)
    }

    const Section = ({ title, color, arr }: { title: string; color: string; arr: OrderData[] }) => (
        <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#1a1a2e' }}>{title} ({arr.length})</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {[['Por Departamento', 'departamento' as keyof OrderData], ['Por Ciudad', 'ciudad' as keyof OrderData], ['Por Producto', 'producto' as keyof OrderData]].map(([label, field]) => (
                    <div key={label as string}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 10 }}>{label as string} ({label === 'Por Producto' ? 'ENT' : 'ENT'})</div>
                        {topBy(arr, field as keyof OrderData).map(([name, count]) => (
                            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f5f5f5', fontSize: 12 }}>
                                <span style={{ color: '#444', fontWeight: 600 }}>{name}</span>
                                <span style={{ color: '#666', fontWeight: 700 }}>{count} <span style={{ color: '#bbb', fontWeight: 400 }}>{((count / arr.length) * 100).toFixed(0)}%</span></span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }} onClick={onClose} />
            <div style={{ position: 'relative', width: '95%', maxWidth: 860, background: 'white', borderRadius: 24, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
                <div style={{ background: '#1a1a2e', padding: '24px 32px', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Truck size={18} color="white" />
                            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'white', margin: 0 }}>{carrier}</h2>
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Envíos Totales: {orders.length}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 12, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
                <div style={{ padding: '28px 32px' }}>
                    <Section title="Análisis de Entregas" color="#27ae60" arr={delivered} />
                    <Section title="Análisis de Devoluciones" color="#e74c3c" arr={returned} />
                </div>
            </div>
        </div>
    )
}

// ─── HISTORY ─────────────────────────────────────────────────────────
function HistoryView({ history, onBack, onSelect, onDelete }: any) {
    return (
        <div style={{ padding: '40px 32px', maxWidth: 860, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <button onClick={onBack} style={{ width: 38, height: 38, background: '#f5f5f5', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e' }}>Historial de Reportes</h1>
            </div>
            {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#bbb' }}>
                    <Clock size={48} style={{ opacity: 0.2, marginBottom: 16 }} /><p style={{ fontWeight: 700 }}>No hay reportes guardados aún.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {history.map((h: any) => (
                        <div key={h.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px' }}>
                            <div style={{ width: 44, height: 44, background: `${ORANGE}15`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={18} color={ORANGE} /></div>
                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onSelect(h)}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>{h.name}</div>
                                <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{h.date} • {h.stats?.totalOrders} pedidos • {h.stats?.entregados} entregados</div>
                            </div>
                            <div style={{ textAlign: 'right', marginRight: 16 }}>
                                <div style={{ fontSize: 15, fontWeight: 900, color: '#27ae60' }}>${(h.stats?.ventasBrutas || 0).toLocaleString()}</div>
                                <div style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase' }}>Ventas</div>
                            </div>
                            <button onClick={() => onDelete(h.id)} style={{ border: 'none', background: '#fff0f0', color: '#e74c3c', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function LoadingSpinner() {
    return (
        <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <Loader2 className="spin" size={48} color={ORANGE} />
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Procesando Datos...</h2>
                <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Analizando pedidos, transportadoras y finanzas.</p>
            </div>
        </div>
    )
}
