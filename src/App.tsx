import { useState, useEffect } from 'react'
import {
  BookOpenCheck,
  BookOpen,
  Layers,
  GraduationCap,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  Check,
  Search,
  Star,
  Shuffle,
  Volume2,
  Zap,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { AnswerSheet } from './components/AnswerSheet'
import { ExamManager } from './components/ExamManager'
import { Notebook } from './components/Notebook'
import { FlashcardsTab } from './components/FlashcardsTab'
import { GrammarPracticeTab } from './components/GrammarPracticeTab'
import { SettingsTab } from './components/SettingsTab'
import { CustomDialog } from './components/CustomDialog'
import { generateAiFlashcards } from './lib/geminiApi'
import { useToeicProgress } from './hooks/useToeicProgress'
import { ThemeProvider, useTheme } from './components/ThemeContext'
import { TOEIC_GRAMMAR_FORMULAS, GRAMMAR_VIETNAMESE_TITLES, COLLO_VIETNAMESE_TITLES } from './lib/toeic'

type TabType = 'practice' | 'notebook' | 'flashcards' | 'grammar' | 'settings'

// ─── Reusable swipe-to-close + tap-backdrop Mobile Drawer ───────────────────
function MobileDrawer({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
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
        className="relative flex flex-col w-72 max-w-[82vw] h-full bg-white dark:bg-[#0b0c16] border-r border-slate-200 dark:border-zinc-800 shadow-2xl z-50"
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

// ─── Collocation category list (shared by sidebar + drawer) ─────────────────
const COLLO_CATEGORIES = [
  'All',
  'Operations',
  'Finance',
  'Legal',
  'HR',
  'Marketing',
  'Sales',
  'Customer Service',
  'Strategy',
  'Logistics',
  'IT & Tech',
  'Meetings',
  'Travel',
  'Purchasing'
]


function ColloFilterList({
  colloCategory,
  colloSearch,
  onCategoryChange,
  onSearchChange,
  compact = false,
}: {
  colloCategory: string
  colloSearch: string
  onCategoryChange: (cat: string) => void
  onSearchChange: (q: string) => void
  compact?: boolean
}) {
  const filtered = COLLO_CATEGORIES.filter((c) => {
    const viTitle = COLLO_VIETNAMESE_TITLES[c] || ''
    const q = colloSearch.toLowerCase()
    return (
      c.toLowerCase().includes(q) ||
      viTitle.toLowerCase().includes(q)
    )
  })
  return (
    <div className="space-y-2">
      {/* Search input inside filter panel */}
      <div className="relative">
        <input
          type="text"
          value={colloSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Lọc chủ đề..."
          className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 pl-8 pr-3 py-2 text-xs text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 transition"
        />
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
      </div>
      {filtered.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onCategoryChange(cat)}
          className={`flex items-center justify-between w-full ${compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2.5'} rounded-xl text-xs font-bold transition spring-transition cursor-pointer ${
            colloCategory === cat
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30 shadow-sm'
              : compact
              ? 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              : 'bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <div className="flex flex-col min-w-0 flex-1 text-left">
            <span className="truncate pr-1 text-slate-800 dark:text-zinc-100 font-bold text-xs">
              {cat === 'All' ? 'Tất cả' : cat}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal truncate mt-0.5">
              {COLLO_VIETNAMESE_TITLES[cat] || ''}
            </span>
          </div>
          {colloCategory === cat && <Check className="size-3 text-indigo-600 dark:text-violet-400 shrink-0 ml-2" />}
        </button>
      ))}
    </div>
  )
}


// ─── Grammar formula list (shared by sidebar + drawer) ──────────────────────
function GrammarFilterList({
  selectedIds,
  grammarSearch,
  onToggle,
  onSearchChange,
  compact = false,
}: {
  selectedIds: string[]
  grammarSearch: string
  onToggle: (id: string) => void
  onSearchChange: (q: string) => void
  compact?: boolean
}) {
  const filtered = TOEIC_GRAMMAR_FORMULAS.filter((f) => {
    const viTitle = GRAMMAR_VIETNAMESE_TITLES[f.id] || ''
    const q = grammarSearch.toLowerCase()
    return (
      f.title.toLowerCase().includes(q) ||
      f.formula.toLowerCase().includes(q) ||
      viTitle.toLowerCase().includes(q)
    )
  })
  return (
    <div className="space-y-2">
      {/* Search inside grammar filter */}
      <div className="relative">
        <input
          type="text"
          value={grammarSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm cấu trúc..."
          className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 pl-8 pr-3 py-2 text-xs text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 transition"
        />
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
      </div>
      {filtered.map((formula) => {
        const isSelected = selectedIds.includes(formula.id)
        return (
          <button
            key={formula.id}
            type="button"
            onClick={() => onToggle(formula.id)}
            title={`${formula.title}: ${formula.formula}`}
            className={`flex items-center justify-between w-full ${compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2.5'} rounded-xl text-left text-xs font-bold transition spring-transition cursor-pointer ${
              isSelected
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30 shadow-sm'
                : compact
                ? 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                : 'bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="truncate pr-1 text-slate-800 dark:text-zinc-100 font-bold text-xs">
                {formula.title}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal truncate mt-0.5">
                {GRAMMAR_VIETNAMESE_TITLES[formula.id] || ''}
              </span>
            </div>
            {isSelected && <Check className="size-3 text-indigo-600 dark:text-violet-400 shrink-0 ml-2" />}
          </button>
        )
      })}
    </div>
  )
}

// ─── Flashcard Config Panel (shared by sidebar + drawer) ──────────────────────
function FlashcardConfigPanel({
  reviewMode,
  setReviewMode,
  studyMode,
  setStudyMode,
  showStarredOnly,
  setShowStarredOnly,
  isShuffled,
  setIsShuffled,
  autoPronounce,
  setAutoPronounce,
  cramMode,
  setCramMode,
  dueCount,
  totalCount,
}: {
  reviewMode: 'due' | 'all'
  setReviewMode: (mode: 'due' | 'all') => void
  studyMode: 'review' | 'spelling'
  setStudyMode: (mode: 'review' | 'spelling') => void
  showStarredOnly: boolean
  setShowStarredOnly: (show: boolean) => void
  isShuffled: boolean
  setIsShuffled: (shuffle: boolean) => void
  autoPronounce: boolean
  setAutoPronounce: (pronounce: boolean) => void
  cramMode: boolean
  setCramMode: (cram: boolean) => void
  dueCount: number
  totalCount: number
}) {
  return (
    <div className="space-y-4 py-2">
      {/* Study Mode Selector */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
          Chế độ học
        </span>
        <div className="flex bg-slate-100 dark:bg-zinc-950/80 p-1 rounded-2xl border border-slate-200/30 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setStudyMode('review')}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer ${
              studyMode === 'review'
                ? 'bg-white dark:bg-zinc-800 text-slate-850 dark:text-white shadow-sm'
                : 'text-slate-550 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-205'
            }`}
          >
            Lật thẻ
          </button>
          <button
            type="button"
            onClick={() => setStudyMode('spelling')}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer ${
              studyMode === 'spelling'
                ? 'bg-white dark:bg-zinc-800 text-slate-850 dark:text-white shadow-sm'
                : 'text-slate-555 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-205'
            }`}
          >
            Chính tả
          </button>
        </div>
      </div>

      {/* Deck Selector */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
          Bộ thẻ hiển thị
        </span>
        <div className="flex bg-slate-100 dark:bg-zinc-950/80 p-1 rounded-2xl border border-slate-200/30 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setReviewMode('due')
              if (cramMode) setCramMode(false)
            }}
            disabled={cramMode}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer disabled:opacity-50 ${
              reviewMode === 'due' && !cramMode
                ? 'bg-white dark:bg-zinc-800 text-slate-850 dark:text-white shadow-sm'
                : 'text-slate-555 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-205'
            }`}
          >
            Cần ôn ({dueCount})
          </button>
          <button
            type="button"
            onClick={() => setReviewMode('all')}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer ${
              reviewMode === 'all' || cramMode
                ? 'bg-white dark:bg-zinc-800 text-slate-855 dark:text-white shadow-sm'
                : 'text-slate-555 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-205'
            }`}
          >
            Tất cả ({totalCount})
          </button>
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
          Tùy chọn bổ sung
        </span>
        <div className="grid grid-cols-2 gap-2">
          {/* Star Option */}
          <button
            type="button"
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              showStarredOnly
                ? 'bg-amber-500/10 border-amber-500/35 text-amber-600 dark:text-amber-400'
                : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200/50 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Star className="size-4 shrink-0" fill={showStarredOnly ? 'currentColor' : 'none'} />
            <span>Gắn sao</span>
          </button>

          {/* Shuffle Option */}
          <button
            type="button"
            onClick={() => setIsShuffled(!isShuffled)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              isShuffled
                ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200/50 dark:border-zinc-800/80 text-slate-555 dark:text-zinc-400'
            }`}
          >
            <Shuffle className="size-4 shrink-0" />
            <span>Xáo trộn</span>
          </button>

          {/* Pronounce Option */}
          <button
            type="button"
            onClick={() => setAutoPronounce(!autoPronounce)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              autoPronounce
                ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-650 dark:text-emerald-450'
                : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200/50 dark:border-zinc-800/80 text-slate-555 dark:text-zinc-400'
            }`}
          >
            <Volume2 className="size-4 shrink-0" />
            <span>Phát âm</span>
          </button>

          {/* Cram Option */}
          <button
            type="button"
            onClick={() => {
              setCramMode(!cramMode)
              if (!cramMode) {
                setReviewMode('all')
              }
            }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              cramMode
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200/50 dark:border-zinc-800/80 text-slate-555 dark:text-zinc-400'
            }`}
          >
            <Zap className="size-4 shrink-0 fill-current" />
            <span>Cram</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Flashcard Generator Panel (shared by sidebar + drawer) ──────────────────
function FlashcardGeneratorPanel({
  apiKey,
  flashcards,
  onAddCard,
  setDialog,
}: {
  apiKey?: string
  flashcards: any[]
  onAddCard: (w: string, p: string, d: string, t: string, e: string) => void
  setDialog: (d: any) => void
}) {
  const [aiWordCount, setAiWordCount] = useState(10)
  const [isGeneratingAiWords, setIsGeneratingAiWords] = useState(false)

  const handleGenerateAiWords = async () => {
    if (!apiKey || !apiKey.trim()) {
      setDialog({
        isOpen: true,
        message: 'Khóa API Gemini trống. Vui lòng truy cập tab "Cài đặt" để cấu hình khóa API Google Gemini AI trước khi sử dụng tính năng này.',
        type: 'alert',
        variant: 'warning',
        onConfirm: () => setDialog((prev: any) => ({ ...prev, isOpen: false }))
      })
      return
    }

    setIsGeneratingAiWords(true)
    try {
      const existing = flashcards.map((c) => c.word)
      const newCards = await generateAiFlashcards(apiKey, existing, aiWordCount)

      if (newCards.length === 0) {
        throw new Error('AI không sinh được từ vựng nào mới. Vui lòng thử lại.')
      }

      newCards.forEach((card) => {
        onAddCard(
          card.word,
          card.phonetic,
          card.definition,
          card.translation,
          card.example
        )
      })

      setDialog({
        isOpen: true,
        message: `Đã sinh thành công và thêm ${newCards.length} từ vựng TOEIC mới nhất bằng AI vào bộ Flashcards của bạn.`,
        type: 'alert',
        variant: 'info',
        onConfirm: () => setDialog((prev: any) => ({ ...prev, isOpen: false }))
      })
    } catch (err: any) {
      console.error(err)
      setDialog({
        isOpen: true,
        message: err.message || 'Có lỗi xảy ra khi sinh từ vựng bằng AI. Vui lòng thử lại.',
        type: 'alert',
        variant: 'danger',
        onConfirm: () => setDialog((prev: any) => ({ ...prev, isOpen: false }))
      })
    } finally {
      setIsGeneratingAiWords(false)
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-sm border border-violet-500/15 dark:border-violet-500/25 bg-gradient-to-br from-white/40 to-slate-50/20 dark:from-[#0f1020]/40 dark:to-[#0b0c16]/20 relative overflow-hidden mt-4">
      {/* Top decorative gradient glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-indigo-500/0 rounded-full blur-xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-655 dark:text-violet-300 uppercase tracking-wider">
          <Sparkles className="size-4 text-violet-500 dark:text-violet-400 animate-pulse" />
          Sinh Từ Vựng AI
        </div>
        <span className="text-[9px] text-indigo-650 dark:text-cyan-400 font-extrabold uppercase tracking-widest bg-indigo-50 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded">
          Gemini 2.5
        </span>
      </div>
      
      <p className="text-[10px] text-slate-505 dark:text-zinc-400 mb-3 leading-relaxed">
        Tự động sinh từ vựng TOEIC mới nhất (kèm phiên âm IPA, nghĩa Anh/Việt và ví dụ ngữ cảnh) và thêm trực tiếp vào bộ thẻ của bạn.
      </p>
      
      <div className="space-y-3.5">
        {/* Count Selector */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black text-slate-655 dark:text-zinc-305">
            Số lượng từ (Tối đa 20):
          </span>
          <div className="flex bg-slate-100 dark:bg-zinc-950/80 p-0.5 rounded-xl border border-slate-200/30 dark:border-zinc-800">
            {[5, 10, 15, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setAiWordCount(num)}
                disabled={isGeneratingAiWords}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition cursor-pointer disabled:opacity-50 ${
                  aiWordCount === num
                    ? 'bg-white dark:bg-zinc-800 text-slate-850 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-250'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        
        {/* Action Button */}
        <button
          type="button"
          onClick={handleGenerateAiWords}
          disabled={isGeneratingAiWords}
          className="w-full relative flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition shadow-md shadow-indigo-500/5 disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
        >
          {isGeneratingAiWords ? (
            <>
              <RefreshCw className="size-3.5 animate-spin text-white" />
              <span>Đang tạo từ...</span>
            </>
          ) : (
            <>
              <Sparkles className="size-3.5 text-white" />
              <span>Tạo và Thêm</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────
function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('practice')
  
  // App-level Custom Alert/Confirm Modal Dialog State
  const [appDialog, setAppDialog] = useState<{
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const {
    activeExam,
    createNewExam,
    exams,
    notesDraft,
    progress,
    renameActiveExam,
    selectExam,
    updateAnswer,
    updateNote,
    flashcards,
    cloudConfig,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    saveCloudConfig,
    onLogin,
    onRegister,
    onLoginWithGoogle,
    onLogout,
    clearData,
    geminiApiKey,
    updateGeminiApiKey,
    leitnerIntervals,
    updateLeitnerIntervals,
    manualSync,
  } = useToeicProgress()

  const [notebookSubTab, setNotebookSubTab] = useState<'vocab' | 'collo' | 'grammar' | 'shadowing'>('vocab')
  const [colloCategory, setColloCategory] = useState<string>('All')
  const [colloSearch, setColloSearch] = useState('')
  const [grammarSearch, setGrammarSearch] = useState('')

  // Flashcard Configuration States
  const [flashcardReviewMode, setFlashcardReviewMode] = useState<'due' | 'all'>('due')
  const [flashcardStudyMode, setFlashcardStudyMode] = useState<'review' | 'spelling'>('review')
  const [flashcardShowStarredOnly, setFlashcardShowStarredOnly] = useState(false)
  const [flashcardIsShuffled, setFlashcardIsShuffled] = useState(false)
  const [flashcardAutoPronounce, setFlashcardAutoPronounce] = useState(true)
  const [flashcardCramMode, setFlashcardCramMode] = useState(false)

  const toggleGrammarFormula = (formulaId: string) => {
    const isSelected = notesDraft.selectedGrammarFormulaIds.includes(formulaId)
    updateNote(
      'selectedGrammarFormulaIds',
      isSelected
        ? notesDraft.selectedGrammarFormulaIds.filter((id) => id !== formulaId)
        : [...notesDraft.selectedGrammarFormulaIds, formulaId],
    )
  }

  // Mobile menu should open for practice, grammar, flashcards & notebook(collo/grammar)
  const shouldShowHamburger =
    activeTab === 'practice' ||
    activeTab === 'grammar' ||
    activeTab === 'flashcards' ||
    (activeTab === 'notebook' && (notebookSubTab === 'collo' || notebookSubTab === 'grammar'))

  const mobileDrawerTitle =
    activeTab === 'practice'
      ? 'Quản lý đề thi'
      : activeTab === 'grammar'
      ? 'Cấu hình Luyện tập'
      : activeTab === 'flashcards'
      ? 'Cấu hình Flashcards'
      : notebookSubTab === 'collo'
      ? 'Chủ đề Cụm từ'
      : 'Cấu trúc Ngữ pháp'

  // Admin access control for Settings tab
  const canSeeSettings = !cloudConfig.user || cloudConfig.user.email === 'nopecode684@gmail.com'

  // Redirect if unauthorized user somehow lands on Settings tab
  useEffect(() => {
    if (activeTab === 'settings' && !canSeeSettings) {
      setActiveTab('practice')
    }
  }, [activeTab, canSeeSettings, setActiveTab])

  const tabs = [
    { id: 'practice' as TabType, label: 'Luyện đề', icon: BookOpenCheck },
    { id: 'notebook' as TabType, label: 'Sổ tay', icon: BookOpen },
    { id: 'flashcards' as TabType, label: 'Từ vựng', icon: Layers },
    { id: 'grammar' as TabType, label: 'Ngữ pháp', icon: GraduationCap },
    ...(canSeeSettings ? [{ id: 'settings' as TabType, label: 'Cài đặt', icon: Settings }] : []),
  ]

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#05050a] text-slate-800 dark:text-zinc-100 lg:flex-row flex-col transition-colors duration-300 relative grid-bg">
      {/* Background aurora glow (Dark Mode only) */}
      <div className="aurora-bg hidden dark:block" />

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 border-r border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0b0c16]/50 backdrop-blur-xl shrink-0 py-6 z-10">
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

          {/* Desktop Notebook Filter Panel */}
          {activeTab === 'notebook' && (notebookSubTab === 'collo' || notebookSubTab === 'grammar') && (
            <div className="flex-1 flex flex-col min-h-0 border-t border-slate-200/50 dark:border-zinc-800/50 pt-4 space-y-3">
              <span className="px-2 text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest shrink-0">
                {notebookSubTab === 'collo' ? 'Chủ đề Cụm từ' : 'Cấu trúc Ngữ pháp'}
              </span>
              <div className="flex-1 overflow-y-auto min-h-0">
                {notebookSubTab === 'collo' ? (
                  <ColloFilterList
                    colloCategory={colloCategory}
                    colloSearch={colloSearch}
                    onCategoryChange={setColloCategory}
                    onSearchChange={setColloSearch}
                    compact
                  />
                ) : (
                  <GrammarFilterList
                    selectedIds={notesDraft.selectedGrammarFormulaIds}
                    grammarSearch={grammarSearch}
                    onToggle={toggleGrammarFormula}
                    onSearchChange={setGrammarSearch}
                    compact
                  />
                )}
              </div>
            </div>
          )}

          {/* Desktop Flashcard Config Panel */}
          {activeTab === 'flashcards' && (
            <div className="flex-1 flex flex-col min-h-0 border-t border-slate-200/50 dark:border-zinc-800/50 pt-4 space-y-3">
              <span className="px-2 text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest shrink-0">
                Cấu hình Flashcards
              </span>
              <div className="flex-1 overflow-y-auto min-h-0 px-2">
                <FlashcardConfigPanel
                  reviewMode={flashcardReviewMode}
                  setReviewMode={setFlashcardReviewMode}
                  studyMode={flashcardStudyMode}
                  setStudyMode={setFlashcardStudyMode}
                  showStarredOnly={flashcardShowStarredOnly}
                  setShowStarredOnly={setFlashcardShowStarredOnly}
                  isShuffled={flashcardIsShuffled}
                  setIsShuffled={setFlashcardIsShuffled}
                  autoPronounce={flashcardAutoPronounce}
                  setAutoPronounce={setFlashcardAutoPronounce}
                  cramMode={flashcardCramMode}
                  setCramMode={setFlashcardCramMode}
                  dueCount={flashcards.filter(c => new Date(c.nextReview) <= new Date()).length}
                  totalCount={flashcards.length}
                />
                <FlashcardGeneratorPanel
                  apiKey={geminiApiKey}
                  flashcards={flashcards}
                  onAddCard={addFlashcard}
                  setDialog={setAppDialog}
                />
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <div className="w-full px-4 shrink-0 mt-4">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200 transition spring-transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            {theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">

        {/* Mobile + Desktop top header */}
        <header className="shrink-0 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-[#0b0c16]/40 backdrop-blur px-4 py-3 sm:px-6 z-10">
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
                {tabs.find((t) => t.id === activeTab)?.label}
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

        {/* Tab content */}
        <main className="flex-1 min-h-0 min-w-0 z-10 relative">
          {activeTab === 'practice' && (
            <div className="flex h-full flex-col min-h-0 min-w-0">
              <div className="hidden lg:block shrink-0 border-b border-slate-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-[#0c0c14]/20 px-4 py-4 sm:px-6">
                <ExamManager
                  activeExam={activeExam}
                  exams={exams}
                  onCreateExam={createNewExam}
                  onRenameExam={renameActiveExam}
                  onSelectExam={selectExam}
                  progress={progress}
                />
              </div>
              <div className="flex-1 min-h-0 min-w-0">
                <AnswerSheet answers={activeExam.answers} onAnswerChange={updateAnswer} />
              </div>
            </div>
          )}
          {activeTab === 'notebook' && (
            <Notebook
              notes={notesDraft}
              onNoteChange={updateNote}
              onAddFlashcard={addFlashcard}
              flashcardWords={flashcards.map((c) => c.word.toLowerCase())}
              subTab={notebookSubTab}
              onSubTabChange={setNotebookSubTab}
              colloCategory={colloCategory}
              onColloCategoryChange={setColloCategory}
            />
          )}
          {activeTab === 'flashcards' && (
            <FlashcardsTab
              flashcards={flashcards}
              onAddCard={addFlashcard}
              onUpdateCard={updateFlashcard}
              onDeleteCard={deleteFlashcard}
              leitnerIntervals={leitnerIntervals}
              apiKey={geminiApiKey}
              reviewMode={flashcardReviewMode}
              setReviewMode={setFlashcardReviewMode}
              studyMode={flashcardStudyMode}
              setStudyMode={setFlashcardStudyMode}
              showStarredOnly={flashcardShowStarredOnly}
              setShowStarredOnly={setFlashcardShowStarredOnly}
              isShuffled={flashcardIsShuffled}
              setIsShuffled={setFlashcardIsShuffled}
              autoPronounce={flashcardAutoPronounce}
              setAutoPronounce={setFlashcardAutoPronounce}
              cramMode={flashcardCramMode}
              setCramMode={setFlashcardCramMode}
            />
          )}
          {activeTab === 'grammar' && (
            <GrammarPracticeTab
              flashcards={flashcards}
              apiKey={geminiApiKey}
              onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              cloudConfig={cloudConfig}
              onLogin={onLogin}
              onRegister={onRegister}
              onLoginWithGoogle={onLoginWithGoogle}
              onLogout={onLogout}
              onSaveCloudConfig={saveCloudConfig}
              onClearData={clearData}
              geminiApiKey={geminiApiKey}
              onSaveGeminiApiKey={updateGeminiApiKey}
              leitnerIntervals={leitnerIntervals}
              onUpdateLeitnerIntervals={updateLeitnerIntervals}
              onManualSync={manualSync}
            />
          )}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ───────────────────────────────────────────── */}
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
                  ? 'text-indigo-600 dark:text-violet-400 font-bold scale-105'
                  : 'text-slate-400 dark:text-zinc-500 font-medium'
              }`}
            >
              <Icon className="size-5" />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* ── Mobile Drawer ───────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <MobileDrawer
          title={mobileDrawerTitle}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {activeTab === 'practice' && (
            <ExamManager
              activeExam={activeExam}
              exams={exams}
              onCreateExam={() => { createNewExam(); setIsMobileMenuOpen(false) }}
              onRenameExam={renameActiveExam}
              onSelectExam={(id) => { selectExam(id); setIsMobileMenuOpen(false) }}
              progress={progress}
            />
          )}
          {activeTab === 'notebook' && notebookSubTab === 'collo' && (
            <ColloFilterList
              colloCategory={colloCategory}
              colloSearch={colloSearch}
              onCategoryChange={(cat) => { setColloCategory(cat); setIsMobileMenuOpen(false) }}
              onSearchChange={setColloSearch}
            />
          )}
          {activeTab === 'notebook' && notebookSubTab === 'grammar' && (
            <GrammarFilterList
              selectedIds={notesDraft.selectedGrammarFormulaIds}
              grammarSearch={grammarSearch}
              onToggle={toggleGrammarFormula}
              onSearchChange={setGrammarSearch}
            />
          )}

          {activeTab === 'flashcards' && (
            <div className="px-2">
              <FlashcardConfigPanel
                reviewMode={flashcardReviewMode}
                setReviewMode={setFlashcardReviewMode}
                studyMode={flashcardStudyMode}
                setStudyMode={setFlashcardStudyMode}
                showStarredOnly={flashcardShowStarredOnly}
                setShowStarredOnly={setFlashcardShowStarredOnly}
                isShuffled={flashcardIsShuffled}
                setIsShuffled={setFlashcardIsShuffled}
                autoPronounce={flashcardAutoPronounce}
                setAutoPronounce={setFlashcardAutoPronounce}
                cramMode={flashcardCramMode}
                setCramMode={setFlashcardCramMode}
                dueCount={flashcards.filter(c => new Date(c.nextReview) <= new Date()).length}
                totalCount={flashcards.length}
              />
              <FlashcardGeneratorPanel
                apiKey={geminiApiKey}
                flashcards={flashcards}
                onAddCard={addFlashcard}
                setDialog={setAppDialog}
              />
            </div>
          )}
        </MobileDrawer>
      )}

      {/* App-level Custom Alert/Confirm Modal Dialog */}
      <CustomDialog
        isOpen={appDialog.isOpen}
        message={appDialog.message}
        type={appDialog.type}
        variant={appDialog.variant}
        onConfirm={appDialog.onConfirm}
        onCancel={() => setAppDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
