import { BookOpenCheck, BookOpen, Layers, GraduationCap, Settings, Sparkles } from 'lucide-react'
import { useToeicStore } from '../../store/useToeicStore'

type TabType = 'practice' | 'notebook' | 'flashcards' | 'grammar' | 'ai-sandbox' | 'settings'

type MobileNavigationProps = {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

export function MobileNavigation({ activeTab, setActiveTab }: MobileNavigationProps) {
  const cloudConfig = useToeicStore((state) => state.cloudConfig)
  const canSeeSettings = !cloudConfig.user || cloudConfig.user.email === 'nopecode684@gmail.com'

  const tabs = [
    { id: 'practice' as TabType, label: 'Luyện đề', icon: BookOpenCheck },
    { id: 'notebook' as TabType, label: 'Sổ tay', icon: BookOpen },
    { id: 'flashcards' as TabType, label: 'Từ vựng', icon: Layers },
    { id: 'grammar' as TabType, label: 'Ngữ pháp', icon: GraduationCap },
    { id: 'ai-sandbox' as TabType, label: 'Trợ lý AI', icon: Sparkles },
    ...(canSeeSettings ? [{ id: 'settings' as TabType, label: 'Cài đặt', icon: Settings }] : []),
  ]

  return (
    <nav className="lg:hidden flex items-center justify-around border-t border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0b0c16]/80 backdrop-blur-xl shrink-0 py-1 pb-safe z-10 select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2.5 cursor-pointer transition spring-transition ${
              isActive
                ? 'text-indigo-605 dark:text-violet-400 font-bold scale-105'
                : 'text-slate-400 dark:text-zinc-500 font-medium'
            }`}
          >
            <Icon className="size-5" />
            <span className="text-[10px]">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
