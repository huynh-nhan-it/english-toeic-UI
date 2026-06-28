import { useState, useEffect, useMemo, useCallback } from 'react'
import { BookOpen, FileText, Clock, AlertCircle, ChevronDown, Sparkles, HelpCircle } from 'lucide-react'
import { createPortal } from 'react-dom'
import { LOCAL_READING_PASSAGES } from '../lib/readingDatabase'
import { generateAiReadingPassage, type ToeicReadingPassage } from '../services/gemini.service'
import { ReadingConfig, BUSINESS_CATEGORIES } from './reading/ReadingConfig'
import { ReadingDocument } from './reading/ReadingDocument'
import { ReadingQuestions } from './reading/ReadingQuestions'
import { CustomDialog } from './CustomDialog'
import { useToeicStore } from '../store/useToeicStore'

type ReadingPracticeSectionProps = {
  onCloseMobileMenu?: () => void
  onOpenMobileMenu?: () => void
}

export function ReadingPracticeSection({
  onCloseMobileMenu,
}: ReadingPracticeSectionProps) {
  const flashcards = useToeicStore((state) => state.flashcards)
  const geminiApiKey = useToeicStore((state) => state.geminiApiKey)

  // Config state
  const [selectedCategory, setSelectedCategory] = useState('All Topics')
  const [passageSource, setPassageSource] = useState<'local' | 'ai'>('local')
  const [practiceState, setPracticeState] = useState<'idle' | 'practice'>('idle')
  
  // Data state
  const [currentPassage, setCurrentPassage] = useState<ToeicReadingPassage | null>(null)
  const [activeDocumentTab, setActiveDocumentTab] = useState(0)
  
  // Mobile View Switcher State (document vs questions)
  const [mobileViewMode, setMobileViewMode] = useState<'document' | 'questions'>('document')

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

  // Interaction state
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Timer state
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  // Format elapsed time
  const formattedTime = useMemo(() => {
    const mins = Math.floor(secondsElapsed / 60)
    const secs = secondsElapsed % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [secondsElapsed])

  // Timer effect
  useEffect(() => {
    let interval: number
    if (timerActive && !isSubmitted) {
      interval = window.setInterval(() => {
        setSecondsElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerActive, isSubmitted])

  // studied words from store
  const studiedWords = useMemo(() => {
    return flashcards.map((c) => c.word)
  }, [flashcards])

  // Load offline passage
  const loadLocalPassage = useCallback((category: string) => {
    setIsLoading(true)
    setError(null)
    setIsSubmitted(false)
    setUserAnswers({})
    setActiveDocumentTab(0)
    setSecondsElapsed(0)
    setMobileViewMode('document')

    setTimeout(() => {
      const filtered = category === 'All Topics'
        ? LOCAL_READING_PASSAGES
        : LOCAL_READING_PASSAGES.filter((p) => p.category === category)

      if (filtered.length === 0) {
        setError(`Thư viện chưa có sẵn đề thuộc chủ đề "${category}". Vui lòng thử sinh đề bằng AI.`)
        setIsLoading(false)
        return
      }

      const randomPassage = filtered[Math.floor(Math.random() * filtered.length)]
      setCurrentPassage(randomPassage)
      setIsLoading(false)
      setTimerActive(true)
      setPracticeState('practice')
    }, 500)
  }, [])

  // Dynamic loading steps for AI generation
  useEffect(() => {
    if (!isLoading || passageSource !== 'ai') return
    
    const stepsCount = 6
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < stepsCount - 1 ? prev + 1 : prev))
    }, 2500)

    return () => clearInterval(interval)
  }, [isLoading, passageSource])

  // Generate passage with Gemini AI
  const handleGenerateAiPassage = useCallback(async () => {
    if (!geminiApiKey || !geminiApiKey.trim()) {
      setError('Không tìm thấy API Key Gemini. Vui lòng vào tab Cài đặt cấu hình API Key để kích hoạt.')
      return
    }

    setIsLoading(true)
    setLoadingStep(0)
    setError(null)
    setIsSubmitted(false)
    setUserAnswers({})
    setActiveDocumentTab(0)
    setSecondsElapsed(0)
    setMobileViewMode('document')

    try {
      const cleanCategory = selectedCategory === 'All Topics' ? 'General Business Operations' : selectedCategory
      const aiPassage = await generateAiReadingPassage(geminiApiKey, studiedWords, cleanCategory)
      
      setCurrentPassage(aiPassage)
      setTimerActive(true)
      setPracticeState('practice')
    } catch (err: unknown) {
      console.error(err)
      const errMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra trong quá trình kết nối với Gemini AI.'
      setError(errMsg)
    } finally {
      setIsLoading(false)
    }
  }, [geminiApiKey, selectedCategory, studiedWords])

  const handleSelectAnswer = useCallback((questionId: string, option: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }))
  }, [isSubmitted])

  const handleSubmit = useCallback(() => {
    if (!currentPassage) return
    
    const totalQuestions = currentPassage.questions.length
    const answeredCount = Object.keys(userAnswers).length
    
    const submitAction = () => {
      setIsSubmitted(true)
      setTimerActive(false)
    }

    if (answeredCount < totalQuestions) {
      setCustomDialog({
        isOpen: true,
        message: `Bạn mới trả lời ${answeredCount}/${totalQuestions} câu hỏi. Bạn có chắc chắn muốn nộp bài?`,
        type: 'confirm',
        variant: 'warning',
        onConfirm: () => {
          submitAction()
          setCustomDialog((prev) => ({ ...prev, isOpen: false }))
        }
      })
    } else {
      submitAction()
    }
  }, [currentPassage, userAnswers])

  const handleRetry = useCallback(() => {
    setIsSubmitted(false)
    setUserAnswers({})
    setSecondsElapsed(0)
    setTimerActive(true)
    setMobileViewMode('document')
  }, [])

  const stats = useMemo(() => {
    if (!currentPassage || !isSubmitted) return { correct: 0, total: 0, percentage: 0 }
    
    let correct = 0
    currentPassage.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct++
      }
    })
    
    const total = currentPassage.questions.length
    const percentage = Math.round((correct / total) * 100)
    
    return { correct, total, percentage }
  }, [currentPassage, userAnswers, isSubmitted])

  const loadingStepText = useMemo(() => {
    const steps = [
      'Đang kết nối với mô hình Gemini 2.5-Flash...',
      'Đang trích xuất từ vựng từ Sổ tay học tập của bạn...',
      'Đang kích hoạt tính năng Google Search Grounding để quét xu hướng kinh tế 2026...',
      'Đang biên soạn văn bản đọc hiểu TOEIC song hành thực tế...',
      'Đang khởi tạo các câu hỏi trắc nghiệm phân tích lập luận sâu sắc...',
      'Đang hoàn thiện các bản giải thích đáp án bằng tiếng Việt...'
    ]
    return steps[loadingStep] || 'Đang xử lý dữ liệu...'
  }, [loadingStep])

  const documentsTextString = useMemo(() => {
    if (!currentPassage) return ''
    return currentPassage.documents.map((d) => `${d.title}\n${d.content}`).join('\n\n')
  }, [currentPassage])

  const portalTarget = typeof document !== 'undefined' ? document.getElementById('mobile-drawer-portal-target') : null

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent select-none">
      {/* Portal content for mobile drawer */}
      {portalTarget && createPortal(
        <div className="lg:hidden space-y-4 text-left">
          <ReadingConfig
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            passageSource={passageSource}
            setPassageSource={setPassageSource}
            onLocalLoad={() => {
              onCloseMobileMenu?.()
              loadLocalPassage(selectedCategory)
            }}
            onAiGenerate={() => {
              onCloseMobileMenu?.()
              handleGenerateAiPassage()
            }}
            apiKeyMissing={!geminiApiKey}
          />
        </div>,
        portalTarget
      )}

      {/* Main Content Pane */}
      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-y-visible">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center py-24 px-6 text-center select-none space-y-6 animate-in fade-in duration-300">
            {passageSource === 'ai' ? (
              <>
                <div className="relative">
                  <div className="size-20 rounded-3xl bg-violet-500/10 dark:bg-violet-500/15 flex items-center justify-center border border-violet-500/20">
                    <Sparkles className="size-10 text-violet-600 dark:text-cyan-400 fill-current animate-pulse" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-violet-500"></span>
                  </div>
                </div>
                
                <div className="space-y-2 max-w-sm mx-auto">
                  <h3 className="text-base font-black text-slate-800 dark:text-white">Gemini 2.5 AI Writing Engine</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                    {loadingStepText}
                  </p>
                </div>

                <div className="w-full max-w-xs bg-slate-200 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${((loadingStep + 1) / 6) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="size-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Đang tải đề thi ngoại tuyến...</p>
              </div>
            )}
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto py-12 px-6 text-center space-y-4 animate-in fade-in duration-200 select-none">
            <div className="mx-auto size-14 bg-rose-500/10 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-600 border border-rose-500/20">
              <AlertCircle className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-slate-800 dark:text-white">Có lỗi xảy ra</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-405 leading-relaxed font-medium">
                {error}
              </p>
            </div>
            <button
              onClick={() => { setError(null); setPracticeState('idle'); }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-extrabold cursor-pointer transition"
            >
              Quay lại màn hình chọn đề
            </button>
          </div>
        ) : practiceState === 'idle' ? (
          <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 select-none animate-in fade-in slide-in-from-bottom-4 duration-300 text-left">
            <div className="text-center space-y-4 mb-10">
              <div className="mx-auto size-16 bg-indigo-500/10 dark:bg-violet-500/10 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-violet-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <BookOpen className="size-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Luyện Đọc Hiểu TOEIC Part 7
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
                  Luyện tập kỹ năng đọc hiểu qua các đoạn văn đơn, kép hoặc ba đoạn bám sát cấu trúc đề thi thực tế năm 2026. Hỗ trợ sinh đề thi thông minh cá nhân hóa bằng AI.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Card 1: Offline Practice */}
              <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 backdrop-blur-md p-6 sm:p-8 hover:border-indigo-500/50 dark:hover:border-indigo-500/30 transition-all duration-300 group shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 shrink-0">
                      <FileText className="size-5" />
                    </div>
                    <h4 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Đề mẫu Offline
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Làm bài đọc hiểu chất lượng cao được tuyển chọn và lưu trữ sẵn có trong thư viện ứng dụng. Không cần kết nối mạng.
                  </p>
                  
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">Chủ đề luyện tập</span>
                    <div className="relative w-full">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/55 pl-4 pr-10 py-3 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none transition"
                      >
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat === 'All Topics' ? 'Tất cả chủ đề' : cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-auto">
                  <button
                    onClick={() => loadLocalPassage(selectedCategory)}
                    className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white text-xs font-black tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    Bắt đầu làm bài (Offline)
                  </button>
                </div>
              </div>

              {/* Card 2: AI Online Generator */}
              <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 backdrop-blur-md p-6 sm:p-8 hover:border-violet-500/50 dark:hover:border-violet-500/30 transition-all duration-300 group shadow-sm relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-500/10 dark:bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-500/20 shrink-0">
                        <Sparkles className="size-5 fill-violet-500/10 dark:fill-violet-400/10 animate-pulse" />
                      </div>
                      <h4 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                        Sinh đề bằng AI
                      </h4>
                    </div>
                    <span className="text-[9px] text-violet-600 dark:text-cyan-400 font-extrabold uppercase tracking-widest bg-violet-50/10 dark:bg-cyan-500/10 px-2 py-0.5 rounded-lg">
                      Gemini 2.5
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Sử dụng trí tuệ nhân tạo để viết đoạn văn đọc hiểu TOEIC song hành với thực tế kinh tế năm 2026, tích hợp trực tiếp các từ vựng mới trong Sổ tay của bạn.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">Chủ đề sinh đề AI</span>
                    <div className="relative w-full">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/55 pl-4 pr-10 py-3 text-xs font-bold text-slate-800 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer appearance-none transition"
                      >
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat === 'All Topics' ? 'Tất cả chủ đề' : cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-slate-200/30 dark:border-zinc-800/60">
                      Từ vựng tích hợp: <strong className="font-extrabold text-slate-700 dark:text-zinc-200">{studiedWords.length} từ</strong>
                    </span>
                    {geminiApiKey ? (
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                        API Key đã sẵn sàng
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-amber-500/20">
                        Chưa cấu hình API Key
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-6 mt-auto">
                  {geminiApiKey ? (
                    <button
                      onClick={handleGenerateAiPassage}
                      className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white text-xs font-black tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-indigo-500/10"
                    >
                      Sinh đề AI & Bắt đầu làm
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <button
                        disabled
                        className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-200 dark:bg-zinc-800 text-slate-405 dark:text-zinc-500 text-xs font-black tracking-wider uppercase cursor-not-allowed border border-slate-300 dark:border-zinc-800"
                      >
                        Cần cấu hình API Key
                      </button>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center font-bold">
                        Hãy thêm API Key Google Gemini trong tab Cài đặt để kích hoạt.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : currentPassage ? (
          <div className="h-full flex flex-col min-h-0">
            {/* 📃 Mobile View Switcher Bar */}
            <div className="lg:hidden px-4 py-2 border-b border-slate-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/20 backdrop-blur flex justify-center shrink-0 select-none">
              <div className="flex bg-slate-100 dark:bg-zinc-950/85 p-1 rounded-2xl border border-slate-200/30 dark:border-zinc-800 w-full max-w-sm">
                <button
                  onClick={() => setMobileViewMode('document')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    mobileViewMode === 'document'
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
                  }`}
                >
                  <FileText className="size-4" />
                  Đọc Tài Liệu
                </button>
                <button
                  onClick={() => setMobileViewMode('questions')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer relative ${
                    mobileViewMode === 'questions'
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
                  }`}
                >
                  <HelpCircle className="size-4" />
                  Làm Câu Hỏi
                  <span className="text-[10px] bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded-full font-bold">
                    {Object.keys(userAnswers).length}/{currentPassage.questions.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-transparent">
              
              {/* Left Column: Reading Passage Documents */}
              <div className={`flex-1 min-w-0 min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-zinc-800 flex flex-col bg-white dark:bg-transparent ${
                mobileViewMode === 'document' ? 'flex' : 'hidden lg:flex'
              }`}>
                {/* Document Header Info */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0 bg-slate-50/40 dark:bg-zinc-950/10 flex items-center justify-between">
                  <div className="space-y-0.5 pr-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-lg">
                        Part 7
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                        {currentPassage.type === 'single' ? 'Đoạn đơn' : currentPassage.type === 'double' ? 'Đoạn kép' : 'Đoạn ba'}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">
                      {currentPassage.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-slate-200/5 select-none shrink-0">
                      <Clock className="size-4 text-slate-400 dark:text-zinc-500 animate-pulse" />
                      {formattedTime}
                    </div>
                    
                    <button
                      onClick={() => {
                        setCustomDialog({
                          isOpen: true,
                          message: 'Bạn có chắc muốn dừng làm bài và quay lại màn hình chính? Tiến trình bài làm hiện tại sẽ bị hủy.',
                          type: 'confirm',
                          variant: 'warning',
                          onConfirm: () => {
                            setTimerActive(false)
                            setPracticeState('idle')
                            setCurrentPassage(null)
                            setIsSubmitted(false)
                            setUserAnswers({})
                            setSecondsElapsed(0)
                            setCustomDialog((prev) => ({ ...prev, isOpen: false }))
                          }
                        })
                      }}
                      className="rounded-xl border border-rose-200 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-500/10 px-3 py-1.5 text-xs font-black text-rose-600 dark:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition cursor-pointer"
                    >
                      Dừng làm
                    </button>
                  </div>
                </div>

                {/* Document Display Panel */}
                <ReadingDocument
                  currentPassage={currentPassage}
                  activeDocumentTab={activeDocumentTab}
                  setActiveDocumentTab={setActiveDocumentTab}
                />
              </div>

              {/* Right Column: Questions and Explanations */}
              <div className={`flex-1 min-h-0 flex flex-col bg-slate-50/10 dark:bg-transparent ${
                mobileViewMode === 'questions' ? 'flex' : 'hidden lg:flex'
              }`}>
                <ReadingQuestions
                  currentPassage={currentPassage}
                  userAnswers={userAnswers}
                  onSelectAnswer={handleSelectAnswer}
                  isSubmitted={isSubmitted}
                  onSubmit={handleSubmit}
                  onRetry={handleRetry}
                  stats={stats}
                  documentsContent={documentsTextString}
                />
              </div>

            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20 px-6 text-center select-none space-y-4">
            <div className="mx-auto size-16 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-slate-400">
              <AlertCircle className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-805 dark:text-white">Không tìm thấy bài đọc</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
                Không thể tải nội dung bài đọc. Vui lòng bấm nút Tải đề ngẫu nhiên hoặc Sinh đề bằng AI để thử lại.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alert/Confirm Dialog */}
      <CustomDialog
        isOpen={customDialog.isOpen}
        message={customDialog.message}
        type={customDialog.type}
        variant={customDialog.variant}
        onConfirm={customDialog.onConfirm}
        onCancel={() => setCustomDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
