import { useState, useEffect } from 'react'
import { BookOpenCheck, Cloud, Lock, Mail, Moon, Sun } from 'lucide-react'
import type { CloudConfig } from '../../types'
import { useTheme } from '../ThemeContext'

interface GoogleGis {
  accounts: {
    id: {
      initialize: (config: { client_id: string; use_fedcm?: boolean; callback: (resp: { credential: string }) => Promise<void> }) => void
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
    }
  }
}

type AuthScreenProps = {
  cloudConfig: CloudConfig
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string) => Promise<void>
  onLoginWithGoogle?: (idToken: string) => Promise<void>
}

export function AuthScreen({
  cloudConfig,
  onLogin,
  onRegister,
  onLoginWithGoogle,
}: AuthScreenProps) {
  const { theme, toggleTheme } = useTheme()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthSuccess('')

    const cleanEmail = email.trim()
    const cleanPassword = password.trim()

    if (!cleanEmail || !cleanPassword) {
      setAuthError('Vui lòng điền đầy đủ Email và Mật khẩu.')
      return
    }

    if (cleanPassword.length < 6) {
      setAuthError('Mật khẩu phải chứa ít nhất 6 ký tự.')
      return
    }

    setIsLoading(true)
    try {
      if (authMode === 'login') {
        await onLogin(cleanEmail, cleanPassword)
        setAuthSuccess('Đăng nhập thành công! Đang tải tiến trình học tập...')
      } else {
        await onRegister(cleanEmail, cleanPassword)
        setAuthSuccess('Đăng ký thành công! Đang thiết lập không gian học tập...')
      }
      setEmail('')
      setPassword('')
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Đã xảy ra lỗi kết nối.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initGoogleGis = () => {
      const clientId = cloudConfig.googleClientId?.trim()
      const google = (window as unknown as { google?: GoogleGis }).google
      if (!clientId || !google || !onLoginWithGoogle) return

      try {
        google.accounts.id.initialize({
          client_id: clientId,
          use_fedcm: true,
          callback: async (response: { credential: string }) => {
            setAuthError('')
            setAuthSuccess('')
            setIsLoading(true)
            try {
              await onLoginWithGoogle(response.credential)
              setAuthSuccess('Đăng nhập bằng Google thành công!')
            } catch (err: unknown) {
              setAuthError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại.')
            } finally {
              setIsLoading(false)
            }
          },
        })

        const btnContainer = document.getElementById('google-signin-btn-auth')
        if (btnContainer) {
          btnContainer.innerHTML = ''
          google.accounts.id.renderButton(btnContainer, {
            theme: theme === 'dark' ? 'filled_black' : 'filled_blue',
            size: 'large',
            width: Math.min(400, Math.max(200, btnContainer.clientWidth || 280)),
            text: 'signin_with',
            shape: 'pill',
          })
        }
      } catch (e) {
        console.error('Lỗi khởi tạo Google GIS:', e)
      }
    }

    const timer = setTimeout(initGoogleGis, 500)
    return () => clearTimeout(timer)
  }, [cloudConfig.googleClientId, onLoginWithGoogle, theme])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-[#05050a] text-slate-800 dark:text-zinc-100 relative grid-bg px-4 py-8">
      <div className="aurora-bg hidden dark:block pointer-events-none" />

      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 z-20 inline-flex size-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0b0c16]/80 text-slate-600 dark:text-zinc-300 backdrop-blur-xl transition hover:scale-105 cursor-pointer"
        aria-label="Đổi giao diện sáng/tối"
      >
        {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
      </button>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Brand panel */}
          <div className="text-center lg:text-left space-y-6 px-2">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-cyan-400 text-white dark:text-zinc-950 shadow-lg shadow-indigo-500/25">
                <BookOpenCheck aria-hidden="true" className="size-6" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">TOEIC Progress</h1>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Bảng ôn & Sổ tay thông minh</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-tight">
                Ôn luyện TOEIC có đồng bộ đám mây
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto lg:mx-0">
                Đăng nhập để truy cập bảng trả lời 200 câu, flashcard Leitner, sổ tay từ vựng và trợ lý AI — dữ liệu được sao lưu an toàn trên mọi thiết bị.
              </p>
            </div>

            <ul className="hidden sm:grid grid-cols-1 gap-2.5 text-left max-w-md mx-auto lg:mx-0">
              {[
                'Luyện đề & ghi chú theo từng bộ đề riêng',
                'Flashcard Leitner với nhắc ôn thông minh',
                'Trợ lý AI Gemini hỗ trợ đọc hiểu & hội thoại',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-xs font-medium text-slate-600 dark:text-zinc-400 bg-white/50 dark:bg-zinc-900/30 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl px-3.5 py-2.5"
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-indigo-500 dark:bg-violet-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Auth card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/10 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2.5 text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                <Cloud className="size-5 text-indigo-500 dark:text-violet-400" />
                {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </div>
              <div className="flex rounded-lg bg-slate-100 dark:bg-zinc-900 p-0.5 border border-slate-200/40 dark:border-zinc-800/40">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess('') }}
                  className={`px-3.5 py-1 text-[10px] font-black rounded-md transition cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess('') }}
                  className={`px-3.5 py-1 text-[10px] font-black rounded-md transition cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Đăng ký
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              {authMode === 'login'
                ? 'Đăng nhập để khôi phục tiến trình ôn tập từ đám mây và tiếp tục học trên thiết bị này.'
                : 'Tạo tài khoản miễn phí để lưu trữ trực tuyến tiến trình học tập trọn đời.'}
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 dark:text-zinc-500 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="Địa chỉ Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="h-11 w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/55 dark:bg-zinc-950 px-3 pl-11 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 dark:text-zinc-500 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    className="h-11 w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/55 dark:bg-zinc-950 px-3 pl-11 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3.5 rounded-2xl border border-rose-200/50 dark:border-rose-950/20 bg-rose-500/5 text-[10px] font-bold leading-relaxed text-rose-600 dark:text-rose-400">
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div className="p-3.5 rounded-2xl border border-emerald-200/50 dark:border-emerald-950/20 bg-emerald-500/5 text-[10px] font-bold leading-relaxed text-emerald-600 dark:text-emerald-400">
                  {authSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 text-white text-xs font-black tracking-wider uppercase transition hover:scale-[1.02] active:scale-[0.97] cursor-pointer disabled:opacity-60 shadow-sm"
              >
                {isLoading ? 'Đang xử lý...' : authMode === 'login' ? 'Đăng Nhập Ngay' : 'Đăng Ký Tài Khoản'}
              </button>
            </form>

            {cloudConfig.googleClientId ? (
              <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-100 dark:border-zinc-800/60 pt-4">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Hoặc đăng nhập nhanh</span>
                <div
                  id="google-signin-btn-auth"
                  style={{ colorScheme: 'light' }}
                  className="w-full flex justify-center min-h-[44px]"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
