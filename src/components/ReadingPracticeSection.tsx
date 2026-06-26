import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen,
  Sparkles,
  Search,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  FileText,
  Clock,
  Layers,
  Award,
  ChevronDown
} from 'lucide-react'
import { createPortal } from 'react-dom'
import type { ToeicReadingPassage } from '../lib/readingDatabase'
import { LOCAL_READING_PASSAGES } from '../lib/readingDatabase'
import { generateAiReadingPassage } from '../lib/geminiApi'
import type { FlashcardItem } from '../lib/toeic'
import { CustomDialog } from './CustomDialog'

type ReadingPracticeSectionProps = {
  flashcards: FlashcardItem[]
  apiKey?: string
  onCloseMobileMenu?: () => void
  onOpenMobileMenu?: () => void
}

const BUSINESS_CATEGORIES = [
  'All Topics',
  'Marketing & Advertising',
  'Human Resources',
  'Finance & Accounting',
  'Logistics & Shipping',
  'IT & Technology',
  'Operations & Management',
  'Purchasing & Procurement',
  'Customer Service'
]

export function ReadingPracticeSection({ flashcards, apiKey, onCloseMobileMenu, onOpenMobileMenu }: ReadingPracticeSectionProps) {
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

  // Timer state for realism
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

  // Get studied words to feed the AI generator
  const studiedWords = useMemo(() => {
    return flashcards.map((c) => c.word)
  }, [flashcards])

  const renderConfigControls = (isMobile: boolean) => {
    const handleLocalLoad = () => {
      loadPassageAndCloseMenu(() => loadLocalPassage(selectedCategory))
    }

    const handleAiGenerate = () => {
      loadPassageAndCloseMenu(handleGenerateAiPassage)
    }

    const loadPassageAndCloseMenu = (action: () => void) => {
      action()
      if (isMobile) {
        onCloseMobileMenu?.()
      }
    }

    if (isMobile) {
      return (
        <div className="flex flex-col gap-4 w-full select-none text-left">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Chủ đề bài đọc</span>
            <div className="relative w-full">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-4 pr-10 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer appearance-none"
              >
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Nguồn bài học</span>
            <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200/35 dark:border-zinc-800 w-full">
              <button
                type="button"
                onClick={() => { setPassageSource('local'); setError(null); }}
                className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer ${
                  passageSource === 'local'
                    ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
                }`}
              >
                Mẫu Offline
              </button>
              <button
                type="button"
                onClick={() => { setPassageSource('ai'); setError(null); }}
                className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                  passageSource === 'ai'
                    ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
                }`}
              >
                <Sparkles className="size-3.5 text-violet-500 fill-violet-500/20" />
                Sinh đề AI
              </button>
            </div>
          </div>

          <div className="pt-2">
            {passageSource === 'local' ? (
              <button
                type="button"
                onClick={handleLocalLoad}
                disabled={isLoading}
                className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-xs font-black tracking-wider uppercase text-slate-800 dark:text-zinc-200 hover:bg-slate-200 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                Tải đề ngẫu nhiên
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isLoading}
                className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white text-xs font-black tracking-wider uppercase transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-55 cursor-pointer shadow-md"
              >
                <Sparkles className="size-4 fill-current" />
                Sinh đề AI 2026
              </button>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 select-none">
        {/* Category selection */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-4 pr-10 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/35 cursor-pointer appearance-none"
          >
            {BUSINESS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
        </div>

        {/* Source switch tab */}
        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200/30 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setPassageSource('local')
              setError(null)
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer ${
              passageSource === 'local'
                ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
            }`}
          >
            Mẫu Offline
          </button>
          <button
            type="button"
            onClick={() => {
              setPassageSource('ai')
              setError(null)
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              passageSource === 'ai'
                ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
            }`}
          >
            <Sparkles className="size-3.5 text-violet-500 fill-violet-500/20" />
            Sinh đề AI
          </button>
        </div>

        {/* Load / Generate Trigger button */}
        {passageSource === 'local' ? (
          <button
            type="button"
            onClick={handleLocalLoad}
            disabled={isLoading}
            className="rounded-2xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200/40 dark:border-zinc-800 px-4 py-2 text-xs font-black tracking-wider uppercase transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Tải đề ngẫu nhiên
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={isLoading}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white px-4 py-2 text-xs font-black tracking-wider uppercase transition hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 disabled:pointer-events-none"
          >
            <Sparkles className="size-3.5 fill-current" />
            Sinh đề AI 2026
          </button>
        )}
      </div>
    )
  }

  // Load a local passage on mount or when requested
  const loadLocalPassage = (categoryFilter = 'All Topics') => {
    setIsLoading(true)
    setError(null)
    setIsSubmitted(false)
    setUserAnswers({})
    setActiveDocumentTab(0)
    setSecondsElapsed(0)
    setMobileViewMode('document') // default to document view on load
    
    setTimeout(() => {
      let filtered = LOCAL_READING_PASSAGES
      if (categoryFilter !== 'All Topics') {
        const cleanCat = categoryFilter.toLowerCase()
        filtered = LOCAL_READING_PASSAGES.filter((p) => {
          return p.category.toLowerCase().includes(cleanCat) || 
                 cleanCat.includes(p.category.toLowerCase())
        })
      }
      
      // If no matches, fallback to all local passages
      if (filtered.length === 0) {
        filtered = LOCAL_READING_PASSAGES
      }
      
      const randomPassage = filtered[Math.floor(Math.random() * filtered.length)]
      setCurrentPassage(randomPassage)
      setIsLoading(false)
      setTimerActive(true)
      setPracticeState('practice')
    }, 500)
  }

  // Dynamic loading steps for AI generation to create a premium feel
  useEffect(() => {
    if (!isLoading || passageSource !== 'ai') return
    
    const steps = [
      'Đang kết nối với mô hình Gemini 2.5-Flash...',
      'Đang trích xuất từ vựng từ Sổ tay học tập của bạn...',
      'Đang kích hoạt tính năng Google Search Grounding để quét xu hướng kinh tế 2026...',
      'Đang biên soạn văn bản đọc hiểu TOEIC song hành thực tế...',
      'Đang khởi tạo các câu hỏi trắc nghiệm phân tích lập luận sâu sắc...',
      'Đang hoàn thiện các bản giải thích đáp án bằng tiếng Việt...'
    ]

    setLoadingStep(0)
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 2500)

    return () => clearInterval(interval)
  }, [isLoading, passageSource])

  // Generate passage with Gemini AI
  const handleGenerateAiPassage = async () => {
    if (!apiKey || !apiKey.trim()) {
      setError('Không tìm thấy API Key Gemini. Vui lòng vào tab Cài đặt cấu hình API Key để kích hoạt tính năng sinh đề bằng trí tuệ nhân tạo.')
      return
    }

    setIsLoading(true)
    setError(null)
    setIsSubmitted(false)
    setUserAnswers({})
    setActiveDocumentTab(0)
    setSecondsElapsed(0)
    setMobileViewMode('document') // default to document view on AI generation

    try {
      const cleanCategory = selectedCategory === 'All Topics' ? 'General Business Operations' : selectedCategory
      
      // Call the API
      const aiPassage = await generateAiReadingPassage(apiKey, studiedWords, cleanCategory)
      
      setCurrentPassage(aiPassage)
      setTimerActive(true)
      setPracticeState('practice')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Có lỗi xảy ra trong quá trình kết nối với Gemini AI. Vui lòng kiểm tra lại cấu hình API Key hoặc thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  // Answer selection handler
  const handleSelectAnswer = (questionId: string, option: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }))
  }

  // Submit test and show results
  const handleSubmit = () => {
    if (!currentPassage) return
    
    // Check if all questions are answered
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
          setCustomDialog(prev => ({ ...prev, isOpen: false }))
        }
      })
    } else {
      submitAction()
    }
  }

  // Restart the current passage test
  const handleRetry = () => {
    setIsSubmitted(false)
    setUserAnswers({})
    setSecondsElapsed(0)
    setTimerActive(true)
    setMobileViewMode('document')
  }

  // Calculate score statistics
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

  // Get loading step text
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

  const portalTarget = typeof document !== 'undefined' ? document.getElementById('mobile-drawer-portal-target') : null

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent select-none">
      {/* Portal content for mobile drawer */}
      {portalTarget && createPortal(
        <div className="lg:hidden space-y-4 text-left">
          {renderConfigControls(true)}
        </div>,
        portalTarget
      )}

      {/* Upper Control Bar */}
      {practiceState === 'practice' && (
        <div className="hidden lg:block border-b border-slate-200/80 dark:border-zinc-800 px-4 py-4 sm:px-6 shrink-0 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-805 dark:text-white flex items-center gap-2">
                <BookOpen className="size-5 text-indigo-605 dark:text-violet-400" />
                Luyện đọc hiểu TOEIC Part 7 (Đọc hiểu Đoạn văn)
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-semibold">
                Hệ thống đang chạy bộ đếm thời gian thực. Hãy tập trung làm bài.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/20 dark:bg-transparent">
        {error && (
          <div className="mx-auto max-w-4xl m-4 p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider">Cấu hình lỗi hoặc sự cố API</h4>
                <p className="text-xs mt-1 leading-relaxed font-semibold">
                  {error}
                </p>
              </div>
            </div>
            {passageSource === 'ai' && !apiKey && (
              <div className="pt-2 border-t border-rose-500/15 flex justify-end">
                <span className="text-[10px] font-bold uppercase text-rose-500/80 tracking-wider">
                  Mẹo: Nhập API Key ở tab Cài đặt sau đó quay lại luyện đề
                </span>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center py-20 px-6 space-y-6 max-w-md mx-auto text-center select-none">
            {passageSource === 'ai' ? (
              <>
                <div className="relative">
                  <div className="size-20 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin flex items-center justify-center">
                    <Sparkles className="size-8 text-violet-500 animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 size-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950">
                    <Search className="size-3 text-white animate-bounce" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-base font-black text-slate-800 dark:text-white">Gemini 2.5-Flash AI Writing Engine</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                    {loadingStepText}
                  </p>
                  <p className="text-[10px] text-violet-600 dark:text-cyan-400 font-bold uppercase tracking-widest animate-pulse">
                    Đang kích hoạt Google Search Grounding...
                  </p>
                </div>

                <div className="w-full bg-slate-200 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
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
        ) : practiceState === 'idle' ? (
          <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 select-none animate-in fade-in slide-in-from-bottom-4 duration-300 text-left">
            <div className="text-center space-y-4 mb-10">
              <div className="mx-auto size-16 bg-indigo-500/10 dark:bg-violet-500/10 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-violet-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <BookOpen className="size-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-905 dark:text-white tracking-tight">
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
                  
                  {/* Category select inside card */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">Chủ đề luyện tập</span>
                    <div className="relative w-full">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/55 pl-4 pr-10 py-3 text-xs font-bold text-slate-750 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none transition"
                      >
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat === 'All Topics' ? 'Tất cả chủ đề' : cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 dark:text-zinc-550 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-auto">
                  <button
                    onClick={() => {
                      setPassageSource('local')
                      loadLocalPassage(selectedCategory)
                    }}
                    className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white text-xs font-black tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    Bắt đầu làm bài (Offline)
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Card 2: AI Online Generator */}
              <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 backdrop-blur-md p-6 sm:p-8 hover:border-violet-500/50 dark:hover:border-violet-500/30 transition-all duration-300 group shadow-sm relative overflow-hidden">
                {/* Top corner gradient glow */}
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
                    <span className="text-[9px] text-violet-650 dark:text-cyan-400 font-extrabold uppercase tracking-widest bg-violet-55/10 dark:bg-cyan-500/10 px-2 py-0.5 rounded-lg">
                      Gemini 2.5
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Sử dụng trí tuệ nhân tạo để viết đoạn văn đọc hiểu TOEIC song hành với thực tế kinh tế năm 2026, tích hợp trực tiếp các từ vựng mới trong Sổ tay của bạn.
                  </p>

                  {/* Category select inside card */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-550">Chủ đề sinh đề AI</span>
                    <div className="relative w-full">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/55 pl-4 pr-10 py-3 text-xs font-bold text-slate-750 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer appearance-none transition"
                      >
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat === 'All Topics' ? 'Tất cả chủ đề' : cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 dark:text-zinc-550 pointer-events-none" />
                    </div>
                  </div>

                  {/* Info badges */}
                  <div className="flex flex-wrap gap-2 pt-1 select-none">
                    <span className="bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-slate-200/30 dark:border-zinc-800/60">
                      Từ vựng tích hợp: <strong className="font-extrabold text-slate-700 dark:text-zinc-200">{studiedWords.length} từ</strong>
                    </span>
                    {apiKey ? (
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
                  {apiKey ? (
                    <button
                      onClick={() => {
                        setPassageSource('ai')
                        handleGenerateAiPassage()
                      }}
                      className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white text-xs font-black tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-indigo-500/10"
                    >
                      <Sparkles className="size-4 fill-current animate-pulse" />
                      Sinh đề AI & Bắt đầu làm
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <button
                        disabled
                        className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-550 text-xs font-black tracking-wider uppercase cursor-not-allowed border border-slate-300 dark:border-zinc-850"
                      >
                        Cần cấu hình API Key
                      </button>
                      <p className="text-[10px] text-amber-655 dark:text-amber-400 text-center font-bold">
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
            
            {/* 📃 Mobile View Switcher Bar - Only visible on mobile (< lg) to avoid vertical stacking clutter */}
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

            {/* Split Screen Layout - Dynamically switches columns on Mobile, displays side-by-side on Desktop */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
              
              {/* Left Column: Reading Passage Documents */}
              <div className={`flex-1 min-w-0 min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-zinc-800 flex flex-col bg-white dark:bg-transparent ${
                mobileViewMode === 'document' ? 'flex' : 'hidden lg:flex'
              }`}>
                {/* Document Header Info */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0 bg-slate-50/40 dark:bg-zinc-950/10 flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-lg">
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

                  {/* Status timer and Stop button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-slate-200/5 select-none shrink-0">
                      <Clock className="size-4 text-slate-400 dark:text-zinc-550 animate-pulse" />
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
                            setCustomDialog(prev => ({ ...prev, isOpen: false }))
                          }
                        })
                      }}
                      className="rounded-xl border border-rose-200 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-500/10 px-3 py-1.5 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-550/20 transition cursor-pointer"
                    >
                      Dừng làm
                    </button>
                  </div>
                </div>

                {/* Document Switcher Tabs (For Double or Triple passages) */}
                {currentPassage.documents.length > 1 && (
                  <div className="px-6 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-950/5 shrink-0 flex flex-nowrap lg:flex-wrap gap-2 overflow-x-auto lg:overflow-x-visible select-none scrollbar-thin">
                    {currentPassage.documents.map((doc, idx) => {
                      const shortTitle = doc.title && doc.title.includes(':') 
                        ? doc.title.split(':')[0].trim().toUpperCase() 
                        : `VĂN BẢN ${idx + 1}`;
                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveDocumentTab(idx)}
                          className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition shrink-0 border flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.97] ${
                            activeDocumentTab === idx
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/80 dark:border-indigo-500/35 text-indigo-700 dark:text-indigo-300'
                              : 'bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                          }`}
                        >
                          <FileText className="size-3.5" />
                          {shortTitle}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Document Text Body content */}
                <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 select-text">
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm min-h-[250px] sm:min-h-[350px]">
                      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-zinc-800/60 pb-2 shrink-0">
                        <FileText className="size-4 text-indigo-600 dark:text-violet-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          {currentPassage.documents[activeDocumentTab]?.title || 'Tài liệu đọc'}
                        </h4>
                      </div>
                      
                      {/* Render paragraph content preserving spacing */}
                      <div className="text-sm font-sans text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-medium tracking-wide">
                        {currentPassage.documents[activeDocumentTab]?.content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Questions and Explanations */}
              <div className={`flex-1 min-h-0 flex flex-col bg-slate-50/10 dark:bg-transparent ${
                mobileViewMode === 'questions' ? 'flex' : 'hidden lg:flex'
              }`}>
                {/* Sidebar Header */}
                <div className="px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800 shrink-0 bg-slate-50/40 dark:bg-zinc-950/10 flex items-center justify-between select-none">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4.5 text-indigo-600 dark:text-violet-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                      Câu hỏi trắc nghiệm ({currentPassage.questions.length} câu)
                    </span>
                  </div>
                  {isSubmitted && (
                    <span className="text-xs font-black text-indigo-600 dark:text-violet-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                      Đã nộp bài
                    </span>
                  )}
                </div>

                {/* Questions Loop Container */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
                  
                  {/* Result Dashboard (Rendered if submitted) */}
                  {isSubmitted && (
                    <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950/60 border border-slate-200/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5 select-none">
                      <div className="flex items-center gap-4">
                        <div className="size-16 rounded-full bg-gradient-to-tr from-violet-100 to-indigo-105 dark:from-violet-500/10 dark:to-indigo-500/10 flex items-center justify-center border border-indigo-100/10 shrink-0">
                          <Award className="size-8 text-indigo-600 dark:text-violet-400" />
                        </div>
                        <div className="space-y-0.5 text-left">
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Kết quả luyện tập</h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                            Đúng <span className="font-black text-indigo-600 dark:text-violet-400 text-sm">{stats.correct}</span> trên tổng số <span className="font-bold">{stats.total}</span> câu hỏi.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Percent badge */}
                        <div className="text-right">
                          <span className="block text-2xl font-black text-slate-800 dark:text-white leading-none">{stats.percentage}%</span>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest">Tỉ lệ chính xác</span>
                        </div>
                        
                        {/* Action trigger */}
                        <button
                          onClick={handleRetry}
                          className="rounded-2xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 px-4 py-2.5 text-xs font-black tracking-wider uppercase transition cursor-pointer"
                        >
                          Làm lại
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mapping Questions */}
                  {currentPassage.questions.map((q, qIdx) => {
                    const selectedOpt = userAnswers[q.id]
                    const isCorrect = selectedOpt === q.correctAnswer
                    const showExplanation = isSubmitted

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-3xl bg-white dark:bg-zinc-950/40 border transition-all duration-300 ${
                          showExplanation
                            ? isCorrect
                              ? 'border-emerald-500/20 dark:border-emerald-500/15 shadow-sm shadow-emerald-500/5'
                              : 'border-rose-500/20 dark:border-rose-500/15 shadow-sm shadow-rose-500/5'
                            : 'border-slate-200/10 shadow-sm'
                        }`}
                      >
                        {/* Question Text */}
                        <div className="flex items-start gap-2.5">
                          <span className="size-6 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-xs font-black rounded-lg flex items-center justify-center shrink-0">
                            {qIdx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed select-text">
                            {q.question}
                          </h4>
                        </div>

                        {/* Options List */}
                        <div className="mt-4 grid grid-cols-1 gap-2.5 select-none">
                          {(Object.keys(q.options) as Array<'A' | 'B' | 'C' | 'D'>).map((optKey) => {
                            const optText = q.options[optKey]
                            const isThisSelected = selectedOpt === optKey
                            const isThisCorrect = q.correctAnswer === optKey
                            
                            // Style resolver for interactive feedback
                            let btnStyle = 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/60 text-slate-700 dark:text-zinc-300'
                            
                            if (isThisSelected) {
                              btnStyle = 'bg-indigo-50/50 border-indigo-300/80 dark:bg-violet-950/20 dark:border-violet-500/35 text-indigo-700 dark:text-violet-300 font-bold'
                            }
                            
                            if (showExplanation) {
                              if (isThisCorrect) {
                                btnStyle = 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-400 font-bold'
                              } else if (isThisSelected) {
                                btnStyle = 'bg-rose-500/15 border-rose-500/35 text-rose-700 dark:text-rose-400 font-bold'
                              } else {
                                btnStyle = 'opacity-50 border-slate-200/10 text-slate-400 dark:text-zinc-400 cursor-not-allowed'
                              }
                            }

                            return (
                              <button
                                key={optKey}
                                onClick={() => handleSelectAnswer(q.id, optKey)}
                                disabled={showExplanation}
                                className={`w-full text-left rounded-2xl border px-4 py-3.5 text-xs transition-all duration-200 flex items-center gap-3 cursor-pointer ${btnStyle}`}
                              >
                                <span className={`size-5.5 rounded-full border text-[10px] font-black flex items-center justify-center shrink-0 ${
                                  isThisSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : showExplanation && isThisCorrect
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 dark:border-zinc-700 text-slate-500 dark:text-zinc-400'
                                }`}>
                                  {optKey}
                                </span>
                                <span className="leading-relaxed font-semibold">{optText}</span>
                              </button>
                            )
                          })}
                        </div>

                        {/* Explanation box (Rendered after submission) */}
                        {showExplanation && (
                          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/10 space-y-2 select-text">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                              <HelpCircle className="size-3.5 text-indigo-600 dark:text-violet-400" />
                              Giải thích & Dịch nghĩa
                            </div>
                            <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400 font-semibold whitespace-pre-line">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Submit panel */}
                {!isSubmitted && (
                  <div className="p-4 border-t border-slate-200/80 dark:border-zinc-800 shrink-0 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-sm select-none">
                    <button
                      onClick={handleSubmit}
                      className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-650 dark:from-violet-500 dark:to-indigo-500 text-white py-3.5 text-xs font-black tracking-wider uppercase transition hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      Nộp bài và xem giải thích
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20 px-6 text-center select-none space-y-4">
            <div className="mx-auto size-16 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-slate-400">
              <AlertCircle className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800 dark:text-white">Không tìm thấy bài đọc</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
                Không thể tải nội dung bài đọc. Vui lòng bấm nút Tải đề ngẫu nhiên hoặc Sinh đề bằng AI để thử lại.
              </p>
            </div>
          </div>
        )}
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
