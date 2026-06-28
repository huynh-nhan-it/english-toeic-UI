import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { useToeicStore } from '../store/useToeicStore'
import type { ToastItem } from '../store/slices/toastSlice'

export function ToastContainer() {
  const toasts = useToeicStore((state) => state.toasts)
  const dismissToast = useToeicStore((state) => state.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [progress, setProgress] = useState(100)
  const duration = toast.duration || 4000

  useEffect(() => {
    if (duration <= 0) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (elapsed >= duration) {
        clearInterval(interval)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [duration])

  const icons = {
    success: <CheckCircle className="size-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="size-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="size-5 text-amber-500 shrink-0" />,
    info: <Info className="size-5 text-indigo-500 dark:text-violet-400 shrink-0" />,
  }

  const borders = {
    success: 'border-emerald-500/20 dark:border-emerald-500/10',
    error: 'border-rose-500/20 dark:border-rose-500/10',
    warning: 'border-amber-500/20 dark:border-amber-500/10',
    info: 'border-indigo-500/20 dark:border-violet-500/10',
  }

  const bgGlows = {
    success: 'after:bg-emerald-500/5',
    error: 'after:bg-rose-500/5',
    warning: 'after:bg-amber-500/5',
    info: 'after:bg-indigo-500/5 dark:after:bg-violet-500/5',
  }

  const progressColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-indigo-600 dark:bg-violet-500',
  }

  return (
    <div
      className={`relative overflow-hidden pointer-events-auto flex gap-3 p-4 rounded-2xl border bg-white/85 dark:bg-[#0c0c14]/90 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-black/40 transition-all duration-300 animate-slide-in ${borders[toast.type]} ${bgGlows[toast.type]} after:absolute after:inset-0 after:pointer-events-none`}
    >
      {icons[toast.type]}

      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 mb-0.5 uppercase tracking-wider">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-slate-600 dark:text-zinc-300 font-bold leading-relaxed">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition shrink-0 cursor-pointer self-start"
        type="button"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100 dark:bg-zinc-800/40">
          <div
            className={`h-full ${progressColors[toast.type]} transition-all duration-30 intervals-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
