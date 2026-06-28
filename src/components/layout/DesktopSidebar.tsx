import { Sun, Moon, BookOpenCheck, BookOpen, Layers, GraduationCap, Settings, Sparkles, LogOut } from 'lucide-react'
import { useTheme } from '../ThemeContext'
import { useToeicStore, useResolvedCloudConfig } from '../../store/useToeicStore'
import { canSeeSettings } from '../../lib/auth'

type TabType = 'practice' | 'notebook' | 'flashcards' | 'grammar' | 'ai-sandbox' | 'settings'

type DesktopSidebarProps = {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  notebookSubTab: 'vocab' | 'collo' | 'grammar' | 'shadowing'
  colloCategory: string
  onColloCategoryChange: (cat: string) => void
  colloSearch: string
  onColloSearchChange: (q: string) => void
  grammarSearch: string
  onGrammarSearchChange: (q: string) => void
  toggleGrammarFormula: (id: string) => void
  
  // Flashcard config props
  flashcardReviewMode: 'due' | 'all'
  setFlashcardReviewMode: (mode: 'due' | 'all') => void
  flashcardStudyMode: 'review' | 'spelling'
  setFlashcardStudyMode: (mode: 'review' | 'spelling') => void
  flashcardShowStarredOnly: boolean
  setFlashcardShowStarredOnly: (starred: boolean) => void
  flashcardIsShuffled: boolean
  setFlashcardIsShuffled: (shuffle: boolean) => void
  flashcardAutoPronounce: boolean
  setFlashcardAutoPronounce: (pronounce: boolean) => void
  flashcardCramMode: boolean
  setCramMode: (cram: boolean) => void
  dueFlashcardsCount: number
  totalFlashcardsCount: number
  
  // Custom sidebar children (filter lists or config panels)
  children?: React.ReactNode
}

export function DesktopSidebar({
  activeTab,
  setActiveTab,
  children
}: DesktopSidebarProps) {
  const { theme, toggleTheme } = useTheme()
  const cloudConfig = useResolvedCloudConfig()
  const showSettingsTab = canSeeSettings(cloudConfig)
  const onLogout = useToeicStore((state) => state.onLogout)

  const tabs = [
    { id: 'practice' as TabType, label: 'Luyện đề', icon: BookOpenCheck },
    { id: 'notebook' as TabType, label: 'Sổ tay', icon: BookOpen },
    { id: 'flashcards' as TabType, label: 'Từ vựng', icon: Layers },
    { id: 'grammar' as TabType, label: 'Ngữ pháp', icon: GraduationCap },
    { id: 'ai-sandbox' as TabType, label: 'Trợ lý AI', icon: Sparkles },
    ...(showSettingsTab ? [{ id: 'settings' as TabType, label: 'Cài đặt', icon: Settings }] : []),
  ]

  return (
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 border-r border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0b0c16]/50 backdrop-blur-xl shrink-0 py-6 z-10 select-none">
      <div className="w-full px-4 space-y-6 flex-1 flex flex-col min-h-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 shrink-0">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-cyan-400 text-white dark:text-zinc-950 shadow-md shadow-indigo-500/20">
            <BookOpenCheck aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">TOEIC Progress</h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Bảng ôn & Sổ tay thông minh</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 w-full shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
                  transition-[background-color,color,box-shadow] duration-150 ease-out
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/10 dark:from-violet-500/10 dark:to-indigo-500/10 dark:text-violet-300 dark:border dark:border-violet-500/30 dark:shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                      : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
              >
                <Icon className="size-4.5" aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Custom sidebar panel widgets (Filters / Options) */}
        {children}
      </div>

      {/* User & theme */}
      <div className="w-full px-4 shrink-0 mt-4 space-y-1.5">
        {cloudConfig.user?.email && (
          <div className="px-3.5 py-2 rounded-xl bg-slate-100/70 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">Đang đăng nhập</p>
            <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 truncate mt-0.5">{cloudConfig.user.email}</p>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition spring-transition cursor-pointer"
        >
          <LogOut className="size-4.5" />
          Đăng xuất
        </button>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200 transition spring-transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
          {theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
        </button>
      </div>
    </aside>
  )
}
