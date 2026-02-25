'use client'

import React, { useState, useEffect } from 'react'
import {
    Calendar, Package, ShoppingBag, Truck, DollarSign, Target,
    Link as LinkIcon, CheckCircle2, MoreHorizontal, Plus, Trash2,
    Search, Filter, Globe, MousePointer2, ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CampaignRow {
    id: string
    date: string
    store: string
    developer: string
    productName: string
    process: 'Producto nuevo' | 'Migracion' | 'Relanzamiento'
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

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data, error } = await supabase
                        .from('campaign_records')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (data) {
                        const formatted = data.map((r: any) => ({
                            id: r.id,
                            campaign_id: r.campaign_id,
                            date: r.date,
                            store: r.store,
                            developer: r.developer,
                            productName: r.product_name,
                            process: r.process,
                            category: r.category,
                            variations: r.variations,
                            ttDate: r.tt_date,
                            fbDate: r.fb_date,
                            supplier: r.supplier,
                            platformCode: r.platform_code,
                            supplierCost: r.supplier_cost,
                            sellingPrice: r.selling_price,
                            revised: r.revised,
                            adAccount: r.ad_account,
                            fanPage: r.fan_page,
                            landingLink: r.landing_link
                        }))
                        setRows(formatted)
                    }
                }
            } catch (error) {
                console.error('Error fetching campaigns:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchCampaigns()
    }, [])

    const [isAdding, setIsAdding] = useState(false)

    const addRow = async () => {
        if (isAdding) return
        setIsAdding(true)
        const newRowData = {
            campaign_id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            store: 'CHOOP COL',
            developer: 'Pepito',
            product_name: '',
            process: 'Producto nuevo',
            category: 'General',
            variations: 'No tiene',
            tt_date: '',
            fb_date: '',
            supplier: 'Dropi',
            platform_code: '',
            supplier_cost: 0,
            selling_price: 0,
            revised: false,
            ad_account: '',
            fan_page: '',
            landing_link: ''
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('Debes iniciar sesión para lanzar un producto.')
                setIsAdding(false)
                return
            }

            const { data, error } = await supabase
                .from('campaign_records')
                .insert({ user_id: user.id, ...newRowData })
                .select()

            if (error) {
                console.error('Error adding campaign:', error.message)
                alert('Error al guardar en la base de datos: ' + error.message)
            } else if (data && data[0]) {
                const r = data[0]
                const formatted: CampaignRow = {
                    id: r.id,
                    date: r.date,
                    store: r.store,
                    developer: r.developer,
                    productName: r.product_name,
                    process: r.process,
                    category: r.category,
                    variations: r.variations,
                    ttDate: r.tt_date,
                    fbDate: r.fb_date,
                    supplier: r.supplier,
                    platformCode: r.platform_code,
                    supplierCost: r.supplier_cost,
                    sellingPrice: r.selling_price,
                    revised: r.revised,
                    adAccount: r.ad_account,
                    fanPage: r.fan_page,
                    landingLink: r.landing_link
                }
                setRows([formatted, ...rows])
            }
        } catch (error) {
            console.error('Error adding campaign:', error)
            alert('Ocurrió un error inesperado al lanzar el producto.')
        } finally {
            setIsAdding(false)
        }
    }

    const updateRow = async (id: string, updates: Partial<CampaignRow>) => {
        setRows(rows.map(r => r.id === id ? { ...r, ...updates } : r))

        const dbUpdates: any = {}
        if (updates.date !== undefined) dbUpdates.date = updates.date
        if (updates.store !== undefined) dbUpdates.store = updates.store
        if (updates.developer !== undefined) dbUpdates.developer = updates.developer
        if (updates.productName !== undefined) dbUpdates.product_name = updates.productName
        if (updates.process !== undefined) dbUpdates.process = updates.process
        if (updates.category !== undefined) dbUpdates.category = updates.category
        if (updates.variations !== undefined) dbUpdates.variations = updates.variations
        if (updates.ttDate !== undefined) dbUpdates.tt_date = updates.ttDate
        if (updates.fbDate !== undefined) dbUpdates.fb_date = updates.fbDate
        if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier
        if (updates.platformCode !== undefined) dbUpdates.platform_code = updates.platformCode
        if (updates.supplierCost !== undefined) dbUpdates.supplier_cost = updates.supplierCost
        if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice
        if (updates.revised !== undefined) dbUpdates.revised = updates.revised
        if (updates.adAccount !== undefined) dbUpdates.ad_account = updates.adAccount
        if (updates.landingLink !== undefined) dbUpdates.landing_link = updates.landingLink

        await supabase.from('campaign_records').update(dbUpdates).eq('id', id)
    }

    const deleteRow = async (id: string) => {
        if (confirm('¿Eliminar este registro de campaña?')) {
            await supabase.from('campaign_records').delete().eq('id', id)
            setRows(rows.filter(r => r.id !== id))
        }
    }

    const calculateBreakeven = (cost: number, price: number) => {
        // Simple breakeven: Price - Cost (Assuming it covers other factors roughly)
        // From Excel it seems to be roughly 55% of price or Price - (Cost + Flete)
        // Let's use a rough estimation for visualization
        const margin = price - cost
        return Math.round(margin > 0 ? margin * 0.7 : 0)
    }

    return (
        <div className="main-scroll custom-scrollbar" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ padding: '24px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Target className="text-[#3498db]" size={28} /> Seguimiento de Campañas
                        </h1>
                        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Historial de productos lanzados, proveedores y costos breakeven.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-secondary" style={{ padding: '8px 16px' }}>
                            <Filter size={16} /> Filtrar
                        </button>
                        <button
                            onClick={addRow}
                            className="btn-primary"
                            style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
                            disabled={isAdding}
                        >
                            {isAdding ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Plus size={18} />
                            )}
                            {isAdding ? 'Lanzando...' : 'Lanzar Producto'}
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div style={{
                    background: 'white', border: '1px solid #eee', borderRadius: 16,
                    overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1800 }}>
                            <thead>
                                <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                                    <th style={thStyle}>Fecha</th>
                                    <th style={thStyle}>Tienda</th>
                                    <th style={thStyle}>Desarrollador</th>
                                    <th style={thStyle}>Producto</th>
                                    <th style={thStyle}>Proceso</th>
                                    <th style={thStyle}>Categoría</th>
                                    <th style={thStyle}>Variaciones</th>
                                    <th style={{ ...thStyle, background: '#f0faff' }}>Act. TT</th>
                                    <th style={{ ...thStyle, background: '#f0faff' }}>Act. FB</th>
                                    <th style={thStyle}>Proveedor</th>
                                    <th style={thStyle}>Cod. Plat</th>
                                    <th style={thStyle}>Costo Prov</th>
                                    <th style={thStyle}>P. Venta</th>
                                    <th style={{ ...thStyle, color: '#e74c3c' }}>CPA B.E.</th>
                                    <th style={thStyle}>Revisado</th>
                                    <th style={thStyle}>Cuenta Pub</th>
                                    <th style={thStyle}>Landing</th>
                                    <th style={{ ...thStyle, width: 40 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={18} style={{ padding: 48, textAlign: 'center', color: '#999', fontSize: 13 }}>
                                            No hay campañas registradas. ¡Lanza tu primer producto!
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5' }} className="table-row-hover">
                                            <td style={tdStyle}><input type="date" value={r.date} onChange={e => updateRow(r.id, { date: e.target.value })} style={inputTableStyle} /></td>
                                            <td style={tdStyle}><input value={r.store} onChange={e => updateRow(r.id, { store: e.target.value })} style={inputTableStyle} /></td>
                                            <td style={tdStyle}><input value={r.developer} onChange={e => updateRow(r.id, { developer: e.target.value })} style={inputTableStyle} /></td>
                                            <td style={tdStyle}><input value={r.productName} placeholder="Nombre..." onChange={e => updateRow(r.id, { productName: e.target.value })} style={{ ...inputTableStyle, width: 150, fontWeight: 700 }} /></td>
                                            <td style={tdStyle}>
                                                <select value={r.process} onChange={e => updateRow(r.id, { process: e.target.value as any })} style={inputTableStyle}>
                                                    <option>Producto nuevo</option>
                                                    <option>Migracion</option>
                                                    <option>Relanzamiento</option>
                                                </select>
                                            </td>
                                            <td style={tdStyle}><input value={r.category} onChange={e => updateRow(r.id, { category: e.target.value })} style={inputTableStyle} /></td>
                                            <td style={tdStyle}><input value={r.variations} onChange={e => updateRow(r.id, { variations: e.target.value })} style={inputTableStyle} /></td>
                                            <td style={{ ...tdStyle, background: '#fcfdff' }}><input type="date" value={r.ttDate} onChange={e => updateRow(r.id, { ttDate: e.target.value })} style={inputTableStyle} /></td>
                                            <td style={{ ...tdStyle, background: '#fcfdff' }}><input type="date" value={r.fbDate} onChange={e => updateRow(r.id, { fbDate: e.target.value })} style={inputTableStyle} /></td>
                                            <td style={tdStyle}><input value={r.supplier} onChange={e => updateRow(r.id, { supplier: e.target.value })} style={inputTableStyle} /></td>
                                            <td style={tdStyle}><input value={r.platformCode} onChange={e => updateRow(r.id, { platformCode: e.target.value })} style={inputTableStyle} /></td>
                                            <td style={tdStyle}><input type="number" value={r.supplierCost === 0 ? '' : r.supplierCost} onChange={e => updateRow(r.id, { supplierCost: Number(e.target.value) })} style={inputTableStyle} /></td>
                                            <td style={tdStyle}><input type="number" value={r.sellingPrice === 0 ? '' : r.sellingPrice} onChange={e => updateRow(r.id, { sellingPrice: Number(e.target.value) })} style={inputTableStyle} /></td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: '#e74c3c' }}>
                                                    ${calculateBreakeven(r.supplierCost, r.sellingPrice).toLocaleString()}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div onClick={() => updateRow(r.id, { revised: !r.revised })} style={{ cursor: 'pointer' }}>
                                                    {r.revised ? <CheckCircle2 size={18} color="#4CAF50" /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #ddd' }} />}
                                                </div>
                                            </td>
                                            <td style={tdStyle}><input value={r.adAccount} onChange={e => updateRow(r.id, { adAccount: e.target.value })} style={inputTableStyle} /></td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <input value={r.landingLink} onChange={e => updateRow(r.id, { landingLink: e.target.value })} style={{ ...inputTableStyle, width: 100 }} placeholder="Link..." />
                                                    {r.landingLink && <a href={r.landingLink} target="_blank" style={{ color: '#4CAF50' }}><ExternalLink size={12} /></a>}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <button onClick={() => deleteRow(r.id)} style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .table-row-hover:hover {
                    background-color: #fcfcfc !important;
                }
            `}</style>
        </div>
    )
}

const thStyle: React.CSSProperties = {
    padding: '16px 14px',
    fontSize: 10,
    fontWeight: 700,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
}

const tdStyle: React.CSSProperties = {
    padding: '8px 14px',
    verticalAlign: 'middle'
}

const inputTableStyle: React.CSSProperties = {
    border: '1px solid transparent',
    background: 'none',
    padding: '6px 8px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    color: '#333',
    width: 100,
    outline: 'none',
    transition: 'all 0.1s',
}
