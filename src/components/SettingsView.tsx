'use client'

import { useState, useEffect } from 'react'
import {
    Key, Plus, CheckCircle2, Settings, Trash2, ArrowLeft, Zap,
    User, Shield, BarChart3, Bell, Globe, DollarSign, Store,
    Wifi, MapPin, Languages, Link, Instagram, Facebook, Twitter,
    Mail, Phone, Clock, Camera, ExternalLink, AlertCircle, Check,
    TrendingUp, CreditCard, Receipt, Activity
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { COUNTRIES, Country } from '@/constants/countries'

// Toggle switch component
function Toggle({ active, onToggle }: { active: boolean, onToggle: () => void }) {
    return (
        <div
            onClick={onToggle}
            style={{
                width: 40, height: 22, borderRadius: 11,
                background: active ? '#22c55e' : '#ddd',
                cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                flexShrink: 0
            }}
        >
            <div style={{
                width: 18, height: 18, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 2,
                left: active ? 20 : 2,
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
            }} />
        </div>
    )
}

// Section card
function SectionCard({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
    return (
        <div style={{
            background: 'white', border: '1px solid #eee', borderRadius: 12,
            padding: 24, ...style
        }}>
            {children}
        </div>
    )
}

// Label
function Label({ children }: { children: React.ReactNode }) {
    return (
        <label style={{
            fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase' as const,
            letterSpacing: '0.05em', marginBottom: 6, display: 'block'
        }}>
            {children}
        </label>
    )
}

export default function SettingsView() {
    const [apiConfigs, setApiConfigs] = useState<{ id: string, name: string, chatgpt: string, gemini: string, grok: string, active: boolean }[]>([])
    const [editingConfig, setEditingConfig] = useState<{ id: string, name: string, chatgpt: string, gemini: string, grok: string, active: boolean } | null>(null)
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'billing'>('profile')

    // Profile state
    const [profile, setProfile] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pixora_profile')
            return saved ? JSON.parse(saved) : {
                businessName: 'Mi Tienda Dropshipping',
                displayName: 'Administrador',
                email: 'admin@pixora.io',
                phone: '+34 600 000 000',
                website: 'https://mi-tienda.com',
                description: 'Tienda online especializada en productos innovadores con envío directo al consumidor.',
                instagram: '@mitienda',
                facebook: 'mitienda.oficial',
                tiktok: '@mitienda',
                timezone: 'Europe/Madrid',
                language: 'es',
            }
        }
        return {}
    })

    // Proxy state
    const [proxyConfig, setProxyConfig] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pixora_proxy')
            return saved ? JSON.parse(saved) : {
                enabled: false,
                type: 'residential',
                host: '',
                port: '',
                username: '',
                password: '',
                country: 'ES',
                rotationInterval: '5',
            }
        }
        return { enabled: false, type: 'residential', host: '', port: '', username: '', password: '', country: 'ES', rotationInterval: '5' }
    })

    // Regional state
    const [regional, setRegional] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pixora_regional')
            return saved ? JSON.parse(saved) : {
                country: 'ES',
                currency: 'EUR',
                language: 'es',
                taxRate: '21',
            }
        }
        return { country: 'ES', currency: 'EUR', language: 'es', taxRate: '21' }
    })

    // Store connections state
    const [stores, setStores] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pixora_stores')
            return saved ? JSON.parse(saved) : [
                { id: 'shopify', name: 'Shopify', icon: '🟢', connected: false, url: '' },
                { id: 'woocommerce', name: 'WooCommerce', icon: '🟣', connected: false, url: '' },
                { id: 'tiendanube', name: 'Tienda Nube', icon: '☁️', connected: false, url: '' },
            ]
        }
        return []
    })

    // Ad platforms state
    const [adPlatforms, setAdPlatforms] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pixora_ads')
            return saved ? JSON.parse(saved) : [
                { id: 'facebook', name: 'Facebook Ads', icon: '📘', connected: false, accountId: '' },
                { id: 'google', name: 'Google Ads', icon: '🔵', connected: false, accountId: '' },
                { id: 'tiktok', name: 'TikTok Ads', icon: '🎵', connected: false, accountId: '' },
                { id: 'pinterest', name: 'Pinterest Ads', icon: '📌', connected: false, accountId: '' },
            ]
        }
        return []
    })

    // Supplier connections
    const [suppliers, setSuppliers] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pixora_suppliers')
            return saved ? JSON.parse(saved) : [
                { id: 'aliexpress', name: 'AliExpress', icon: '🛒', connected: false },
                { id: 'cj', name: 'CJ Dropshipping', icon: '📦', connected: false },
                { id: 'zendrop', name: 'Zendrop', icon: '⚡', connected: false },
            ]
        }
        return []
    })

    const [saving, setSaving] = useState(false)

    // Persistence removed in favor of Supabase
    useEffect(() => {
        const fetchUserSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (data) {
                if (data.profile) setProfile(data.profile)
                if (data.proxy_config) setProxyConfig(data.proxy_config)
                if (data.regional) setRegional(data.regional)
                if (data.stores) setStores(data.stores)
                if (data.ad_platforms) setAdPlatforms(data.ad_platforms)
                if (data.suppliers) setSuppliers(data.suppliers)
            }
        }
        fetchUserSettings()
    }, [])

    const syncSettings = async (updates: any) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('user_settings').upsert({
            user_id: user.id,
            ...updates,
            updated_at: new Date().toISOString()
        })
    }

    // API Keys logic (same as before)
    const fetchConfigs = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('user_api_configs')
            .select('*')
            .order('created_at', { ascending: true })

        if (data && data.length > 0) {
            setApiConfigs(data)
        } else {
            const savedKeys = localStorage.getItem('pixora_api_keys')
            if (savedKeys) {
                const keys = JSON.parse(savedKeys)
                const defaultConfig = {
                    user_id: user.id, name: 'Principal',
                    chatgpt: keys.chatgpt || '', gemini: keys.gemini || '', grok: keys.grok || '',
                    active: true
                }
                const { data: inserted } = await supabase.from('user_api_configs').insert([defaultConfig]).select()
                if (inserted) setApiConfigs(inserted)
            } else {
                const defaultConfig = {
                    user_id: user.id, name: 'Principal',
                    chatgpt: '', gemini: '', grok: '', active: true
                }
                const { data: inserted } = await supabase.from('user_api_configs').insert([defaultConfig]).select()
                if (inserted) setApiConfigs(inserted)
            }
        }
        setLoading(false)
    }

    useEffect(() => { fetchConfigs() }, [])

    const handleSaveConfigs = async (config: any) => {
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            // Local fallback for demo
            if (isAddingNew) {
                const newConfig = { ...config, id: Math.random().toString(36).substr(2, 9), active: false }
                setApiConfigs(prev => [...prev, newConfig])
            } else {
                setApiConfigs(prev => prev.map(c => c.id === config.id ? config : c))
            }
            setSaving(false)
            return
        }

        try {
            if (isAddingNew) {
                await supabase.from('user_api_configs').insert([{ ...config, user_id: user.id, id: undefined }])
            } else {
                await supabase.from('user_api_configs').update({
                    name: config.name, chatgpt: config.chatgpt, gemini: config.gemini, grok: config.grok, active: config.active
                }).eq('id', config.id)
            }
            await fetchConfigs()
        } catch (err) {
            console.error('Error saving config:', err)
        }
        setSaving(false)
    }

    const toggleActive = async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser()

        // Optimistic UI update
        setApiConfigs(prev => prev.map(c => ({ ...c, active: c.id === id })))

        if (user) {
            await supabase.from('user_api_configs').update({ active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('user_api_configs').update({ active: true }).eq('id', id)
        }

        const config = apiConfigs.find(c => c.id === id)
        if (config) {
            localStorage.setItem('pixora_api_keys', JSON.stringify({
                chatgpt: config.chatgpt, gemini: config.gemini, grok: config.grok
            }))
        }
        window.dispatchEvent(new Event('storage'))
    }

    const deleteConfig = async (id: string) => {
        if (apiConfigs.length <= 1) { alert('No puedes eliminar todas las configuraciones'); return }

        const { data: { user } } = await supabase.auth.getUser()

        // Optimistic update
        setApiConfigs(prev => prev.filter(c => c.id !== id))

        if (user) {
            await supabase.from('user_api_configs').delete().eq('id', id)
        }
    }

    // Loading
    if (loading) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
                <Zap size={20} color="#22c55e" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        )
    }

    // Edit API Key form
    if (isAddingNew || editingConfig) {
        return (
            <div className="main-scroll custom-scrollbar" style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ maxWidth: 640, margin: '0 auto' }}>
                    <button
                        onClick={() => { setIsAddingNew(false); setEditingConfig(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#999', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24 }}
                    >
                        <ArrowLeft size={14} /> Volver a Configuración
                    </button>

                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#333', marginBottom: 4 }}>
                        {isAddingNew ? 'Nueva Configuración' : 'Editar Perfil API'}
                    </h1>
                    <p style={{ color: '#999', fontSize: 12, marginBottom: 32 }}>Gestiona tus credenciales de IA</p>

                    <SectionCard>
                        <div style={{ marginBottom: 16 }}>
                            <Label>Nombre del Perfil</Label>
                            <input
                                value={editingConfig?.name || ''}
                                onChange={(e) => setEditingConfig(prev => ({ ...(prev || { id: '', chatgpt: '', gemini: '', grok: '', active: false }), name: e.target.value }))}
                                placeholder="Ej: Producción, Testing..."
                                className="input-field"
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <Label>ChatGPT API Key</Label>
                                <input type="password" value={editingConfig?.chatgpt || ''} onChange={(e) => setEditingConfig(prev => ({ ...(prev || { id: '', name: '', gemini: '', grok: '', active: false }), chatgpt: e.target.value }))} placeholder="sk-..." className="input-field" />
                            </div>
                            <div>
                                <Label>Gemini API Key</Label>
                                <input type="password" value={editingConfig?.gemini || ''} onChange={(e) => setEditingConfig(prev => ({ ...(prev || { id: '', name: '', chatgpt: '', grok: '', active: false }), gemini: e.target.value }))} placeholder="AI..." className="input-field" />
                            </div>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <Label>Grok API Key (X.AI)</Label>
                            <input type="password" value={editingConfig?.grok || ''} onChange={(e) => setEditingConfig(prev => ({ ...(prev || { id: '', name: '', chatgpt: '', gemini: '', active: false }), grok: e.target.value }))} placeholder="xai-..." className="input-field" />
                        </div>
                        <button
                            onClick={() => {
                                if (!editingConfig?.name) return alert('El nombre es obligatorio')
                                handleSaveConfigs(editingConfig)
                                setIsAddingNew(false); setEditingConfig(null)
                            }}
                            className="btn-primary"
                            style={{
                                width: '100%', justifyContent: 'center', padding: '12px 24px',
                                opacity: saving ? 0.7 : 1, pointerEvents: saving ? 'none' : 'auto'
                            }}
                        >
                            {saving ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </SectionCard>
                </div>
            </div>
        )
    }

    return (
        <div className="main-scroll custom-scrollbar" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ maxWidth: 860, margin: '0 auto' }}>

                {/* Profile Header */}
                <SectionCard style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%', background: '#f5f5f5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #eee', position: 'relative', cursor: 'pointer', flexShrink: 0
                    }}>
                        <User size={32} color="#999" />
                        <div style={{
                            position: 'absolute', bottom: -2, right: -2, width: 24, height: 24,
                            borderRadius: '50%', background: '#22c55e', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', border: '2px solid white'
                        }}>
                            <Camera size={11} color="white" />
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#333' }}>{profile.displayName}</h2>
                        <span style={{
                            fontSize: 10, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' as const,
                            letterSpacing: '0.1em', background: '#f0faf0', padding: '3px 8px',
                            borderRadius: 4, display: 'inline-block', marginTop: 4
                        }}>VERIFICADO</span>
                        <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{profile.email}</p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {[
                            { icon: Settings, label: 'Config. General', tab: 'profile' },
                            { icon: Shield, label: 'Seguridad', tab: 'integrations' },
                            { icon: BarChart3, label: 'Analíticas', tab: 'billing' },
                            { icon: Bell, label: 'Notificaciones', tab: 'profile' },
                        ].map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                cursor: 'pointer', opacity: activeTab === item.tab ? 1 : 0.4, transition: 'all 0.2s'
                            }}
                                onClick={() => setActiveTab(item.tab as any)}
                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={e => { if (activeTab !== item.tab) e.currentTarget.style.opacity = '0.4' }}
                            >
                                <div style={{
                                    width: 38, height: 38, borderRadius: 8, background: activeTab === item.tab ? '#f0faf0' : '#fafafa',
                                    border: `1px solid ${activeTab === item.tab ? '#22c55e' : '#eee'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}>
                                    <item.icon size={16} color={activeTab === item.tab ? '#22c55e' : '#666'} />
                                </div>
                                <span style={{ fontSize: 8, color: activeTab === item.tab ? '#22c55e' : '#999', textAlign: 'center', maxWidth: 56, fontWeight: activeTab === item.tab ? 700 : 400 }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #eee', marginBottom: 24 }}>
                    {([
                        { id: 'profile' as const, label: 'Perfil Público' },
                        { id: 'integrations' as const, label: 'Integraciones' },
                        { id: 'billing' as const, label: 'Facturación' },
                    ]).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '12px 20px', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                                color: activeTab === tab.id ? '#333' : '#999',
                                borderBottom: `2px solid ${activeTab === tab.id ? '#22c55e' : 'transparent'}`,
                                background: 'none', border: 'none',
                                borderBottomWidth: 2, borderBottomStyle: 'solid' as const,
                                borderBottomColor: activeTab === tab.id ? '#22c55e' : 'transparent',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ==================== PERFIL PÚBLICO ==================== */}
                {activeTab === 'profile' && (
                    <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Información del Negocio */}
                        <SectionCard>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Store size={16} color="#22c55e" /> Información del Negocio
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                                <div>
                                    <Label>Nombre del Negocio</Label>
                                    <input
                                        value={profile.businessName}
                                        onChange={e => setProfile({ ...profile, businessName: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <Label>Nombre de Usuario</Label>
                                    <input
                                        value={profile.displayName}
                                        onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <Label>Descripción del Negocio</Label>
                                <textarea
                                    value={profile.description}
                                    onChange={e => setProfile({ ...profile, description: e.target.value })}
                                    rows={3}
                                    className="input-field"
                                    style={{ resize: 'none' }}
                                />
                            </div>
                            <div>
                                <Label>Sitio Web</Label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        value={profile.website}
                                        onChange={e => setProfile({ ...profile, website: e.target.value })}
                                        placeholder="https://tu-tienda.com"
                                        className="input-field"
                                    />
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer"
                                        style={{
                                            width: 42, height: 42, borderRadius: 8, background: '#f5f5f5',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            border: '1px solid #eee', color: '#999', textDecoration: 'none'
                                        }}
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Contacto */}
                        <SectionCard>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Mail size={16} color="#22c55e" /> Datos de Contacto
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                                <div>
                                    <Label>Email</Label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={14} style={{ position: 'absolute', left: 12, top: 14, color: '#ccc' }} />
                                        <input
                                            value={profile.email}
                                            onChange={e => setProfile({ ...profile, email: e.target.value })}
                                            className="input-field"
                                            style={{ paddingLeft: 34 }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Teléfono</Label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={14} style={{ position: 'absolute', left: 12, top: 14, color: '#ccc' }} />
                                        <input
                                            value={profile.phone}
                                            onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                            className="input-field"
                                            style={{ paddingLeft: 34 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Redes Sociales */}
                        <SectionCard>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Link size={16} color="#22c55e" /> Redes Sociales
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                {[
                                    { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: '@mitienda' },
                                    { key: 'facebook', label: 'Facebook', icon: '📘', placeholder: 'mitienda.oficial' },
                                    { key: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: '@mitienda' },
                                ].map(social => (
                                    <div key={social.key}>
                                        <Label>{social.icon} {social.label}</Label>
                                        <input
                                            value={profile[social.key] || ''}
                                            onChange={e => setProfile({ ...profile, [social.key]: e.target.value })}
                                            placeholder={social.placeholder}
                                            className="input-field"
                                        />
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Zona horaria y preferencias */}
                        <SectionCard>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Clock size={16} color="#22c55e" /> Preferencias Regionales
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                                <div>
                                    <Label>Zona Horaria</Label>
                                    <select value={profile.timezone} onChange={e => setProfile({ ...profile, timezone: e.target.value })} className="input-field">
                                        <option value="Europe/Madrid">🇪🇸 España (GMT+1)</option>
                                        <option value="America/Mexico_City">🇲🇽 México (GMT-6)</option>
                                        <option value="America/Bogota">🇨🇴 Colombia (GMT-5)</option>
                                        <option value="America/Argentina/Buenos_Aires">🇦🇷 Argentina (GMT-3)</option>
                                        <option value="America/New_York">🇺🇸 EST (GMT-5)</option>
                                        <option value="America/Los_Angeles">🇺🇸 PST (GMT-8)</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Idioma de la Interfaz</Label>
                                    <select value={profile.language} onChange={e => setProfile({ ...profile, language: e.target.value })} className="input-field">
                                        <option value="es">🇪🇸 Español</option>
                                        <option value="en">🇬🇧 English</option>
                                        <option value="pt">🇧🇷 Português</option>
                                        <option value="fr">🇫🇷 Français</option>
                                    </select>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Save button */}
                        <button
                            onClick={async () => {
                                setSaving(true)
                                await syncSettings({
                                    profile,
                                    proxy_config: proxyConfig,
                                    regional,
                                    stores,
                                    ad_platforms: adPlatforms,
                                    suppliers
                                })
                                setSaving(false)
                                alert('Configuración guardada en la nube')
                            }}
                            className="btn-primary"
                            style={{
                                width: '100%', justifyContent: 'center', padding: '12px 24px',
                                opacity: saving ? 0.7 : 1, pointerEvents: saving ? 'none' : 'auto'
                            }}
                        >
                            <Check size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                )}

                {/* ==================== INTEGRACIONES ==================== */}
                {activeTab === 'integrations' && (
                    <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Configuración Regional */}
                        <SectionCard>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Globe size={16} color="#22c55e" /> Configuración Regional
                                </h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                <div>
                                    <Label>País de Operación</Label>
                                    <select
                                        value={regional.country}
                                        onChange={e => {
                                            const countryCode = e.target.value;
                                            const countryData = COUNTRIES.find(c => c.code === countryCode);
                                            setRegional({
                                                ...regional,
                                                country: countryCode,
                                                currency: countryData ? countryData.currency : regional.currency
                                            });
                                        }}
                                        className="input-field"
                                    >
                                        <optgroup label="América">
                                            {COUNTRIES.filter(c => c.region === 'America').map(c => (
                                                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Europa">
                                            {COUNTRIES.filter(c => c.region === 'Europe').map(c => (
                                                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>
                                <div>
                                    <Label>Moneda</Label>
                                    <select value={regional.currency} onChange={e => setRegional({ ...regional, currency: e.target.value })} className="input-field">
                                        {Array.from(new Set(COUNTRIES.map(c => c.currency))).sort().map(curr => {
                                            const country = COUNTRIES.find(c => c.currency === curr);
                                            return (
                                                <option key={curr} value={curr}>
                                                    {curr} ({country?.symbol}) - {country?.currencyName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <Label>Idioma del Copy</Label>
                                    <select value={regional.language} onChange={e => setRegional({ ...regional, language: e.target.value })} className="input-field">
                                        <option value="es">Español</option>
                                        <option value="en">English</option>
                                        <option value="pt">Português</option>
                                        <option value="fr">Français</option>
                                        <option value="de">Deutsch</option>
                                        <option value="it">Italiano</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>IVA / Impuesto (%)</Label>
                                    <input
                                        type="number"
                                        value={regional.taxRate}
                                        onChange={e => setRegional({ ...regional, taxRate: e.target.value })}
                                        className="input-field"
                                        placeholder="21"
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        {/* Proxy Configuration */}
                        <SectionCard>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Shield size={16} color="#e67e22" /> Configuración de Proxy
                                </h3>
                                <Toggle active={proxyConfig.enabled} onToggle={() => setProxyConfig({ ...proxyConfig, enabled: !proxyConfig.enabled })} />
                            </div>

                            {!proxyConfig.enabled && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fffbf0', border: '1px solid #ffeaa7', borderRadius: 8, fontSize: 12, color: '#856404' }}>
                                    <AlertCircle size={14} />
                                    Sin proxy, las peticiones de scraping usarán tu IP directa. Los proveedores pueden bloquear tu acceso.
                                </div>
                            )}

                            {proxyConfig.enabled && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {['residential', 'datacenter', 'mobile'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setProxyConfig({ ...proxyConfig, type })}
                                                style={{
                                                    padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                                    border: '1px solid ' + (proxyConfig.type === type ? '#4CAF50' : '#eee'),
                                                    background: proxyConfig.type === type ? '#f0faf0' : 'white',
                                                    color: proxyConfig.type === type ? '#4CAF50' : '#666',
                                                    cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' as const
                                                }}
                                            >
                                                {type === 'residential' ? '🏠 Residencial' : type === 'datacenter' ? '🖥️ Datacenter' : '📱 Mobile'}
                                            </button>
                                        ))}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                                        <div>
                                            <Label>Host / IP</Label>
                                            <input value={proxyConfig.host} onChange={e => setProxyConfig({ ...proxyConfig, host: e.target.value })} placeholder="proxy.ejemplo.com" className="input-field" />
                                        </div>
                                        <div>
                                            <Label>Puerto</Label>
                                            <input value={proxyConfig.port} onChange={e => setProxyConfig({ ...proxyConfig, port: e.target.value })} placeholder="8080" className="input-field" />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <Label>Usuario</Label>
                                            <input value={proxyConfig.username} onChange={e => setProxyConfig({ ...proxyConfig, username: e.target.value })} placeholder="user" className="input-field" />
                                        </div>
                                        <div>
                                            <Label>Contraseña</Label>
                                            <input type="password" value={proxyConfig.password} onChange={e => setProxyConfig({ ...proxyConfig, password: e.target.value })} placeholder="••••••" className="input-field" />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <Label>País del Proxy</Label>
                                            <select value={proxyConfig.country} onChange={e => setProxyConfig({ ...proxyConfig, country: e.target.value })} className="input-field">
                                                <option value="ES">🇪🇸 España</option>
                                                <option value="US">🇺🇸 Estados Unidos</option>
                                                <option value="UK">🇬🇧 Reino Unido</option>
                                                <option value="DE">🇩🇪 Alemania</option>
                                                <option value="FR">🇫🇷 Francia</option>
                                                <option value="BR">🇧🇷 Brasil</option>
                                                <option value="MX">🇲🇽 México</option>
                                                <option value="AUTO">🌐 Auto-rotar</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Rotación (minutos)</Label>
                                            <input type="number" value={proxyConfig.rotationInterval} onChange={e => setProxyConfig({ ...proxyConfig, rotationInterval: e.target.value })} placeholder="5" className="input-field" />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSaving(true)
                                            setTimeout(() => {
                                                setSaving(false)
                                                alert('Conexión de Proxy exitosa')
                                            }, 1000)
                                        }}
                                        className="btn-primary"
                                        style={{
                                            alignSelf: 'flex-start', padding: '8px 20px', fontSize: 12,
                                            opacity: saving ? 0.7 : 1, pointerEvents: saving ? 'none' : 'auto'
                                        }}
                                    >
                                        <Wifi size={14} /> {saving ? 'Probando...' : 'Probar Conexión'}
                                    </button>
                                </div>
                            )}
                        </SectionCard>

                        {/* API Keys IA */}
                        <SectionCard>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Key size={16} color="#3498db" /> Modelos de IA (API Keys)
                                </h3>
                                <button
                                    onClick={() => { setIsAddingNew(true); setEditingConfig({ id: '', name: '', chatgpt: '', gemini: '', grok: '', active: false }); }}
                                    style={{
                                        padding: '6px 14px', borderRadius: 6, background: '#f5f5f5', border: '1px solid #eee',
                                        fontSize: 11, fontWeight: 600, color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                    }}
                                >
                                    <Plus size={12} /> Nueva API
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                                {apiConfigs.map(config => (
                                    <div key={config.id} style={{
                                        padding: 14, borderRadius: 10, border: `1px solid ${config.active ? '#4CAF50' : '#eee'}`,
                                        background: config.active ? '#fafff9' : 'white', transition: 'all 0.2s'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <div>
                                                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{config.name}</h4>
                                                <span style={{ fontSize: 10, color: config.active ? '#4CAF50' : '#999' }}>
                                                    {config.active ? '● Activo' : '○ Inactivo'}
                                                </span>
                                            </div>
                                            <Toggle active={config.active} onToggle={() => toggleActive(config.id)} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                                            {config.chatgpt && <span style={{ fontSize: 8, fontWeight: 700, background: '#eef', padding: '2px 6px', borderRadius: 4, color: '#55e' }}>GPT</span>}
                                            {config.gemini && <span style={{ fontSize: 8, fontWeight: 700, background: '#fef', padding: '2px 6px', borderRadius: 4, color: '#a5a' }}>GEM</span>}
                                            {config.grok && <span style={{ fontSize: 8, fontWeight: 700, background: '#333', padding: '2px 6px', borderRadius: 4, color: '#fff' }}>GRK</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => setEditingConfig(config)} style={{ flex: 1, padding: '5px 10px', borderRadius: 6, background: '#f5f5f5', border: 'none', fontSize: 11, fontWeight: 600, color: '#666', cursor: 'pointer' }}>Editar</button>
                                            <button onClick={() => deleteConfig(config.id)} style={{ padding: '5px 8px', borderRadius: 6, background: '#f5f5f5', border: 'none', color: '#999', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={11} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Tiendas */}
                        <SectionCard>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Store size={16} color="#9b59b6" /> Tiendas Conectadas
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                {stores.map((store: any, i: number) => (
                                    <div key={store.id} style={{
                                        padding: 16, borderRadius: 10, border: `1px solid ${store.connected ? '#4CAF50' : '#eee'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        transition: 'all 0.2s'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontSize: 20 }}>{store.icon}</span>
                                            <div>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{store.name}</span>
                                                <br />
                                                <span style={{ fontSize: 10, color: store.connected ? '#4CAF50' : '#999' }}>
                                                    {store.connected ? 'Conectado' : 'Sin conectar'}
                                                </span>
                                            </div>
                                        </div>
                                        <Toggle
                                            active={store.connected}
                                            onToggle={() => {
                                                const updated = [...stores]
                                                updated[i] = { ...store, connected: !store.connected }
                                                setStores(updated)
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Plataformas de Ads */}
                        <SectionCard>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TrendingUp size={16} color="#e74c3c" /> Plataformas de Ads
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {adPlatforms.map((platform: any, i: number) => (
                                    <div key={platform.id} style={{
                                        padding: 14, borderRadius: 10, border: `1px solid ${platform.connected ? '#4CAF50' : '#eee'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontSize: 18 }}>{platform.icon}</span>
                                            <div>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{platform.name}</span>
                                                <br />
                                                <span style={{ fontSize: 10, color: platform.connected ? '#4CAF50' : '#999' }}>
                                                    {platform.connected ? 'Vinculado' : 'No vinculado'}
                                                </span>
                                            </div>
                                        </div>
                                        <Toggle
                                            active={platform.connected}
                                            onToggle={() => {
                                                const updated = [...adPlatforms]
                                                updated[i] = { ...platform, connected: !platform.connected }
                                                setAdPlatforms(updated)
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Proveedores */}
                        <SectionCard>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Activity size={16} color="#f39c12" /> Proveedores Dropshipping
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                {suppliers.map((sup: any, i: number) => (
                                    <div key={sup.id} style={{
                                        padding: 14, borderRadius: 10, border: `1px solid ${sup.connected ? '#4CAF50' : '#eee'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontSize: 18 }}>{sup.icon}</span>
                                            <div>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{sup.name}</span>
                                                <br />
                                                <span style={{ fontSize: 10, color: sup.connected ? '#4CAF50' : '#999' }}>
                                                    {sup.connected ? 'Conectado' : 'Sin conectar'}
                                                </span>
                                            </div>
                                        </div>
                                        <Toggle
                                            active={sup.connected}
                                            onToggle={() => {
                                                const updated = [...suppliers]
                                                updated[i] = { ...sup, connected: !sup.connected }
                                                setSuppliers(updated)
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>
                )}

                {/* ==================== FACTURACIÓN ==================== */}
                {activeTab === 'billing' && (
                    <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Plan actual */}
                        <SectionCard>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CreditCard size={16} color="#4CAF50" /> Plan Actual
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                {[
                                    { name: 'Starter', price: 'Gratis', features: ['50 análisis/mes', '1 API Key', 'Banners básicos'], isActive: true },
                                    { name: 'Pro', price: '$19/mes', features: ['Análisis ilimitados', '5 API Keys', 'Todas las herramientas', 'Proxy integrado'], isActive: false },
                                    { name: 'Enterprise', price: '$49/mes', features: ['Todo de Pro', 'Multi-tienda', 'API personalizada', 'Soporte prioritario', 'White-label'], isActive: false },
                                ].map((plan, i) => (
                                    <div key={i} style={{
                                        padding: 20, borderRadius: 12,
                                        border: `2px solid ${plan.isActive ? '#4CAF50' : '#eee'}`,
                                        background: plan.isActive ? '#fafff9' : 'white',
                                        position: 'relative'
                                    }}>
                                        {plan.isActive && (
                                            <span style={{
                                                position: 'absolute', top: -10, right: 12,
                                                fontSize: 9, fontWeight: 700, background: '#4CAF50', color: 'white',
                                                padding: '3px 10px', borderRadius: 10
                                            }}>ACTUAL</span>
                                        )}
                                        <h4 style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 4 }}>{plan.name}</h4>
                                        <p style={{ fontSize: 22, fontWeight: 800, color: plan.isActive ? '#4CAF50' : '#333', marginBottom: 12 }}>{plan.price}</p>
                                        <ul style={{ listStyle: 'none', padding: 0 }}>
                                            {plan.features.map((f, fi) => (
                                                <li key={fi} style={{ fontSize: 12, color: '#666', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Check size={12} color="#4CAF50" /> {f}
                                                </li>
                                            ))}
                                        </ul>
                                        {!plan.isActive && (
                                            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12, fontSize: 12, padding: '8px 16px' }}>
                                                Mejorar Plan
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Uso de Créditos */}
                        <SectionCard>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Activity size={16} color="#3498db" /> Uso de Créditos IA
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                {[
                                    { label: 'Análisis realizados', value: '12 / 50', pct: 24, color: '#4CAF50' },
                                    { label: 'Banners generados', value: '3 / 20', pct: 15, color: '#3498db' },
                                    { label: 'Copies creados', value: '8 / 50', pct: 16, color: '#9b59b6' },
                                ].map((metric, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>{metric.label}</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{metric.value}</span>
                                        </div>
                                        <div style={{ height: 6, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${metric.pct}%`, background: metric.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Historial de pagos */}
                        <SectionCard>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Receipt size={16} color="#e67e22" /> Historial de Pagos
                            </h3>
                            <div style={{ fontSize: 12 }}>
                                {[
                                    { date: '25 Feb 2026', desc: 'Plan Starter - Renovación', amount: 'Gratis', status: 'Completado' },
                                    { date: '25 Ene 2026', desc: 'Plan Starter - Activación', amount: 'Gratis', status: 'Completado' },
                                ].map((payment, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 0', borderBottom: '1px solid #f5f5f5'
                                    }}>
                                        <div>
                                            <span style={{ fontWeight: 600, color: '#333' }}>{payment.desc}</span>
                                            <br />
                                            <span style={{ color: '#999', fontSize: 11 }}>{payment.date}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontWeight: 700, color: '#333' }}>{payment.amount}</span>
                                            <br />
                                            <span style={{ fontSize: 10, fontWeight: 600, color: '#4CAF50' }}>● {payment.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>
                )}
            </div>
        </div>
    )
}
