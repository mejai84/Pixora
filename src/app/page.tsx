'use client'

import { useState, useEffect } from 'react'
import { supabase, type Analysis, type ProductInfo, type SalesAngle, type Template } from '@/lib/supabase'
import Step1URL from '@/components/steps/Step1URL'
import Step2Analysis from '@/components/steps/Step2Analysis'
import Step3Angles from '@/components/steps/Step3Angles'
import Step4Copy from '@/components/steps/Step4Copy'
import Step5Channel from '@/components/steps/Step5Channel'
import Step6Template from '@/components/steps/Step6Template'
import ResultPanel from '@/components/ResultPanel'
import Sidebar from '@/components/Sidebar'
import { Menu, Sparkles } from 'lucide-react'

export type WizardData = {
  url: string
  productInfo: ProductInfo | null
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
  selectedModel: 'gemini' | 'openai' | 'grok'
  apiKeys: {
    gemini?: string
    openai?: string
    grok?: string
  }
}

const STEPS = [
  { id: 1, label: 'URL' },
  { id: 2, label: 'Análisis' },
  { id: 3, label: 'Ángulo' },
  { id: 4, label: 'Copy' },
  { id: 5, label: 'Canal' },
  { id: 6, label: 'Plantilla' },
]

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isComplete, setIsComplete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [data, setData] = useState<WizardData>(() => {
    // Intentar cargar de localStorage si estamos en el cliente
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pixora_settings') : null
    const settings = saved ? JSON.parse(saved) : {}

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
      selectedModel: settings.selectedModel || 'openai',
      apiKeys: settings.apiKeys || {},
    }
  })

  // Cargar configuración inicial desde Supabase si existe
  useEffect(() => {
    const loadSettings = async () => {
      const { data: settings, error } = await supabase
        .from('api_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (!error && settings) {
        updateData({
          selectedModel: settings.selected_model as any,
          apiKeys: {
            gemini: settings.gemini_key || '',
            openai: settings.openai_key || '',
            grok: settings.grok_key || '',
          }
        })
      }
    }
    loadSettings()
  }, [])

  // Guardar configuración cuando cambie el modelo o las keys (Local y DB)
  useEffect(() => {
    localStorage.setItem('pixora_settings', JSON.stringify({
      selectedModel: data.selectedModel,
      apiKeys: data.apiKeys,
    }))

    const saveSettings = async () => {
      await supabase.from('api_settings').upsert({
        id: 1,
        selected_model: data.selectedModel,
        gemini_key: data.apiKeys.gemini,
        openai_key: data.apiKeys.openai,
        grok_key: data.apiKeys.grok,
        updated_at: new Date().toISOString(),
      })
    }
    saveSettings()
  }, [data.selectedModel, data.apiKeys])

  const updateData = (partial: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...partial }))
  }

  const goNext = () => setCurrentStep(s => Math.min(s + 1, 6))
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 1))

  const handleComplete = async (template: Template | null, productImages: string[], outputSize: string, outputLanguage: string) => {
    updateData({ template, productImages, outputSize, outputLanguage })
    setIsSaving(true)

    try {
      await supabase.from('analyses').insert({
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

  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div className="mac-window glass">
      {/* Barra de título macOS */}
      <div className="mac-titlebar">
        <div className="mac-traffic-lights flex-shrink-0">
          <div className="mac-dot red" />
          <div className="mac-dot yellow" />
          <div className="mac-dot green" />
        </div>

        {/* Botón menú móvil */}
        <button
          className="md:hidden ml-4 p-2 rounded-lg hover:bg-black/5"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <Menu size={18} />
        </button>

        <div className="mac-window-title">Pixora — Product Analyzer AI</div>
      </div>

      <div className="mac-content">
        {/* Sidebar de historial */}
        <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex absolute md:relative z-20 h-full md:h-auto`}>
          <Sidebar
            onLoadAnalysis={(a) => { handleLoadAnalysis(a); setShowSidebar(false) }}
            onNewAnalysis={() => { handleNewAnalysis(); setShowSidebar(false) }}
          />
          {/* Overlay para cerrar sidebar en móvil */}
          {showSidebar && (
            <div
              className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1]"
              onClick={() => setShowSidebar(false)}
            />
          )}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header interno / Stepper */}
          <header className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                <Sparkles size={14} className="sm:size-[16px]" color="white" />
              </div>
              <span className="text-base sm:text-lg font-bold gradient-text">Pixora</span>
            </div>

            {!isComplete && (
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar max-w-[50%] sm:max-w-none">
                {STEPS.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                      <div className={`step-dot ${currentStep === step.id ? 'active' : ''}`} />
                      <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider" style={{ color: currentStep === step.id ? 'var(--accent-light)' : 'var(--text-muted)' }}>
                        {step.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className="w-4 sm:w-6 h-px" style={{ background: 'var(--border)', opacity: 0.5 }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </header>

          {/* Wizard content */}
          <main className="flex-1 overflow-y-auto p-8 sidebar-scroll">
            {isComplete ? (
              <ResultPanel data={{ ...data }} onNewAnalysis={handleNewAnalysis} />
            ) : (
              <div className="max-w-3xl mx-auto animate-fade-in">
                {currentStep === 1 && (
                  <Step1URL
                    value={data.url}
                    selectedModel={data.selectedModel}
                    apiKeys={data.apiKeys}
                    onChange={(url) => updateData({ url })}
                    onModelChange={(selectedModel) => updateData({ selectedModel })}
                    onKeysChange={(apiKeys) => updateData({ apiKeys })}
                    onNext={goNext}
                    onAnalyzed={(productInfo) => { updateData({ productInfo }); goNext() }}
                  />
                )}
                {currentStep === 2 && (
                  <Step2Analysis
                    productInfo={data.productInfo}
                    selectedModel={data.selectedModel}
                    apiKeys={data.apiKeys}
                    onNext={goNext}
                    onPrev={goPrev}
                    onAnglesGenerated={(angles) => { updateData({ salesAngles: angles }); goNext() }}
                  />
                )}
                {currentStep === 3 && (
                  <Step3Angles
                    angles={data.salesAngles}
                    selected={data.chosenAngle}
                    selectedModel={data.selectedModel}
                    apiKeys={data.apiKeys}
                    onSelect={(angle) => updateData({ chosenAngle: angle })}
                    onNext={() => goNext()}
                    onPrev={goPrev}
                    onCopyGenerated={(copy) => { updateData({ copy }); goNext() }}
                    productInfo={data.productInfo}
                  />
                )}
                {currentStep === 4 && (
                  <Step4Copy
                    copy={data.copy}
                    chosenAngle={data.chosenAngle}
                    onNext={goNext}
                    onPrev={goPrev}
                  />
                )}
                {currentStep === 5 && (
                  <Step5Channel
                    selected={data.salesChannel}
                    selectedModel={data.selectedModel}
                    apiKeys={data.apiKeys}
                    onSelect={(channel) => updateData({ salesChannel: channel })}
                    onNext={goNext}
                    onPrev={goPrev}
                    onAdapted={(adaptedCopy, tips) => { updateData({ adaptedCopy, tips }); goNext() }}
                    productInfo={data.productInfo}
                    chosenAngle={data.chosenAngle}
                    copy={data.copy}
                  />
                )}
                {currentStep === 6 && (
                  <Step6Template
                    onComplete={handleComplete}
                    onPrev={goPrev}
                    isSaving={isSaving}
                  />
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

