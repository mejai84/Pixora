'use client'

import React, { useState, useEffect } from 'react'
import {
    Search, Zap, Target, Plus, Trash2,
    Save, FileText, CheckCircle2, XCircle, ChevronRight,
    Edit3, Activity, X, Info
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
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<string | null>(null)

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            const { data } = await supabase
                .from('winning_products')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) {
                const formatted = data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    adLinks: p.ad_links || [],
                    supplierPrice: p.supplier_price || 0,
                    sellingPrice: p.selling_price || 0,
                    dropiId: p.dropi_id || '',
                    angles: p.angles || { principal: '', secondary: '', tertiary: '' },
                    competitor: p.competitor || {
                        notSellingInMarket: false,
                        canCompetePrice: false,
                        creativeNotUsedInMarket: false,
                        creativeNotUsedInMyMarket: false,
                        links: ['', ''],
                        notes: '',
                        validationReason: ''
                    },
                    technical: p.technical || {
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
                }))
                setProducts(formatted)
            }
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const activeProduct = products.find(p => p.id === selectedId) || null

    const handleCreateNew = () => {
        const tempId = 'new_' + Date.now()
        const newProd: ProductAnalysis = {
            id: tempId,
            name: 'Nuevo Producto',
            adLinks: ['', ''],
            supplierPrice: 0,
            sellingPrice: 0,
            dropiId: '',
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
        setProducts([newProd, ...products])
        setSelectedId(tempId)
        setIsModalOpen(true)
    }

    const updateProductLocal = (id: string, updates: Partial<ProductAnalysis>) => {
        setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p))
    }

    const saveProduct = async () => {
        if (!activeProduct) return
        setIsSaving(true)
        setSaveStatus('Guardando...')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No auth user')

            const dbData = {
                user_id: user.id,
                name: activeProduct.name,
                ad_links: activeProduct.adLinks,
                supplier_price: activeProduct.supplierPrice,
                selling_price: activeProduct.sellingPrice,
                dropi_id: activeProduct.dropiId,
                angles: activeProduct.angles,
                competitor: activeProduct.competitor,
                technical: activeProduct.technical,
                product_id: activeProduct.id.startsWith('new_') ? Math.random().toString(36).substr(2, 9) : undefined
            }

            if (activeProduct.id.startsWith('new_')) {
                const { data, error } = await supabase
                    .from('winning_products')
                    .insert(dbData)
                    .select()
                    .single()

                if (error) throw error
                // Update ID from DB
                setProducts(products.map(p => p.id === activeProduct.id ? { ...activeProduct, id: data.id } : p))
                setSelectedId(data.id)
            } else {
                const { error } = await supabase
                    .from('winning_products')
                    .update(dbData)
                    .eq('id', activeProduct.id)
                if (error) throw error
            }

            setSaveStatus('✓ ¡Guardado!')
            setTimeout(() => setSaveStatus(null), 3000)
        } catch (error: any) {
            console.error('Error saving:', error)
            alert('Error al guardar: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const deleteProduct = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este análisis?')) return
        try {
            if (!id.startsWith('new_')) {
                await supabase.from('winning_products').delete().eq('id', id)
            }
            setProducts(products.filter(p => p.id !== id))
            setIsModalOpen(false)
            setSelectedId(null)
        } catch (error) {
            console.error('Error deleting:', error)
        }
    }

    const calculateTechnicalScore = (t: TechnicalAnalysis) => {
        return Object.values(t).filter(v => typeof v === 'boolean' && v === true).length
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dropiId.includes(searchTerm)
    )

    return (
        <div className="main-scroll custom-scrollbar" style={{ padding: 32, animation: 'fadeIn 0.3s ease' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* Header Area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Zap color="#f1c40f" size={32} /> Análisis de Ganadores
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, fontWeight: 500 }}>
                            Valida el potencial de tus productos antes de escalar campañas.
                        </p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        style={{
                            padding: '12px 24px', borderRadius: 12, background: '#1a1a2e', color: 'white',
                            border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Plus size={18} /> NUEVO ANÁLISIS
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: 24 }}>
                    <Search size={18} color="#cbd5e1" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre o ID de producto..."
                        style={{
                            width: '100%', padding: '16px 16px 16px 48px', borderRadius: 16,
                            border: '1px solid #e2e8f0', background: 'white', fontSize: 14, outline: 'none'
                        }}
                    />
                </div>

                {/* Dashboard List */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {isLoading ? (
                        <div style={{ color: '#94a3b8' }}>Cargando análisis...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, background: 'white', borderRadius: 24, border: '1px dashed #e2e8f0' }}>
                            <FileText size={48} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 600 }}>No hay análisis que coincidan.</p>
                        </div>
                    ) : (
                        filteredProducts.map(p => {
                            const score = calculateTechnicalScore(p.technical)
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => { setSelectedId(p.id); setIsModalOpen(true); }}
                                    style={{
                                        background: 'white', padding: 24, borderRadius: 20, border: '1px solid #f1f5f9',
                                        cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                                    }}
                                    className="hover-card"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e', flex: 1 }}>{p.name}</div>
                                        <div style={{
                                            background: score >= 7 ? '#f0faf0' : score >= 4 ? '#fffbeb' : '#fef2f2',
                                            color: score >= 7 ? '#4CAF50' : score >= 4 ? '#f59e0b' : '#ef4444',
                                            padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900
                                        }}>
                                            Score: {score}/10
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                            <span style={{ color: '#94a3b8' }}>ID:</span>
                                            <span style={{ fontWeight: 700, color: '#64748b' }}>{p.dropiId || '---'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                            <span style={{ color: '#94a3b8' }}>Precio Venta:</span>
                                            <span style={{ fontWeight: 800, color: '#4CAF50' }}>${p.sellingPrice.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.angles.principal ? '#4CAF50' : '#e2e8f0' }}></div>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.competitor.validationReason ? '#4CAF50' : '#e2e8f0' }}></div>
                                        </div>
                                        <ChevronRight size={18} color="#cbd5e1" />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* FLOATING MODAL - PRODUCT EDITOR */}
                {isModalOpen && activeProduct && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(10,10,30,0.6)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                    }} onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                        <div style={{
                            width: '100%', maxWidth: 900, maxHeight: '90vh', background: 'white',
                            borderRadius: 32, overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
                            animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }} className="custom-scrollbar">

                            {/* Modal Header */}
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: '#f1c40f', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Zap color="white" size={20} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e' }}>Análisis: {activeProduct.name}</h2>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>EDITANDO REGISTRO</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        onClick={saveProduct}
                                        disabled={isSaving}
                                        style={{
                                            background: '#4CAF50', color: 'white', border: 'none', padding: '10px 20px',
                                            borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                                        }}
                                    >
                                        {isSaving ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
                                        {saveStatus || 'GUARDAR'}
                                    </button>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        style={{ background: '#f8fafc', border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer', color: '#64748b' }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: 32 }}>
                                {/* Basic Info Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                                    <Field label="Nombre del Producto">
                                        <input
                                            value={activeProduct.name}
                                            onChange={e => updateProductLocal(activeProduct.id, { name: e.target.value })}
                                            style={modalInput} placeholder="Ej: Afilador Pro..."
                                        />
                                    </Field>
                                    <Field label="ID Dropi / URL">
                                        <input
                                            value={activeProduct.dropiId}
                                            onChange={e => updateProductLocal(activeProduct.id, { dropiId: e.target.value })}
                                            style={modalInput} placeholder="44321"
                                        />
                                    </Field>
                                    <Field label="Precio Proveedor ($)">
                                        <input
                                            type="number"
                                            value={activeProduct.supplierPrice}
                                            onChange={e => updateProductLocal(activeProduct.id, { supplierPrice: Number(e.target.value) })}
                                            style={modalInput}
                                        />
                                    </Field>
                                    <Field label="Precio Venta ($)">
                                        <input
                                            type="number"
                                            value={activeProduct.sellingPrice}
                                            onChange={e => updateProductLocal(activeProduct.id, { sellingPrice: Number(e.target.value) })}
                                            style={modalInput}
                                        />
                                    </Field>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

                                    {/* Left Column: Analysis Tools */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                        <Section title="ÁNGULOS DE VENTA (COPYWRITING)">
                                            <Field label="#1 Ángulo Ganador">
                                                <textarea
                                                    value={activeProduct.angles.principal}
                                                    onChange={e => updateProductLocal(activeProduct.id, { angles: { ...activeProduct.angles, principal: e.target.value } })}
                                                    style={{ ...modalInput, height: 80, resize: 'none' }} placeholder="¿Cuál es el ángulo principal de venta?"
                                                />
                                            </Field>
                                            <Field label="#2 Ángulo Secundario">
                                                <textarea
                                                    value={activeProduct.angles.secondary}
                                                    onChange={e => updateProductLocal(activeProduct.id, { angles: { ...activeProduct.angles, secondary: e.target.value } })}
                                                    style={{ ...modalInput, height: 60, resize: 'none' }}
                                                />
                                            </Field>
                                        </Section>

                                        <Section title="AUDITORÍA DE COMPETENCIA">
                                            <CheckItem
                                                label="¿Mercado no saturado?"
                                                checked={activeProduct.competitor.notSellingInMarket}
                                                onChange={v => updateProductLocal(activeProduct.id, { competitor: { ...activeProduct.competitor, notSellingInMarket: v } })}
                                            />
                                            <CheckItem
                                                label="¿Margen competitivo vs competencia?"
                                                checked={activeProduct.competitor.canCompetePrice}
                                                onChange={v => updateProductLocal(activeProduct.id, { competitor: { ...activeProduct.competitor, canCompetePrice: v } })}
                                            />
                                            <Field label="Razón de Validación" style={{ marginTop: 12 }}>
                                                <textarea
                                                    value={activeProduct.competitor.validationReason}
                                                    onChange={e => updateProductLocal(activeProduct.id, { competitor: { ...activeProduct.competitor, validationReason: e.target.value } })}
                                                    style={{ ...modalInput, height: 80, resize: 'none' }} placeholder="Escribe por qué crees que este es un ganador..."
                                                />
                                            </Field>
                                        </Section>
                                    </div>

                                    {/* Right Column: Technical Check */}
                                    <div>
                                        <Section title="VALIDACIÓN TÉCNICA" headerRight={`${calculateTechnicalScore(activeProduct.technical)}/10 PUNTOS`}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {[
                                                    { key: 'solvesNicheProblem', label: '¿Soluciona problema nicho?' },
                                                    { key: 'highValuePerception', label: '¿Alta percepción de valor?' },
                                                    { key: 'wowEffect', label: '¿Efecto Wow (Sorprende)?' },
                                                    { key: 'notInMarketplace', label: '¿No se encuentra en chinos?' },
                                                    { key: 'generatesRebuy', label: '¿Genera recompra?' },
                                                    { key: 'solvesNeed', label: '¿Resuelve necesidad vital?' },
                                                    { key: 'lowTicket', label: '¿Ticket bajo de impulso?' },
                                                    { key: 'captioningAd', label: '¿Anuncio visual potente?' },
                                                    { key: 'isNotBlack', label: '¿No es producto Black?' },
                                                    { key: 'easyToImport', label: '¿Fácil de enviar/importar?' },
                                                ].map((item: any) => (
                                                    <CheckItem
                                                        key={item.key}
                                                        label={item.label}
                                                        checked={(activeProduct.technical as any)[item.key]}
                                                        onChange={v => updateProductLocal(activeProduct.id, { technical: { ...activeProduct.technical, [item.key]: v } })}
                                                    />
                                                ))}
                                            </div>
                                            <div style={{ marginTop: 24, padding: 20, background: '#f8fafc', borderRadius: 20, textAlign: 'center' }}>
                                                <button
                                                    onClick={() => deleteProduct(activeProduct.id)}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '0 auto' }}
                                                >
                                                    <Trash2 size={14} /> ELIMINAR ANÁLISIS
                                                </button>
                                            </div>
                                        </Section>
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
                .hover-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.06) !important;
                }
            `}</style>
        </div>
    )
}

function Section({ title, children, headerRight }: any) {
    return (
        <div style={{ border: '1px solid #f1f5f9', borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#1a1a2e', letterSpacing: '0.05em' }}>{title}</span>
                {headerRight && <span style={{ fontSize: 10, fontWeight: 800, color: '#4CAF50', background: 'white', padding: '4px 8px', borderRadius: 6 }}>{headerRight}</span>}
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
        </div>
    )
}

function CheckItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div
            onClick={() => onChange(!checked)}
            style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 12,
                cursor: 'pointer', background: checked ? '#f0faf0' : 'white', border: `1px solid ${checked ? '#defaca' : '#f1f5f9'}`,
                transition: 'all 0.1s'
            }}
        >
            <span style={{ fontSize: 12, fontWeight: checked ? 700 : 500, color: checked ? '#4CAF50' : '#64748b' }}>{label}</span>
            {checked ? <CheckCircle2 size={16} color="#4CAF50" /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #e2e8f0' }} />}
        </div>
    )
}

function Field({ label, children, style }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</label>
            {children}
        </div>
    )
}

const modalInput: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: '1.5px solid #f1f5f9',
    background: '#fafafa',
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a2e',
    outline: 'none',
    transition: 'all 0.2s'
}
