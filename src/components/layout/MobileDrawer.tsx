import { useState } from 'react'
import { X } from 'lucide-react'

type MobileDrawerProps = {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function MobileDrawer({ title, onClose, children }: MobileDrawerProps) {
  const [touchStartX, setTouchStartX] = useState(0)

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop – tap to close */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel – swipe left to close */}
      <div
        className="relative flex flex-col w-72 max-w-[82vw] h-full bg-white dark:bg-[#0b0c16] border-r border-slate-200 dark:border-zinc-800 shadow-2xl z-50 animate-in slide-in-from-left duration-200"
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX - e.changedTouches[0].clientX > 60) onClose()
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0 border-b border-slate-100 dark:border-zinc-800">
          <span className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
            {title}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition cursor-pointer"
            aria-label="Đóng menu"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4">
          <div id="mobile-drawer-portal-target" className="w-full"></div>
          {children}
        </div>

        {/* Swipe hint */}
        <p className="text-center text-[10px] text-slate-300 dark:text-zinc-700 py-3 select-none shrink-0">
          ← Vuốt trái để đóng
        </p>
      </div>
    </div>
  )
}
