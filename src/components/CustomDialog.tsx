import { useEffect } from 'react'
import { AlertCircle, HelpCircle, Info, X } from 'lucide-react'

type CustomDialogProps = {
  isOpen: boolean
  title?: string
  message: string
  type: 'alert' | 'confirm'
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'info' | 'warning' | 'danger'
}

export function CustomDialog({
  isOpen,
  title,
  message,
  type,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  onConfirm,
  onCancel,
  variant = 'info'
}: CustomDialogProps) {
  
  // Close on Escape keypress
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  // Resolve icons and colors based on variant
  let Icon = Info
  let iconColor = 'text-indigo-500 dark:text-cyan-400 bg-indigo-500/10'
  let confirmBtnStyle = 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/10'
  let titleText = title || 'Thông báo'

  if (variant === 'warning') {
    Icon = HelpCircle
    iconColor = 'text-amber-500 bg-amber-500/10'
    confirmBtnStyle = 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/10'
    titleText = title || 'Xác nhận hành động'
  } else if (variant === 'danger') {
    Icon = AlertCircle
    iconColor = 'text-rose-500 bg-rose-500/10'
    confirmBtnStyle = 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md shadow-rose-500/10'
    titleText = title || 'Cảnh báo nguy hiểm'
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 select-none">
      {/* Backdrop with smooth blur */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onCancel}
      />

      {/* Dialog container card */}
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-zinc-800/90 bg-white dark:bg-zinc-950 p-6 shadow-2xl z-10 transform transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-4">
        
        {/* Close button top right */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 transition cursor-pointer"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>

        {/* Content Body */}
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          {/* Animated Icon Circle */}
          <div className={`p-3.5 rounded-full ${iconColor} flex items-center justify-center shrink-0`}>
            <Icon className="size-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
              {titleText}
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-semibold leading-relaxed px-2 select-text">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          {type === 'confirm' && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 font-black text-xs uppercase tracking-wider transition cursor-pointer order-2 sm:order-1"
            >
              {cancelText}
            </button>
          )}
          
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer order-1 sm:order-2 ${confirmBtnStyle}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
