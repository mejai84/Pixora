'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, Lock, LogIn, Chrome, AlertCircle, Sparkles, UserPlus, Apple, User, Eye, EyeOff } from 'lucide-react'

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
                    router.push('/')
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
                    setError(error.message)
                } else if (data.user && data.session === null) {
                    setMessage('Revisa tu email para confirmar tu cuenta.')
                } else {
                    router.push('/')
                    router.refresh()
                }
                setLoading(false)
            }
        } catch (err) {
            setError('Ocurrió un error inesperado')
            setLoading(false)
        }
    }

    const handleOAuth = async (provider: 'google' | 'azure' | 'apple') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
                }
            })
            if (error) setError(error.message)
        } catch (err) {
            setError('Error al intentar iniciar sesión con ' + provider)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f0f0f7] relative overflow-hidden">
            {/* Abstract Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/40 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-[460px] animate-fade-in shadow-2xl glass border border-white/20 rounded-2xl overflow-hidden flex flex-col">
                <div className="mac-titlebar h-10 px-6">
                    <div className="mac-traffic-lights">
                        <div className="mac-dot red w-3 h-3"></div>
                        <div className="mac-dot yellow w-3 h-3"></div>
                        <div className="mac-dot green w-3 h-3"></div>
                    </div>
                    <div className="mac-window-title text-[11px]">Pixora — {isLogin ? 'Login' : 'Registro'}</div>
                </div>

                <div className="px-12 py-10 sm:px-14 sm:py-12 flex flex-col gap-8">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                            <Sparkles size={24} color="white" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <h1 className="text-2xl font-bold tracking-tight gradient-text">
                                {isLogin ? '¡Hola de nuevo!' : 'Crea tu cuenta'}
                            </h1>
                            <p className="text-[13px] text-muted">
                                {isLogin
                                    ? 'Ingresa tus credenciales para continuar'
                                    : 'Comienza a analizar productos con IA'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleAuth} className="flex flex-col gap-3.5">
                        {!isLogin && (
                            <div className="flex flex-col gap-1.5 animate-fade-in">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted/80 ml-1">Nombre Completo</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-purple-600 transition-colors z-10" />
                                    <input
                                        type="text"
                                        placeholder="Tu nombre"
                                        className="input-field h-11 bg-white/50"
                                        style={{ paddingLeft: '44px' }}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted/80 ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-purple-600 transition-colors z-10" />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="input-field h-11 bg-white/50"
                                    style={{ paddingLeft: '44px' }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted/80">Contraseña</label>
                                {isLogin && (
                                    <button type="button" className="text-[10px] font-medium text-purple-600 hover:text-purple-700 hover:underline">
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                )}
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-purple-600 transition-colors z-10" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="input-field h-11 bg-white/50 w-full"
                                    style={{ paddingLeft: '44px', paddingRight: '44px' }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-purple-600 transition-colors z-10 p-1"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-100 flex items-start gap-3 text-red-600 animate-fade-in mt-2 shadow-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div className="text-xs font-medium leading-relaxed">{error}</div>
                            </div>
                        )}

                        {message && (
                            <div className="p-3 rounded-xl bg-green-50/80 backdrop-blur-sm border border-green-100 flex items-start gap-3 text-green-600 animate-fade-in mt-2 shadow-sm">
                                <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div className="text-xs font-medium leading-relaxed">{message}</div>
                            </div>
                        )}

                        <button
                            disabled={loading}
                            className="btn-primary w-full h-12 flex justify-center text-sm font-semibold mt-4 shadow-lg shadow-purple-500/10"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                                    {isLogin ? <LogIn className="w-4 h-4 ml-1" /> : <UserPlus className="w-4 h-4 ml-1" />}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-100"></span>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted/40">
                            <span className="bg-[#fcfcff] px-3">O continúa con</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <button
                            type="button"
                            className="btn-secondary h-11 justify-center text-xs font-semibold hover:bg-white/80 transition-all border-gray-100 shadow-sm"
                            onClick={() => handleOAuth('google')}
                        >
                            <Chrome className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            className="btn-secondary h-11 justify-center text-xs font-semibold hover:bg-white/80 transition-all border-gray-100 shadow-sm"
                            onClick={() => handleOAuth('azure')}
                        >
                            <Mail className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            className="btn-secondary h-11 justify-center text-xs font-semibold hover:bg-white/80 transition-all border-gray-100 shadow-sm"
                            onClick={() => handleOAuth('apple')}
                        >
                            <Apple className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-center text-xs text-muted font-medium pt-2">
                        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
                            className="font-bold text-purple-600 hover:text-purple-700 hover:underline transition-all"
                        >
                            {isLogin ? 'Regístrate gratis' : 'Inicia sesión aquí'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
