'use client'

import React, { useState, useEffect } from 'react'
import {
    Calendar, Package, ShoppingBag, Truck, DollarSign, Target,
    Link as LinkIcon, CheckCircle2, MoreHorizontal, Plus, Trash2,
    Search, Filter, Globe, MousePointer2, ExternalLink, X, Save, Activity, Edit3
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
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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

    const [editState, setEditState] = useState<CampaignRow | null>(null)

    const handleCreateNew = () => {
        const newRow: CampaignRow = {
            id: 'new_' + Date.now(),
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
        setEditState(newRow)
        setIsModalOpen(true)
    }

    const handleEdit = (row: CampaignRow) => {
        setEditState({ ...row })
        setIsModalOpen(true)
    }

    const updateEditState = (updates: Partial<CampaignRow>) => {
        if (editState) setEditState({ ...editState, ...updates })
    }

    const saveCampaign = async () => {
        if (!editState) return
        setIsSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No auth user')

            const isNew = editState.id.startsWith('new_')
            const dbData = {
                user_id: user.id,
                campaign_id: isNew ? Math.random().toString(36).substr(2, 9) : undefined,
                date: editState.date,
                store: editState.store,
                developer: editState.developer,
                product_name: editState.productName,
                process: editState.process,
                category: editState.category,
                variations: editState.variations,
                tt_date: editState.ttDate,
                fb_date: editState.fbDate,
                supplier: editState.supplier,
                platform_code: editState.platformCode,
                supplier_cost: editState.supplierCost,
                selling_price: editState.sellingPrice,
                revised: editState.revised,
                ad_account: editState.adAccount,
                fan_page: editState.fanPage,
                landing_link: editState.landingLink
            }

            if (isNew) {
                const { data, error } = await supabase.from('campaign_records').insert([dbData]).select().single()
                if (error) throw error
                setRows(prev => [{ ...editState, id: data.id }, ...prev])
            } else {
                const { error } = await supabase.from('campaign_records').update(dbData).eq('id', editState.id)
                if (error) throw error
                setRows(prev => prev.map(r => r.id === editState.id ? { ...editState } : r))
            }
            setIsModalOpen(false)
            setEditState(null)
        } catch (error: any) {
            alert('Error al guardar: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const deleteRow = async () => {
        if (!deleteConfirmId) return
        try {
            if (!deleteConfirmId.startsWith('new_')) {
                const { error } = await supabase.from('campaign_records').delete().eq('id', deleteConfirmId)
                if (error) throw error
            }
            setRows(prev => prev.filter(r => r.id !== deleteConfirmId))
            if (selectedId === deleteConfirmId) {
                setIsModalOpen(false)
                setSelectedId(null)
            }
            setDeleteConfirmId(null)
        } catch (error: any) {
            console.error('Error deleting:', error)
            alert('Error al eliminar: ' + error.message)
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
                                    <th style={thStyle}>Rentabilidad</th>
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
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {(() => {
                                                            const cpaBE = r.sellingPrice - r.supplierCost;
                                                            // Mock logic: if CPA BE is high, it's green. In real world, we'd compare with Marketing Spend table.
                                                            const status = cpaBE > 25000 ? 'green' : cpaBE > 10000 ? 'yellow' : 'red';
                                                            const colors = { green: '#22c55e', yellow: '#f59e0b', red: '#ef4444' };
                                                            const labels = { green: 'Rentable', yellow: 'Break-even', red: 'Riesgo' };
                                                            return (
                                                                <>
                                                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[status] }} />
                                                                    <span style={{ fontSize: 10, fontWeight: 800, color: colors[status] }}>{labels[status]}</span>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                                <td style={tdStyle}>
                                                    {r.revised ? <CheckCircle2 size={18} color="#4CAF50" /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #e2e8f0' }} />}
                                                </td>
                                                <td style={tdStyle}>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={() => handleEdit(r)} style={actionBtn}><Edit3 size={14} /></button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(r.id); }}
                                                            style={{ ...actionBtn, color: '#ef4444' }}
                                                            title="Eliminar campaña"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
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
                {isModalOpen && editState && (
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
                                        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e' }}>Lanzamiento: {editState.productName || 'Nuevo'}</h2>
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
                                    <button onClick={() => { setIsModalOpen(false); setEditState(null); }} style={{ background: '#f8fafc', border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer' }}><X size={20} /></button>
                                </div>
                            </div>

                            <div style={{ padding: 32 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>

                                    {/* Left: General Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <h3 style={sectionTitle}>Información del Producto</h3>
                                        <Field label="Nombre del Producto">
                                            <input value={editState.productName} onChange={e => updateEditState({ productName: e.target.value })} style={modalInput} placeholder="Ej: Peluche Viral..." />
                                        </Field>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <Field label="Tienda">
                                                <input value={editState.store} onChange={e => updateEditState({ store: e.target.value })} style={modalInput} placeholder="Nombre tienda" />
                                            </Field>
                                            <Field label="ID Desarrollador">
                                                <input value={editState.developer} onChange={e => updateEditState({ developer: e.target.value })} style={modalInput} placeholder="Tu nombre" />
                                            </Field>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <Field label="Proceso">
                                                <select value={editState.process} onChange={e => updateEditState({ process: e.target.value })} style={modalInput}>
                                                    <option>Producto nuevo</option>
                                                    <option>Migracion</option>
                                                    <option>Relanzamiento</option>
                                                </select>
                                            </Field>
                                            <Field label="Categoría">
                                                <input value={editState.category} onChange={e => updateEditState({ category: e.target.value })} style={modalInput} />
                                            </Field>
                                        </div>

                                        <h3 style={{ ...sectionTitle, marginTop: 16 }}>Costos y Finanzas</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <Field label="Costo Proveedor ($)">
                                                <input type="number" value={editState.supplierCost} onChange={e => updateEditState({ supplierCost: Number(e.target.value) })} style={modalInput} />
                                            </Field>
                                            <Field label="Precio Venta ($)">
                                                <input type="number" value={editState.sellingPrice} onChange={e => updateEditState({ sellingPrice: Number(e.target.value) })} style={modalInput} />
                                            </Field>
                                        </div>
                                        <div style={{ padding: 16, background: '#fef2f2', borderRadius: 16, border: '1px solid #fee2e2' }}>
                                            <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>Breakeven Esperado</div>
                                            <div style={{ fontSize: 24, fontWeight: 900, color: '#b91c1c' }}>${(editState.sellingPrice - editState.supplierCost).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {/* Right: Technical & Ads */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <h3 style={sectionTitle}>Logística de Ads</h3>
                                        <Field label="Proveedor / Plataforma">
                                            <input value={editState.supplier} onChange={e => updateEditState({ supplier: e.target.value })} style={modalInput} placeholder="Ej: Dropi..." />
                                        </Field>
                                        <Field label="Link de Landing Page">
                                            <input value={editState.landingLink} onChange={e => updateEditState({ landingLink: e.target.value })} style={modalInput} placeholder="https://..." />
                                        </Field>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <Field label="Fecha Lanz. TT">
                                                <input type="date" value={editState.ttDate} onChange={e => updateEditState({ ttDate: e.target.value })} style={modalInput} />
                                            </Field>
                                            <Field label="Fecha Lanz. FB">
                                                <input type="date" value={editState.fbDate} onChange={e => updateEditState({ fbDate: e.target.value })} style={modalInput} />
                                            </Field>
                                        </div>

                                        <Field label="Cuenta Publicitaria / FanPage">
                                            <input value={editState.adAccount} onChange={e => updateEditState({ adAccount: e.target.value })} style={modalInput} placeholder="Nombre de cuenta..." />
                                        </Field>

                                        <div onClick={() => updateEditState({ revised: !editState.revised })} style={{ marginTop: 20, padding: 16, borderRadius: 16, border: '1.5px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: editState.revised ? '#f0faf0' : 'white' }}>
                                            {editState.revised ? <CheckCircle2 size={24} color="#4CAF50" /> : <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #e2e8f0' }} />}
                                            <span style={{ fontWeight: 800, color: editState.revised ? '#4CAF50' : '#64748b' }}>MARCAR COMO REVISADO</span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    background: 'rgba(10,10,30,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                }}>
                    <div style={{
                        width: '100%', maxWidth: 400, background: 'white',
                        borderRadius: 24, padding: 32, boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
                        textAlign: 'center', animation: 'slideUp 0.2s ease'
                    }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: 20, background: '#fee2e2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px', color: '#ef4444'
                        }}>
                            <Trash2 size={28} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e', marginBottom: 12 }}>¿Eliminar Campaña?</h3>
                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
                            Esta acción es permanente y no se podrá recuperar la información de esta campaña.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #f1f5f9',
                                    background: 'white', color: '#64748b', fontWeight: 800, cursor: 'pointer'
                                }}
                            >
                                CANCELAR
                            </button>
                            <button
                                onClick={deleteRow}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                                    background: '#ef4444', color: 'white', fontWeight: 800, cursor: 'pointer'
                                }}
                            >
                                SÍ, ELIMINAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
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
