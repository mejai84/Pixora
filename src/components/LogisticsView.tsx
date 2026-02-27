'use client'
import React, { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Truck, Upload, Calendar, History, X, CheckCircle2, XCircle, Clock, Activity, Save, Search, Download, Loader2, Trash2, Package, FileText, AlertCircle, ChevronRight, RefreshCw, BarChart as ChartIcon, Filter } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'

type SubView = 'menu' | 'dashboard' | 'history' | 'detail' | 'pauta'
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

const PRIMARY = '#22c55e'
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
    const [selectedProduct, setSelectedProduct] = useState<{ name: string; stats: any } | null>(null)
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
        setRawData(orders); setStats(s); setFileName(name); setSubView('dashboard')

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

    const handleSaveReport = async () => {
        if (!stats || !rawData) return
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Inicia sesión para guardar')
            const { data, error } = await supabase.from('logistics_reports').insert({
                user_id: user.id,
                report_date: new Date().toLocaleString(),
                name: fileName,
                stats: stats,
                raw_data: rawData
            }).select()
            if (error) throw error
            if (data?.[0]) {
                setHistory(prev => [{ id: data[0].id, date: data[0].report_date, name: data[0].name, stats: data[0].stats, rawData: data[0].raw_data }, ...prev].slice(0, 15))
            }
            showToast('✅ Reporte guardado exitosamente')
        } catch (e: any) {
            showToast('❌ Error: ' + e.message, false)
        } finally {
            setIsLoading(false)
        }
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
                subView === 'menu' ? <Menu onUpload={() => fileRef.current?.click()} onHistory={() => setSubView('history')} setSubView={setSubView} /> :
                    subView === 'history' ? <HistoryView history={history} onBack={() => setSubView('menu')} onSelect={(r: SavedReport) => { setStats(r.stats); setRawData(r.rawData); setFileName(r.name); setSubView('dashboard') }} onDelete={async (id: string) => { await supabase.from('logistics_reports').delete().eq('id', id); setHistory(p => p.filter(h => h.id !== id)) }} /> :
                        subView === 'pauta' ? <PautaCalculator onBack={() => setSubView('menu')} /> :
                            stats ? <Dashboard stats={stats} rawData={rawData} fileName={fileName} adSpend={adSpend} setAdSpend={setAdSpend} productPauta={productPauta} setProductPauta={setProductPauta} onBack={() => setSubView('menu')} onUpload={() => fileRef.current?.click()} onModal={setModalType} onDetail={openDetail} onCarrier={setCarrierDetail} onSave={handleSaveReport} onProductDetail={setSelectedProduct} /> : null
            }
            {modalType && <EfficiencyModal type={modalType} data={rawData} onClose={() => setModalType(null)} />}
            {detailOpen && <DetailModal title={detailTitle} data={getDetailData()} filter={detailFilter} setFilter={setDetailFilter} onClose={() => setDetailOpen(false)} />}
            {carrierDetail && <CarrierDetailModal carrier={carrierDetail} data={rawData} onClose={() => setCarrierDetail(null)} />}
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct.name}
                    stats={selectedProduct.stats}
                    pauta={productPauta[selectedProduct.name] || 0}
                    setPauta={(val: number) => setProductPauta((prev: any) => ({ ...prev, [selectedProduct.name]: val }))}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </div>
    )
}

// ─── MENU ───────────────────────────────────────────────────────────
function Menu({ onUpload, onHistory, setSubView }: any) {
    return (
        <div style={{ padding: '60px 24px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'white', padding: '8px 20px', borderRadius: 100, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: 24 }}>
                <div style={{ width: 8, height: 8, background: PRIMARY, borderRadius: '50%' }}></div>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#1a1a2e', letterSpacing: '0.05em' }}>CENTRO DE OPERACIONES</span>
            </div>

            <h1 style={{ fontSize: 42, fontWeight: 950, color: '#1a1a2e', marginBottom: 16, letterSpacing: '-0.03em' }}>
                Auditor <span style={{ color: PRIMARY }}>Logístico</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: 16, marginBottom: 50, maxWidth: 600, margin: '0 auto 50px', lineHeight: 1.6 }}>
                La herramienta estratégica para controlar tus finanzas reales, <br />
                reducir devoluciones y auditar tus transportadoras.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                <div
                    onClick={onUpload}
                    className="card shadow-hover"
                    style={{ padding: '40px 32px', cursor: 'pointer', textAlign: 'left', border: '1px solid #f1f5f9', borderRadius: 28, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                    <div style={{ width: 64, height: 64, background: `${PRIMARY}10`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <Upload color={PRIMARY} size={32} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a2e', marginBottom: 12 }}>Subir Nuevo Reporte</h3>
                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
                        Carga tu archivo Excel o CSV de Dropi para analizar utilidades, fletes y estados de entrega.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: PRIMARY, fontWeight: 900, fontSize: 13 }}>
                        COMENZAR ANÁLISIS <ChevronRight size={16} />
                    </div>
                </div>

                <div
                    onClick={onHistory}
                    className="card shadow-hover"
                    style={{ padding: '40px 32px', cursor: 'pointer', textAlign: 'left', border: '1px solid #f1f5f9', borderRadius: 28 }}
                >
                    <div style={{ width: 64, height: 64, background: '#3b82f610', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <History color="#3b82f6" size={32} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a2e', marginBottom: 12 }}>Consultar Historial</h3>
                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
                        Revisa tus reportes guardados anteriormente y compara el rendimiento de tus campañas.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6', fontWeight: 900, fontSize: 13 }}>
                        VER REPORTES <ChevronRight size={16} />
                    </div>
                </div>

                <div
                    onClick={() => setSubView('pauta')}
                    className="card shadow-hover"
                    style={{ padding: '40px 32px', cursor: 'pointer', textAlign: 'left', border: '1px solid #f1f5f9', borderRadius: 28 }}
                >
                    <div style={{ width: 64, height: 64, background: '#a855f710', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <ChartIcon color="#a855f7" size={32} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a2e', marginBottom: 12 }}>Diario de Pauta</h3>
                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
                        Calculadora estratégica para proyectar tus ventas, CPA objetivo y retorno de inversión.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a855f7', fontWeight: 900, fontSize: 13 }}>
                        PROYECTAR ESCALADO <ChevronRight size={16} />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 60, padding: '24px', background: '#f8fafc', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, background: '#22c55e', borderRadius: '50%' }}></div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Procesador Dropi v2.0</span>
                </div>
                <div style={{ width: 1, height: 20, background: '#cbd5e1' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={16} color="#64748b" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Formatos soportados: .xlsx, .csv</span>
                </div>
            </div>
        </div>
    )
}

// ─── DASHBOARD ──────────────────────────────────────────────────────
function Dashboard({ stats, rawData, fileName, adSpend, setAdSpend, productPauta, setProductPauta, onBack, onUpload, onModal, onDetail, onCarrier, onSave, onProductDetail }: any) {
    const s: LogisticsStats = stats
    const guias = s.guiasGeneradas || 1
    const totalPedidos = s.totalOrders || 1
    const confRate = ((s.guiasGeneradas / totalPedidos) * 100).toFixed(1)
    const cancelRate = ((s.cancelados / totalPedidos) * 100).toFixed(1)
    const delivRate = ((s.entregados / guias) * 100).toFixed(1)
    const transitRate = ((s.enTransito / guias) * 100).toFixed(1)
    const retRate = ((s.devoluciones / guias) * 100).toFixed(1)

    // Exact LogisKei Net Profit calculation: (Ventas + Anticipado) - (Costo Prov + Flete Ent + Flete Dev + Ads)
    const totalRevenue = s.ventasBrutas + s.pagoAnticipado
    const totalCosts = s.costoProveedor + s.fletesEntregados + s.fletesDevolucion + adSpend
    const netProfit = totalRevenue - totalCosts

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

    const statusGrid1 = [
        { label: 'Pend. Confirmación', count: s.pendienteConf, val: s.pendienteConfVal, color: '#f39c12' },
        { label: 'Pendiente Envío', count: s.pendienteEnvio, val: 0, color: '#8e44ad' },
        { label: 'En Novedad', count: s.enNovedad, val: s.novedadVal, color: PRIMARY },
        { label: 'Reclamar en Oficina', count: s.reclamarOficina, val: s.oficinaVal, color: '#8e44ad' },
        { label: 'Tránsito Total', count: s.enTransito, val: s.transitoTotalVal, color: '#2980b9' },
    ]

    const statusGrid2 = [
        { label: 'Entregados', count: s.entregados, val: s.entregadosVal, color: '#27ae60' },
        { label: 'Devoluciones', count: s.devoluciones, val: s.devolucionesVal, color: '#c0392b' },
        { label: 'Cancelados', count: s.cancelados, val: s.canceladosVal, color: '#7f8c8d' },
        { label: 'Rechazados', count: s.rechazados, val: s.rechazadosVal, color: '#c0392b' },
    ]

    return (
        <div style={{ padding: '24px 32px 60px' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button onClick={onBack} style={{ width: 42, height: 42, background: 'white', border: '1px solid #eee', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}><X size={18} /></button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h1 style={{ fontSize: 20, fontWeight: 950, color: '#1a1a2e' }}>Auditor Logístico</h1>
                            <span style={{ fontSize: 10, background: '#eef2ff', color: '#6366f1', padding: '2px 8px', borderRadius: 20, fontWeight: 800 }}>ESTRATÉGICO</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <FileText size={12} /> Analizando: <b>{fileName}</b>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={onUpload} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 16, fontWeight: 850, fontSize: 12, cursor: 'pointer', boxShadow: `0 10px 20px ${PRIMARY}30` }}>
                        <Upload size={16} /> Subir Nuevo Excel
                    </button>
                    <button onClick={onSave} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'white', color: '#1a1a2e', border: '1px solid #1a1a2e', borderRadius: 16, fontWeight: 850, fontSize: 12, cursor: 'pointer' }}>
                        <Save size={16} /> Guardar Reporte
                    </button>
                </div>
            </div>

            {/* Top KPI Cards (LogisKei Style) */}
            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                {[
                    { label: 'Total Pedidos', val: s.totalOrders, icon: <Package size={20} />, color: '#1a1a2e', bg: 'white' },
                    { label: 'Total Guías', val: s.guiasGeneradas, icon: <Truck size={20} />, color: '#3b82f6', bg: 'white' },
                    { label: '% Confirmación', val: `${confRate}%`, icon: <CheckCircle2 size={20} />, color: '#22c55e', bg: '#f0fdf4' },
                    { label: '% Cancelación', val: `${cancelRate}%`, icon: <XCircle size={20} />, color: '#ef4444', bg: '#fef2f2' },
                ].map(k => (
                    <div key={k.label} className="card" style={{ padding: '24px', background: k.bg, borderRadius: 24, border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.02em' }}>{k.label}</div>
                                <div style={{ fontSize: 32, fontWeight: 950, color: k.color }}>{k.val}</div>
                            </div>
                            <div style={{ width: 44, height: 44, background: `${k.color}10`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>{k.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Huge Orange Financial Box */}
            <div style={{ padding: '40px', background: PRIMARY, borderRadius: 32, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: `0 20px 40px ${PRIMARY}25`, marginBottom: 32 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 70%)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 32 }}>
                    <h3 style={{ fontSize: 24, fontWeight: 950, display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
                        $ Finanzas Reales (Entregados)
                    </h3>
                </div>

                <div className="responsive-grid grid-cols-2-1" style={{ gap: 40, position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* 4 Financial Columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                            {[
                                { l: 'Ventas Totales (+)', v: s.ventasBrutas, sub: 'Recaudo efectivo' },
                                { l: 'Costo Prod (-)', v: s.costoProveedor, sub: 'Mayorista' },
                                { l: 'Fletes Ent. (-)', v: s.fletesEntregados, sub: 'Guías entregadas' },
                                { l: 'Fletes Dev. (-)', v: s.fletesDevolucion, sub: 'Logística inversa' },
                            ].map(f => (
                                <div key={f.l}>
                                    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>{f.l}</div>
                                    <div style={{ fontSize: 24, fontWeight: 950, marginTop: 4 }}>${f.v.toLocaleString()}</div>
                                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{f.sub}</div>
                                </div>
                            ))}
                        </div>

                        {/* Anticipado */}
                        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <CheckCircle2 size={20} />
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 900 }}>PEDIDOS SIN RECAUDO</div>
                                    <div style={{ fontSize: 11, opacity: 0.8 }}>Pago Anticipado</div>
                                </div>
                            </div>
                            <span style={{ fontSize: 24, fontWeight: 950 }}>${s.pagoAnticipado.toLocaleString()}</span>
                        </div>

                        {/* Projections */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Activity size={16} /> Proyección de lo que viene en camino (Tránsito)
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 950, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 10 }}>100% = ${s.transitoTotalVal.toLocaleString()}</span>
                            </div>
                            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                                {[0.9, 0.8, 0.7, 0.6, 0.5].map(r => (
                                    <div key={r} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ fontSize: 10, fontWeight: 850 }}>SI ENTREGAS {r * 100}%</div>
                                        <div style={{ fontSize: 15, fontWeight: 950, marginTop: 6 }}>${Math.round(s.transitoTotalVal * r).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right side box (Ads + Net) */}
                    <div style={{ background: 'white', borderRadius: 28, padding: 32, color: '#1a1a2e', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Gasto en Pauta (ADS)</div>
                                <Activity size={14} color="#94a3b8" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: '16px 20px', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: 24, fontWeight: 950, color: '#94a3b8' }}>$</span>
                                <input
                                    className="input-field"
                                    style={{ border: 'none', background: 'none', padding: 0, fontSize: 28, fontWeight: 950, width: '100%', outline: 'none', color: '#1a1a2e' }}
                                    value={adSpend}
                                    onChange={e => {
                                        const val = Number(e.target.value.replace(/[^0-9]/g, ''))
                                        setAdSpend(val)
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: 40 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div style={{ fontSize: 14, fontWeight: 950, color: '#64748b' }}>GANANCIA NETA REAL</div>
                                <AlertCircle size={16} color="#94a3b8" />
                            </div>
                            <div style={{ fontSize: 48, fontWeight: 950, color: netProfit >= 0 ? '#22c55e' : '#ef4444', letterSpacing: '-0.04em' }}>
                                ${netProfit.toLocaleString()}
                            </div>
                            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, fontWeight: 700 }}>* Esta ganancia incluye el dinero de Pago Anticipado.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategic Performance Widgets */}
            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
                {[
                    { label: 'EFECTIVIDAD ENTREGA', val: `${delivRate}%`, type: 'delivery' as ModalType, color: '#22c55e' },
                    { label: 'EN TRÁNSITO GLOBAL', val: `${transitRate}%`, type: 'transit' as ModalType, color: '#3b82f6' },
                    { label: 'TASA DEVOLUCIÓN', val: `${retRate}%`, type: 'returns' as ModalType, color: '#f59e0b' },
                ].map(w => (
                    <div key={w.label} className="card shadow-hover" onClick={() => onModal(w.type)} style={{ padding: '28px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 24 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 }}>{w.label}</div>
                            <div style={{ fontSize: 42, fontWeight: 950, color: w.color }}>{w.val}</div>
                        </div>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: w.color, boxShadow: `0 0 12px ${w.color}50` }}></div>
                    </div>
                ))}
            </div>

            {/* Status Grid Row 1 (5 items) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 16 }}>
                {statusGrid1.map(c => (
                    <div key={c.label} className="card shadow-hover" onClick={() => onDetail(c.label)} style={{ padding: '24px 20px', cursor: 'pointer', borderRadius: 24, borderLeft: `4px solid ${c.color}` }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>{c.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 950, color: c.color }}>{c.count}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, fontWeight: 700 }}>${(c.val || 0).toLocaleString()}</div>
                    </div>
                ))}
            </div>

            {/* Status Grid Row 2 (4 items) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
                {statusGrid2.map(c => (
                    <div key={c.label} className="card shadow-hover" onClick={() => onDetail(c.label)} style={{ padding: '24px 20px', cursor: 'pointer', borderRadius: 24, borderTop: `4px solid ${c.color}` }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>{c.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 950, color: c.color }}>{c.count}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, fontWeight: 700 }}>${(c.val || 0).toLocaleString()}</div>
                    </div>
                ))}
            </div>

            {/* Sections Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 6, height: 28, background: '#1a1a2e', borderRadius: 4 }}></div>
                <h2 style={{ fontSize: 22, fontWeight: 950, color: '#1a1a2e' }}>Efectividad Transportadora</h2>
            </div>

            {/* Transportadora Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 28, border: '1px solid #f1f5f9', marginBottom: 40 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>{['Empresa', 'Enviados', 'Tránsito', 'Devoluciones', 'Cancelados', 'Rechazados', 'Entregados'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                        <tbody>
                            {Object.entries(byCarrier).sort((a, b) => b[1].sent - a[1].sent).map(([name, c]) => (
                                <tr key={name} onClick={() => onCarrier(name)} style={{ background: 'white', cursor: 'pointer' }} className="shadow-hover">
                                    <td style={{ ...td, fontWeight: 900, color: '#1a1a2e', paddingLeft: 24 }}>{name}</td>
                                    <td style={{ ...td, fontWeight: 700 }}>{c.sent}</td>
                                    <td style={{ ...td, color: '#3b82f6', fontWeight: 800 }}>{c.transit} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: 10 }}>({((c.transit / c.sent) * 100).toFixed(0)}%)</span></td>
                                    <td style={{ ...td, color: '#ef4444', fontWeight: 800 }}>{c.dev} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: 10 }}>({((c.dev / c.sent) * 100).toFixed(0)}%)</span></td>
                                    <td style={td}>{c.cancel}</td>
                                    <td style={td}>{c.rechazado}</td>
                                    <td style={{ ...td, color: '#22c55e', fontWeight: 900, paddingRight: 24 }}>{c.entregado} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: 10 }}>({((c.entregado / (c.sent - c.cancel)) * 100).toFixed(0)}%)</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rentabilidad Table */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 6, height: 28, background: PRIMARY, borderRadius: 4 }}></div>
                <h2 style={{ fontSize: 22, fontWeight: 950, color: '#1a1a2e' }}>Rentabilidad por Producto</h2>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 28, border: '1px solid #f1f5f9' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>
                            <th style={{ ...th, paddingLeft: 24 }}>Producto</th>
                            <th style={{ ...th, color: '#22c55e' }}>Entr.</th><th style={{ ...th, color: '#22c55e' }}>% Efec.</th>
                            <th style={{ ...th, color: '#3b82f6' }}>Trán.</th><th style={{ ...th, color: '#3b82f6' }}>% Trán.</th>
                            <th style={{ ...th, color: '#ef4444' }}>Dev.</th><th style={{ ...th, color: '#ef4444' }}>% Dev.</th>
                            <th style={th}>Ventas</th><th style={{ ...th, color: PRIMARY }}>Pauta</th><th style={{ ...th, paddingRight: 24 }}>Utilidad</th>
                        </tr></thead>
                        <tbody>
                            {(() => {
                                const byProd: Record<string, { sent: number; entr: number; tran: number; dev: number; ventas: number; costos: number; fletes: number; cancels: number }> = {}
                                rawData.forEach((o: OrderData) => {
                                    const p = o.producto || 'Sin producto'
                                    if (!byProd[p]) byProd[p] = { sent: 0, entr: 0, tran: 0, dev: 0, ventas: 0, costos: 0, fletes: 0, cancels: 0 }
                                    const c = classifyEstado(o.estado_dropi)
                                    byProd[p].sent++
                                    if (c.entregado) { byProd[p].entr++; byProd[p].ventas += o.valor_recaudo; byProd[p].costos += o.valor_proveedor; byProd[p].fletes += o.flete }
                                    if (c.transito) byProd[p].tran++
                                    if (c.devolucion) { byProd[p].dev++; byProd[p].fletes += o.flete }
                                    if (c.cancelado) byProd[p].cancels++
                                })
                                return Object.entries(byProd).sort((a, b) => b[1].ventas - a[1].ventas).map(([prod, p]) => {
                                    const pauta = productPauta[prod] || 0
                                    const utilidad = p.ventas - p.costos - p.fletes - pauta
                                    const realSent = p.sent - p.cancels
                                    return (
                                        <tr key={prod} style={{ background: 'white', cursor: 'pointer' }} onClick={() => onProductDetail({ name: prod, stats: p })} className="shadow-hover">
                                            <td style={{ ...td, fontWeight: 900, color: '#1a1a2e', paddingLeft: 24, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod}</td>
                                            <td style={{ ...td, color: '#22c55e', fontWeight: 900 }}>{p.entr}</td>
                                            <td style={{ ...td, color: '#22c55e', fontWeight: 700 }}>{realSent ? ((p.entr / realSent) * 100).toFixed(0) : 0}%</td>
                                            <td style={{ ...td, color: '#3b82f6', fontWeight: 900 }}>{p.tran}</td>
                                            <td style={{ ...td, color: '#3b82f6', fontWeight: 700 }}>{realSent ? ((p.tran / realSent) * 100).toFixed(0) : 0}%</td>
                                            <td style={{ ...td, color: '#ef4444', fontWeight: 900 }}>{p.dev}</td>
                                            <td style={{ ...td, color: '#ef4444', fontWeight: 700 }}>{realSent ? ((p.dev / realSent) * 100).toFixed(0) : 0}%</td>
                                            <td style={{ ...td, fontWeight: 800 }}>${p.ventas.toLocaleString()}</td>
                                            <td style={td}>
                                                <input
                                                    style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: 12, padding: '8px 12px', width: 100, fontSize: 13, fontWeight: 900, color: PRIMARY, outline: 'none' }}
                                                    value={pauta || ''}
                                                    placeholder="$ pauta"
                                                    onChange={e => setProductPauta((prev: Record<string, number>) => ({ ...prev, [prod]: Number(e.target.value.replace(/[^0-9]/g, '')) }))}
                                                />
                                            </td>
                                            <td style={{ ...td, fontWeight: 950, color: utilidad >= 0 ? '#22c55e' : '#ef4444', paddingRight: 24, fontSize: 14 }}>${utilidad.toLocaleString()}</td>
                                        </tr>
                                    )
                                })
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Performance Chart Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, marginTop: 40 }}>
                <div style={{ width: 6, height: 28, background: '#3b82f6', borderRadius: 4 }}></div>
                <h2 style={{ fontSize: 22, fontWeight: 950, color: '#1a1a2e' }}>Análisis Geográfico de Transportadoras</h2>
            </div>
            <CarrierPerformanceChart data={rawData} />
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
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [subStatus, setSubStatus] = useState('all')

    const isTransitView = title.toLowerCase().includes('tránsito') || title.toLowerCase().includes('transito')
    const uniqueStatuses = Array.from(new Set(data.map((o: any) => o.estado_dropi))).sort()

    const parseOrderDate = (d: string) => {
        if (!d) return null
        // Handle DD/MM/YYYY or YYYY-MM-DD
        if (d.includes('/')) {
            const parts = d.split(' ')[0].split('/')
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
        }
        return new Date(d)
    }

    const headerColor = getStatusColor(title)
    const filtered = data.filter((o: OrderData) => {
        const matchesSearch = (o.id || '').includes(search) || (o.guia || '').includes(search) ||
            (o.cliente || '').toLowerCase().includes(search.toLowerCase()) ||
            (o.producto || '').toLowerCase().includes(search.toLowerCase())

        if (!matchesSearch) return false

        if (subStatus !== 'all' && o.estado_dropi !== subStatus) return false

        const orderDate = parseOrderDate(o.fecha)
        if (orderDate) {
            if (startDate && orderDate < new Date(startDate)) return false
            if (endDate && orderDate > new Date(endDate)) return false
        }
        return true
    })
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

                    {isTransitView && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8f8f8', border: '1px solid #eee', borderRadius: 10, padding: '4px 10px' }}>
                            <Filter size={13} color="#bbb" />
                            <select
                                value={subStatus}
                                onChange={e => setSubStatus(e.target.value)}
                                style={{ border: 'none', background: 'transparent', fontSize: 11, fontWeight: 700, outline: 'none', color: '#666', cursor: 'pointer' }}
                            >
                                <option value="all">TODOS LOS ESTADOS</option>
                                {uniqueStatuses.map((s: any) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8f8f8', border: '1px solid #eee', borderRadius: 10, padding: '4px 10px' }}>
                        <Calendar size={13} color="#bbb" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 11, outline: 'none', color: '#666' }} />
                        <span style={{ color: '#ccc' }}>→</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 11, outline: 'none', color: '#666' }} />
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
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function PautaCalculator({ onBack }: any) {
    const [orders, setOrders] = useState(100)
    const [cpa, setCpa] = useState(8000)
    const [price, setPrice] = useState(69900)
    const [cost, setCost] = useState(25000)
    const [flete, setFlete] = useState(15000)
    const [eff, setEff] = useState(80)

    const totalAds = orders * cpa
    const delivered = Math.round(orders * (eff / 100))
    const totalRev = delivered * price
    const totalProdCost = delivered * cost
    const totalFlete = orders * (flete + (100 - eff) / 100 * flete * 0.5)
    const totalProfit = totalRev - totalProdCost - totalFlete - totalAds
    const roas = totalAds > 0 ? totalRev / totalAds : 0

    return (
        <div style={{ padding: '40px 32px', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={onBack} style={{ width: 42, height: 42, background: 'white', border: '1px solid #eee', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                    <h1 style={{ fontSize: 24, fontWeight: 950, color: '#1a1a2e' }}>Diario de Pauta</h1>
                </div>
                <div style={{ background: '#f0f9ff', color: '#0369a1', padding: '8px 16px', borderRadius: 100, fontSize: 11, fontWeight: 800 }}>CALCULADORA DE ESCALADO</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
                {[
                    { l: 'Pedidos Esperados', v: orders, s: setOrders, i: <Package size={14} /> },
                    { l: 'CPA Objetivo ($)', v: cpa, s: setCpa, i: <Activity size={14} /> },
                    { l: 'Precio Venta ($)', v: price, s: setPrice, i: <FileText size={14} /> },
                    { l: 'Costo Producto ($)', v: cost, s: setCost, i: <Truck size={14} /> },
                    { l: 'Flete Promedio ($)', v: flete, s: setFlete, i: <Truck size={14} /> },
                    { l: '% Efectividad', v: eff, s: setEff, i: <CheckCircle2 size={14} /> },
                ].map(x => (
                    <div key={x.l} style={{ background: 'white', padding: '24px', borderRadius: 24, border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>{x.i} {x.l}</div>
                        <input
                            type="number"
                            value={x.v}
                            onChange={e => x.s(Number(e.target.value))}
                            style={{ border: 'none', background: '#f8fafc', padding: '16px 20px', borderRadius: 16, fontSize: 20, fontWeight: 950, width: '100%', outline: 'none', color: '#1a1a2e' }}
                        />
                    </div>
                ))}
            </div>

            <div style={{ background: '#1a1a2e', borderRadius: 32, padding: '48px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 48, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', marginBottom: 12 }}>Utilidad Proyectada</div>
                    <div style={{ fontSize: 64, fontWeight: 950, color: totalProfit >= 0 ? '#22c55e' : '#ef4444', letterSpacing: '-0.04em' }}>
                        ${totalProfit.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.5, marginTop: 12 }}>Proyección basada en {delivered} entregas ({eff}%)</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 40 }}>
                    {[
                        { l: 'Gasto en Ads', v: `$${totalAds.toLocaleString()}`, c: 'white' },
                        { l: 'ROAS', v: roas.toFixed(2), c: PRIMARY },
                        { l: 'Ventas Totales', v: `$${totalRev.toLocaleString()}`, c: 'white' },
                        { l: 'Margen Neto', v: `${totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : 0}%`, c: 'white' },
                    ].map(x => (
                        <div key={x.l}>
                            <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{x.l}</div>
                            <div style={{ fontSize: 28, fontWeight: 950, color: x.c }}>{x.v}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

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
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 10 }}>{label as string}</div>
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
                            <div style={{ width: 44, height: 44, background: `${PRIMARY}15`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={18} color={PRIMARY} /></div>
                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onSelect(h)}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>{h.name}</div>
                                <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{h.date} • {h.stats?.totalOrders} pedidos • {h.stats?.entregados} entregados</div>
                            </div>
                            <div style={{ textAlign: 'right', marginRight: 16 }}>
                                <div style={{ fontSize: 15, fontWeight: 900, color: '#27ae60' }}>${(h.stats?.ventasBrutas || 0).toLocaleString()}</div>
                                <div style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase' }}>Ventas</div>
                            </div>
                            <button onClick={() => onDelete(h.id)} style={{ border: 'none', background: '#fff0f0', color: '#e74c3c', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function ProductDetailModal({ product, stats, pauta, setPauta, onClose }: any) {
    const p = stats
    const utility = p.ventas - p.costos - p.fletes - pauta
    const margin = p.ventas > 0 ? (utility / p.ventas) * 100 : 0

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }} onClick={onClose} />
            <div style={{ position: 'relative', width: '90%', maxWidth: 500, background: 'white', borderRadius: 32, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.4)', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ background: PRIMARY, padding: '32px', color: 'white' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ANÁLISIS DE PRODUCTO</div>
                    <h2 style={{ fontSize: 24, fontWeight: 950, marginTop: 8, lineHeight: 1.2 }}>{product}</h2>
                </div>

                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Ventas Brutas</div>
                            <div style={{ fontSize: 20, fontWeight: 950, color: '#1a1a2e', marginTop: 4 }}>${p.ventas.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Costos (Prod+Flete)</div>
                            <div style={{ fontSize: 20, fontWeight: 950, color: '#ef4444', marginTop: 4 }}>-${(p.costos + p.fletes).toLocaleString()}</div>
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 24, padding: '24px', border: '1px solid #f1f5f9', marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: '#1a1a2e' }}>INVERSIÓN ADS (PAUTA)</div>
                            <Activity size={14} color={PRIMARY} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', padding: '16px 20px', borderRadius: 16, border: '1px solid #e2e8f0 shadow-sm' }}>
                            <span style={{ fontSize: 20, fontWeight: 950, color: '#94a3b8' }}>$</span>
                            <input
                                autoFocus
                                className="input-field"
                                style={{ border: 'none', background: 'none', padding: 0, fontSize: 24, fontWeight: 950, width: '100%', outline: 'none' }}
                                value={pauta || ''}
                                onChange={e => setPauta(Number(e.target.value.replace(/[^0-9]/g, '')))}
                            />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#64748b' }}>UTILIDAD NETA</div>
                            <div style={{ fontSize: 36, fontWeight: 950, color: utility >= 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>
                                ${utility.toLocaleString()}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Margen</div>
                            <div style={{ fontSize: 20, fontWeight: 950, color: utility >= 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>{margin.toFixed(1)}%</div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{ width: '100%', marginTop: 32, padding: '16px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 16, fontWeight: 900, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                    >
                        LISTO, CERRAR
                    </button>
                </div>
            </div>
        </div>
    )
}

function LoadingSpinner() {
    return (
        <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <Loader2 className="spin" size={48} color={PRIMARY} />
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Procesando Datos...</h2>
                <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Analizando pedidos, transportadoras y finanzas.</p>
            </div>
        </div>
    )
}

function CarrierPerformanceChart({ data }: { data: OrderData[] }) {
    const [groupBy, setGroupBy] = useState<'departamento' | 'ciudad'>('departamento')
    const [metric, setMetric] = useState<'eff' | 'ret'>('eff')

    const CHART_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#64748b']

    const regionMap: Record<string, Record<string, { sent: number; del: number; ret: number }>> = {}
    const carriersSet = new Set<string>()

    data.forEach(o => {
        const region = (o[groupBy] || 'N/A').toUpperCase().trim().slice(0, 15)
        const carrier = (o.transportadora || 'SIN ASIGNAR').toUpperCase().trim()
        if (!region || region === 'N/A') return
        carriersSet.add(carrier)

        if (!regionMap[region]) regionMap[region] = {}
        if (!regionMap[region][carrier]) regionMap[region][carrier] = { sent: 0, del: 0, ret: 0 }

        const c = classifyEstado(o.estado_dropi)
        regionMap[region][carrier].sent++
        if (c.entregado) regionMap[region][carrier].del++
        if (c.devolucion) regionMap[region][carrier].ret++
    })

    const chartData = Object.entries(regionMap)
        .map(([region, carrierStats]) => {
            const row: any = { region }
            let totalSent = 0
            Object.entries(carrierStats).forEach(([carrier, s]) => {
                totalSent += s.sent
                row[carrier] = metric === 'eff' ? (s.sent > 0 ? (s.del / s.sent) * 100 : 0) : (s.sent > 0 ? (s.ret / s.sent) * 100 : 0)
            })
            row.totalSent = totalSent
            return row
        })
        .sort((a, b) => b.totalSent - a.totalSent)
        .slice(0, 15)

    const carriers = Array.from(carriersSet).sort((a, b) => {
        const countA = data.filter(o => o.transportadora === a).length
        const countB = data.filter(o => o.transportadora === b).length
        return countB - countA
    }).slice(0, 5)

    return (
        <div className="card" style={{ padding: '32px', borderRadius: 28, border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', background: '#f8fafc', padding: '6px', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                    <button onClick={() => setGroupBy('departamento')} style={{ padding: '8px 16px', fontSize: 11, fontWeight: 800, border: 'none', borderRadius: 10, cursor: 'pointer', background: groupBy === 'departamento' ? 'white' : 'transparent', color: groupBy === 'departamento' ? '#1a1a2e' : '#94a3b8', boxShadow: groupBy === 'departamento' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>DEPARTAMENTOS</button>
                    <button onClick={() => setGroupBy('ciudad')} style={{ padding: '8px 16px', fontSize: 11, fontWeight: 800, border: 'none', borderRadius: 10, cursor: 'pointer', background: groupBy === 'ciudad' ? 'white' : 'transparent', color: groupBy === 'ciudad' ? '#1a1a2e' : '#94a3b8', boxShadow: groupBy === 'ciudad' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>CIUDADES</button>
                </div>
                <div style={{ display: 'flex', background: '#f8fafc', padding: '6px', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                    <button onClick={() => setMetric('eff')} style={{ padding: '8px 16px', fontSize: 11, fontWeight: 800, border: 'none', borderRadius: 10, cursor: 'pointer', background: metric === 'eff' ? '#10b981' : 'transparent', color: metric === 'eff' ? 'white' : '#94a3b8' }}>% EFECTIVIDAD</button>
                    <button onClick={() => setMetric('ret')} style={{ padding: '8px 16px', fontSize: 11, fontWeight: 800, border: 'none', borderRadius: 10, cursor: 'pointer', background: metric === 'ret' ? '#ef4444' : 'transparent', color: metric === 'ret' ? 'white' : '#94a3b8' }}>% DEVOLUCIÓN</button>
                </div>
            </div>
            <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '12px 16px' }} itemStyle={{ fontSize: 12, fontWeight: 800 }} labelStyle={{ fontSize: 13, fontWeight: 950, marginBottom: 8, color: '#1a1a2e' }} />
                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', paddingBottom: 20 }} />
                        {carriers.map((carrier, idx) => (
                            <Bar key={carrier} dataKey={carrier} name={carrier} fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={[6, 6, 0, 0]} barSize={groupBy === 'departamento' ? 20 : 12} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
