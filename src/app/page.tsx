'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  ChevronRight,
  Layout,
  Image as ImageIcon,
  Zap,
  Target,
  Users,
  MessageSquare,
  Sparkles,
  Calculator,
  ArrowLeft,
  Settings,
  Menu,
  Crown,
  Share2,
  Download,
  Check,
  Globe,
  Languages,
  Maximize2,
  ShoppingCart,
  Search,
  User,
  ShoppingBag,
  X
} from 'lucide-react'
import { supabase, type Analysis, type SalesAngle, type Template } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import SettingsView from '@/components/SettingsView'
import ProfitCalcView from '@/components/ProfitCalcView'
import ProductAnalysisView from '@/components/ProductAnalysisView'
import CampaignsView from '@/components/CampaignsView'
import OperationsView from '@/components/OperationsView'
import LogisticsView from '@/components/LogisticsView'

interface WizardData {
  url: string
  productInfo: any
  salesAngles: SalesAngle[]
  chosenAngle: SalesAngle | null
  copy: {
    description: string
    main_focus: string
    problems: string[]
    ideal_client: string
    target_client: string
  } | null
  salesChannel: string
  adaptedCopy: string
  tips: string[]
  template: Template | null
  productImages: string[]
  outputSize: string
  outputLanguage: string
  selectedModel: 'openai' | 'gemini' | 'grok'
  apiKeys: {
    openai?: string
    gemini?: string
    grok?: string
  }
}

export default function HomePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isComplete, setIsComplete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [data, setData] = useState<WizardData>({
    url: '',
    productInfo: null,
    salesAngles: [],
    chosenAngle: null,
    copy: null,
    salesChannel: '',
    adaptedCopy: '',
    tips: [],
    template: null,
    productImages: [],
    outputSize: '1080x1920',
    outputLanguage: 'es',
    selectedModel: 'openai',
    apiKeys: {}
  })

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load products
      const { data: prods } = await supabase.from('user_products').select('*').order('created_at', { ascending: false })
      if (prods) setProducts(prods)

      // Load wizard data (if any recent)
      const saved = localStorage.getItem('pixora_wizard_data')
      if (saved) setData(JSON.parse(saved))
    }
    fetchInitialData()
  }, [])

  useEffect(() => {
    const keys = localStorage.getItem('pixora_api_keys')
    if (keys) {
      const parsedKeys = JSON.parse(keys)
      setData(prev => ({
        ...prev,
        apiKeys: {
          openai: parsedKeys.chatgpt,
          gemini: parsedKeys.gemini,
          grok: parsedKeys.grok
        }
      }))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('pixora_wizard_data', JSON.stringify(data))
  }, [data])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pixora_api_keys' && e.newValue) {
        const parsedKeys = JSON.parse(e.newValue)
        setData(prev => ({
          ...prev,
          apiKeys: {
            openai: parsedKeys.chatgpt,
            gemini: parsedKeys.gemini,
            grok: parsedKeys.grok
          }
        }))
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const updateData = (partial: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...partial }))
  }

  const goNext = () => setCurrentStep(s => Math.min(s + 1, 6))
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 1))

  const handleComplete = async (template: Template | null, productImages: string[], outputSize: string, outputLanguage: string) => {
    updateData({ template, productImages, outputSize, outputLanguage })
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('analyses').insert({
        user_id: user?.id,
        product_url: data.url,
        product_name: data.productInfo?.name || null,
        product_info: data.productInfo,
        sales_angles: data.salesAngles,
        chosen_angle: data.chosenAngle?.title || null,
        description: data.copy?.description || null,
        problems: data.copy?.problems || null,
        ideal_client: data.copy?.ideal_client || null,
        target_client: data.copy?.target_client || null,
        sales_channel: data.salesChannel,
        adapted_copy: data.adaptedCopy,
        template_id: template?.id || null,
      })
    } catch (err) {
      console.error('Error guardando análisis:', err)
    } finally {
      setIsSaving(false)
      setIsComplete(true)
    }
  }

  const handleNewAnalysis = () => {
    setCurrentStep(1)
    setIsComplete(false)
    setData(prev => ({
      ...prev,
      url: '',
      productInfo: null,
      salesAngles: [],
      chosenAngle: null,
      copy: null,
      salesChannel: '',
      adaptedCopy: '',
      tips: [],
      template: null,
      productImages: [],
      outputSize: '1080x1920',
      outputLanguage: 'es',
    }))
  }

  const handleLoadAnalysis = (analysis: Analysis) => {
    setData({
      url: analysis.product_url,
      productInfo: analysis.product_info,
      salesAngles: analysis.sales_angles || [],
      chosenAngle: analysis.sales_angles?.find((a: SalesAngle) => a.title === analysis.chosen_angle) || null,
      copy: analysis.description ? {
        description: analysis.description,
        main_focus: '',
        problems: analysis.problems || [],
        ideal_client: analysis.ideal_client || '',
        target_client: analysis.target_client || '',
      } : null,
      salesChannel: analysis.sales_channel || '',
      adaptedCopy: analysis.adapted_copy || '',
      tips: [],
      template: null,
      productImages: [],
      outputSize: '1080x1920',
      outputLanguage: 'es',
      selectedModel: data.selectedModel,
      apiKeys: data.apiKeys,
    })
    setIsComplete(true)
  }

  const [activeView, setActiveView] = useState<string>('analyzer')
  const [showSidebar, setShowSidebar] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'form'>('grid')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setShowSuccessModal(true)
      setGeneratedImage('https://images.unsplash.com/photo-1614850553959-d21b651cc79c?q=80&w=1000&auto=format&fit=crop')
    }, 4000)
  }

  const [products, setProducts] = useState<{ id: string, name: string, description: string, url?: string }[]>([])

  const [selectedProduct, setSelectedProduct] = useState<{ id: string, name: string, description: string, url?: string } | null>(null)

  // Removed localStorage sync for products

  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAIGenerate = async () => {
    const urlInput = document.querySelector('input[name="url"]') as HTMLInputElement
    const url = urlInput?.value
    if (!url) {
      alert('Por favor, ingresa una URL primero')
      return
    }
    setIsAnalyzing(true)
    try {
      const { data: activeConfig } = await supabase
        .from('user_api_configs')
        .select('*')
        .eq('active', true)
        .single()

      let apiKeys = {
        openai: activeConfig?.chatgpt,
        gemini: activeConfig?.gemini,
        grok: activeConfig?.grok
      }

      if (!apiKeys.openai && !apiKeys.gemini && !apiKeys.grok) {
        const keysSaved = localStorage.getItem('pixora_api_keys')
        const apiKeysSaved = keysSaved ? JSON.parse(keysSaved) : {}
        apiKeys = {
          openai: apiKeysSaved.chatgpt,
          gemini: apiKeysSaved.gemini,
          grok: apiKeysSaved.grok
        }
      }

      let model = 'openai'
      if (apiKeys.grok) model = 'grok'
      else if (apiKeys.gemini) model = 'gemini'

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, model, apiKeys })
      })

      const analyzeData = await analyzeRes.json()
      if (analyzeData.error) {
        if (analyzeData.error.includes('quota') || analyzeRes.status === 429) {
          alert('Has excedido tu cuota de API (Error 429).')
        } else {
          alert('Error de la IA: ' + analyzeData.error)
        }
        setIsAnalyzing(false)
        return
      }
      const { productInfo } = analyzeData

      const anglesRes = await fetch('/api/angles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productInfo, model, apiKeys })
      })

      const anglesData = await anglesRes.json()
      if (anglesData.error) {
        alert('Error al generar ángulos: ' + anglesData.error)
        setIsAnalyzing(false)
        return
      }
      const { angles } = anglesData

      const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement
      const descInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement

      if (nameInput) nameInput.value = productInfo.name || ""

      let formattedText = `Aquí tienes el análisis completo 👇\n\n`
      formattedText += `Descripción: ${productInfo.summary}\n\n`

      if (productInfo.features?.length) {
        formattedText += `🧸 Características principales:\n`
        productInfo.features.slice(0, 5).forEach((f: any) => formattedText += `- ${f}\n`)
        formattedText += `\n`
      }

      formattedText += `🎯 Para qué sirve:\n`
      productInfo.use_cases?.forEach((u: any) => formattedText += `- ${u}\n`)
      formattedText += `\n`

      if (productInfo.price) formattedText += `💶 Precio: ${productInfo.price}\n\n`

      formattedText += `🎯 CLIENTE OBJETIVO:\n${productInfo.target_audience}\n\n`

      formattedText += `🔥 ÁNGULOS DE VENTAS:\n`
      angles?.forEach((a: any, i: number) => {
        formattedText += `🎯 Ángulo ${i + 1}: ${a.title}\n`
        formattedText += `Hook: ${a.hook}\n`
        formattedText += `Enfoque: ${a.description}\n\n`
      })

      if (descInput) descInput.value = formattedText
    } catch (err: any) {
      console.error('Error en análisis IA:', err)
      alert('Error en el análisis: ' + err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const url = formData.get('url') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: inserted, error } = await supabase
        .from('user_products')
        .insert({ user_id: user.id, name, description, url })
        .select()
        .single()

      if (inserted) {
        setProducts(prev => [inserted, ...prev])
        setSelectedProduct(inserted)
        setShowCreateModal(false)
        setViewMode('form')
      }
    }
  }

  const handleDeleteProduct = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('¿Eliminar este producto?')) {
      await supabase.from('user_products').delete().eq('id', id)
      setProducts(prev => prev.filter(p => p.id !== id))
    }
  }

  // View title mapping
  const getViewTitle = () => {
    switch (activeView) {
      case 'analyzer': return 'PANEL DE INICIO'
      case 'product_analysis': return 'ANÁLISIS DE PRODUCTO'
      case 'campaigns': return 'SEGUIMIENTO DE CAMPAÑAS'
      case 'operations': return 'ANÁLISIS DE OPERACIÓN'
      case 'logistics': return 'AUDITOR LOGÍSTICO'
      case 'banners': return 'BANNER STUDIO'
      case 'landings': return 'LANDING FACTORY'
      case 'simulator': return 'CONTROL DIARIO'
      case 'settings': return 'AJUSTES DE CUENTA'
      default: return 'PIXORA'
    }
  }

  return (
    <div className="mac-window glass">
      {/* Create Product Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowCreateModal(false)}
          />
          <form
            onSubmit={handleCreateProduct}
            style={{
              position: 'relative', width: '100%', maxWidth: 520,
              background: 'white', borderRadius: 16, padding: 32,
              boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#333', marginBottom: 4 }}>Nuevo Producto</h2>
              <p style={{ color: '#999', fontSize: 13 }}>Ingresa los detalles o deja que la IA analice por ti.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>URL del Producto</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    name="url"
                    placeholder="https://tu-tienda.com/producto"
                    className="input-field"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={isAnalyzing}
                    style={{
                      width: 44, height: 44, borderRadius: 8,
                      background: '#4CAF50', color: 'white', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0
                    }}
                  >
                    {isAnalyzing ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Zap size={18} className="fill-white" />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Nombre Comercial</label>
                <input
                  name="name"
                  required
                  placeholder="Ej: Suplemento Vitamínico Premium"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Descripción</label>
                <textarea
                  name="description"
                  placeholder="Análisis y descripción del producto..."
                  rows={5}
                  className="input-field"
                  style={{ resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
              >
                Crear Producto
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mac-content">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'fixed inset-0 flex' : 'hidden'} md:relative md:flex z-50 md:z-20 h-full`}>
          {showSidebar && (
            <div
              className="md:hidden fixed inset-0 bg-black/30"
              style={{ zIndex: -1 }}
              onClick={() => setShowSidebar(false)}
            />
          )}
          <Sidebar
            activeView={activeView}
            onViewChange={(v: any) => {
              setActiveView(v);
              setShowSidebar(false);
              setViewMode('grid');
            }}
            onLoadAnalysis={(a) => { handleLoadAnalysis(a); setShowSidebar(false); setActiveView('analyzer') }}
            onNewAnalysis={() => { handleNewAnalysis(); setShowSidebar(false); setActiveView('analyzer') }}
          />
        </div>

        {/* Main content */}
        <div className="main-content">
          {/* Top Header */}
          <div className="top-header">
            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setShowSidebar(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <Menu size={20} color="#333" />
            </button>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <span className="top-header-title">{getViewTitle()}</span>
            </div>

            <div className="top-header-actions">
              <div className="top-header-icon">
                <Search size={18} />
              </div>
              <div className="top-header-icon">
                <User size={18} />
              </div>
              <div className="top-header-icon">
                <ShoppingBag size={18} />
              </div>
            </div>
          </div>

          {/* Content Area */}
          {activeView === 'analyzer' ? (
            <main className="main-scroll custom-scrollbar">
              <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
                Panel de Analizador (Próximamente versión light)
              </div>
            </main>
          ) : activeView === 'settings' ? (
            <SettingsView />
          ) : activeView === 'simulator' ? (
            <ProfitCalcView />
          ) : activeView === 'product_analysis' ? (
            <ProductAnalysisView />
          ) : activeView === 'campaigns' ? (
            <CampaignsView />
          ) : activeView === 'operations' ? (
            <OperationsView />
          ) : activeView === 'logistics' ? (
            <LogisticsView />
          ) : (activeView === 'banners' || activeView === 'landings') && viewMode === 'grid' ? (
            <div className="main-scroll custom-scrollbar">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: '#333', marginBottom: 4 }}>
                    {activeView === 'banners' ? 'Banner Studio' : 'Landing Factory'}
                  </h1>
                  <p style={{ color: '#4CAF50', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} />
                    Alta Conversión con IA
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <Plus size={16} />
                  Nuevo Activo
                </button>
              </div>

              {products.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 64, border: '2px dashed #eee', borderRadius: 16, background: '#fafafa'
                }}>
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: 'white', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <ShoppingCart size={28} color="#ddd" />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#333', marginBottom: 8 }}>Tu catálogo está vacío</h2>
                  <p style={{ color: '#999', fontSize: 13, marginBottom: 24, maxWidth: 300, textAlign: 'center' }}>Crea tu primer producto para empezar a generar creativos</p>
                  <button onClick={() => setShowCreateModal(true)} className="btn-secondary">
                    Crear mi primer producto
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {products.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedProduct(p); setViewMode('form') }}
                      className="card"
                      style={{ padding: 24, cursor: 'pointer', position: 'relative' }}
                    >
                      <div style={{ position: 'absolute', top: 16, right: 16 }}>
                        <button
                          onClick={(e) => handleDeleteProduct(e, p.id)}
                          style={{
                            width: 32, height: 32, borderRadius: 8, background: '#fff5f5',
                            color: '#e74c3c', border: 'none', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', opacity: 0.6
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div style={{
                        width: 48, height: 48, borderRadius: 10, background: '#f0faf0',
                        color: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
                      }}>
                        <Layout size={22} />
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 8 }}>{p.name}</h3>
                      <p style={{ color: '#999', fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>{p.description}</p>

                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingTop: 12, borderTop: '1px solid #f5f5f5', fontSize: 10, color: '#ccc', fontWeight: 600
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Sparkles size={10} color="#4CAF50" />
                          {p.url ? 'VERIFICADO' : 'MANUAL'}
                        </span>
                        <ChevronRight size={14} color="#4CAF50" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (activeView === 'banners' || activeView === 'landings') && viewMode === 'form' ? (
            <main className="main-scroll custom-scrollbar">
              <div style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      width: 40, height: 40, borderRadius: 8, background: 'white',
                      border: '1px solid #eee', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    <ArrowLeft size={18} color="#333" />
                  </button>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#333' }}>{selectedProduct?.name}</h2>
                    <p style={{ color: '#999', fontSize: 12 }}>
                      Configurando {activeView === 'banners' ? 'Creativos Publicitarios' : 'Sección de Landing'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  {/* Dropzone Producto */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                      Fotos del Producto
                    </label>
                    <div
                      onClick={() => document.getElementById('product-upload')?.click()}
                      style={{
                        height: 200, borderRadius: 12, border: '2px dashed #eee', background: '#fafafa',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <input type="file" id="product-upload" style={{ display: 'none' }} multiple />
                      <Plus size={24} color="#ccc" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#666', marginTop: 8 }}>Subir Assets</span>
                      <span style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>PNG, JPG hasta 10MB</span>
                    </div>
                  </div>

                  {/* Dropzone Plantilla */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                      Estilo Visual
                    </label>
                    <div
                      onClick={() => document.getElementById('template-upload')?.click()}
                      style={{
                        height: 200, borderRadius: 12, border: '2px dashed #eee', background: '#fafafa',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <input type="file" id="template-upload" style={{ display: 'none' }} />
                      <Maximize2 size={24} color="#ccc" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#666', marginTop: 8 }}>Cargar Guía</span>
                      <span style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>Referencia para la IA</span>
                    </div>
                  </div>
                </div>

                {/* Config */}
                <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>País de venta</label>
                      <select className="input-field">
                        <option value="es">España (€)</option>
                        <option value="mx">México ($)</option>
                        <option value="ar">Argentina ($)</option>
                        <option value="co">Colombia ($)</option>
                        <option value="us">Estados Unidos ($)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Formato de Salida</label>
                      <select className="input-field">
                        <option value="1080x1920">Instagram Stories (9:16)</option>
                        <option value="1080x1080">Post Cuadrado (1:1)</option>
                        <option value="1200x628">Facebook Ads (1.91:1)</option>
                        <option value="1920x1080">Full HD (16:9)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Idioma del Copy</label>
                      <select className="input-field">
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Instrucciones Adicionales</label>
                    <textarea
                      placeholder="Escribe aquí cualquier detalle especial..."
                      rows={3}
                      className="input-field"
                      style={{ resize: 'none' }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px 24px', fontSize: 14, justifyContent: 'center' }}
                >
                  <Zap size={18} className="fill-white" />
                  Generar Activo Ganador
                </button>

                {/* Generating overlay */}
                {isGenerating && (
                  <div style={{
                    position: 'fixed', inset: 0, zIndex: 110,
                    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.5s ease'
                  }}>
                    <Zap size={48} color="#4CAF50" style={{ marginBottom: 16 }} className="fill-green-500" />
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#333', marginBottom: 8 }}>Diseñando Creativos</h2>
                    <p style={{ color: '#999', fontSize: 13, marginBottom: 24 }}>La IA está trabajando...</p>
                    <div style={{ width: 240, height: 4, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', background: '#4CAF50', borderRadius: 4,
                        animation: 'progress 2s ease-in-out infinite'
                      }} />
                    </div>
                  </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                  <div style={{
                    position: 'fixed', inset: 0, zIndex: 120,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowSuccessModal(false)} />
                    <div style={{
                      position: 'relative', width: '100%', maxWidth: 480,
                      background: 'white', borderRadius: 16, padding: 32,
                      boxShadow: '0 24px 64px rgba(0,0,0,0.15)', textAlign: 'center',
                      animation: 'fadeIn 0.3s ease'
                    }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%', background: '#f0faf0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                      }}>
                        <Check size={32} color="#4CAF50" />
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#333', marginBottom: 8 }}>¡Éxito!</h2>
                      <p style={{ color: '#999', fontSize: 13, marginBottom: 24 }}>Tu diseño está listo</p>

                      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                        <img src={generatedImage || ''} alt="Generated Asset" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button onClick={() => setShowSuccessModal(false)} className="btn-primary" style={{ justifyContent: 'center' }}>
                          <Share2 size={14} /> Publicar
                        </button>
                        <button onClick={() => setShowSuccessModal(false)} className="btn-secondary" style={{ justifyContent: 'center' }}>
                          <Download size={14} /> Descargar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          ) : (
            <div className="main-scroll custom-scrollbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 12, background: 'white', border: '1px solid #eee',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                }}>
                  <Calculator size={28} color="#ddd" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#333', marginBottom: 8 }}>Coming Soon</h2>
                <p style={{ color: '#4CAF50', fontSize: 12, fontWeight: 600 }}>Calcula tus márgenes y ROI</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
