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
  Square,
  Hexagon,
  Triangle
} from 'lucide-react'
import { supabase, type Analysis, type SalesAngle, type Template } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import SettingsView from '@/components/SettingsView'

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
  const [data, setData] = useState<WizardData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pixora_wizard_data')
      if (saved) return JSON.parse(saved)
    }
    return {
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
    }
  })

  // Cargar llaves guardadas al inicio
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

  // Escuchar cambios en las API Keys desde el sidebar
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

  const [activeView, setActiveView] = useState<'analyzer' | 'banners' | 'landings' | 'simulator' | 'settings'>('analyzer')
  const [showSidebar, setShowSidebar] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'form'>('grid')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const handleGenerate = () => {
    setIsGenerating(true)
    // Simulamos el proceso de diseño con IA
    setTimeout(() => {
      setIsGenerating(false)
      setShowSuccessModal(true)
      // Usaremos una imagen representativa para el demo
      setGeneratedImage('https://images.unsplash.com/photo-1614850553959-d21b651cc79c?q=80&w=1000&auto=format&fit=crop')
    }, 4000)
  }

  // Nuevo estado para productos (idealmente vendría de DB)
  const [products, setProducts] = useState<{ id: string, name: string, description: string, url?: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pixora_products')
      return saved ? JSON.parse(saved) : [{ id: '1', name: 'prueba', description: '' }]
    }
    return []
  })

  const [selectedProduct, setSelectedProduct] = useState<{ id: string, name: string, description: string, url?: string } | null>(null)

  useEffect(() => {
    localStorage.setItem('pixora_products', JSON.stringify(products))
  }, [products])

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
      // 1. Obtener llaves de API (Priorizar DB sobre localStorage)
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

      // Determinar modelo a usar (Prioridad: Grok > Gemini > OpenAI)
      let model = 'openai'
      if (apiKeys.grok) model = 'grok'
      else if (apiKeys.gemini) model = 'gemini'

      // 2. Analizar Producto
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, model, apiKeys })
      })

      const analyzeData = await analyzeRes.json()
      if (analyzeData.error) {
        if (analyzeData.error.includes('quota') || analyzeRes.status === 429) {
          alert('Has excedido tu cuota de API (Error 429). Por favor, revisa tu plan en OpenAI/Google/Grok.')
        } else {
          alert('Error de la IA: ' + analyzeData.error)
        }
        setIsAnalyzing(false)
        return
      }
      const { productInfo } = analyzeData

      // 3. Generar Ángulos
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

      // 4. Formatear y Rellenar
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

  const handleCreateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const url = formData.get('url') as string

    const newProduct = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      url
    }

    setProducts(prev => [newProduct, ...prev])
    setSelectedProduct(newProduct)
    setShowCreateModal(false)
    setViewMode('form')
  }

  const handleDeleteProduct = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="mac-window glass">
      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <form
            onSubmit={handleCreateProduct}
            className="relative w-full max-w-xl bg-white border border-gray-100 rounded-[48px] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in duration-500"
          >
            <div className="mb-10">
              <h2 className="text-3xl font-black text-[#1a1a2e] mb-2 tracking-tighter uppercase italic">Nuevo Producto</h2>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest text-[10px]">
                Ingresa los detalles o deja que nuestra IA analice la tienda por ti.
              </p>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">URL del Producto (Tienda)</label>
                <div className="flex gap-3">
                  <input
                    name="url"
                    placeholder="https://tu-tienda.com/producto"
                    className="flex-1 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-[#1a1a2e] placeholder:text-gray-300 outline-none focus:border-[#FF6B6B]/30 focus:bg-white transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={isAnalyzing}
                    className={`w-14 h-14 rounded-2xl bg-[#FF6B6B] text-white flex items-center justify-center shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0`}
                  >
                    {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={22} className="fill-white" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 rounded-3xl bg-red-50/30 border border-red-100/30">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[9px] font-black text-[#FF6B6B] shadow-sm">GPT</div>
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[9px] font-black text-[#1a1a2e] shadow-sm">GEM</div>
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[9px] font-black text-[#FF6B6B] shadow-sm">GRK</div>
                </div>
                <div>
                  <p className="text-[11px] font-black text-[#1a1a2e] uppercase tracking-tight italic">Análisis Inteligente</p>
                  <p className="text-[10px] font-bold text-gray-400 tracking-tight">Autocompleta los campos usando múltiples modelos de IA</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nombre Comercial</label>
                <input
                  name="name"
                  required
                  placeholder="Ej: Suplemento Vitamínico Premium"
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-[#1a1a2e] placeholder:text-gray-300 outline-none focus:border-[#FF6B6B]/30 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center justify-between">
                  Estrategia y Descripción
                  <span className="text-[10px] text-[#FF6B6B] font-bold uppercase tracking-widest">Ángulos IA</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Aquí aparecerá el análisis del público objetivo y ángulos de venta generados por la IA..."
                  rows={6}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-3xl px-6 py-5 text-[#1a1a2e] placeholder:text-gray-300 outline-none focus:border-[#FF6B6B]/30 focus:bg-white transition-all resize-none shadow-sm text-sm leading-relaxed"
                />
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-8 py-5 rounded-2xl border border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-[2] px-8 py-5 rounded-2xl bg-[#1a1a2e] text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all text-center"
              >
                Crear Producto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de título macOS Personalizada */}
      <div className="mac-titlebar bg-white border-b border-gray-50">
        <div className="mac-traffic-lights">
          <div className="mac-dot bg-[#FF6B6B] shadow-lg shadow-red-100">
            <Square size={8} className="text-white fill-white opacity-80" />
          </div>
          <div className="mac-dot bg-[#1a1a2e] shadow-lg shadow-slate-900/10">
            <Hexagon size={9} className="text-white fill-white opacity-80" />
          </div>
          <div className="mac-dot bg-amber-400 shadow-lg shadow-amber-100">
            <Triangle size={8} className="text-white fill-white opacity-80" />
          </div>
        </div>
        <div className="mac-window-title font-black text-[10px] tracking-[0.2em] text-[#1a1a2e] opacity-40 uppercase italic">Pixora OS • {activeView.toUpperCase()}</div>
      </div>

      <div className="mac-content relative">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'fixed inset-0 flex' : 'hidden'} md:relative md:flex z-50 md:z-20 h-full`}>
          {/* Overlay móvil */}
          {showSidebar && (
            <div
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-md z-[-1]"
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

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {activeView === 'analyzer' ? (
            <main className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Analyzer UI - Similar but with light theme */}
              {/* [Rest of analyzer logic...] */}
              <div className="p-12 text-center text-gray-400">Panel de Analizador (Próximamente versión light)</div>
            </main>
          ) : activeView === 'settings' ? (
            <SettingsView />
          ) : (activeView === 'banners' || activeView === 'landings') && viewMode === 'grid' ? (
            <div className="flex-1 flex flex-col p-8 md:p-12 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-12">
                <div className="space-y-1">
                  <h1 className="text-4xl font-black text-[#1a1a2e] tracking-tighter uppercase italic">
                    {activeView === 'banners' ? 'Banner Studio' : 'Landing Factory'}
                  </h1>
                  <p className="text-[#FF6B6B] font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                    <Sparkles size={14} />
                    Alta Conversión con IA
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-4 rounded-2xl bg-[#FF6B6B] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 transition-all text-center flex items-center gap-3 italic"
                >
                  <Plus size={18} />
                  Nuevo Activo
                </button>
              </div>

              {products.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 border-2 border-dashed border-gray-100 rounded-[48px] bg-gray-50/30">
                  <div className="w-24 h-24 rounded-3xl bg-white border border-gray-100 flex items-center justify-center mb-8 shadow-sm">
                    <ShoppingCart size={40} className="text-gray-200" />
                  </div>
                  <h2 className="text-2xl font-black text-[#111827] mb-2 uppercase tracking-tighter italic">Tu catálogo está vacío</h2>
                  <p className="text-gray-400 text-sm font-medium mb-10 max-w-xs text-center">Crea tu primer producto para empezar a generar creativos profesionales</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-8 py-5 rounded-2xl bg-white border border-gray-100 text-[#111827] font-black text-xs uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all"
                  >
                    Crear mi primer producto
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedProduct(p); setViewMode('form') }}
                      className="group relative bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:border-[#FF6B6B]/10 transition-all cursor-pointer overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => handleDeleteProduct(e, p.id)}
                          className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="w-16 h-16 rounded-2xl bg-red-50/50 text-[#FF6B6B] flex items-center justify-center mb-6 border border-red-100 group-hover:scale-110 transition-transform">
                        <Layout size={28} />
                      </div>
                      <h3 className="text-xl font-black text-[#1a1a2e] mb-3 uppercase tracking-tighter leading-none group-hover:text-[#FF6B6B] transition-colors italic">{p.name}</h3>
                      <p className="text-gray-400 text-xs font-bold leading-relaxed line-clamp-3 mb-8">{p.description}</p>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-300">
                        <div className="flex items-center gap-2">
                          <Sparkles size={12} className="text-[#FF6B6B]" />
                          {p.url ? 'VERIFICADO' : 'MANUAL'}
                        </div>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-[#FF6B6B]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (activeView === 'banners' || activeView === 'landings') && viewMode === 'form' ? (
            <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-8">
              <div className="max-w-6xl mx-auto w-full space-y-8">
                {/* Header del Formulario */}
                <div className="flex items-center gap-6 mb-12">
                  <button
                    onClick={() => setViewMode('grid')}
                    className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#1a1a2e] shadow-sm hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-3xl font-black text-[#1a1a2e] tracking-tighter uppercase italic">{selectedProduct?.name}</h2>
                      <div className="px-3 py-1 rounded-full bg-red-50 border border-red-100 text-[10px] font-black text-[#FF6B6B] uppercase tracking-widest">Activo</div>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      Configurando {activeView === 'banners' ? 'Creativos Publicitarios' : 'Sección de Landing'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Columna Izquierda: Assets */}
                  <div className="lg:col-span-12 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* Dropzone Producto */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-3">
                          <ImageIcon size={14} className="text-[#FF6B6B]" /> Fotos del Producto
                        </label>
                        <div
                          onClick={() => document.getElementById('product-upload')?.click()}
                          className="h-64 rounded-[40px] border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center p-12 group hover:border-[#FF6B6B]/20 hover:bg-white transition-all cursor-pointer"
                        >
                          <input type="file" id="product-upload" className="hidden" multiple />
                          <div className="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <Plus size={24} className="text-gray-300" />
                          </div>
                          <span className="text-[11px] font-black text-[#1a1a2e] uppercase tracking-widest">Subir Assets</span>
                          <span className="text-[10px] text-gray-400 font-bold mt-2 uppercase">PNG, JPG hasta 10MB</span>
                        </div>
                      </div>

                      {/* Dropzone Plantilla */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-3">
                          <Sparkles size={14} className="text-[#FF6B6B]" /> Estilo Visual
                        </label>
                        <div
                          onClick={() => document.getElementById('template-upload')?.click()}
                          className="h-64 rounded-[40px] border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center p-12 group hover:border-[#1a1a2e]/20 hover:bg-white transition-all cursor-pointer"
                        >
                          <input type="file" id="template-upload" className="hidden" />
                          <div className="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <Maximize2 size={24} className="text-gray-300" />
                          </div>
                          <span className="text-[11px] font-black text-[#1a1a2e] uppercase tracking-widest">Cargar Guía</span>
                          <span className="text-[10px] text-gray-400 font-bold mt-2 uppercase">Referencia para la IA</span>
                        </div>
                      </div>
                    </div>

                    {/* Configuración Grid */}
                    <div className="p-12 rounded-[48px] bg-gray-50/50 border border-gray-100 space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Selector País */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-3">
                            <Globe size={14} className="text-[#FF6B6B]" /> País de venta
                          </label>
                          <select className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold text-[#1a1a2e] outline-none focus:border-[#FF6B6B]/20 transition-all shadow-sm appearance-none">
                            <option value="es">España (€)</option>
                            <option value="mx">México ($)</option>
                            <option value="ar">Argentina ($)</option>
                            <option value="co">Colombia ($)</option>
                            <option value="cl">Chile ($)</option>
                            <option value="pe">Perú (S/.)</option>
                            <option value="us">Estados Unidos ($)</option>
                          </select>
                        </div>

                        {/* Selector Tamaño */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-3">
                            <Maximize2 size={14} className="text-[#FF6B6B]" /> Formato de Salida
                          </label>
                          <select className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold text-[#1a1a2e] outline-none focus:border-[#1a1a2e]/20 transition-all shadow-sm appearance-none">
                            <option value="1080x1920">Instagram Stories (9:16)</option>
                            <option value="1080x1080">Post Cuadrado (1:1)</option>
                            <option value="1200x628">Facebook Ads (1.91:1)</option>
                            <option value="1920x1080">Full HD Landings (16:9)</option>
                          </select>
                        </div>

                        {/* Selector Idioma */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-3">
                            <Languages size={14} className="text-emerald-500" /> Idioma del Copy
                          </label>
                          <select className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold text-[#1a1a2e] outline-none focus:border-emerald-500/20 transition-all shadow-sm appearance-none">
                            <option value="es">Español Nativo</option>
                            <option value="en">English (US)</option>
                            <option value="pt">Português (BR)</option>
                            <option value="fr">Français</option>
                          </select>
                        </div>
                      </div>

                      {/* Textarea Instrucciones */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-3">
                          <MessageSquare size={14} className="text-[#FF6B6B]" /> Instrucciones Adicionales
                        </label>
                        <textarea
                          placeholder="Escribe aquí cualquier detalle especial..."
                          rows={4}
                          className="w-full bg-white border border-gray-100 rounded-3xl px-8 py-6 text-sm font-bold text-[#1a1a2e] placeholder:text-gray-200 outline-none focus:border-[#FF6B6B]/20 transition-all shadow-sm resize-none"
                        />
                      </div>
                    </div>

                    {/* Botón Generar */}
                    <div className="pt-6">
                      <button
                        onClick={handleGenerate}
                        className="relative w-full py-8 rounded-[40px] bg-[#1a1a2e] text-white font-black uppercase tracking-[0.4em] text-sm shadow-[0_20px_50px_rgba(26,26,46,0.1)] hover:brightness-110 hover:scale-[0.99] active:scale-[0.98] transition-all flex items-center justify-center gap-6 group overflow-hidden italic"
                      >
                        <Zap size={28} className="fill-[#FF6B6B] text-[#FF6B6B] group-hover:animate-pulse" />
                        Generar Activo Ganador
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Overlays de Generación */}
                {isGenerating && (
                  <div className="fixed inset-0 z-[110] bg-white/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-700">
                    <div className="text-center space-y-12">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                        <h2 className="relative text-8xl font-black text-[#1a1a2e] tracking-tighter italic opacity-5 uppercase select-none">Pargo Rojo</h2>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Zap size={60} className="text-[#FF6B6B] animate-bounce fill-[#FF6B6B] drop-shadow-[0_0_15px_rgba(255,107,107,0.5)]" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-2xl font-black text-[#1a1a2e] uppercase tracking-[0.2em] italic">Diseñando Creativos</p>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">La Inteligencia Artificial de Pargo Rojo está trabajando</p>
                      </div>
                      <div className="w-80 h-2 bg-gray-50 rounded-full overflow-hidden mx-auto shadow-inner p-0.5">
                        <div className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#ee5a5a] rounded-full animate-progress" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setShowSuccessModal(false)} />
                    <div className="relative w-full max-w-xl bg-white border border-gray-50 rounded-[56px] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.15)] animate-in zoom-in fade-in duration-500 text-center">
                      <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-500/10 border border-red-100/50">
                        <Crown size={48} className="text-[#FF6B6B] fill-[#FF6B6B]/20" />
                      </div>

                      <h2 className="text-4xl font-black text-[#1a1a2e] mb-4 tracking-tighter uppercase italic leading-none">¡Éxito Total!</h2>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10">Tu diseño está listo para escalar</p>

                      <div className="aspect-[16/10] rounded-[40px] overflow-hidden mb-12 shadow-2xl border-4 border-white bg-gray-50 relative group">
                        <img src={generatedImage || ''} alt="Generated Asset" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/60 to-transparent flex items-end justify-between p-8">
                          <div className="text-left">
                            <p className="text-white font-black text-[10px] uppercase tracking-widest leading-none mb-1">Resultado Final</p>
                            <p className="text-white/60 text-[8px] font-black uppercase tracking-widest italic">Optimizado por Pixora Engine</p>
                          </div>
                          <button className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all">
                            <Maximize2 size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => setShowSuccessModal(false)}
                          className="w-full py-6 rounded-3xl bg-[#FF6B6B] text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-3 italic"
                        >
                          <Share2 size={16} /> Publicar Diseño
                        </button>
                        <button
                          onClick={() => setShowSuccessModal(false)}
                          className="w-full py-6 rounded-3xl bg-[#1a1a2e] text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center gap-3"
                        >
                          <Download size={16} /> Descargar PNG
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 m-12 rounded-[56px] border-2 border-dashed border-gray-100 bg-gray-50/20">
              <div className="text-center">
                <div className="w-24 h-24 rounded-3xl bg-white border border-gray-100 flex items-center justify-center mx-auto mb-8 shadow-sm">
                  <Calculator size={48} className="text-gray-200" />
                </div>
                <h2 className="text-3xl font-black text-[#1a1a2e] mb-2 uppercase tracking-tighter italic">Coming Soon</h2>
                <p className="text-[#FF6B6B] font-black text-[10px] uppercase tracking-[0.2em]">Calcula tus márgenes y ROI con el motor de Pargo Rojo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
