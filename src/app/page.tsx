'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap, Activity, ArrowRight,
  BarChart3, Target, History, Sparkles,
  ChevronRight, ExternalLink, ShieldCheck,
  Calculator
} from 'lucide-react'
import { COUNTRIES } from '@/constants/countries'

export default function LandingPage() {
  const router = useRouter()

  const handleLoginClick = () => {
    window.open('/login', '_blank')
  }

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#1a1a2e' }}>

      {/* Header / Nav */}
      <header style={{
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 5%',
        position: 'fixed',
        top: 0,
        width: '100%',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#4CAF50', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(76, 175, 80, 0.2)' }}>
            <Activity color="white" size={24} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>PIXORA</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <nav style={{ display: 'flex', gap: 32, fontSize: 13, fontWeight: 700, color: '#64748b' }} className="hidden md:flex">
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Funciones</a>
            <a href="#audit" style={{ color: 'inherit', textDecoration: 'none' }}>Auditoría</a>
            <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Precios</a>
          </nav>
          <button
            onClick={handleLoginClick}
            style={{
              background: '#1a1a2e',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            Acceder <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section - Control Total Style */}
      <main style={{ paddingTop: 160, paddingBottom: 100, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#f0fdf4',
            padding: '6px 16px',
            borderRadius: 30,
            color: '#22c55e',
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 32,
            animation: 'fadeInUp 0.6s ease-out'
          }}>
            <Sparkles size={14} /> EL FUTURO DEL E-COMMERCE OPERATIVO
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 8vw, 72px)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            marginBottom: 24,
            animation: 'fadeInUp 0.8s ease-out'
          }}>
            Control <span style={{ color: '#4CAF50' }}>Total</span> de tu <br /> Operación Logística
          </h1>

          <p style={{
            fontSize: 18,
            color: '#64748b',
            maxWidth: 700,
            margin: '0 auto 48px',
            lineHeight: 1.6,
            fontWeight: 500,
            animation: 'fadeInUp 1s ease-out'
          }}>
            La primera plataforma diseñada para dueños de tiendas que necesitan rentabilidad real.
            Audita fletes, simula utilidades y analiza productos con IA en un solo lugar.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, animation: 'fadeInUp 1.2s ease-out' }}>
            <button
              onClick={handleLoginClick}
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '12px 32px',
                borderRadius: 16,
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(76, 175, 80, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              Comienza Gratis <Zap size={18} className="fill-white" />
            </button>
          </div>

          {/* Dashboard Preview / Mockup */}
          <div style={{
            marginTop: 80,
            position: 'relative',
            animation: 'fadeInUp 1.4s ease-out'
          }}>
            <div style={{
              background: 'white',
              borderRadius: 40,
              border: '1px solid #efeff5',
              padding: '12px',
              boxShadow: '0 40px 100px rgba(0,0,0,0.08)',
              maxWidth: 1000,
              margin: '0 auto'
            }}>
              <div style={{
                background: '#f8fafc',
                borderRadius: 32,
                padding: '40px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 50, background: '#ff5f57' }}></div>
                    <div style={{ width: 12, height: 12, borderRadius: 50, background: '#febc2e' }}></div>
                    <div style={{ width: 12, height: 12, borderRadius: 50, background: '#28c840' }}></div>
                  </div>
                  <div style={{ background: 'white', padding: '6px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: '1px solid #eee' }}>pixora.ai/dashboard</div>
                  <div style={{ width: 60 }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32 }}>
                  <div style={{ background: 'white', borderRadius: 28, padding: 32, border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 900 }}>Control Operativo</h3>
                      <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 800 }}>Auditoría Activa 🟢</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                        <span>Facturación Bruta</span>
                        <span style={{ color: '#1a1a2e' }}>$12.450.000</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                        <span>Costo Logístico</span>
                        <span style={{ color: '#ef4444' }}>-$2.120.000</span>
                      </div>
                      <div style={{ height: 1, background: '#f1f5f9' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>Utilidad Real</span>
                        <span style={{ fontSize: 24, fontWeight: 900, color: '#22c55e' }}>+$5.430.000</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#1a1a2e', borderRadius: 28, padding: 32, color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                      <Sparkles size={18} color="#4CAF50" />
                      <span style={{ fontSize: 14, fontWeight: 800 }}>IA Winning Score</span>
                    </div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: '#4CAF50' }}>8.5 <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>/10</span></div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 12, lineHeight: 1.5 }}>
                      Este producto tiene alta probabilidad de éxito en el mercado Latinoamericano.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Problem Section (Media 1) */}
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, background: '#fef2f2', padding: '6px 16px', borderRadius: 30 }}>El dolor operativo</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#1a1a2e', marginTop: 20 }}>¿Tienes problemas con tus transportadoras?</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { title: "Cobra de más", desc: "Detecta cobros injustificados en fletes y recupera tu dinero automáticamente analizando cada guía.", icon: "💸", color: "#ef4444" },
              { title: "Tiempos de entrega", desc: "Visualiza qué ciudades y transportadoras están fallando sistemáticamente en sus promesas de entrega.", icon: "⏰", color: "#f59e0b" },
              { title: "Devoluciones fantasma", desc: "Identifica guías que aparecen como 'devueltas' pero que nunca llegaron físicamente a tu bodega.", icon: "👻", color: "#6366f1" }
            ].map((p, i) => (
              <div key={i} style={{ padding: 40, borderRadius: 32, background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 10px 40px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: p.color }}></div>
                <div style={{ fontSize: 40, marginBottom: 20 }}>{p.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Grid Section */}
      <section style={{
        padding: '100px 5%',
        background: 'linear-gradient(180deg, #4CAF50 0%, #2d6a30 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, marginBottom: 16 }}>Lo que lograrás con Pixora</h2>
          <p style={{ fontSize: 18, fontWeight: 500, opacity: 0.9, marginBottom: 64 }}>Transforma tu operación de caos a control total.</p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16
          }}>
            {[
              { text: "Reduce tus devoluciones", icon: <History size={20} /> },
              { text: "Aumenta tu utilidad", icon: <Zap size={20} /> },
              { text: "Supervisa tus pedidos de forma fácil", icon: <Activity size={20} /> },
              { text: "Vigila tu gasto en pauta publicitaria", icon: <Target size={20} /> },
              { text: "Valida la rentabilidad por producto", icon: <BarChart3 size={20} /> },
              { text: "Supervisa los pedidos que no se han movido", icon: <Activity size={20} /> },
              { text: "Trazabilidad detallada de pedidos", icon: <Target size={20} /> },
              { text: "Supervisión de costos logísticos reales", icon: <ShieldCheck size={20} /> },
              { text: "Proyección de crecimiento sostenible", icon: <Sparkles size={20} /> },
              { text: "Análisis por transportadora", icon: <ArrowRight size={20} /> },
              { text: "Análisis por producto con IA", icon: <Zap size={20} /> },
              { text: "Costeo detallado de productos", icon: <Calculator size={20} /> },
              { text: "Todo tu negocio en un solo lugar", icon: <Activity size={20} /> },
              { text: "Aumenta tu tasa de efectividad", icon: <Zap size={20} /> },
              { text: "Controla tus cancelaciones", icon: <Target size={20} /> }
            ].map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 24,
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'transform 0.2s'
              }}>
                <div style={{ opacity: 0.8 }}>{item.icon}</div>
                <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{item.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleLoginClick}
            style={{
              marginTop: 64,
              background: 'white',
              color: '#1a1a2e',
              border: 'none',
              padding: '16px 40px',
              borderRadius: 50,
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            Empieza a tomar el control ahora
          </button>
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section style={{ padding: '100px 5%', background: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <span style={{ color: '#4CAF50', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Control Total</span>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 900, color: '#1a1a2e', marginTop: 12, marginBottom: 16 }}>
            Empieza a analizar desde hoy cómo <br /> <span style={{ color: '#4CAF50' }}>dejar de perder dinero</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: 16, fontWeight: 500, marginBottom: 80 }}>
            Descubre exactamente cuánto estás ganando (o perdiendo) en cada envío. Sin trucos, sin Excels rotos.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {[
              { step: 1, title: 'Conecta tu tienda', desc: 'Integra Shopify, WooCommerce o Dropi en un solo clic para importar tus datos.' },
              { step: 2, title: 'Analiza tu operación', desc: 'Pixora procesa miles de pedidos y audita todo automáticamente, detectando errores.' },
              { step: 3, title: 'Maximiza rentabilidad', desc: 'Visualiza utilidad real, detecta fletes costosos y optimiza tu pauta con IA.' }
            ].map((s, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: 24,
                padding: 40,
                border: '1px solid #f1f5f9',
                textAlign: 'left',
                boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 50, background: '#f0fdf4', color: '#4CAF50',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, marginBottom: 24
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a2e', marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audit Transparency Section (Media 2 style) */}
      <section id="audit" style={{ padding: '100px 5%', background: '#f0fdf4' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div>
            <span style={{ color: '#4CAF50', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Auditoría Inteligente</span>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 900, color: '#1a1a2e', marginTop: 12, marginBottom: 24 }}>
              Transparencia total en tus <br /><span style={{ color: '#4CAF50' }}>fletes y recaudos</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: 17, lineHeight: 1.6, fontWeight: 500, marginBottom: 40 }}>
              Carga tu reporte de Dropi o transportadora y deja que nuestra IA cruce cada dato. Detectamos discrepancias en centavos que, al final del mes, se convierten en millones para tu bolsillo.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                "Conciliación automática de recaudos",
                "Detección de sobrecostos por peso/volumen",
                "Seguimiento en tiempo real de novedades",
                "Alertas de guías estancadas"
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 50, background: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={12} color="white" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 40, padding: 12, boxShadow: '0 40px 80px rgba(0,0,0,0.06)', border: '1px solid #dcfce7' }}>
            <div style={{ background: '#f8fafc', borderRadius: 32, padding: 32 }}>
              <div style={{ height: 24, width: 120, background: '#e2e8f0', borderRadius: 6, marginBottom: 32 }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ background: 'white', padding: 16, borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f8fafc' }}></div>
                      <div style={{ width: 80, height: 8, background: '#f1f5f9', borderRadius: 4 }}></div>
                    </div>
                    <div style={{ width: 60, height: 24, background: i === 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 30, height: 6, background: i === 0 ? '#ef4444' : '#4CAF50', opacity: 0.3, borderRadius: 10 }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section id="features" style={{ padding: '100px 5%', background: '#f8fafc', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: '#1a1a2e' }}>Más claro que el agua</h2>
          <p style={{ color: '#64748b', fontSize: 16, fontWeight: 500, marginTop: 12, marginBottom: 64 }}>Deja que la herramienta haga la matemática difícil. Tú enfócate en vender.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {[
              { icon: <Activity color="white" size={20} />, bg: '#4CAF50', title: 'Utilidad Neta REAL', desc: 'No te mientas con ventas brutas. Pixora resta automáticamente costos de producto, fletes, devoluciones y publicidad.' },
              { icon: <ShieldCheck color="white" size={20} />, bg: '#3b82f6', title: 'Detector de Novedades', desc: 'Identifica pedidos estancados, novedades de entrega y devoluciones en tiempo real antes de que afecten tu caja.' },
              { icon: <Calculator color="white" size={20} />, bg: '#8b5cf6', title: 'Calculadora de Precios', desc: 'Calcula tu precio ideal considerando margen de error por devoluciones y CPA. Nunca más vendas a pérdida.' },
              { icon: <Sparkles color="white" size={20} />, bg: '#22c55e', title: 'Acceso en la Nube', desc: 'Revisa tus números desde tu celular o PC. Todo sincronizado y seguro bajo una infraestructura de alta disponibilidad.' },
              { icon: <ArrowRight color="white" size={20} />, bg: '#f59e0b', title: 'Auditor de Transportadoras', desc: '¿Servientrega o Interrapidísimo? Pixora te dice con datos qué transportadora está entregando mejor.' },
              { icon: <History color="white" size={20} />, bg: '#64748b', title: 'Diario de Pauta', desc: 'Lleva el control manual o automático de tu gasto diario en Ads y compáralo con tus ventas reales netas.' }
            ].map((f, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: 28,
                padding: 32,
                border: '1px solid #efeff5',
                textAlign: 'left',
                display: 'flex',
                gap: 20
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: '#1a1a2e', marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inside Look Section */}
      <section style={{ padding: '100px 5%', background: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: '#1a1a2e', marginBottom: 64 }}>Así se ve por dentro</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 40 }}>
            <div style={{ background: '#f8fafc', borderRadius: 32, padding: 32, textAlign: 'left', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'white', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📊</div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900 }}>Tablero Principal</h3>
                  <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Tu centro de comando. Ve de un vistazo la utilidad neta.</p>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 20, height: 300, border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', padding: 20 }}>
                <div style={{ width: '100%', height: '100%', background: '#f8fafc', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, padding: 15 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1, height: 60, background: 'white', borderRadius: 8, border: '1px solid #eee' }}></div>
                    <div style={{ flex: 1, height: 60, background: 'white', borderRadius: 8, border: '1px solid #eee' }}></div>
                    <div style={{ flex: 1, height: 60, background: 'white', borderRadius: 8, border: '1px solid #eee' }}></div>
                  </div>
                  <div style={{ flex: 1, background: 'white', borderRadius: 8, border: '1px solid #eee' }}></div>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 32, padding: 32, textAlign: 'left', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'white', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900 }}>Informe por Productos</h3>
                  <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Descubre qué producto es realmente rentable.</p>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 20, height: 300, border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', padding: 20 }}>
                <div style={{ width: '100%', height: '100%', background: '#f8fafc', borderRadius: 12, padding: 15 }}>
                  <div style={{ height: 20, width: '40%', background: '#4CAF50', opacity: 0.1, borderRadius: 4, marginBottom: 15 }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...Array(5)].map((_, j) => (
                      <div key={j} style={{ height: 32, background: 'white', borderRadius: 6, border: '1px solid #eee', display: 'flex', alignItems: 'center', padding: '0 10px', justifyContent: 'space-between' }}>
                        <div style={{ width: 80, height: 8, background: '#eee', borderRadius: 4 }}></div>
                        <div style={{ width: 40, height: 8, background: '#4CAF50', opacity: 0.2, borderRadius: 4 }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section style={{ padding: '100px 5%', background: '#f8fafc', textAlign: 'center' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#1a1a2e', marginBottom: 64 }}>¿Por qué Pixora?</h2>

          <div style={{ background: 'white', borderRadius: 32, border: '1px solid #efeff5', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '24px 32px', fontSize: 13, color: '#64748b', fontWeight: 700 }}>CARACTERÍSTICAS</th>
                  <th style={{ padding: '24px 32px', fontSize: 13, color: '#64748b', fontWeight: 700 }}>EXCEL TRADICIONAL</th>
                  <th style={{ padding: '24px 32px', fontSize: 13, color: '#64748b', fontWeight: 700 }}>SOFTWARE COSTOSO</th>
                  <th style={{ padding: '24px 32px', fontSize: 15, color: '#4CAF50', fontWeight: 900, background: '#f0fdf4' }}>PIXORA AI</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Facilidad de uso', excel: '❌ Difícil', soft: 'Regular', pixora: '✅ Muy intuitivo' },
                  { feature: 'Cálculo de Utilidad Neta', excel: 'Manual / Errores', soft: '✅', pixora: '⚡ Automático' },
                  { feature: 'Precio Mensual', excel: 'Gratis (lento)', soft: '$50 - $100 USD', pixora: '$26 USD' },
                  { feature: 'Trazabilidad de Guías', excel: '❌', soft: '✅', pixora: '✅ Detallada' },
                  { feature: 'Análisis IA', excel: '❌', pixora: '🔥 Incluido' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '20px 32px', fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{row.feature}</td>
                    <td style={{ padding: '20px 32px', fontSize: 14, color: '#94a3b8' }}>{row.excel}</td>
                    <td style={{ padding: '20px 32px', fontSize: 14, color: '#94a3b8' }}>{row.soft}</td>
                    <td style={{ padding: '20px 32px', fontSize: 14, fontWeight: 800, color: '#166534', background: '#f0fdf4' }}>{row.pixora}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '100px 5%', background: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#1a1a2e', marginBottom: 12 }}>Lo que dicen nuestros <span style={{ color: '#4CAF50' }}>Usuarios</span></h2>
          <p style={{ color: '#64748b', fontSize: 16, fontWeight: 500, marginBottom: 64 }}>Dropshippers de todo el país que han mejorado su operación con Pixora</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            {[
              { name: "Andrés M.", city: "Bogotá", text: "Antes no sabía si realmente estaba ganando dinero después de fletes. Con Pixora ahora tengo el control centavo a centavo." },
              { name: "Paola R.", city: "Medellín", text: "El análisis de IA para productos me ahorra horas de trabajo. Ahora lanzo campañas con mucha más confianza." },
              { name: "Carlos T.", city: "Cali", text: "La mejor inversión para mi tienda. El diario de pauta me permitió detectar que estaba quemando plata en TikTok." }
            ].map((t, i) => (
              <div key={i} style={{ padding: 40, borderRadius: 32, background: '#f8fafc', border: '1px solid #efeff5', textAlign: 'left' }}>
                <p style={{ fontSize: 16, color: '#1a1a2e', fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 50, background: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section (Media 3) */}
      <section id="pricing" style={{ padding: '100px 5%', background: '#f8fafc', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span style={{ color: '#4CAF50', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Planes a tu medida</span>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#1a1a2e', marginTop: 12, marginBottom: 64 }}>Invierte en el futuro de tu rentabilidad</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            {[
              { title: "Plan Mensual", price: "26", period: "mes", desc: "Ideal para tiendas que están empezando a organizar su operación.", btn: "Empezar Mensual", popular: false },
              { title: "Plan Trimestral", price: "69", period: "trimestre", desc: "El balance perfecto entre ahorro y flujo de caja operativo.", btn: "Ahorrar 15%", popular: true, tag: "RECOMENDADO" },
              { title: "Plan Anual", price: "240", period: "año", desc: "Para dueños de negocio que juegan a largo plazo. Ahorra 2 meses.", btn: "Obtener 2 Meses Gratis", popular: false }
            ].map((p, i) => (
              <div key={i} style={{
                background: 'white',
                padding: 48,
                borderRadius: 40,
                border: p.popular ? '2px solid #4CAF50' : '1px solid #efeff5',
                boxShadow: p.popular ? '0 30px 60px rgba(76, 175, 80, 0.1)' : '0 10px 40px rgba(0,0,0,0.02)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left'
              }}>
                {p.popular && (
                  <div style={{ position: 'absolute', top: 24, right: 24, background: '#4CAF50', color: 'white', fontSize: 10, fontWeight: 900, padding: '4px 12px', borderRadius: 30 }}>{p.tag}</div>
                )}
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a2e', marginBottom: 12 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginBottom: 32, lineHeight: 1.5 }}>{p.desc}</p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 40 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#94a3b8' }}>$</span>
                  <span style={{ fontSize: 48, fontWeight: 950, color: '#1a1a2e' }}>{p.price}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>USD/{p.period}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48, flex: 1 }}>
                  {["Auditoría Ilimitada", "Análisis de Ganadores IA", "Tablero de Utilidad Real", "Soporte Prioritario"].map((feat, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                      <Activity size={14} color="#4CAF50" /> {feat}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleLoginClick}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 14,
                    border: 'none',
                    background: p.popular ? '#4CAF50' : '#1a1a2e',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {p.btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '64px 5%', borderTop: '1px solid #f1f5f9', textAlign: 'center', background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#4CAF50', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity color="white" size={18} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em' }}>PIXORA</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>
          © 2026 Pixora AI. Todos los derechos reservados. <br />
          Hecho para emprendedores que no se conforman con el "creo que gané".
        </p>
      </footer>

      <style jsx global>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
    </div>
  )
}
