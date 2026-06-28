import { useState } from 'react'
import {
  Cloud,
  LogOut,
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
import type { CloudConfig } from '../types'
import { useToeicStore } from '../store/useToeicStore'
import { CustomDialog } from './CustomDialog'

type SettingsTabProps = {
  cloudConfig: CloudConfig
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
  onLogout,
  onSaveCloudConfig,
  onClearData,
  geminiApiKey = '',
  onSaveGeminiApiKey,
  leitnerIntervals,
  onUpdateLeitnerIntervals,
  onManualSync
}: SettingsTabProps) {
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

  const [prevGeminiApiKey, setPrevGeminiApiKey] = useState(geminiApiKey)
  if (geminiApiKey !== prevGeminiApiKey) {
    setPrevGeminiApiKey(geminiApiKey)
    setGeminiKey(geminiApiKey)
  }

  const [prevLeitnerIntervals, setPrevLeitnerIntervals] = useState(leitnerIntervals)
  if (leitnerIntervals !== prevLeitnerIntervals) {
    setPrevLeitnerIntervals(leitnerIntervals)
    if (leitnerIntervals && leitnerIntervals.length === 5) {
      setBox1(Math.round(leitnerIntervals[0] / (60 * 1000)))
      setBox2(Math.round(leitnerIntervals[1] / (60 * 1000)))
      setBox3(Math.round(leitnerIntervals[2] / (24 * 60 * 60 * 1000)))
      setBox4(Math.round(leitnerIntervals[3] / (24 * 60 * 60 * 1000)))
      setBox5(Math.round(leitnerIntervals[4] / (24 * 60 * 60 * 1000)))
    }
  }

  const handleSaveAdvanced = () => {
    onSaveCloudConfig(projectId.trim(), firebaseApiKey.trim(), googleClientId.trim(), enabled)
    useToeicStore.getState().showToast('Đã cập nhật cấu hình Firebase nâng cao thành công!', 'success', 'Đồng bộ đám mây')
  }

  const handleSaveGeminiKey = () => {
    onSaveGeminiApiKey(geminiKey.trim())
    useToeicStore.getState().showToast('Đã lưu cấu hình khóa Gemini API Key thành công!', 'success', 'Cấu hình AI')
  }

  const handleSaveLeitnerIntervals = () => {
    if (box1 <= 0 || box2 <= 0 || box3 <= 0 || box4 <= 0 || box5 <= 0) {
      useToeicStore.getState().showToast('Vui lòng nhập khoảng thời gian lớn hơn 0.', 'warning', 'Lỗi cấu hình')
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
    useToeicStore.getState().showToast('Đã lưu cấu hình khoảng thời gian ôn tập Leitner mới thành công!', 'success', 'Hệ thống Leitner')
  }

  const handleManualSyncNow = async () => {
    if (!onManualSync) return
    setIsSyncing(true)
    setSyncMessage('Đang đồng bộ hóa hai chiều với máy chủ Firebase...')
    try {
      await onManualSync()
      setSyncMessage('Đồng bộ thành công! Dữ liệu của bạn đã được cập nhật mới nhất.')
      setTimeout(() => setSyncMessage(''), 4000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối mạng'
      setSyncMessage(`Đồng bộ thất bại: ${msg}`)
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
                <p className="text-xs font-black text-slate-800 dark:text-zinc-200 line-clamp-1">{cloudConfig.user?.email}</p>
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
                  className="text-[10px] font-black text-indigo-600 dark:text-violet-500 hover:underline tracking-wide"
                >
                  Lấy API Key Gemini miễn phí tại đây →
                </a>
                
                <button
                  onClick={handleSaveGeminiKey}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 px-4 text-xs font-black text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">Hộp 1 (Phút)</span>
                <input
                  type="number"
                  min="1"
                  value={box1}
                  onChange={(e) => setBox1(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-bold text-slate-800 dark:text-white"
                />
              </label>

              <label className="block space-y-1 bg-slate-50/50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-slate-200/5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">Hộp 2 (Phút)</span>
                <input
                  type="number"
                  min="1"
                  value={box2}
                  onChange={(e) => setBox2(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-bold text-slate-800 dark:text-white"
                />
              </label>

              <label className="block space-y-1 bg-slate-50/50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-slate-200/5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">Hộp 3 (Ngày)</span>
                <input
                  type="number"
                  min="1"
                  value={box3}
                  onChange={(e) => setBox3(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-bold text-slate-800 dark:text-white"
                />
              </label>

              <label className="block space-y-1 bg-slate-50/50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-slate-200/5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">Hộp 4 (Ngày)</span>
                <input
                  type="number"
                  min="1"
                  value={box4}
                  onChange={(e) => setBox4(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-bold text-slate-800 dark:text-white"
                />
              </label>

              <label className="block space-y-1 bg-slate-50/50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-slate-200/5 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">Hộp 5 (Ngày)</span>
                <input
                  type="number"
                  min="1"
                  value={box5}
                  onChange={(e) => setBox5(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-bold text-slate-800 dark:text-white"
                />
              </label>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSaveLeitnerIntervals}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 px-4 text-xs font-black text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 px-4 text-xs font-black text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 text-xs font-bold border border-transparent transition spring-transition hover:scale-[1.03] active:scale-[0.96] shrink-0 cursor-pointer"
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
