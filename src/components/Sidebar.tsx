'use client'

import { useEffect, useState } from 'react'
import {
    Home,
    Image as ImageIcon,
    Layout,
    Calculator,
    Zap,
    Plus,
    Trash2,
    Settings,
    Store,
    ChevronDown,
    Check,
    X,
    Search,
    Target,
    Activity,
    Truck,
    LogOut,
    TrendingUp
} from 'lucide-react'
import PomodoroTimer from './PomodoroTimer'
import { supabase, type Analysis } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UserStore {
    id: string
    name: string
    url: string
    platform: string
}

interface Props {
    onLoadAnalysis: (analysis: Analysis) => void
    onNewAnalysis: () => void
    activeView: string
    onViewChange: (view: string) => void
    isOpen?: boolean
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export default function Sidebar({ onLoadAnalysis, onNewAnalysis, activeView, onViewChange, isOpen }: Props) {
    const router = useRouter()
    const [analyses, setAnalyses] = useState<Analysis[]>([])
    const [loading, setLoading] = useState(true)

    // Store selector state
    const [stores, setStores] = useState<UserStore[]>([])
    const [activeStoreId, setActiveStoreId] = useState<string>('')
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false)
    const [showAddStore, setShowAddStore] = useState(false)
    const [newStoreName, setNewStoreName] = useState('')
    const [newStoreUrl, setNewStoreUrl] = useState('')
    const [newStorePlatform, setNewStorePlatform] = useState('shopify')

    const activeStore = stores.find(s => s.id === activeStoreId) || stores[0]

    // Persistence handled via Supabase
    useEffect(() => {
        const fetchInitial = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase.from('user_stores').select('*').order('created_at', { ascending: true })
            if (data && data.length > 0) {
                setStores(data)
                const active = data.find((s: any) => s.is_active)
                if (active) setActiveStoreId(active.id)
                else setActiveStoreId(data[0].id)
            }
        }
        fetchInitial()
    }, [])

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (!error) {
            router.push('/login')
            router.refresh()
        }
    }

    const handleAddStore = async () => {
        if (!newStoreName.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: inserted } = await supabase
            .from('user_stores')
            .insert({
                user_id: user.id,
                name: newStoreName,
                url: newStoreUrl,
                platform: newStorePlatform,
                is_active: true
            })
            .select()
            .single()

        if (inserted) {
            // Deactivate others
            await supabase.from('user_stores').update({ is_active: false }).neq('id', inserted.id)

            setStores(prev => [...prev.map(s => ({ ...s, is_active: false })), inserted])
            setActiveStoreId(inserted.id)
            setNewStoreName('')
            setNewStoreUrl('')
            setShowAddStore(false)
            setStoreDropdownOpen(false)
        }
    }

    const switchStore = async (id: string) => {
        setActiveStoreId(id)
        setStoreDropdownOpen(false)
        await supabase.from('user_stores').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('user_stores').update({ is_active: true }).eq('id', id)
    }

    const handleDeleteStore = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (stores.length <= 1) return

        await supabase.from('user_stores').delete().eq('id', id)
        setStores(prev => prev.filter(s => s.id !== id))
        if (activeStoreId === id) {
            const next = stores.find(s => s.id !== id)
            if (next) {
                setActiveStoreId(next.id)
                await supabase.from('user_stores').update({ is_active: true }).eq('id', next.id)
            }
        }
    }

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'shopify': return '🟢'
            case 'woocommerce': return '🟣'
            case 'tiendanube': return '☁️'
            case 'custom': return '🌐'
            default: return '🏪'
        }
    }

    const loadAnalyses = async () => {
        const { data } = await supabase
            .from('analyses')
            .select('id, created_at, product_url, product_name, chosen_angle, sales_channel')
            .order('created_at', { ascending: false })
            .limit(10)
        setAnalyses((data || []) as Analysis[])
        setLoading(false)
    }

    useEffect(() => { loadAnalyses() }, [])

    const handleLoad = async (id: string) => {
        const { data } = await supabase.from('analyses').select('*').eq('id', id).single()
        if (data) {
            onViewChange('analyzer')
            onLoadAnalysis(data as Analysis)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        await supabase.from('analyses').delete().eq('id', id)
        setAnalyses(prev => prev.filter(a => a.id !== id))
    }

    const moduleItems = [
        { id: 'analyzer', label: 'Panel Central', icon: Home },
        { id: 'product_analysis', label: 'Análisis Producto', icon: Search },
        { id: 'campaigns', label: 'Campañas', icon: Target },
        { id: 'marketing', label: 'Pauta / Marketing', icon: TrendingUp },
        { id: 'simulator', label: 'Control Diario', icon: Calculator },
        { id: 'quick_calc', label: 'Calculadora Express', icon: Zap },
        { id: 'productivity', label: 'Productividad AI', icon: Activity },
        { id: 'operations', label: 'Operaciones', icon: Check },
        { id: 'logistics', label: 'Logística', icon: Truck },
        { id: 'creative_studio', label: 'Creative Studio', icon: ImageIcon },
        { id: 'settings', label: 'Ajustes', icon: Settings },
    ]

    return (
        <aside className={`sidebar custom-scrollbar ${isOpen ? 'open' : ''}`}>
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <Zap size={18} className="fill-white" />
                </div>
                <span className="sidebar-logo-text">PIXORA</span>
            </div>

            {/* Store Selector */}
            <div style={{ padding: '0 12px', marginBottom: 8, position: 'relative' }}>
                <button
                    onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 8,
                        background: storeDropdownOpen ? '#f0faf0' : '#fafafa',
                        border: `1px solid ${storeDropdownOpen ? '#4CAF50' : '#eee'}`,
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                    }}
                >
                    <span style={{ fontSize: 16 }}>{getPlatformIcon(activeStore?.platform || '')}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {activeStore?.name || 'Seleccionar tienda'}
                        </div>
                        <div style={{ fontSize: 10, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {activeStore?.url || 'Sin URL'}
                        </div>
                    </div>
                    <ChevronDown size={14} color="#999" style={{
                        transition: 'transform 0.2s',
                        transform: storeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flexShrink: 0
                    }} />
                </button>

                {/* Dropdown */}
                {storeDropdownOpen && (
                    <div style={{
                        position: 'absolute', top: '100%', left: 12, right: 12,
                        background: 'white', border: '1px solid #eee', borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 100,
                        marginTop: 4, overflow: 'hidden', animation: 'fadeIn 0.2s ease'
                    }}>
                        {/* Store list */}
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                            {stores.map(store => (
                                <div
                                    key={store.id}
                                    onClick={() => switchStore(store.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 14px', cursor: 'pointer',
                                        background: store.id === activeStoreId ? '#f0faf0' : 'transparent',
                                        transition: 'background 0.15s',
                                        borderBottom: '1px solid #f8f8f8'
                                    }}
                                    onMouseEnter={e => { if (store.id !== activeStoreId) e.currentTarget.style.background = '#fafafa' }}
                                    onMouseLeave={e => { if (store.id !== activeStoreId) e.currentTarget.style.background = 'transparent' }}
                                >
                                    <span style={{ fontSize: 14 }}>{getPlatformIcon(store.platform)}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.name}</div>
                                        <div style={{ fontSize: 10, color: '#999' }}>{store.url || 'Sin URL'}</div>
                                    </div>
                                    {store.id === activeStoreId && <Check size={14} color="#4CAF50" style={{ flexShrink: 0 }} />}
                                    {stores.length > 1 && (
                                        <Trash2
                                            size={12}
                                            style={{ opacity: 0.3, flexShrink: 0, cursor: 'pointer' }}
                                            onClick={(e) => handleDeleteStore(e, store.id)}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '0.3'}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add new store inline form */}
                        {showAddStore ? (
                            <div style={{ padding: 12, borderTop: '1px solid #eee', background: '#fafafa' }}>
                                <input
                                    value={newStoreName}
                                    onChange={e => setNewStoreName(e.target.value)}
                                    placeholder="Nombre de la tienda"
                                    className="input-field"
                                    style={{ marginBottom: 6, fontSize: 12, padding: '8px 10px' }}
                                    autoFocus
                                />
                                <input
                                    value={newStoreUrl}
                                    onChange={e => setNewStoreUrl(e.target.value)}
                                    placeholder="URL (ej: mi-tienda.myshopify.com)"
                                    className="input-field"
                                    style={{ marginBottom: 6, fontSize: 12, padding: '8px 10px' }}
                                />
                                <select
                                    value={newStorePlatform}
                                    onChange={e => setNewStorePlatform(e.target.value)}
                                    className="input-field"
                                    style={{ marginBottom: 8, fontSize: 12, padding: '8px 10px' }}
                                >
                                    <option value="shopify">🟢 Shopify</option>
                                    <option value="woocommerce">🟣 WooCommerce</option>
                                    <option value="tiendanube">☁️ Tienda Nube</option>
                                    <option value="custom">🌐 Personalizado</option>
                                </select>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        onClick={handleAddStore}
                                        style={{
                                            flex: 1, padding: '6px 12px', borderRadius: 6,
                                            background: '#4CAF50', color: 'white', border: 'none',
                                            fontSize: 11, fontWeight: 600, cursor: 'pointer'
                                        }}
                                    >
                                        Crear
                                    </button>
                                    <button
                                        onClick={() => { setShowAddStore(false); setNewStoreName(''); setNewStoreUrl('') }}
                                        style={{
                                            padding: '6px 10px', borderRadius: 6,
                                            background: '#f5f5f5', border: 'none',
                                            fontSize: 11, color: '#999', cursor: 'pointer'
                                        }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddStore(true)}
                                style={{
                                    width: '100%', padding: '10px 14px', background: 'transparent',
                                    border: 'none', borderTop: '1px solid #eee',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    fontSize: 12, fontWeight: 600, color: '#4CAF50',
                                    cursor: 'pointer', transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f0faf0'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <Plus size={14} /> Agregar Tienda
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {/* Pomodoro Timer Access */}
                <PomodoroTimer />

                {/* Module items */}
                {/* Module items */}
                {moduleItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => { onViewChange(item.id); setStoreDropdownOpen(false) }}
                        className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
                    >
                        <item.icon size={16} />
                        {item.label}
                    </button>
                ))}

                {/* Recent analyses */}
                <div className="sidebar-section-title">Recientes</div>
                {loading ? (
                    [...Array(2)].map((_, i) => (
                        <div key={i} style={{ height: 32, background: '#f5f5f5', borderRadius: 6, margin: '4px 8px', animation: 'fadeIn 0.5s ease' }} />
                    ))
                ) : (
                    analyses.map(analysis => (
                        <div
                            key={analysis.id}
                            onClick={() => handleLoad(analysis.id)}
                            className="sidebar-item"
                            style={{ justifyContent: 'space-between', fontSize: 12 }}
                        >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                {analysis.product_name || 'Análisis S/N'}
                            </span>
                            <Trash2
                                size={12}
                                style={{ opacity: 0.3, flexShrink: 0 }}
                                onClick={(e) => handleDelete(e, analysis.id)}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
                            />
                        </div>
                    ))
                )}
            </nav>

            {/* Bottom section */}

            <div className="sidebar-bottom" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                    onClick={handleLogout}
                    className="sidebar-bottom-btn"
                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }}
                >
                    <LogOut size={14} />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    )
}
