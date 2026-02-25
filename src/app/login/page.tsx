'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
    Activity, Eye, EyeOff,
    AlertCircle, Sparkles
} from 'lucide-react'

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) {
                    setError(error.message)
                    setLoading(false)
                } else {
                    router.push('/dashboard')
                    router.refresh()
                }
            } else {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
                    },
                })
                if (error) {
                    if (error.message.includes('already registered')) {
                        setError('Este correo ya está registrado. Por favor, inicia sesión.')
                        setIsLogin(true) // Switch to login tab
                    } else {
                        setError(error.message)
                    }
                } else if (data.user && data.session === null) {
                    setMessage('Cuenta creada. Revisa tu email para confirmar y poder entrar.')
                } else {
                    router.push('/dashboard')
                    router.refresh()
                }
                setLoading(false)
            }
        } catch (err) {
            setError('Ocurrió un error inesperado al conectar con el servidor.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f4f7fa] font-sans text-[#1e293b]">
            <div className="w-full max-w-[440px] bg-white rounded-[48px] shadow-[0_30px_100px_rgba(0,0,0,0.08)] px-8 py-32 flex flex-col items-center">

                {/* Visual Header */}
                <div className="mb-12 flex flex-col items-center">
                    <div className="mb-4">
                        <div className="relative w-20 h-16 flex items-center justify-center">
                            <div className="absolute inset-0 bg-[#4CAF50] blur-xl opacity-10 rounded-full scale-125"></div>
                            <div className="relative z-10 text-[#4CAF50]">
                                <Activity size={52} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-[28px] font-[900] tracking-tight">Pix</span>
                        <span className="text-[28px] font-[900] text-[#4CAF50] tracking-tight">ora</span>
                        <span className="text-[10px] font-bold text-[#94a3b8] mt-1.5 ml-1">v2.0</span>
                    </div>

                    <p className="text-[#94a3b8] text-[13px] font-semibold text-center leading-relaxed max-w-[280px]">
                        Pana mío, deja de perder plata y empieza a mejorar tu operación desde hoy
                    </p>
                </div>

                {/* Segmented Control - Fixed width for LogisKei look */}
                <div className="w-full max-w-[340px] bg-[#f1f5f9] p-1 rounded-[20px] flex mb-8">
                    <button
                        onClick={() => setIsLogin(true)}
                        onMouseDown={(e) => e.preventDefault()}
                        className={`flex-1 py-2.5 text-[13px] font-black rounded-[16px] transition-all duration-300 ${isLogin ? 'bg-white text-[#1e293b] shadow-sm' : 'text-[#94a3b8] hover:text-[#64748b]'}`}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        onMouseDown={(e) => e.preventDefault()}
                        className={`flex-1 py-2.5 text-[13px] font-black rounded-[16px] transition-all duration-300 ${!isLogin ? 'bg-white text-[#1e293b] shadow-sm' : 'text-[#94a3b8] hover:text-[#64748b]'}`}
                    >
                        Crear Cuenta
                    </button>
                </div>

                <form onSubmit={handleAuth} className="w-full max-w-[340px] flex flex-col gap-5">
                    {!isLogin && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-[#64748b] ml-1">Nombre Completo</label>
                            <input
                                type="text"
                                placeholder="Escribe tu nombre"
                                className="w-full h-12 px-5 bg-white border border-[#e2e8f0] rounded-xl text-[14px] font-bold outline-none transition-all placeholder:text-[#cbd5e1] focus:border-[#4CAF50]"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#64748b] ml-1">Correo</label>
                        <input
                            type="email"
                            placeholder="usuario@pixora.com"
                            className="w-full h-12 px-5 bg-white border border-[#e2e8f0] rounded-xl text-[14px] font-[800] outline-none transition-all placeholder:text-[#cbd5e1] focus:border-[#4CAF50]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#64748b] ml-1">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="........"
                                className="w-full h-12 px-5 bg-white border border-[#e2e8f0] rounded-xl text-[14px] font-[800] outline-none transition-all placeholder:text-[#cbd5e1] focus:border-[#4CAF50]"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#cbd5e1] hover:text-[#4CAF50]"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <div className="text-[11px] font-bold">{error}</div>
                        </div>
                    )}

                    {message && (
                        <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center gap-2 text-[#4CAF50]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <div className="text-[11px] font-bold">{message}</div>
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full h-[50px] mt-2 bg-[#4CAF50] text-white rounded-[16px] font-black text-[15px] shadow-[0_8px_20px_rgba(76,175,80,0.25)] hover:shadow-[0_12px_24px_rgba(76,175,80,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="tracking-wide">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                        )}
                    </button>
                </form>

                {isLogin && (
                    <button type="button" className="mt-6 text-[11px] font-bold text-[#94a3b8] hover:text-[#4CAF50] transition-colors uppercase tracking-widest">
                        ¿Olvidaste tu contraseña?
                    </button>
                )}
            </div>

            {/* Copyright Style from Reference */}
            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none opacity-20 capitalize">
                <p className="text-[11px] font-black tracking-[0.2em] text-[#1e293b]">© 2026 Pixora operating software</p>
            </div>
        </div>
    )
}
