'use client'

import React, { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
    Truck, Upload, Calendar, History, DollarSign,
    ArrowUpRight, ArrowDownRight, Package, Grid,
    TrendingUp, AlertCircle, FileText, ChevronRight,
    Users, MapPin, CheckCircle2, XCircle, Clock,
    BarChart3, PieChart, Activity, Save, X, Info,
    Search, Download, Filter, ExternalLink, Loader2, Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type SubView = 'menu' | 'diary' | 'dashboard' | 'history' | 'detail'

interface OrderData {
    id: string
    fecha: string
    cliente: string
    producto: string
    cantidad: number
    estado_dropi: string
    valor_recaudo: number
    valor_proveedor: number
    flete: number
    guia: string
    dias_mov: number
    transportadora: string
    departamento: string
    ciudad: string
}

interface SavedReport {
    id: string
    date: string
    name: string
    stats: LogisticsStats
    rawData: OrderData[]
}

interface LogisticsStats {
    totalOrders: number
    guiasGeneradas: number
    entregados: number
    enTransito: number
    devoluciones: number
    cancelados: number
    ventasBrutas: number
    costoProveedor: number
    fletesEntregados: number
    fletesDevolucion: number
    pagoAnticipado: number
    transitoTotalVal: number
}

export default function LogisticsView() {
    const [subView, setSubView] = useState<SubView>('menu')
    const [isLoading, setIsLoading] = useState(false)
    const [rawData, setRawData] = useState<OrderData[]>([])
    const [stats, setStats] = useState<LogisticsStats | null>(null)
    const [history, setHistory] = useState<SavedReport[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pixora_logistics_history')
            return saved ? JSON.parse(saved) : []
        }
        return []
    })
    const [adSpendGlobal, setAdSpendGlobal] = useState(0)
    const [showEfficiencyModal, setShowEfficiencyModal] = useState<'delivery' | 'transit' | 'returns' | null>(null)
    const [detailTitle, setDetailTitle] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data, error } = await supabase
                        .from('logistics_reports')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(10)

                    if (data) {
                        const formattedHistory: SavedReport[] = data.map((h: any) => ({
                            id: h.id,
                            date: h.report_date,
                            name: h.name,
                            stats: h.stats,
                            rawData: h.raw_data
                        }))
                        setHistory(formattedHistory)
                    }
                }
            } catch (error) {
                console.error('Error fetching history:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchHistory()
    }, [])

    const processExcel = (data: any[], fileName: string = 'Reporte') => {
        // Mapeo exhaustivo para el formato real de Dropi
        const orders: OrderData[] = data.map((row: any) => ({
            id: String(row['ID Pedido'] || row['ID'] || row['id'] || row['#'] || ''),
            fecha: row['Fecha'] || row['fecha'] || row['Fecha Creación'] || '',
            cliente: row['Nombre Cliente'] || row['Cliente'] || row['Nombre'] || row['cliente'] || '',
            producto: row['Producto'] || row['Nombre del Producto'] || row['producto'] || '',
            cantidad: Number(row['Cantidad'] || row['Unidades'] || 1),
            estado_dropi: (row['Estado'] || row['Estado Dropi'] || row['estado'] || row['Status'] || '').toUpperCase(),
            valor_recaudo: Number(row['Precio Venta'] || row['Valor Recaudo'] || row['Total'] || row['valor_recaudo'] || row['Total Pedido'] || 0),
            valor_proveedor: Number(row['Costo Mayorista'] || row['Costo Proveedor'] || row['Costo Producto'] || row['Precio Proveedor'] || row['costo_proveedor'] || 0),
            flete: Number(row['Flete'] || row['Costo Flete'] || row['flete'] || 0),
            guia: String(row['Guía'] || row['Guia'] || row['Numero de Guía'] || row['guia'] || ''),
            dias_mov: Number(row['Días Movimiento'] || row['dias_movimiento'] || 0),
            transportadora: (row['Logística'] || row['Transportadora'] || row['Logistica'] || row['Logistica Transportadora'] || row['transportadora'] || 'SIN ASIGNAR').toUpperCase(),
            departamento: row['Departamento'] || row['departamento'] || '',
            ciudad: row['Ciudad'] || row['ciudad'] || ''
        })).filter(o => o.id && o.id !== 'undefined' && o.id !== '')

        setRawData(orders)

        // Calcular Estadísticas
        const delivered = orders.filter(o => o.estado_dropi.includes('ENTREGADO'))
        const inTransit = orders.filter(o => o.estado_dropi.includes('TRANSITO') || o.estado_dropi.includes('REPARTO'))
        const returned = orders.filter(o => o.estado_dropi.includes('DEVOLUCION') || o.estado_dropi.includes('RECHAZADO'))
        const cancelled = orders.filter(o => o.estado_dropi.includes('CANCELADO'))

        const calculatedStats: LogisticsStats = {
            totalOrders: orders.length,
            guiasGeneradas: orders.filter(o => o.guia && o.guia !== '').length,
            entregados: delivered.length,
            enTransito: inTransit.length,
            devoluciones: returned.length,
            cancelados: cancelled.length,
            ventasBrutas: delivered.reduce((acc, o) => acc + o.valor_recaudo, 0),
            costoProveedor: delivered.reduce((acc, o) => acc + o.valor_proveedor, 0),
            fletesEntregados: delivered.reduce((acc, o) => acc + o.flete, 0),
            fletesDevolucion: returned.reduce((acc, o) => acc + o.flete, 0),
            pagoAnticipado: orders.filter(o => o.estado_dropi.includes('ANTICIPADO')).reduce((acc, o) => acc + o.valor_recaudo, 0),
            transitoTotalVal: inTransit.reduce((acc, o) => acc + o.valor_recaudo, 0)
        }

        setStats(calculatedStats)

        // Guardar en la base de datos automáticamente
        const saveToDB = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: inserted, error } = await supabase
                        .from('logistics_reports')
                        .insert({
                            user_id: user.id,
                            report_date: new Date().toLocaleString(),
                            name: fileName,
                            stats: calculatedStats,
                            raw_data: orders
                        })
                        .select()

                    if (inserted && inserted[0]) {
                        const newReport: SavedReport = {
                            id: inserted[0].id,
                            date: inserted[0].report_date,
                            name: inserted[0].name,
                            stats: inserted[0].stats,
                            rawData: inserted[0].raw_data
                        }
                        setHistory(prev => [newReport, ...prev].slice(0, 10))
                    }
                } else {
                    // Fallback to local history if no user
                    const newSavedReport: SavedReport = {
                        id: Math.random().toString(36).substr(2, 9),
                        date: new Date().toLocaleString(),
                        name: fileName,
                        stats: calculatedStats,
                        rawData: orders
                    }
                    setHistory(prev => [newSavedReport, ...prev].slice(0, 10))
                }
            } catch (error) {
                console.error('Error saving report:', error)
            }
        }

        saveToDB()
        setSubView('dashboard')
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)
                processExcel(data, file.name)
            } catch (error) {
                alert('Error al leer el archivo. Asegúrate de que sea un Excel válido.')
            } finally {
                setIsLoading(false)
            }
        }
        reader.readAsBinaryString(file)
    }

    const renderContent = () => {
        if (isLoading) return <LoadingState />

        switch (subView) {
            case 'menu': return <LogisticsMenu onUpload={() => fileInputRef.current?.click()} onSelect={setSubView} />
            case 'diary': return <DiaryOfAds onBack={() => setSubView('menu')} />
            case 'dashboard': return (
                <LogisticsDashboard
                    stats={stats}
                    onBack={() => setSubView('menu')}
                    onOpenEfficiency={setShowEfficiencyModal}
                    onOpenDetail={(title: string) => { setDetailTitle(title); setSubView('detail') }}
                    adSpend={adSpendGlobal}
                    setAdSpend={setAdSpendGlobal}
                    rawData={rawData}
                />
            )
            case 'detail': return (
                <LogisticsDetailView
                    title={detailTitle}
                    onBack={() => setSubView('dashboard')}
                    data={rawData.filter(o => {
                        const t = detailTitle.toLowerCase()
                        if (t.includes('confirmación')) return o.estado_dropi.includes('CONFIRMACION')
                        if (t.includes('novedad')) return o.estado_dropi.includes('NOVEDAD')
                        if (t.includes('oficina')) return o.estado_dropi.includes('OFICINA')
                        if (t.includes('tránsito')) return o.estado_dropi.includes('TRANSITO') || o.estado_dropi.includes('REPARTO')
                        if (t.includes('entregados')) return o.estado_dropi.includes('ENTREGADO')
                        if (t.includes('devueltos')) return o.estado_dropi.includes('DEVOLUCION')
                        return true
                    })}
                />
            )
            case 'history': return (
                <HistoryView
                    history={history}
                    onBack={() => setSubView('menu')}
                    onSelectReport={(report: SavedReport) => {
                        setStats(report.stats)
                        setRawData(report.rawData)
                        setSubView('dashboard')
                    }}
                    onDeleteReport={async (id: string) => {
                        const { error } = await supabase
                            .from('logistics_reports')
                            .delete()
                            .eq('id', id)

                        if (!error) {
                            setHistory(prev => prev.filter(h => h.id !== id))
                        } else {
                            // Local fallback if UUID fails (for old local items)
                            setHistory(prev => prev.filter(h => h.id !== id))
                        }
                    }}
                />
            )
            default: return <LogisticsMenu onUpload={() => fileInputRef.current?.click()} onSelect={setSubView} />
        }
    }

    return (
        <div className="main-scroll custom-scrollbar" style={{ animation: 'fadeIn 0.2s ease' }}>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" style={{ display: 'none' }} />
            {renderContent()}
            {showEfficiencyModal && (
                <EfficiencyModal
                    type={showEfficiencyModal}
                    onClose={() => setShowEfficiencyModal(null)}
                    data={rawData}
                />
            )}
        </div>
    )
}

// --- COMPONENTS ---

function LoadingState() {
    return (
        <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <Loader2 className="spin" size={48} color="#e67e22" />
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Procesando Datos de Logística...</h2>
                <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Analizando pedidos, transportadoras y finanzas reales.</p>
            </div>
        </div>
    )
}

function LogisticsMenu({ onUpload, onSelect }: any) {
    return (
        <div style={{ padding: '80px 24px', maxWidth: 1000, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, textAlign: 'center', marginBottom: 40, letterSpacing: '-0.02em' }}>AUDITOR LOGÍSTICO</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                <MenuCard title="Subir Reporte" desc="Carga tu archivo Excel de Dropi" icon={<Upload color="#3498db" />} onClick={onUpload} />
                <MenuCard title="Diario de Pauta" desc="Control proyectado" icon={<Calendar color="#4CAF50" />} onClick={() => onSelect('diary')} />
                <MenuCard title="Ver Historial" desc="Reportes guardados" icon={<Clock color="#e67e22" />} onClick={() => onSelect('history')} />
            </div>
        </div>
    )
}

function LogisticsDashboard({ stats, onBack, onOpenEfficiency, onOpenDetail, adSpend, setAdSpend, rawData }: any) {
    if (!stats) return null
    const netProfit = stats.ventasBrutas - stats.costoProveedor - stats.fletesEntregados - stats.fletesDevolucion - adSpend

    return (
        <div style={{ padding: '24px 32px 60px' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={onBack} className="sidebar-logo-icon" style={{ cursor: 'pointer', border: 'none', background: '#f5f5f5' }}><X size={16} /></button>
                    <h1 style={{ fontSize: 20, fontWeight: 900 }}>Análisis de Informe Real</h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-secondary" onClick={() => window.print()}><Download size={16} /> Exportar</button>
                    <button className="btn-primary" style={{ background: '#e67e22' }} onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}><Upload size={16} /> Cargar Nuevo</button>
                </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                <HeaderStat label="Pedidos" val={stats.totalOrders} icon={<Package size={14} />} />
                <HeaderStat label="Guías" val={stats.guiasGeneradas} icon={<FileText size={14} />} />
                <HeaderStat label="Confirmación" val={`${((stats.guiasGeneradas / stats.totalOrders) * 100).toFixed(1)}%`} icon={<CheckCircle2 size={14} />} color="#4CAF50" />
                <HeaderStat label="Cancelados" val={stats.cancelados} icon={<XCircle size={14} />} color="#e74c3c" />
            </div>

            {/* Finance Card */}
            <div style={{ background: '#e67e22', borderRadius: 24, padding: '32px', color: 'white', marginBottom: 24, boxShadow: '0 20px 40px rgba(230, 126, 34, 0.2)' }}>
                <div style={{ display: 'flex', gap: 40 }}>
                    <div style={{ flex: 1.4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 11, fontWeight: 800, opacity: 0.8 }}>FINANZAS REALES (ENTREGADOS)</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, display: 'block' }}>TASA ENTREGA</span>
                                    <span style={{ fontSize: 14, fontWeight: 900 }}>{((stats.entregados / (stats.guiasGeneradas || 1)) * 100).toFixed(1)}%</span>
                                </div>
                                <div style={{ width: 60, height: 60, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="60" height="60" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="10"
                                            strokeDasharray={`${(stats.entregados / (stats.guiasGeneradas || 1)) * 251.2} 251.2`}
                                            strokeLinecap="round" transform="rotate(-90 50 50)"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                            <FinStat label="Ventas (+)" val={stats.ventasBrutas} />
                            <FinStat label="Costo Prov (-)" val={stats.costoProveedor} />
                            <FinStat label="Fletes (+)" val={stats.fletesEntregados} />
                            <FinStat label="Devoluciones (-)" val={stats.fletesDevolucion} />
                        </div>
                        <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 16, display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>💰 DINERO ANTICIPADO <div className="tooltip-parent" style={{ position: 'relative', display: 'flex' }}><Info size={12} opacity={0.6} /></div></span>
                            <span style={{ fontSize: 14, fontWeight: 900 }}>$ {stats.pagoAnticipado.toLocaleString()}</span>
                        </div>
                    </div>
                    <div style={{ flex: 0.6, background: 'white', borderRadius: 20, padding: 24, color: '#1a1a2e', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: '#fcfcfc', borderRadius: '0 0 0 80px', pointerEvents: 'none' }} />
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#999', position: 'relative' }}>GASTO EN PAUTA</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '8px 0', borderBottom: '2px solid #eee', paddingBottom: 4 }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: '#999' }}>$</span>
                            <input
                                className="input-field"
                                style={{ border: 'none', background: 'none', padding: 0, fontSize: 18, fontWeight: 900, width: '100%' }}
                                value={adSpend}
                                onChange={e => setAdSpend(Number(e.target.value))}
                            />
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#999' }}>UTILIDAD NETA FINAL</span>
                            <div style={{ fontSize: 32, fontWeight: 950, color: netProfit >= 0 ? '#4CAF50' : '#e74c3c', letterSpacing: '-0.03em' }}>$ {netProfit.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Efficiency Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
                <BigStatCard label="Efectividad Entrega" val={`${((stats.entregados / stats.guiasGeneradas) * 100).toFixed(1)}%`} icon={<CheckCircle2 />} onClick={() => onOpenEfficiency('delivery')} />
                <BigStatCard label="En Tránsito" val={stats.enTransito} icon={<Truck />} onClick={() => onOpenEfficiency('transit')} />
                <BigStatCard label="Tasa Devolución" val={`${((stats.devoluciones / stats.guiasGeneradas) * 100).toFixed(1)}%`} icon={<Activity />} onClick={() => onOpenEfficiency('returns')} />
            </div>

            {/* Detailed Status Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                <StatusSmall label="Novedades" count={rawData.filter((o: any) => o.estado_dropi.includes('NOVEDAD')).length} onClick={() => onOpenDetail('Pedidos en Novedad')} />
                <StatusSmall label="Oficina" count={rawData.filter((o: any) => o.estado_dropi.includes('OFICINA')).length} onClick={() => onOpenDetail('Reclamar en Oficina')} />
                <StatusSmall label="Confirmar" count={rawData.filter((o: any) => o.estado_dropi.includes('CONFIRMACION')).length} onClick={() => onOpenDetail('Pendiente Confirmación')} />
                <StatusSmall label="Entregados" count={stats.entregados} onClick={() => onOpenDetail('Pedidos Entregados')} />
                <StatusSmall label="Devueltos" count={stats.devoluciones} color="#e74c3c" onClick={() => onOpenDetail('Pedidos Devueltos')} />
            </div>
        </div>
    )
}

function MenuCard({ title, desc, icon, onClick }: any) {
    return (
        <div className="card shadow-hover" onClick={onClick} style={{ padding: 32, textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>{title}</h3>
            <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>{desc}</p>
        </div>
    )
}

function HeaderStat({ label, val, icon, color }: any) {
    return (
        <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ color: color || '#999' }}>{icon}</div>
            <div>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#999', display: 'block' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 900 }}>{val}</span>
            </div>
        </div>
    )
}

function FinStat({ label, val }: any) {
    return (
        <div>
            <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.8 }}>{label}</span>
            <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>$ {val.toLocaleString()}</div>
        </div>
    )
}

function BigStatCard({ label, val, icon, onClick }: any) {
    return (
        <div className="card shadow-hover" onClick={onClick} style={{ padding: 24, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#999' }}>{label}</span>
                <div style={{ fontSize: 26, fontWeight: 950, marginTop: 4 }}>{val}</div>
            </div>
            <div style={{ width: 40, height: 40, background: '#f8f9fa', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        </div>
    )
}

function StatusSmall({ label, count, onClick, color }: any) {
    return (
        <div className="card shadow-hover" onClick={onClick} style={{ padding: 12, cursor: 'pointer', textAlign: 'center', borderBottom: color ? `3px solid ${color}` : 'none' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#999' }}>{label}</span>
            <div style={{ fontSize: 18, fontWeight: 950, marginTop: 2 }}>{count}</div>
        </div>
    )
}

function EfficiencyModal({ type, onClose, data }: any) {
    // Agrupar por transportadora
    const grouped = data.reduce((acc: any, o: any) => {
        const t = o.transportadora || 'SIN ASIGNAR'
        if (!acc[t]) acc[t] = { sent: 0, del: 0, ret: 0 }
        acc[t].sent++
        if (o.estado_dropi.includes('ENTREGADO')) acc[t].del++
        if (o.estado_dropi.includes('DEVOLUCION')) acc[t].ret++
        return acc
    }, {})

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
            <div style={{ position: 'relative', width: '90%', maxWidth: 800, background: 'white', borderRadius: 24, padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 900 }}>Efectividad por Transportadora</h2>
                    <button onClick={onClose} className="sidebar-logo-icon"><X size={16} /></button>
                </div>
                <div className="custom-scrollbar" style={{ maxHeight: 400, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ textAlign: 'left', background: '#f9f9f9' }}>
                            <tr>
                                <th style={thStyle}>Transportadora</th>
                                <th style={thStyle}>Enviados</th>
                                <th style={thStyle}>Entregados</th>
                                <th style={thStyle}>Eficiencia %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(grouped).map(([name, s]: any) => {
                                const eff = (s.del / s.sent) * 100
                                return (
                                    <tr key={name} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={tdStyle}><b>{name}</b></td>
                                        <td style={tdStyle}>{s.sent}</td>
                                        <td style={tdStyle}>{s.del}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ flex: 1, height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ width: `${eff}%`, height: '100%', background: eff > 70 ? '#4CAF50' : '#e74c3c' }} />
                                                </div>
                                                <span style={{ fontWeight: 800 }}>{eff.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function LogisticsDetailView({ title, onBack, data }: any) {
    const [searchTerm, setSearchTerm] = useState('')
    const filtered = data.filter((o: any) =>
        (o.id || '').includes(searchTerm) || (o.guia || '').includes(searchTerm) || (o.cliente || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={onBack} className="sidebar-logo-icon"><X size={16} /></button>
                    <h2 style={{ fontSize: 20, fontWeight: 900 }}>{title} ({filtered.length})</h2>
                </div>
                <div style={{ background: 'white', display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: 8, border: '1px solid #eee' }}>
                    <Search size={14} color="#999" />
                    <input
                        placeholder="Buscar ID, Guía o Cliente..."
                        style={{ border: 'none', padding: 10, outline: 'none', fontSize: 13, width: 250 }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="card" style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ textAlign: 'left', background: '#f8f9fa' }}>
                        <tr>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>CLIENTE</th>
                            <th style={thStyle}>ESTADO</th>
                            <th style={thStyle}>GUIA</th>
                            <th style={thStyle}>TRANS.</th>
                            <th style={thStyle}>UBICACIÓN</th>
                            <th style={thStyle}>VALOR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((o: any) => (
                            <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={tdStyle}>{o.id}</td>
                                <td style={tdStyle}>{o.cliente}</td>
                                <td style={tdStyle}><span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', background: '#f0f0f0', borderRadius: 4 }}>{o.estado_dropi}</span></td>
                                <td style={tdStyle}>{o.guia}</td>
                                <td style={tdStyle}>{o.transportadora}</td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: 10, fontWeight: 700 }}>{o.ciudad}</div>
                                    <div style={{ fontSize: 9, color: '#999' }}>{o.departamento}</div>
                                </td>
                                <td style={tdStyle}>$ {o.valor_recaudo.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function HistoryView({ history, onBack, onSelectReport, onDeleteReport }: any) {
    return (
        <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={onBack} className="sidebar-logo-icon" style={{ cursor: 'pointer', border: 'none', background: '#f5f5f5' }}><X size={16} /></button>
                    <h1 style={{ fontSize: 24, fontWeight: 900 }}>Historial de Reportes</h1>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={() => { if (confirm('¿Vaciar todo el historial?')) history.forEach((h: any) => onDeleteReport(h.id)) }}
                        style={{ border: 'none', background: 'none', color: '#e74c3c', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <Trash2 size={14} /> Vaciar Historial
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                    <Clock size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                    <p>No hay reportes guardados todavía.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {history.map((h: any) => (
                        <div key={h.id} className="card shadow-hover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px' }}>
                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onSelectReport(h)}>
                                <div style={{ fontSize: 14, fontWeight: 800 }}>{h.name}</div>
                                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{h.date} • {h.stats.totalOrders} pedidos</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 13, fontWeight: 900, color: '#4CAF50' }}>$ {h.stats.ventasBrutas.toLocaleString()}</div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>Ventas Brutas</div>
                                </div>
                                <button
                                    onClick={() => onDeleteReport(h.id)}
                                    style={{ border: 'none', background: '#fff0f0', color: '#e74c3c', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function DiaryOfAds({ onBack }: any) {
    return <div style={{ padding: 40 }}><button onClick={onBack} className="btn-secondary">Atrás</button><h2 style={{ marginTop: 20 }}>Calculadora Proyectada</h2></div>
}

const thStyle: React.CSSProperties = { padding: '16px 20px', fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase' }
const tdStyle: React.CSSProperties = { padding: '16px 20px', fontSize: 12, color: '#333' }
