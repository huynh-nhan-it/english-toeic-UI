import { useState, useEffect } from 'react'
import {
  Cloud,
  Lock,
  Mail,
  LogOut,
  Check,
  Save,
  AlertTriangle,
  Trash2,
  Key,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import type { CloudConfig } from '../lib/toeic'
import { CustomDialog } from './CustomDialog'
import { useTheme } from './ThemeContext'

type SettingsTabProps = {
  cloudConfig: CloudConfig
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string) => Promise<void>
  onLoginWithGoogle?: (idToken: string) => Promise<void>
  onLogout: () => void
  onSaveCloudConfig: (projectId: string, apiKey: string, googleClientId: string, enabled: boolean) => void
  onClearData: () => void
  geminiApiKey?: string
  onSaveGeminiApiKey: (key: string) => void
  leitnerIntervals?: number[]
  onUpdateLeitnerIntervals: (intervals: number[]) => void
  onManualSync?: () => Promise<void>
}

export function SettingsTab({
  cloudConfig,
  onLogin,
  onRegister,
  onLoginWithGoogle,
  onLogout,
  onSaveCloudConfig,
  onClearData,
  geminiApiKey = '',
  onSaveGeminiApiKey,
  leitnerIntervals,
  onUpdateLeitnerIntervals,
  onManualSync
}: SettingsTabProps) {
  const { theme } = useTheme()
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  // Advanced Firebase Config State
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [projectId, setProjectId] = useState(cloudConfig.projectId)
  const [firebaseApiKey, setFirebaseApiKey] = useState(cloudConfig.apiKey)
  const [googleClientId, setGoogleClientId] = useState(cloudConfig.googleClientId || '')
  const [enabled, setEnabled] = useState(cloudConfig.enabled)

  // Custom Dialog State
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean
    message: string
    type: 'alert' | 'confirm'
    onConfirm: () => void
    variant?: 'info' | 'warning' | 'danger'
  }>({
    isOpen: false,
    message: '',
    type: 'alert',
    onConfirm: () => {},
    variant: 'info'
  })

  const triggerAlert = (message: string, onConfirm?: () => void) => {
    setCustomDialog({
      isOpen: true,
      message,
      type: 'alert',
      variant: 'info',
      onConfirm: () => {
        onConfirm?.()
        setCustomDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const triggerConfirm = (message: string, onConfirm: () => void, variant: 'warning' | 'danger' = 'warning') => {
    setCustomDialog({
      isOpen: true,
      message,
      type: 'confirm',
      variant,
      onConfirm: () => {
        onConfirm()
        setCustomDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Gemini API Key State
  const [geminiKey, setGeminiKey] = useState(geminiApiKey)
  const [showGeminiKey, setShowGeminiKey] = useState(false)

  // Manual Sync State
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  // Leitner Interval Inputs (converts ms to mins/days)
  const defaultIntervals = [
    60 * 1000, // Box 1: 1 min
    10 * 60 * 1000, // Box 2: 10 min
    24 * 60 * 60 * 1000, // Box 3: 1 day
    4 * 24 * 60 * 60 * 1000, // Box 4: 4 days
    10 * 24 * 60 * 60 * 1000, // Box 5: 10 days
  ]

  const currentIntervals = leitnerIntervals || defaultIntervals

  // Local states for Leitner inputs
  const [box1, setBox1] = useState(Math.round(currentIntervals[0] / (60 * 1000)))
  const [box2, setBox2] = useState(Math.round(currentIntervals[1] / (60 * 1000)))
  const [box3, setBox3] = useState(Math.round(currentIntervals[2] / (24 * 60 * 60 * 1000)))
  const [box4, setBox4] = useState(Math.round(currentIntervals[3] / (24 * 60 * 60 * 1000)))
  const [box5, setBox5] = useState(Math.round(currentIntervals[4] / (24 * 60 * 60 * 1000)))

  // Sync state if prop changes
  useEffect(() => {
    setGeminiKey(geminiApiKey)
  }, [geminiApiKey])

  useEffect(() => {
    if (leitnerIntervals && leitnerIntervals.length === 5) {
      setBox1(Math.round(leitnerIntervals[0] / (60 * 1000)))
      setBox2(Math.round(leitnerIntervals[1] / (60 * 1000)))
      setBox3(Math.round(leitnerIntervals[2] / (24 * 60 * 60 * 1000)))
      setBox4(Math.round(leitnerIntervals[3] / (24 * 60 * 60 * 1000)))
      setBox5(Math.round(leitnerIntervals[4] / (24 * 60 * 60 * 1000)))
    }
  }, [leitnerIntervals])

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
        setAuthSuccess('Đăng nhập thành công! Tiến trình học tập đã được đồng bộ.')
      } else {
        await onRegister(cleanEmail, cleanPassword)
        setAuthSuccess('Đăng ký tài khoản thành công! Dữ liệu đã được lưu trữ trực tuyến.')
      }
      setEmail('')
      setPassword('')
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Đã xảy ra lỗi kết nối.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAdvanced = () => {
    onSaveCloudConfig(projectId.trim(), firebaseApiKey.trim(), googleClientId.trim(), enabled)
    triggerAlert('Đã cập nhật cấu hình Firebase nâng cao thành công!')
  }

  // Khởi tạo Google Identity Services (GIS) để đăng nhập bằng Google
  useEffect(() => {
    const initGoogleGis = () => {
      const clientId = cloudConfig.googleClientId?.trim()
      const google = (window as any).google
      if (!clientId || !google) return

      try {
        google.accounts.id.initialize({
          client_id: clientId,
          use_fedcm: true,
          callback: async (response: any) => {
            setAuthError('')
            setAuthSuccess('')
            setIsLoading(true)
            try {
              if (onLoginWithGoogle) {
                await onLoginWithGoogle(response.credential)
                setAuthSuccess('Đăng nhập bằng Google thành công! Tiến trình học tập đã được đồng bộ.')
              }
            } catch (err: unknown) {
              setAuthError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại.')
            } finally {
              setIsLoading(false)
            }
          },
        })

        const btnContainer = document.getElementById('google-signin-btn-real')
        if (btnContainer) {
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

  const handleSaveGeminiKey = () => {
    onSaveGeminiApiKey(geminiKey.trim())
    triggerAlert('Đã lưu cấu hình khóa Gemini API Key thành công!')
  }

  const handleSaveLeitnerIntervals = () => {
    if (box1 <= 0 || box2 <= 0 || box3 <= 0 || box4 <= 0 || box5 <= 0) {
      triggerAlert('Vui lòng nhập khoảng thời gian lớn hơn 0.')
      return
    }

    // Convert back to ms
    const newIntervals = [
      box1 * 60 * 1000,
      box2 * 60 * 1000,
      box3 * 24 * 60 * 60 * 1000,
      box4 * 24 * 60 * 60 * 1000,
      box5 * 24 * 60 * 60 * 1000,
    ]

    onUpdateLeitnerIntervals(newIntervals)
    triggerAlert('Đã lưu cấu hình khoảng thời gian ôn tập Leitner mới thành công!')
  }

  const handleManualSyncNow = async () => {
    if (!onManualSync) return
    setIsSyncing(true)
    setSyncMessage('Đang đồng bộ hóa hai chiều với máy chủ Firebase...')
    try {
      await onManualSync()
      setSyncMessage('Đồng bộ thành công! Dữ liệu của bạn đã được cập nhật mới nhất.')
      setTimeout(() => setSyncMessage(''), 4000)
    } catch (err: any) {
      setSyncMessage(`Đồng bộ thất bại: ${err.message || 'Lỗi kết nối mạng'}`)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      {/* Tab Title */}
      <div className="border-b border-slate-200/80 dark:border-zinc-800/80 px-4 py-4 sm:px-6 shrink-0 bg-transparent">
        <h2 className="text-base font-black text-slate-800 dark:text-white">Cài đặt Hệ thống (Settings)</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Quản lý tài khoản đồng bộ đám mây, cấu hình Leitner tùy biến và tích hợp Gemini AI.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 bg-slate-50/30 dark:bg-transparent">
        <div className="mx-auto max-w-xl space-y-6">
          
          {/* Cloud Storage State Card */}
          {cloudConfig.user ? (
            /* Logged In Status Card */
            <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-5 border border-indigo-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  <Cloud className="size-5 text-violet-500 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
                  Đang đồng bộ trực tuyến
                </div>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 bg-slate-100/50 dark:bg-zinc-950/40 p-3 rounded-2xl border border-slate-200/5">
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider">Tài khoản kết nối</p>
                  <p className="text-xs font-black text-slate-850 dark:text-zinc-200 line-clamp-1">{cloudConfig.user.email}</p>
                </div>

                <div className="space-y-1 bg-slate-100/50 dark:bg-zinc-950/40 p-3 rounded-2xl border border-slate-200/5">
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider">Trạng thái đồng bộ</p>
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">Tự động (Real-time)</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                Tất cả tiến trình ôn tập của bạn (đáp án, từ vựng ghi chú, flashcards) đang được tự động sao lưu trực tuyến liên tục dưới tài khoản này.
              </p>

              {syncMessage && (
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {syncMessage}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-zinc-800 pt-4">
                {onManualSync && (
                  <button
                    onClick={handleManualSyncNow}
                    disabled={isSyncing}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-4 text-xs font-black text-indigo-600 dark:text-violet-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    Đồng bộ hóa ngay
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-200/60 dark:border-rose-950/40 bg-rose-50/50 dark:bg-rose-500/10 px-4 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out / Login-Register Form */
            <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-5 border border-slate-200/10">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3.5">
                <div className="flex items-center gap-2.5 text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  <Cloud className="size-5 text-indigo-500 dark:text-violet-400" />
                  Đồng bộ Đám mây
                </div>
                <div className="flex rounded-lg bg-slate-100 dark:bg-zinc-900 p-0.5 border border-slate-200/40 dark:border-zinc-800/40">
                  <button
                    onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                    className={`px-3.5 py-1 text-[10px] font-black rounded-md transition cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
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
                  ? 'Đăng nhập để khôi phục tiến trình ôn tập của bạn từ đám mây và đồng bộ trên thiết bị này.'
                  : 'Tạo tài khoản miễn phí để lưu trữ trực tuyến tiến trình học tập của bạn trọn đời.'}
              </p>

              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-450 dark:text-zinc-500 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="Địa chỉ Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/55 dark:bg-zinc-950 px-3 pl-11 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-450 dark:text-zinc-500 pointer-events-none" />
                    <input
                      type="password"
                      placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                  className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-650 dark:from-indigo-500 dark:to-violet-500 text-white text-xs font-black tracking-wider uppercase transition hover:scale-[1.02] active:scale-[0.97] cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  {authMode === 'login' ? 'Đăng Nhập Ngay' : 'Đăng Ký Tài Khoản'}
                </button>
              </form>

              {/* Nút đăng nhập Google tích hợp trực tiếp */}
              {cloudConfig.googleClientId ? (
                <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-100 dark:border-zinc-800/60 pt-4">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Hoặc đăng nhập nhanh</span>
                  <div 
                    id="google-signin-btn-real" 
                    style={{ colorScheme: 'light' }}
                    className="w-full flex justify-center min-h-[44px]"
                  ></div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-100 dark:border-zinc-800/60 pt-4">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Hoặc đăng nhập nhanh</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('Để đăng nhập bằng Google, vui lòng cấu hình "Google Client ID" và "API Key Firebase" thật của bạn trong phần Cấu hình nâng cao phía dưới.')
                      setShowAdvanced(true)
                      setTimeout(() => {
                        document.getElementById('google-client-id-label')?.scrollIntoView({ behavior: 'smooth' })
                      }, 100)
                    }}
                    className="w-full inline-flex h-11 items-center justify-center gap-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs font-black text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-sm"
                  >
                    <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Đăng nhập bằng Google
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Gemini AI API Key Config Card */}
          <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4 border border-slate-200/10">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                <Sparkles className="size-4.5 text-violet-500 dark:text-cyan-400 fill-violet-500/10" />
                Cấu hình Gemini AI (Part 7)
              </div>
              <span className="text-[9px] bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 font-black tracking-widest uppercase px-2 py-0.5 rounded-lg">
                Free model
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              Nhập API Key từ **Google AI Studio (Gemini 2.5-Flash)** để tự động tạo đề thi đọc hiểu chuyên sâu bám sát từ vựng cá nhân, tích hợp Google Search Grounding tìm kiếm thông tin 2026.
            </p>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  placeholder="Nhập khóa API Gemini (AIzaSy...)"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/55 dark:bg-zinc-950 px-4 pr-12 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showGeminiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-black text-indigo-600 dark:text-violet-450 hover:underline tracking-wide"
                >
                  Lấy API Key Gemini miễn phí tại đây →
                </a>
                
                <button
                  onClick={handleSaveGeminiKey}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 px-4 text-xs font-black text-slate-850 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Save className="size-4" />
                  Lưu API Key
                </button>
              </div>
            </div>
          </div>

          {/* Leitner Interval Customization Card */}
          <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4 border border-slate-200/10">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-3">
              <Sliders className="size-4.5 text-indigo-600 dark:text-violet-400" />
              Tùy biến Khoảng thời gian Leitner
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              Thiết lập chu kỳ lặp lại ngắt quãng để các từ vựng tự động xuất hiện lại tại Tab **Cần ôn** tương ứng với từng Hộp ghi nhớ.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <label className="block space-y-1 bg-slate-50/50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-slate-200/5">
                <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider block">Hộp 1 (Phút)</span>
                <input
                  type="number"
                  min="1"
                  value={box1}
                  onChange={(e) => setBox1(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-bold text-slate-850 dark:text-white"
                />
              </label>

              <label className="block space-y-1 bg-slate-50/50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-slate-200/5">
                <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider block">Hộp 2 (Phút)</span>
                <input
                  type="number"
                  min="1"
                  value={box2}
                  onChange={(e) => setBox2(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-bold text-slate-850 dark:text-white"
                />
              </label>

              <label className="block space-y-1 bg-slate-50/50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-slate-200/5">
                <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider block">Hộp 3 (Ngày)</span>
                <input
                  type="number"
                  min="1"
                  value={box3}
                  onChange={(e) => setBox3(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-bold text-slate-850 dark:text-white"
                />
              </label>

              <label className="block space-y-1 bg-slate-50/50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-slate-200/5">
                <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider block">Hộp 4 (Ngày)</span>
                <input
                  type="number"
                  min="1"
                  value={box4}
                  onChange={(e) => setBox4(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-bold text-slate-850 dark:text-white"
                />
              </label>

              <label className="block space-y-1 bg-slate-50/50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-slate-200/5 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider block">Hộp 5 (Ngày)</span>
                <input
                  type="number"
                  min="1"
                  value={box5}
                  onChange={(e) => setBox5(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-bold text-slate-850 dark:text-white"
                />
              </label>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSaveLeitnerIntervals}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 px-4 text-xs font-black text-slate-850 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Save className="size-4" />
                Lưu cấu hình thời gian
              </button>
            </div>
          </div>

          {/* Advanced Firebase Configuration expansion panel */}
          <div className="glass-panel rounded-3xl p-5 shadow-sm space-y-4 border border-slate-200/10">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-400 uppercase tracking-wider cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Key className="size-4 text-slate-400 dark:text-zinc-500" />
                Cấu hình Firebase nâng cao
              </div>
              {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-zinc-800 animate-fade-in">
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed">
                  Mặc định, ứng dụng sử dụng cơ sở dữ liệu chung được cấu hình sẵn. Bạn có thể tự điền cấu hình Firebase của mình ở dưới để lưu trữ dữ liệu hoàn toàn độc lập và bảo mật.
                </p>

                <div className="space-y-3">
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">Firebase Project ID</span>
                    <input
                      type="text"
                      placeholder="default-project-id"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">Firebase Web API Key</span>
                    <input
                      type="password"
                      placeholder="AIzaSyD..."
                      value={firebaseApiKey}
                      onChange={(e) => setFirebaseApiKey(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500"
                    />
                  </label>

                  <label id="google-client-id-label" className="block space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">Google Client ID (cho Google Sign-In)</span>
                    <input
                      type="text"
                      placeholder="Google OAuth Client ID (123456-abcdef.apps.googleusercontent.com)"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-400 py-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      className="size-4 rounded-md accent-violet-600 dark:accent-violet-500 cursor-pointer"
                    />
                    Kích hoạt lưu trực tuyến thời gian thực
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveAdvanced}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 px-4 text-xs font-black text-slate-850 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Save className="size-4" />
                    Lưu cấu hình
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="rounded-3xl border border-rose-200/50 dark:border-rose-950/20 bg-rose-500/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider select-none">
              <AlertTriangle className="size-4.5" />
              Khu vực nguy hiểm
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5 text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Xóa dữ liệu cục bộ</span>
                <p className="text-[10px] text-slate-400 dark:text-zinc-400 leading-relaxed max-w-sm">
                  Thao tác này xóa sạch các đáp án đề thi và các ghi chú lưu trữ cục bộ trên trình duyệt này.
                </p>
              </div>
              <button
                onClick={() => {
                  triggerConfirm(
                    'CẢNH BÁO: Thao tác này sẽ xóa toàn bộ tiến trình học tập của bạn trên thiết bị này. Bạn có chắc chắn muốn tiếp tục?',
                    () => {
                      onClearData()
                      triggerAlert('Đã xóa dữ liệu cục bộ thành công! Trang web sẽ tải lại ngay bây giờ.', () => {
                        window.location.reload()
                      })
                    },
                    'danger'
                  )
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-rose-650 hover:bg-rose-700 text-white px-4 text-xs font-bold border border-transparent transition spring-transition hover:scale-[1.03] active:scale-[0.96] shrink-0 cursor-pointer"
              >
                <Trash2 className="size-4" />
                Xóa toàn bộ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Alert/Confirm Modal Dialog */}
      <CustomDialog
        isOpen={customDialog.isOpen}
        message={customDialog.message}
        type={customDialog.type}
        variant={customDialog.variant}
        onConfirm={customDialog.onConfirm}
        onCancel={() => setCustomDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
