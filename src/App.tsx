import { useState, useMemo, useCallback } from 'react'
import { Check, Search } from 'lucide-react'
import { AnswerSheet } from './components/AnswerSheet'
import { ExamManager } from './components/ExamManager'
import { Notebook } from './components/Notebook'
import { FlashcardsTab } from './components/FlashcardsTab'
import { GrammarPracticeTab } from './components/GrammarPracticeTab'
import { SettingsTab } from './components/SettingsTab'
import { AiSandboxTab } from './features/ai-sandbox/AiSandboxTab'
import { CustomDialog } from './components/CustomDialog'
import { ToastContainer } from './components/ToastContainer'

// Layouts & Sub-panels
import { DesktopSidebar } from './components/layout/DesktopSidebar'
import { AppHeader } from './components/layout/AppHeader'
import { MobileNavigation } from './components/layout/MobileNavigation'
import { MobileDrawer } from './components/layout/MobileDrawer'
import { FlashcardConfigPanel } from './components/flashcard/FlashcardConfigPanel'
import { FlashcardGeneratorPanel } from './components/flashcard/FlashcardGeneratorPanel'
import { AuthScreen } from './components/auth/AuthScreen'

// Global Store & Configs
import { useToeicStore, useActiveExam, useResolvedCloudConfig, useResolvedGeminiApiKey } from './store/useToeicStore'
import { ThemeProvider } from './components/ThemeContext'
import { TOEIC_GRAMMAR_FORMULAS, GRAMMAR_VIETNAMESE_TITLES, COLLO_VIETNAMESE_TITLES } from './lib/toeic'
import { isAuthenticated, canSeeSettings } from './lib/auth'
import type { StudyNotes } from './types'

type TabType = 'practice' | 'notebook' | 'flashcards' | 'grammar' | 'ai-sandbox' | 'settings'

// ─── Collocation category filter list ─────────────────
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
    <div className="space-y-2 text-left">
      <div className="relative">
        <input
          type="text"
          value={colloSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Lọc chủ đề..."
          className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 pl-8 pr-3 py-2 text-xs text-slate-705 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 transition"
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
          {colloCategory === cat && <Check className="size-3 text-indigo-605 dark:text-violet-400 shrink-0 ml-2" />}
        </button>
      ))}
    </div>
  )
}

// ─── Grammar formula filter list ──────────────────────
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
    <div className="space-y-2 text-left">
      <div className="relative">
        <input
          type="text"
          value={grammarSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm cấu trúc..."
          className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 pl-8 pr-3 py-2 text-xs text-slate-705 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 transition"
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
            {isSelected && <Check className="size-3 text-indigo-605 dark:text-violet-400 shrink-0 ml-2" />}
          </button>
        )
      })}
    </div>
  )
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('practice')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notebookSubTab, setNotebookSubTab] = useState<'vocab' | 'collo' | 'grammar' | 'shadowing'>('vocab')
  const [colloCategory, setColloCategory] = useState<string>('All')
  const [colloSearch, setColloSearch] = useState('')
  const [grammarSearch, setGrammarSearch] = useState('')

  // Dialog state
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

  // Flashcard Configuration States
  const [flashcardReviewMode, setFlashcardReviewMode] = useState<'due' | 'all'>('due')
  const [flashcardStudyMode, setFlashcardStudyMode] = useState<'review' | 'spelling'>('review')
  const [flashcardShowStarredOnly, setFlashcardShowStarredOnly] = useState(false)
  const [flashcardIsShuffled, setFlashcardIsShuffled] = useState(false)
  const [flashcardAutoPronounce, setFlashcardAutoPronounce] = useState(true)
  const [flashcardCramMode, setFlashcardCramMode] = useState(false)

  // Zustand state subscriptions
  const activeExam = useActiveExam()
  const exams = useToeicStore((state) => state.exams)
  const createNewExam = useToeicStore((state) => state.createNewExam)
  const renameActiveExam = useToeicStore((state) => state.renameActiveExam)
  const selectExam = useToeicStore((state) => state.selectExam)
  const updateAnswer = useToeicStore((state) => state.updateAnswer)
  const updateActiveExamNotes = useToeicStore((state) => state.updateActiveExamNotes)

  const flashcards = useToeicStore((state) => state.flashcards)
  const addFlashcard = useToeicStore((state) => state.addFlashcard)
  const updateFlashcard = useToeicStore((state) => state.updateFlashcard)
  const deleteFlashcard = useToeicStore((state) => state.deleteFlashcard)

  const cloudConfig = useResolvedCloudConfig()
  const saveCloudConfig = useToeicStore((state) => state.saveCloudConfig)
  const onLogin = useToeicStore((state) => state.onLogin)
  const onRegister = useToeicStore((state) => state.onRegister)
  const onLoginWithGoogle = useToeicStore((state) => state.onLoginWithGoogle)
  const onLogout = useToeicStore((state) => state.onLogout)
  const clearData = useToeicStore((state) => state.clearData)
  const manualSync = useToeicStore((state) => state.manualSync)

  const geminiApiKey = useResolvedGeminiApiKey()
  const updateGeminiApiKey = useToeicStore((state) => state.updateGeminiApiKey)
  const leitnerIntervals = useToeicStore((state) => state.leitnerIntervals)
  const updateLeitnerIntervals = useToeicStore((state) => state.updateLeitnerIntervals)

  const toggleGrammarFormula = useCallback((formulaId: string) => {
    const list = activeExam.notes.selectedGrammarFormulaIds
    const next = list.includes(formulaId) ? list.filter((id) => id !== formulaId) : [...list, formulaId]
    updateActiveExamNotes({
      ...activeExam.notes,
      selectedGrammarFormulaIds: next
    })
  }, [activeExam, updateActiveExamNotes])

  const handleNoteChange = useCallback(<K extends keyof StudyNotes>(key: K, value: StudyNotes[K]) => {
    updateActiveExamNotes({
      ...activeExam.notes,
      [key]: value
    })
  }, [activeExam, updateActiveExamNotes])

  const showSettingsTab = canSeeSettings(cloudConfig)

  const visibleTab: TabType = activeTab === 'settings' && !showSettingsTab ? 'practice' : activeTab

  const shouldShowHamburger =
    visibleTab === 'practice' ||
    visibleTab === 'grammar' ||
    visibleTab === 'flashcards' ||
    (visibleTab === 'notebook' && (notebookSubTab === 'collo' || notebookSubTab === 'grammar'))

  const mobileDrawerTitle =
    visibleTab === 'practice'
      ? 'Quản lý đề thi'
      : visibleTab === 'grammar'
      ? 'Cấu hình Luyện tập'
      : visibleTab === 'flashcards'
      ? 'Cấu hình Flashcards'
      : notebookSubTab === 'collo'
      ? 'Chủ đề Cụm từ'
      : 'Cấu trúc Ngữ pháp'

  const progressObject = useMemo(() => ({
    version: 5 as const,
    activeExamId: activeExam.id,
    exams,
    flashcards,
    cloudConfig,
    leitnerIntervals,
    geminiApiKey,
    updatedAt: new Date().toISOString()
  }), [activeExam.id, exams, flashcards, cloudConfig, leitnerIntervals, geminiApiKey])

  const dueCount = useMemo(() => {
    const now = new Date()
    return flashcards.filter(c => new Date(c.nextReview) <= now).length
  }, [flashcards])

  const tabLabels = {
    practice: 'Luyện đề',
    notebook: 'Sổ tay',
    flashcards: 'Từ vựng',
    grammar: 'Ngữ pháp',
    'ai-sandbox': 'Trợ lý AI',
    settings: 'Cài đặt',
  }

  if (!isAuthenticated(cloudConfig)) {
    return (
      <>
        <AuthScreen
          cloudConfig={cloudConfig}
          onLogin={onLogin}
          onRegister={onRegister}
          onLoginWithGoogle={onLoginWithGoogle}
        />
        <ToastContainer />
      </>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#05050a] text-slate-800 dark:text-zinc-100 lg:flex-row flex-col transition-colors duration-300 relative grid-bg">
      {/* Background aurora glow */}
      <div className="aurora-bg hidden dark:block pointer-events-none" />

      {/* Desktop Sidebar with children filters */}
      <DesktopSidebar
        activeTab={visibleTab}
        setActiveTab={setActiveTab}
        notebookSubTab={notebookSubTab}
        colloCategory={colloCategory}
        onColloCategoryChange={setColloCategory}
        colloSearch={colloSearch}
        onColloSearchChange={setColloSearch}
        grammarSearch={grammarSearch}
        onGrammarSearchChange={setGrammarSearch}
        toggleGrammarFormula={toggleGrammarFormula}
        flashcardReviewMode={flashcardReviewMode}
        setFlashcardReviewMode={setFlashcardReviewMode}
        flashcardStudyMode={flashcardStudyMode}
        setFlashcardStudyMode={setFlashcardStudyMode}
        flashcardShowStarredOnly={flashcardShowStarredOnly}
        setFlashcardShowStarredOnly={setFlashcardShowStarredOnly}
        flashcardIsShuffled={flashcardIsShuffled}
        setFlashcardIsShuffled={setFlashcardIsShuffled}
        flashcardAutoPronounce={flashcardAutoPronounce}
        setFlashcardAutoPronounce={setFlashcardAutoPronounce}
        flashcardCramMode={flashcardCramMode}
        setCramMode={setFlashcardCramMode}
        dueFlashcardsCount={dueCount}
        totalFlashcardsCount={flashcards.length}
      >
        {/* Render filter panels dynamically inside sidebar */}
        {visibleTab === 'notebook' && (
          <div className="flex-1 flex flex-col min-h-0 border-t border-slate-200/50 dark:border-zinc-800/50 pt-4 space-y-3">
            <span className="px-2 text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest shrink-0">
              {notebookSubTab === 'collo' ? 'Chủ đề Cụm từ' : 'Cấu trúc Ngữ pháp'}
            </span>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className={notebookSubTab === 'collo' ? '' : 'hidden'}>
                <ColloFilterList
                  colloCategory={colloCategory}
                  colloSearch={colloSearch}
                  onCategoryChange={setColloCategory}
                  onSearchChange={setColloSearch}
                  compact
                />
              </div>
              <div className={notebookSubTab === 'grammar' || notebookSubTab === 'vocab' || notebookSubTab === 'shadowing' ? '' : 'hidden'}>
                <GrammarFilterList
                  selectedIds={activeExam.notes.selectedGrammarFormulaIds}
                  grammarSearch={grammarSearch}
                  onToggle={toggleGrammarFormula}
                  onSearchChange={setGrammarSearch}
                  compact
                />
              </div>
            </div>
          </div>
        )}

        {visibleTab === 'flashcards' && (
          <div className="flex-1 flex flex-col min-h-0 border-t border-slate-200/50 dark:border-zinc-800/50 pt-4 space-y-3">
            <span className="px-2 text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest shrink-0">
              Cấu hình Flashcards
            </span>
            <div className="flex-1 overflow-y-auto min-h-0 px-2 space-y-4">
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
                dueCount={dueCount}
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
      </DesktopSidebar>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-transparent">
        <AppHeader
          activeTab={visibleTab}
          shouldShowHamburger={shouldShowHamburger}
          mobileDrawerTitle={mobileDrawerTitle}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          tabLabel={tabLabels[visibleTab]}
        />

        <main className="flex-1 min-h-0 min-w-0 z-10 relative flex flex-col">
          {visibleTab === 'practice' && (
            <div className="flex h-full flex-col min-h-0 min-w-0">
              <div className="hidden lg:block shrink-0 border-b border-slate-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-[#0c0c14]/20 px-4 py-4 sm:px-6">
                <ExamManager
                  activeExam={activeExam}
                  exams={exams}
                  onCreateExam={createNewExam}
                  onRenameExam={renameActiveExam}
                  onSelectExam={selectExam}
                  progress={progressObject}
                />
              </div>
              <div className="flex-1 min-h-0 min-w-0">
                <AnswerSheet answers={activeExam.answers} onAnswerChange={updateAnswer} />
              </div>
            </div>
          )}

          {visibleTab === 'notebook' && (
            <Notebook
              notes={activeExam.notes}
              onNoteChange={handleNoteChange}
              onAddFlashcard={addFlashcard}
              flashcardWords={flashcards.map((c) => c.word.toLowerCase())}
              subTab={notebookSubTab}
              onSubTabChange={setNotebookSubTab}
              colloCategory={colloCategory}
              onColloCategoryChange={setColloCategory}
            />
          )}

          {visibleTab === 'flashcards' && (
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

          {visibleTab === 'grammar' && (
            <GrammarPracticeTab
              flashcards={flashcards}
              apiKey={geminiApiKey}
              onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            />
          )}

          {visibleTab === 'ai-sandbox' && (
            <AiSandboxTab />
          )}

          {visibleTab === 'settings' && showSettingsTab && (
            <SettingsTab
              cloudConfig={cloudConfig}
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

        <MobileNavigation activeTab={visibleTab} setActiveTab={setActiveTab} />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <MobileDrawer
          title={mobileDrawerTitle}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {visibleTab === 'practice' && (
            <ExamManager
              activeExam={activeExam}
              exams={exams}
              onCreateExam={() => { createNewExam(); setIsMobileMenuOpen(false) }}
              onRenameExam={renameActiveExam}
              onSelectExam={(id) => { selectExam(id); setIsMobileMenuOpen(false) }}
              progress={progressObject}
            />
          )}
          {visibleTab === 'notebook' && notebookSubTab === 'collo' && (
            <ColloFilterList
              colloCategory={colloCategory}
              colloSearch={colloSearch}
              onCategoryChange={(cat) => { setColloCategory(cat); setIsMobileMenuOpen(false) }}
              onSearchChange={setColloSearch}
            />
          )}
          {visibleTab === 'notebook' && notebookSubTab === 'grammar' && (
            <GrammarFilterList
              selectedIds={activeExam.notes.selectedGrammarFormulaIds}
              grammarSearch={grammarSearch}
              onToggle={toggleGrammarFormula}
              onSearchChange={setGrammarSearch}
            />
          )}

          {visibleTab === 'flashcards' && (
            <div className="px-2 text-left">
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
                dueCount={dueCount}
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

      {/* Alert/Confirm Dialog */}
      <CustomDialog
        isOpen={appDialog.isOpen}
        message={appDialog.message}
        type={appDialog.type}
        variant={appDialog.variant}
        onConfirm={appDialog.onConfirm}
        onCancel={() => setAppDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Custom Toast Notifications Container */}
      <ToastContainer />
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
