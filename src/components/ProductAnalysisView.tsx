'use client'

import React, { useState, useEffect } from 'react'
import {
    Search, Zap, Shield, Target, Plus, Trash2,
    Save, FileText, CheckCircle2, XCircle, ChevronDown,
    Link as LinkIcon, Edit3, BarChart, Settings, List, Info, MousePointer2,
    Activity
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CompetitorAnalysis {
    notSellingInMarket: boolean
    canCompetePrice: boolean
    creativeNotUsedInMarket: boolean
    creativeNotUsedInMyMarket: boolean
    links: string[]
    notes: string
    validationReason: string
}

interface TechnicalAnalysis {
    solvesNicheProblem: boolean
    highValuePerception: boolean
    wowEffect: boolean
    notInMarketplace: boolean
    generatesRebuy: boolean
    solvesNeed: boolean
    lowTicket: boolean
    captioningAd: boolean
    isNotBlack: boolean
    easyToImport: boolean
    additionalNotes: string
}

interface ProductAnalysis {
    id: string
    name: string
    adLinks: string[]
    supplierPrice: number
    sellingPrice: number
    dropiId: string
    angles: {
        principal: string
        secondary: string
        tertiary: string
    }
    competitor: CompetitorAnalysis
    technical: TechnicalAnalysis
}

export default function ProductAnalysisView() {
    const [products, setProducts] = useState<ProductAnalysis[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data, error } = await supabase
                        .from('winning_products')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (data) {
                        const formatted = data.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            adLinks: p.ad_links,
                            supplierPrice: p.supplier_price,
                            sellingPrice: p.selling_price,
                            dropiId: p.dropi_id,
                            angles: p.angles,
                            competitor: p.competitor,
                            technical: p.technical
                        }))
                        setProducts(formatted)
                        if (formatted.length > 0) setActiveId(formatted[0].id)
                    }
                }
            } catch (error) {
                console.error('Error fetching products:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchProducts()
    }, [])

    const [activeId, setActiveId] = useState<string | null>(products[0]?.id || null)

    const activeProduct = products.find(p => p.id === activeId) || null

    const addProduct = async () => {
        const newProdData = {
            product_id: Math.random().toString(36).substr(2, 9),
            name: 'Nuevo Producto',
            ad_links: ['', ''],
            supplier_price: 0,
            selling_price: 0,
            dropi_id: '',
            angles: { principal: '', secondary: '', tertiary: '' },
            competitor: {
                notSellingInMarket: false,
                canCompetePrice: false,
                creativeNotUsedInMarket: false,
                creativeNotUsedInMyMarket: false,
                links: ['', ''],
                notes: '',
                validationReason: ''
            },
            technical: {
                solvesNicheProblem: false,
                highValuePerception: false,
                wowEffect: false,
                notInMarketplace: false,
                generatesRebuy: false,
                solvesNeed: false,
                lowTicket: false,
                captioningAd: false,
                isNotBlack: false,
                easyToImport: false,
                additionalNotes: ''
            }
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data, error } = await supabase
                    .from('winning_products')
                    .insert({ user_id: user.id, ...newProdData })
                    .select()

                if (data && data[0]) {
                    const p = data[0]
                    const formatted: ProductAnalysis = {
                        id: p.id,
                        name: p.name,
                        adLinks: p.ad_links,
                        supplierPrice: p.supplier_price,
                        sellingPrice: p.selling_price,
                        dropiId: p.dropi_id,
                        angles: p.angles,
                        competitor: p.competitor,
                        technical: p.technical
                    }
                    setProducts([formatted, ...products])
                    setActiveId(formatted.id)
                }
            }
        } catch (error) {
            console.error('Error adding product analysis:', error)
        }
    }

    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<string | null>(null)

    const handleManualSave = async () => {
        if (!activeProduct) return
        setIsSaving(true)
        setSaveStatus('Guardando...')

        try {
            const dbUpdates: any = {
                name: activeProduct.name,
                ad_links: activeProduct.adLinks,
                supplier_price: activeProduct.supplierPrice,
                selling_price: activeProduct.sellingPrice,
                dropi_id: activeProduct.dropiId,
                angles: activeProduct.angles,
                competitor: activeProduct.competitor,
                technical: activeProduct.technical
            }

            const { error } = await supabase
                .from('winning_products')
                .update(dbUpdates)
                .eq('id', activeProduct.id)

            if (error) throw error
            setSaveStatus('✓ ¡Guardado!')
            setTimeout(() => setSaveStatus(null), 3000)
        } catch (error: any) {
            console.error('Error saving:', error)
            setSaveStatus('Error')
            alert('Error al guardar: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const updateProductLocal = (id: string, updates: Partial<ProductAnalysis>) => {
        setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p))
    }

    const deleteProduct = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este análisis? Esta acción no se puede deshacer.')) return
        try {
            const { error } = await supabase.from('winning_products').delete().eq('id', id)
            if (error) throw error

            setProducts(prev => {
                const filtered = prev.filter(p => p.id !== id)
                if (activeId === id) {
                    setActiveId(filtered.length > 0 ? filtered[0].id : null)
                }
                return filtered
            })
            alert('Análisis eliminado correctamente.')
        } catch (error: any) {
            console.error('Error deleting:', error)
            alert('Error al eliminar: ' + error.message)
        }
    }

    const calculateTechnicalScore = (t: TechnicalAnalysis) => {
        return Object.values(t).filter(v => v === true).length
    }

    const calculateCompetitorScore = (c: CompetitorAnalysis) => {
        const { links, notes, validationReason, ...bools } = c
        return Object.values(bools).filter(v => v === true).length
    }

    const getScoreColors = (score: number, isActive: boolean) => {
        if (score >= 8) return {
            bg: isActive ? '#f0faf0' : 'white',
            border: isActive ? '#4CAF50' : '#eee',
            text: isActive ? '#4CAF50' : '#333',
            badge: '#4CAF50'
        }
        if (score >= 4) return {
            bg: isActive ? '#fffbeb' : 'white',
            border: isActive ? '#f59e0b' : '#eee',
            text: isActive ? '#f59e0b' : '#333',
            badge: '#f59e0b'
        }
        return {
            bg: isActive ? '#fef2f2' : 'white',
            border: isActive ? '#ef4444' : '#eee',
            text: isActive ? '#ef4444' : '#333',
            badge: '#ef4444'
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dropiId.includes(searchTerm)
    )

    return (
        <div className="main-scroll custom-scrollbar" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ padding: '24px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Search className="text-[#4CAF50]" size={30} /> Análisis de Producto Ganador
                        </h1>
                        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Evalúa y valida tus productos bajo criterios técnicos y de competencia.</p>
                    </div>
                    <button onClick={addProduct} className="btn-primary">
                        <Plus size={18} /> Nuevo Análisis
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>

                    {/* Sidebar List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12,
                                    border: '1px solid #eee', fontSize: 13, outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = '#4CAF50'}
                                onBlur={e => e.target.style.borderColor = '#eee'}
                            />
                        </div>
                        {filteredProducts.length === 0 ? (
                            <div style={{ padding: 24, background: '#f8f9fa', borderRadius: 12, textAlign: 'center', border: '1px dashed #ddd' }}>
                                <p style={{ fontSize: 12, color: '#999' }}>{searchTerm ? 'No se encontraron resultados.' : 'No hay análisis creados.'}</p>
                            </div>
                        ) : (
                            filteredProducts.map(p => {
                                const score = calculateTechnicalScore(p.technical);
                                const colors = getScoreColors(score, activeId === p.id);
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => setActiveId(p.id)}
                                        style={{
                                            padding: '16px', borderRadius: 12, cursor: 'pointer',
                                            background: colors.bg,
                                            border: `1px solid ${colors.border}`,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{p.name || 'Sin nombre'}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                            <span style={{ fontSize: 10, color: '#999' }}>ID: {p.dropiId || '---'}</span>
                                            <div style={{
                                                background: colors.badge,
                                                color: 'white', fontSize: 9, fontWeight: 800,
                                                padding: '2px 6px', borderRadius: 4
                                            }}>
                                                {score}/10 pts
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Main Analysis Form */}
                    {activeProduct ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                            {/* General Data Card */}
                            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                                    <Field label="Nombre del Producto">
                                        <input
                                            value={activeProduct.name}
                                            onChange={e => updateProductLocal(activeProduct.id, { name: e.target.value })}
                                            className="input-field" placeholder="Foam Cleaner..."
                                        />
                                    </Field>
                                    <Field label="Precio Proveedor">
                                        <input
                                            type="number" value={activeProduct.supplierPrice}
                                            onChange={e => updateProductLocal(activeProduct.id, { supplierPrice: Number(e.target.value) })}
                                            className="input-field" placeholder="$0"
                                        />
                                    </Field>
                                    <Field label="ID o Enlace (Dropi/Enlace)">
                                        <input
                                            value={activeProduct.dropiId}
                                            onChange={e => updateProductLocal(activeProduct.id, { dropiId: e.target.value })}
                                            className="input-field" placeholder="45332"
                                        />
                                    </Field>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr', gap: 20, marginTop: 16, alignItems: 'end' }}>
                                    <Field label="Link del anuncio (TikTok/FB)">
                                        <input
                                            value={activeProduct.adLinks[0]}
                                            onChange={e => {
                                                const newLinks = [...activeProduct.adLinks]
                                                newLinks[0] = e.target.value
                                                updateProductLocal(activeProduct.id, { adLinks: newLinks })
                                            }}
                                            className="input-field" placeholder="https://..."
                                        />
                                    </Field>
                                    <Field label="Precio de Venta">
                                        <input
                                            type="number" value={activeProduct.sellingPrice}
                                            onChange={e => updateProductLocal(activeProduct.id, { sellingPrice: Number(e.target.value) })}
                                            className="input-field" placeholder="$0"
                                        />
                                    </Field>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button
                                            onClick={handleManualSave}
                                            disabled={isSaving}
                                            style={{
                                                flex: 2,
                                                height: 44,
                                                background: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 12,
                                                fontWeight: 800,
                                                fontSize: 14,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
                                                opacity: isSaving ? 0.7 : 1
                                            }}
                                        >
                                            {isSaving ? <Activity size={18} className="animate-spin" /> : <Save size={18} />}
                                            {saveStatus || 'Guardar Análisis'}
                                        </button>
                                        <button
                                            onClick={() => deleteProduct(activeProduct.id)}
                                            style={{
                                                flex: 1,
                                                height: 44,
                                                background: '#fff',
                                                color: '#ef4444',
                                                border: '1.5px solid #fee2e2',
                                                borderRadius: 12,
                                                fontWeight: 800,
                                                fontSize: 13,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Trash2 size={16} /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Triple Column Analysis */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>

                                {/* Angles Column */}
                                <Column title="ANÁLISIS DE ÁNGULOS">
                                    <Field label="Ángulo #1 Principal">
                                        <textarea
                                            value={activeProduct.angles.principal}
                                            onChange={e => updateProductLocal(activeProduct.id, { angles: { ...activeProduct.angles, principal: e.target.value } })}
                                            className="input-field" rows={3} style={{ resize: 'none' }}
                                        />
                                    </Field>
                                    <Field label="Ángulo #2 Secundario">
                                        <textarea
                                            value={activeProduct.angles.secondary}
                                            onChange={e => updateProductLocal(activeProduct.id, { angles: { ...activeProduct.angles, secondary: e.target.value } })}
                                            className="input-field" rows={3} style={{ resize: 'none' }}
                                        />
                                    </Field>
                                    <Field label="Ángulo #3 Terciario">
                                        <textarea
                                            value={activeProduct.angles.tertiary}
                                            onChange={e => updateProductLocal(activeProduct.id, { angles: { ...activeProduct.angles, tertiary: e.target.value } })}
                                            className="input-field" rows={3} style={{ resize: 'none' }}
                                        />
                                    </Field>
                                </Column>

                                {/* Competition Column */}
                                <Column title="ANÁLISIS COMPETENCIA" headerRight={`Result: ${calculateCompetitorScore(activeProduct.competitor)}`}>
                                    <CheckItem
                                        label="¿No lo están vendiendo?"
                                        checked={activeProduct.competitor.notSellingInMarket}
                                        onChange={v => updateProductLocal(activeProduct.id, { competitor: { ...activeProduct.competitor, notSellingInMarket: v } })}
                                    />
                                    <CheckItem
                                        label="¿Puedo competir en precio?"
                                        checked={activeProduct.competitor.canCompetePrice}
                                        onChange={v => updateProductLocal(activeProduct.id, { competitor: { ...activeProduct.competitor, canCompetePrice: v } })}
                                    />
                                    <CheckItem
                                        label="¿Creativo NO usado en mercado?"
                                        checked={activeProduct.competitor.creativeNotUsedInMarket}
                                        onChange={v => updateProductLocal(activeProduct.id, { competitor: { ...activeProduct.competitor, creativeNotUsedInMarket: v } })}
                                    />
                                    <CheckItem
                                        label="¿Creativo NO usado en mi país?"
                                        checked={activeProduct.competitor.creativeNotUsedInMyMarket}
                                        onChange={v => updateProductLocal(activeProduct.id, { competitor: { ...activeProduct.competitor, creativeNotUsedInMyMarket: v } })}
                                    />
                                    <div style={{ marginTop: 12 }}>
                                        <Field label="Enlaces de Competencia">
                                            <input className="input-field" style={{ marginBottom: 4, height: 32, fontSize: 11 }} placeholder="Link 1" />
                                            <input className="input-field" style={{ height: 32, fontSize: 11 }} placeholder="Link 2" />
                                        </Field>
                                    </div>
                                    <Field label="Por qué está validado?">
                                        <textarea
                                            value={activeProduct.competitor.validationReason}
                                            onChange={e => updateProductLocal(activeProduct.id, { competitor: { ...activeProduct.competitor, validationReason: e.target.value } })}
                                            className="input-field" rows={4} style={{ resize: 'none', fontSize: 11 }}
                                        />
                                    </Field>
                                </Column>

                                {/* Technical Column */}
                                <Column title="ANÁLISIS TÉCNICO" headerRight={`Total: ${calculateTechnicalScore(activeProduct.technical)}/10`}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {[
                                            { key: 'solvesNicheProblem', label: '¿Soluciona problema nicho?' },
                                            { key: 'highValuePerception', label: '¿Alta percepción valor?' },
                                            { key: 'wowEffect', label: '¿Efecto Wow?' },
                                            { key: 'notInMarketplace', label: '¿No disponible en Marketplace?' },
                                            { key: 'generatesRebuy', label: '¿Genera recompra?' },
                                            { key: 'solvesNeed', label: '¿Resuelve necesidad?' },
                                            { key: 'lowTicket', label: '¿Ticket bajo?' },
                                            { key: 'captioningAd', label: '¿Anuncio cautivador?' },
                                            { key: 'isNotBlack', label: '¿No es Black?' },
                                            { key: 'easyToImport', label: '¿Fácil importar/fabricar?' },
                                        ].map((item, i) => (
                                            <CheckItem
                                                key={i}
                                                label={item.label}
                                                checked={(activeProduct.technical as any)[item.key]}
                                                onChange={v => updateProductLocal(activeProduct.id, { technical: { ...activeProduct.technical, [item.key]: v } })}
                                            />
                                        ))}
                                    </div>
                                    <Field label="Notas Adicionales" style={{ marginTop: 12 }}>
                                        <textarea
                                            value={activeProduct.technical.additionalNotes}
                                            onChange={e => updateProductLocal(activeProduct.id, { technical: { ...activeProduct.technical, additionalNotes: e.target.value } })}
                                            className="input-field" rows={3} style={{ resize: 'none', fontSize: 11 }}
                                        />
                                    </Field>
                                </Column>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, background: 'white', border: '1px solid #eee', borderRadius: 16 }}>
                            <FileText size={48} color="#eee" style={{ marginBottom: 16 }} />
                            <h3 style={{ color: '#999', fontWeight: 600 }}>Selecciona un producto o crea un nuevo análisis</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function Column({ title, children, headerRight }: { title: string, children: React.ReactNode, headerRight?: string }) {
    return (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                background: '#fafafa', borderBottom: '1px solid #eee', padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#333', letterSpacing: '0.05em' }}>{title}</span>
                {headerRight && <span style={{ fontSize: 10, fontWeight: 800, color: '#4CAF50', background: 'white', padding: '2px 8px', borderRadius: 4, border: '1px solid #eee' }}>{headerRight}</span>}
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {children}
            </div>
        </div>
    )
}

function CheckItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div
            onClick={() => onChange(!checked)}
            style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                background: checked ? '#f0faf0' : '#fcfcfc',
                border: `1px solid ${checked ? '#defaca' : '#f0f0f0'}`,
                transition: 'all 0.1s'
            }}
        >
            <span style={{ fontSize: 11, fontWeight: checked ? 700 : 500, color: checked ? '#4CAF50' : '#666' }}>{label}</span>
            {checked ? <CheckCircle2 size={14} color="#4CAF50" /> : <XCircle size={14} color="#ddd" />}
        </div>
    )
}

function Field({ label, children, style }: { label: string, children: React.ReactNode, style?: React.CSSProperties }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</label>
            {children}
        </div>
    )
}
