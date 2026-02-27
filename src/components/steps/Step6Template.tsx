'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Globe, Image, Loader2, Plus, Upload, X } from 'lucide-react'
import { supabase, type Template } from '@/lib/supabase'

interface Props {
    onComplete: (
        template: Template | null,
        productImages: string[],
        outputSize: string,
        outputLanguage: string,
    ) => void
    onPrev: () => void
    isSaving: boolean
}

const INDUSTRIES = ['Todos', 'belleza', 'salud', 'tecnologia', 'hogar', 'moda', 'deportes', 'general']
const SECTION_TYPES = ['Todos', 'hero', 'oferta', 'beneficios', 'antes_despues', 'testimonios', 'comparativa']
const SECTION_LABELS: Record<string, string> = {
    hero: 'Hero / Gancho',
    oferta: 'Oferta Irresistible',
    beneficios: 'Beneficios',
    antes_despues: 'Antes y Después',
    testimonios: 'Testimonios',
    comparativa: 'Tabla Comparativa',
}

const OUTPUT_SIZES = [
    { value: '1080x1920', label: 'Instagram Stories (1080×1920) — Recomendado' },
    { value: '1080x1080', label: 'Instagram Post cuadrado (1080×1080)' },
    { value: '1080x1350', label: 'Instagram Post vertical (1080×1350)' },
    { value: '1920x1080', label: 'Banner horizontal (1920×1080)' },
    { value: '1200x628', label: 'Facebook / LinkedIn post (1200×628)' },
    { value: '1000x1500', label: 'Pinterest (1000×1500)' },
    { value: '720x1280', label: 'TikTok / Reels (720×1280)' },
]

const OUTPUT_LANGUAGES = [
    { value: 'es', label: '🇪🇸 Español' },
    { value: 'es-mx', label: '🇲🇽 Español México' },
    { value: 'es-ar', label: '🇦🇷 Español Argentina' },
    { value: 'en', label: '🇬🇧 English' },
    { value: 'pt', label: '🇧🇷 Português' },
    { value: 'fr', label: '🇫🇷 Français' },
    { value: 'it', label: '🇮🇹 Italiano' },
    { value: 'de', label: '🇩🇪 Deutsch' },
]

// Paletas visuales por industria
const TEMPLATE_THEMES: Record<string, { bg: string; accent: string }> = {
    belleza: { bg: 'linear-gradient(135deg, #1a0533, #3d1a6e)', accent: '#e879f9' },
    salud: { bg: 'linear-gradient(135deg, #022c22, #064e3b)', accent: '#34d399' },
    tecnologia: { bg: 'linear-gradient(135deg, #0f172a, #1e3a5f)', accent: '#60a5fa' },
    hogar: { bg: 'linear-gradient(135deg, #1c1007, #451a03)', accent: '#fb923c' },
    moda: { bg: 'linear-gradient(135deg, #0f0f0f, #2d1b1b)', accent: '#f43f5e' },
    deportes: { bg: 'linear-gradient(135deg, #0c1445, #1e3a8a)', accent: '#f59e0b' },
    general: { bg: 'linear-gradient(135deg, #0a0a0f, #1a0533)', accent: '#a855f7' },
}

function TemplateThumbnail({ template, isSelected }: { template: Template; isSelected: boolean }) {
    const theme = TEMPLATE_THEMES[template.industry] || TEMPLATE_THEMES.general
    return (
        <div
            className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 aspect-[9/16]"
            style={{
                background: theme.bg,
                border: isSelected ? `2px solid ${theme.accent}` : '2px solid transparent',
                boxShadow: isSelected ? `0 0 20px ${theme.accent}40` : undefined,
            }}
        >
            <div className="absolute inset-0 p-3 flex flex-col justify-between">
                <div>
                    <div className="w-6 h-1 rounded mb-1.5" style={{ background: theme.accent }} />
                    <div className="h-1.5 rounded mb-1 opacity-60" style={{ background: '#fff', width: '80%' }} />
                    <div className="h-1.5 rounded opacity-30" style={{ background: '#fff', width: '55%' }} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <div className="h-1 rounded opacity-40" style={{ background: '#fff' }} />
                    <div className="h-1 rounded opacity-25" style={{ background: '#fff', width: '65%' }} />
                    <div className="mt-1 py-1 rounded-lg text-center text-xs font-bold" style={{ background: theme.accent, color: '#000', fontSize: '8px' }}>
                        COMPRAR AHORA
                    </div>
                </div>
            </div>
            {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: theme.accent }}>
                    <CheckCircle2 size={12} color="#000" />
                </div>
            )}
        </div>
    )
}

export default function Step6Template({ onComplete, onPrev, isSaving }: Props) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedIndustry, setSelectedIndustry] = useState('Todos')
    const [selectedType, setSelectedType] = useState('Todos')
    const [selected, setSelected] = useState<Template | null>(null)
    const [productImages, setProductImages] = useState<string[]>([])
    const [referenceImage, setReferenceImage] = useState<string | null>(null)
    const [outputSize, setOutputSize] = useState('1080x1920')
    const [outputLanguage, setOutputLanguage] = useState('es')
    const productImgRef = useRef<HTMLInputElement>(null)
    const refImgRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        async function loadTemplates() {
            const { data } = await supabase.from('templates').select('*').order('name')
            setTemplates(data || [])
            setLoading(false)
        }
        loadTemplates()
    }, [])

    const handleProductImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const remaining = 3 - productImages.length
        const toAdd = files.slice(0, remaining)
        toAdd.forEach(file => {
            const reader = new FileReader()
            reader.onload = () => setProductImages(prev => [...prev, reader.result as string].slice(0, 3))
            reader.readAsDataURL(file)
        })
    }

    const handleRefImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => setReferenceImage(reader.result as string)
        reader.readAsDataURL(file)
    }

    const removeProductImage = (idx: number) => {
        setProductImages(prev => prev.filter((_, i) => i !== idx))
    }

    const filtered = templates.filter(t => {
        const matchIndustry = selectedIndustry === 'Todos' || t.industry === selectedIndustry
        const matchType = selectedType === 'Todos' || t.section_type === selectedType
        return matchIndustry && matchType
    })

    const selectLabel = (value: string, options: { value: string; label: string }[]) =>
        options.find(o => o.value === value)?.label || value

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 badge badge-purple mb-3">
                    <Image size={14} />
                    Paso 6 de 6 — ¡Último paso!
                </div>
                <h2 className="text-3xl font-bold mb-2">
                    Configura tu <span className="gradient-text">anuncio visual</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Añade imágenes, elige plantilla y formato de salida
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {/* Fotos del producto */}
                <div className="card p-5">
                    <p className="text-sm font-semibold mb-1">
                        📸 Fotos del Producto
                        <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                            (agrega de 1 a 3 fotos)
                        </span>
                    </p>
                    <div className="flex gap-3 mt-3">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="flex-1 aspect-square rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all relative"
                                style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border)' }}
                                onClick={() => !productImages[i] && productImages.length <= i && productImgRef.current?.click()}
                            >
                                {productImages[i] ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={productImages[i]} alt={`Producto ${i + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={e => { e.stopPropagation(); removeProductImage(i) }}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                            style={{ background: 'rgba(0,0,0,0.7)' }}
                                        >
                                            <X size={10} color="white" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                        <Plus size={18} />
                                        <span className="text-xs">Imagen {i + 1}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <input
                        ref={productImgRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleProductImages}
                    />
                    {productImages.length < 3 && (
                        <button
                            className="mt-3 w-full text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                            style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
                            onClick={() => productImgRef.current?.click()}
                        >
                            <Upload size={13} /> Añadir foto del producto
                        </button>
                    )}
                </div>

                {/* Plantilla + Imagen de referencia */}
                <div className="card p-5 flex flex-col gap-3">
                    <div>
                        <p className="text-sm font-semibold mb-2">🖼️ Plantilla</p>
                        <div
                            className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-5 cursor-pointer transition-all"
                            style={{
                                background: selected ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                                boxShadow: selected ? '0 0 0 2px var(--accent-glow)' : undefined,
                            }}
                            onClick={() => document.getElementById('template-gallery')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            {selected ? (
                                <>
                                    <CheckCircle2 size={22} style={{ color: 'var(--accent-light)' }} />
                                    <p className="text-sm font-semibold text-center px-2">{selected.name}</p>
                                    <span className="badge badge-purple text-xs">Seleccionada</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)' }}>
                                        <Image size={18} style={{ color: 'var(--accent-light)' }} />
                                    </div>
                                    <p className="text-sm font-medium">Seleccionar Plantilla</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>de la Galería Pixora</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Imagen de referencia */}
                    <div>
                        <input ref={refImgRef} type="file" accept="image/*" className="hidden" onChange={handleRefImage} />
                        <button
                            className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all"
                            style={{
                                background: referenceImage ? 'rgba(124,58,237,0.2)' : 'rgba(168,85,247,0.15)',
                                color: referenceImage ? 'var(--accent-light)' : 'white',
                                border: `1px solid ${referenceImage ? 'var(--accent)' : 'transparent'}`,
                            }}
                            onClick={() => refImgRef.current?.click()}
                        >
                            <Upload size={15} />
                            {referenceImage ? '✓ Imagen de referencia añadida' : '⬆ Subir imagen de referencia'}
                        </button>
                        {referenceImage && (
                            <button
                                className="mt-1 text-xs w-full text-center"
                                style={{ color: 'var(--text-muted)' }}
                                onClick={() => setReferenceImage(null)}
                            >
                                Quitar imagen de referencia
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tamaño e idioma */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="card p-5">
                    <label className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <span>📐</span> Tamaño de Salida
                    </label>
                    <select
                        className="input-field text-sm"
                        value={outputSize}
                        onChange={e => setOutputSize(e.target.value)}
                    >
                        {OUTPUT_SIZES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
                <div className="card p-5">
                    <label className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <Globe size={15} /> Idioma de Salida
                    </label>
                    <select
                        className="input-field text-sm"
                        value={outputLanguage}
                        onChange={e => setOutputLanguage(e.target.value)}
                    >
                        {OUTPUT_LANGUAGES.map(l => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Galería de Plantillas */}
            <div id="template-gallery" className="card p-5 mb-5">
                <p className="text-sm font-semibold mb-3">🎨 Galería de Plantillas</p>

                {/* Filtro industria */}
                <div className="mb-3">
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>INDUSTRIA</p>
                    <div className="flex flex-wrap gap-1.5">
                        {INDUSTRIES.map(ind => (
                            <button
                                key={ind}
                                onClick={() => setSelectedIndustry(ind)}
                                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                                style={{
                                    background: selectedIndustry === ind ? 'var(--accent)' : 'var(--bg-secondary)',
                                    color: selectedIndustry === ind ? 'white' : 'var(--text-secondary)',
                                    border: `1px solid ${selectedIndustry === ind ? 'var(--accent)' : 'var(--border)'}`,
                                }}
                            >
                                {ind.charAt(0).toUpperCase() + ind.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtro tipo */}
                <div className="mb-4">
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>TIPO DE SECCIÓN</p>
                    <div className="flex flex-wrap gap-1.5">
                        {SECTION_TYPES.map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                                style={{
                                    background: selectedType === type ? 'var(--accent)' : 'var(--bg-secondary)',
                                    color: selectedType === type ? 'white' : 'var(--text-secondary)',
                                    border: `1px solid ${selectedType === type ? 'var(--accent)' : 'var(--border)'}`,
                                }}
                            >
                                {type === 'Todos' ? 'Todos' : (SECTION_LABELS[type] || type)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid plantillas */}
                {loading ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                        {[...Array(12)].map((_, i) => <div key={i} className="skeleton aspect-[9/16] rounded-xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {filtered.map(t => (
                            <div key={t.id} onClick={() => setSelected(prev => prev?.id === t.id ? null : t)}>
                                <TemplateThumbnail template={t} isSelected={selected?.id === t.id} />
                                <p className="text-xs text-center mt-1 truncate px-1 opacity-60">{t.name}</p>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-6 text-center py-6" style={{ color: 'var(--text-muted)' }}>
                                Sin plantillas con estos filtros
                            </div>
                        )}
                    </div>
                )}

                {selected && (
                    <div className="mt-4 p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid var(--border-accent)' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--accent-light)' }} />
                        <div className="flex-1">
                            <p className="text-sm font-semibold">{selected.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.description}</p>
                        </div>
                        <button className="text-xs" style={{ color: 'var(--text-muted)' }} onClick={() => setSelected(null)}>
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Resumen configuración */}
            <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>CONFIGURACIÓN SELECCIONADA</p>
                <div className="flex flex-wrap gap-2">
                    <span className="badge badge-purple text-xs">📐 {selectLabel(outputSize, OUTPUT_SIZES).split(' ')[0]} {selectLabel(outputSize, OUTPUT_SIZES).split(' ')[1]}</span>
                    <span className="badge badge-purple text-xs">{selectLabel(outputLanguage, OUTPUT_LANGUAGES)}</span>
                    {productImages.length > 0 && <span className="badge badge-green text-xs">📸 {productImages.length} foto{productImages.length > 1 ? 's' : ''}</span>}
                    {referenceImage && <span className="badge badge-green text-xs">🖼️ Referencia añadida</span>}
                    {selected && <span className="badge badge-green text-xs">✓ {selected.name}</span>}
                </div>
            </div>

            <div className="flex justify-between items-center">
                <button className="btn-secondary" onClick={onPrev}>← Volver</button>
                <div className="flex gap-3">
                    <button className="btn-secondary" onClick={() => onComplete(null, productImages, outputSize, outputLanguage)} disabled={isSaving}>
                        Saltar plantilla
                    </button>
                    <button
                        className="btn-primary px-8"
                        onClick={() => onComplete(selected, productImages, outputSize, outputLanguage)}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <><Loader2 size={18} className="animate-spin" />Guardando...</>
                        ) : (
                            <><CheckCircle2 size={18} />{selected ? 'Usar esta plantilla' : 'Finalizar'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
