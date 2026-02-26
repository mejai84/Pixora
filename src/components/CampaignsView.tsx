'use client'

import React, { useState, useEffect } from 'react'
import {
    Calendar, Package, ShoppingBag, Truck, DollarSign, Target,
    Link as LinkIcon, CheckCircle2, MoreHorizontal, Plus, Trash2,
    Search, Filter, Globe, MousePointer2, ExternalLink, X, Save, Activity
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CampaignRow {
    id: string
    date: string
    store: string
    developer: string
    productName: string
    process: string
    category: string
    variations: string
    ttDate: string
    fbDate: string
    supplier: string
    platformCode: string
    supplierCost: number
    sellingPrice: number
    revised: boolean
    adAccount: string
    fanPage: string
    landingLink: string
}

export default function CampaignsView() {
    const [rows, setRows] = useState<CampaignRow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchCampaigns()
    }, [])

    const fetchCampaigns = async () => {
        try {
            const { data } = await supabase
                .from('campaign_records')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) {
                const formatted = data.map((r: any) => ({
                    id: r.id,
                    date: r.date || '',
                    store: r.store || '',
                    developer: r.developer || '',
                    productName: r.product_name || '',
                    process: r.process || 'Producto nuevo',
                    category: r.category || '',
                    variations: r.variations || '',
                    ttDate: r.tt_date || '',
                    fbDate: r.fb_date || '',
                    supplier: r.supplier || '',
                    platformCode: r.platform_code || '',
                    supplierCost: r.supplier_cost || 0,
                    sellingPrice: r.selling_price || 0,
                    revised: r.revised || false,
                    adAccount: r.ad_account || '',
                    fanPage: r.fan_page || '',
                    landingLink: r.landing_link || ''
                }))
                setRows(formatted)
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const activeRow = rows.find(r => r.id === selectedId) || null

    const handleCreateNew = () => {
        const tempId = 'new_' + Date.now()
        const newRow: CampaignRow = {
            id: tempId,
            date: new Date().toISOString().split('T')[0],
            store: '',
            developer: '',
            productName: '',
            process: 'Producto nuevo',
            category: '',
            variations: '',
            ttDate: '',
            fbDate: '',
            supplier: 'Dropi',
            platformCode: '',
            supplierCost: 0,
            sellingPrice: 0,
            revised: false,
            adAccount: '',
            fanPage: '',
            landingLink: ''
        }
        setRows([newRow, ...rows])
        setSelectedId(tempId)
        setIsModalOpen(true)
    }

    const updateRowLocal = (id: string, updates: Partial<CampaignRow>) => {
        setRows(rows.map(r => r.id === id ? { ...r, ...updates } : r))
    }

    const saveCampaign = async () => {
        if (!activeRow) return
        setIsSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No auth user')

            const dbData = {
                user_id: user.id,
                campaign_id: activeRow.id.startsWith('new_') ? Math.random().toString(36).substr(2, 9) : undefined,
                date: activeRow.date,
                store: activeRow.store,
                developer: activeRow.developer,
                product_name: activeRow.productName,
                process: activeRow.process,
                category: activeRow.category,
                variations: activeRow.variations,
                tt_date: activeRow.ttDate,
                fb_date: activeRow.fbDate,
                supplier: activeRow.supplier,
                platform_code: activeRow.platformCode,
                supplier_cost: activeRow.supplierCost,
                selling_price: activeRow.sellingPrice,
                revised: activeRow.revised,
                ad_account: activeRow.adAccount,
                fan_page: activeRow.fanPage,
                landing_link: activeRow.landingLink
            }

            if (activeRow.id.startsWith('new_')) {
                const { data, error } = await supabase.from('campaign_records').insert(dbData).select().single()
                if (error) throw error
                setRows(rows.map(r => r.id === activeRow.id ? { ...activeRow, id: data.id } : r))
                setSelectedId(data.id)
            } else {
                const { error } = await supabase.from('campaign_records').update(dbData).eq('id', activeRow.id)
                if (error) throw error
            }
            setIsModalOpen(false)
        } catch (error: any) {
            alert('Error al guardar: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const deleteRow = async (id: string) => {
        if (!confirm('¿Eliminar este registro?')) return
        try {
            if (!id.startsWith('new_')) {
                await supabase.from('campaign_records').delete().eq('id', id)
            }
            setRows(rows.filter(r => r.id !== id))
            setIsModalOpen(false)
        } catch (error) {
            console.error('Error deleting:', error)
        }
    }

    const filteredRows = rows.filter(r =>
        r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.store.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="main-scroll custom-scrollbar" style={{ padding: 32, animation: 'fadeIn 0.3s ease' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Target color="#3498db" size={32} /> Seguimiento de Campañas
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Control total de tus lanzamientos y costos breakeven.</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        style={{
                            padding: '12px 24px', borderRadius: 12, background: '#3498db', color: 'white',
                            border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
                        }}
                    >
                        <Plus size={18} /> LANZAR PRODUCTO
                    </button>
                </div>

                {/* Table View */}
                <div style={{ background: 'white', borderRadius: 24, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: 300 }}>
                            <Search size={16} color="#cbd5e1" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar campaña..."
                                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                    <th style={thStyle}>Fecha</th>
                                    <th style={thStyle}>Producto</th>
                                    <th style={thStyle}>Tienda</th>
                                    <th style={thStyle}>Proceso</th>
                                    <th style={thStyle}>Costo Prov.</th>
                                    <th style={thStyle}>P. Venta</th>
                                    <th style={{ ...thStyle, color: '#e74c3c' }}>CPA B.E.</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={{ ...thStyle, width: 80 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>No hay registros encontrados</td>
                                    </tr>
                                ) : (
                                    filteredRows.map(r => {
                                        const cpaBE = r.sellingPrice - r.supplierCost
                                        return (
                                            <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="table-row">
                                                <td style={tdStyle}>{r.date}</td>
                                                <td style={{ ...tdStyle, fontWeight: 700, color: '#1a1a2e' }}>{r.productName || '---'}</td>
                                                <td style={tdStyle}>{r.store || '---'}</td>
                                                <td style={tdStyle}>
                                                    <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: '#f1f5f9', color: '#64748b' }}>
                                                        {r.process}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>${r.supplierCost.toLocaleString()}</td>
                                                <td style={tdStyle}>${r.sellingPrice.toLocaleString()}</td>
                                                <td style={{ ...tdStyle, fontWeight: 900, color: '#e74c3c' }}>${cpaBE.toLocaleString()}</td>
                                                <td style={tdStyle}>
                                                    {r.revised ? <CheckCircle2 size={18} color="#4CAF50" /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #e2e8f0' }} />}
                                                </td>
                                                <td style={tdStyle}>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={() => { setSelectedId(r.id); setIsModalOpen(true); }} style={actionBtn}><Edit3 size={14} /></button>
                                                        <button onClick={() => deleteRow(r.id)} style={{ ...actionBtn, color: '#ef4444' }}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FLOATING MODAL - CAMPAIGN EDITOR */}
                {isModalOpen && activeRow && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(10,10,30,0.6)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                    }} onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                        <div style={{
                            width: '100%', maxWidth: 850, maxHeight: '90vh', background: 'white',
                            borderRadius: 32, overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
                            animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }} className="custom-scrollbar">

                            <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: '#3498db', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Target color="white" size={20} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e' }}>Lanzamiento: {activeRow.productName || 'Nuevo'}</h2>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>CONFIGURACIÓN DE CAMPAÑA</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        onClick={saveCampaign}
                                        disabled={isSaving}
                                        style={{
                                            background: '#3498db', color: 'white', border: 'none', padding: '10px 24px',
                                            borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 8
                                        }}
                                    >
                                        {isSaving ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
                                        GUARDAR CAMPAÑA
                                    </button>
                                    <button onClick={() => setIsModalOpen(false)} style={{ background: '#f8fafc', border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer' }}><X size={20} /></button>
                                </div>
                            </div>

                            <div style={{ padding: 32 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>

                                    {/* Left: General Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <h3 style={sectionTitle}>Información del Producto</h3>
                                        <Field label="Nombre del Producto">
                                            <input value={activeRow.productName} onChange={e => updateRowLocal(activeRow.id, { productName: e.target.value })} style={modalInput} placeholder="Ej: Peluche Viral..." />
                                        </Field>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <Field label="Tienda">
                                                <input value={activeRow.store} onChange={e => updateRowLocal(activeRow.id, { store: e.target.value })} style={modalInput} placeholder="Nombre tienda" />
                                            </Field>
                                            <Field label="ID Desarrollador">
                                                <input value={activeRow.developer} onChange={e => updateRowLocal(activeRow.id, { developer: e.target.value })} style={modalInput} placeholder="Tu nombre" />
                                            </Field>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <Field label="Proceso">
                                                <select value={activeRow.process} onChange={e => updateRowLocal(activeRow.id, { process: e.target.value })} style={modalInput}>
                                                    <option>Producto nuevo</option>
                                                    <option>Migracion</option>
                                                    <option>Relanzamiento</option>
                                                </select>
                                            </Field>
                                            <Field label="Categoría">
                                                <input value={activeRow.category} onChange={e => updateRowLocal(activeRow.id, { category: e.target.value })} style={modalInput} />
                                            </Field>
                                        </div>

                                        <h3 style={{ ...sectionTitle, marginTop: 16 }}>Costos y Finanzas</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <Field label="Costo Proveedor ($)">
                                                <input type="number" value={activeRow.supplierCost} onChange={e => updateRowLocal(activeRow.id, { supplierCost: Number(e.target.value) })} style={modalInput} />
                                            </Field>
                                            <Field label="Precio Venta ($)">
                                                <input type="number" value={activeRow.sellingPrice} onChange={e => updateRowLocal(activeRow.id, { sellingPrice: Number(e.target.value) })} style={modalInput} />
                                            </Field>
                                        </div>
                                        <div style={{ padding: 16, background: '#fef2f2', borderRadius: 16, border: '1px solid #fee2e2' }}>
                                            <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>Breakeven Esperado</div>
                                            <div style={{ fontSize: 24, fontWeight: 900, color: '#b91c1c' }}>${(activeRow.sellingPrice - activeRow.supplierCost).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {/* Right: Technical & Ads */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <h3 style={sectionTitle}>Logística de Ads</h3>
                                        <Field label="Proveedor / Plataforma">
                                            <input value={activeRow.supplier} onChange={e => updateRowLocal(activeRow.id, { supplier: e.target.value })} style={modalInput} placeholder="Ej: Dropi..." />
                                        </Field>
                                        <Field label="Link de Landing Page">
                                            <input value={activeRow.landingLink} onChange={e => updateRowLocal(activeRow.id, { landingLink: e.target.value })} style={modalInput} placeholder="https://..." />
                                        </Field>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <Field label="Fecha Lanz. TT">
                                                <input type="date" value={activeRow.ttDate} onChange={e => updateRowLocal(activeRow.id, { ttDate: e.target.value })} style={modalInput} />
                                            </Field>
                                            <Field label="Fecha Lanz. FB">
                                                <input type="date" value={activeRow.fbDate} onChange={e => updateRowLocal(activeRow.id, { fbDate: e.target.value })} style={modalInput} />
                                            </Field>
                                        </div>

                                        <Field label="Cuenta Publicitaria / FanPage">
                                            <input value={activeRow.adAccount} onChange={e => updateRowLocal(activeRow.id, { adAccount: e.target.value })} style={modalInput} placeholder="Nombre de cuenta..." />
                                        </Field>

                                        <div onClick={() => updateRowLocal(activeRow.id, { revised: !activeRow.revised })} style={{ marginTop: 20, padding: 16, borderRadius: 16, border: '1.5px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: activeRow.revised ? '#f0faf0' : 'white' }}>
                                            {activeRow.revised ? <CheckCircle2 size={24} color="#4CAF50" /> : <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #e2e8f0' }} />}
                                            <span style={{ fontWeight: 800, color: activeRow.revised ? '#4CAF50' : '#64748b' }}>MARCAR COMO REVISADO</span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .table-row:hover { background: #fcfdfe; }
            `}</style>
        </div>
    )
}

const thStyle: React.CSSProperties = { padding: '16px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }
const tdStyle: React.CSSProperties = { padding: '16px 24px', fontSize: 13, color: '#64748b' }
const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 900, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.05em' }
const actionBtn: React.CSSProperties = { background: '#f8fafc', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }
const modalInput: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #f1f5f9', background: '#fafafa', fontSize: 13, fontWeight: 600, color: '#1a1a2e', outline: 'none' }

function Field({ label, children, style }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</label>
            {children}
        </div>
    )
}

const Edit3 = ({ size, color }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
)
