import { Sun, Moon, Menu, BookOpenCheck } from 'lucide-react'
import { useTheme } from '../ThemeContext'

type TabType = 'practice' | 'notebook' | 'flashcards' | 'grammar' | 'ai-sandbox' | 'settings'

type AppHeaderProps = {
  activeTab: TabType
  shouldShowHamburger: boolean
  mobileDrawerTitle: string
  setIsMobileMenuOpen: (open: boolean) => void
  tabLabel: string
}

export function AppHeader({
  shouldShowHamburger,
  mobileDrawerTitle,
  setIsMobileMenuOpen,
  tabLabel,
}: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="shrink-0 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-[#0b0c16]/40 backdrop-blur px-4 py-3 sm:px-6 z-10 select-none">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile left: hamburger + logo */}
        <div className="flex items-center gap-2.5 lg:hidden">
          {shouldShowHamburger && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition spring-transition cursor-pointer text-slate-700 dark:text-zinc-300"
              title={mobileDrawerTitle}
              aria-label="Mở menu"
            >
              <Menu className="size-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-cyan-400 text-white dark:text-zinc-950 shadow-md shadow-indigo-500/20">
              <BookOpenCheck aria-hidden="true" className="size-4.5" />
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">TOEIC Progress</span>
          </div>
        </div>

        {/* Desktop breadcrumb */}
        <div className="hidden lg:block text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
          TOEIC Study Workspace /{' '}
          <span className="text-slate-800 dark:text-zinc-200 font-bold">
            {tabLabel}
          </span>
        </div>

        {/* Theme toggle (mobile only) */}
        <button
          onClick={toggleTheme}
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition spring-transition cursor-pointer text-slate-700 dark:text-zinc-300"
          title="Đổi chủ đề"
        >
          {theme === 'dark' ? <Sun className="size-4.5 text-amber-500" /> : <Moon className="size-4.5" />}
        </button>
      </div>
    </header>
  )
}
