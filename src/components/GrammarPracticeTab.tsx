import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Check,
  X,
  Timer,
  ArrowRight,
  Award,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Layers,
  BookOpen,
  Sparkles
} from 'lucide-react'
import { GRAMMAR_QUESTIONS, type GrammarQuestion } from '../lib/grammarDatabase'
import { TOEIC_GRAMMAR_FORMULAS } from '../lib/toeic'
import { ReadingPracticeSection } from './ReadingPracticeSection'
import { generateAiGrammarQuestions } from '../lib/geminiApi'
import type { FlashcardItem } from '../lib/toeic'
import { CustomDialog } from './CustomDialog'

type GrammarPracticeTabProps = {
  flashcards: FlashcardItem[]
  apiKey?: string
  onCloseMobileMenu?: () => void
  onOpenMobileMenu?: () => void
}

export function GrammarPracticeTab({ flashcards, apiKey, onCloseMobileMenu, onOpenMobileMenu }: GrammarPracticeTabProps) {
  // Segment state: part56 (Grammar MCQ) vs part7 (Reading Comprehension)
  const [activeSubSection, setActiveSubSection] = useState<'part56' | 'part7'>('part56')

  // Grammar Quiz States
  const [quizState, setQuizState] = useState<'idle' | 'quiz' | 'result'>('idle')
  const [questions, setQuestions] = useState<GrammarQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [isAnswered, setIsAnswered] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [incorrectQuestionIds, setIncorrectQuestionIds] = useState<string[]>([])
  const [isReviewingMistakes, setIsReviewingMistakes] = useState(false)

  // AI Generation States
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const timerRef = useRef<number | null>(null)

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

  // Start a new quiz with 30 random questions (Offline mode)
  const startQuiz = useCallback((mistakesOnly = false) => {
    let pool = GRAMMAR_QUESTIONS
    setError(null)

    if (mistakesOnly && incorrectQuestionIds.length > 0) {
      pool = GRAMMAR_QUESTIONS.filter((q) => incorrectQuestionIds.includes(q.id))
      setIsReviewingMistakes(true)
    } else {
      setIsReviewingMistakes(false)
    }

    // Shuffle and pick 30 (or all if pool is smaller)
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const limit = Math.min(30, shuffled.length)
    setQuestions(shuffled.slice(0, limit))
    
    // Reset states
    setCurrentIndex(0)
    setSelectedAnswers({})
    setIsAnswered(false)
    setElapsedTime(0)
    setQuizState('quiz')

    // Start timer
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
  }, [incorrectQuestionIds])

  // Start a new quiz generated online by Gemini AI
  const startQuizAi = useCallback(async () => {
    if (!apiKey || !apiKey.trim()) {
      setError('Không tìm thấy API Key Gemini. Vui lòng vào tab Cài đặt để cấu hình API Key trước khi kích hoạt tính năng sinh đề thi trực tuyến bằng AI.')
      return
    }

    setIsLoading(true)
    setError(null)
    setSelectedAnswers({})
    setIsAnswered(false)
    setElapsedTime(0)
    setIsReviewingMistakes(false)

    try {
      const aiQuestions = await generateAiGrammarQuestions(apiKey)
      setQuestions(aiQuestions)
      setCurrentIndex(0)
      setQuizState('quiz')

      // Start timer
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Có lỗi xảy ra trong quá trình kết nối với Gemini AI.')
    } finally {
      setIsLoading(false)
    }
  }, [apiKey])

  // Dynamic loading steps for AI grammar generation
  useEffect(() => {
    if (!isLoading) return
    const steps = [
      'Đang kết nối với mô hình Gemini 2.5-Flash...',
      'Đang xây dựng câu hỏi ngữ pháp TOEIC Part 5 & 6 nâng cao 2026...',
      'Đang thiết lập đáp án trắc nghiệm chuẩn xác...',
      'Đang soạn thảo phần giải thích ngữ pháp chi tiết bằng tiếng Việt...'
    ]

    setLoadingStep(0)
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 2500)

    return () => clearInterval(interval)
  }, [isLoading])

  // Stop timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  const currentQuestion = questions[currentIndex] || null
  const userAnswer = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined

  const handleSelectOption = useCallback((option: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered || !currentQuestion) return

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }))
    setIsAnswered(true)
  }, [isAnswered, currentQuestion])

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setIsAnswered(false)
    } else {
      // Finished quiz, stop timer
      if (timerRef.current) window.clearInterval(timerRef.current)
      
      // Calculate incorrect IDs
      const mistakes: string[] = []
      questions.forEach((q) => {
        if (selectedAnswers[q.id] !== q.correctAnswer) {
          mistakes.push(q.id)
        }
      })
      setIncorrectQuestionIds(mistakes)
      setQuizState('result')
    }
  }, [currentIndex, questions, selectedAnswers])

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate score stats
  const score = useMemo(() => {
    let correct = 0
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++
      }
    })
    return correct
  }, [questions, selectedAnswers])

  // Breakdown results by grammar topic
  const topicStats = useMemo(() => {
    if (quizState !== 'result') return []

    const topics: Record<string, { total: number; correct: number }> = {}
    questions.forEach((q) => {
      if (!topics[q.topic]) {
        topics[q.topic] = { total: 0, correct: 0 }
      }
      topics[q.topic].total++
      if (selectedAnswers[q.id] === q.correctAnswer) {
        topics[q.topic].correct++
      }
    })

    return Object.entries(topics).map(([topicId, data]) => {
      const formula = TOEIC_GRAMMAR_FORMULAS.find((f) => f.id === topicId)
      return {
        id: topicId,
        title: formula ? formula.title : topicId,
        total: data.total,
        correct: data.correct,
        percentage: Math.round((data.correct / data.total) * 100),
      }
    })
  }, [quizState, questions, selectedAnswers])

  // Get loading step text
  const loadingStepText = useMemo(() => {
    const steps = [
      'Đang kết nối với mô hình Gemini 2.5-Flash...',
      'Đang xây dựng câu hỏi ngữ pháp TOEIC Part 5 & 6 nâng cao 2026...',
      'Đang thiết lập đáp án trắc nghiệm chuẩn xác...',
      'Đang soạn thảo phần giải thích ngữ pháp chi tiết bằng tiếng Việt...'
    ]
    return steps[loadingStep] || 'Đang xử lý dữ liệu...'
  }, [loadingStep])

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* Sub-Section Segment Control Bar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 sm:px-6 sm:py-3 shrink-0 bg-white dark:bg-zinc-900/40 flex justify-center sm:justify-start">
        <div className="flex bg-zinc-100 dark:bg-zinc-950 p-0.5 sm:p-1 rounded-2xl border border-zinc-200/40 dark:border-zinc-800 select-none w-full sm:w-auto">
          <button
            onClick={() => setActiveSubSection('part56')}
            className={`flex-1 sm:flex-none px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.98] ${
              activeSubSection === 'part56'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-cyan-400 shadow-sm font-extrabold'
                : 'text-zinc-500 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-100'
            }`}
          >
            <Layers className="size-3.5 sm:size-4 shrink-0" />
            <span className="sm:hidden">Ngữ pháp (5-6)</span>
            <span className="hidden sm:inline">Trắc nghiệm Ngữ pháp (Part 5-6)</span>
          </button>
          <button
            onClick={() => setActiveSubSection('part7')}
            className={`flex-1 sm:flex-none px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.98] ${
              activeSubSection === 'part7'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-cyan-400 shadow-sm font-extrabold'
                : 'text-zinc-500 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-100'
            }`}
          >
            <BookOpen className="size-3.5 sm:size-4 shrink-0" />
            <span className="sm:hidden">Đọc hiểu (7)</span>
            <span className="hidden sm:inline">Đọc hiểu Đoạn văn (Part 7)</span>
          </button>
        </div>
      </div>

      {/* Conditional Rendering of Subsections */}
      {activeSubSection === 'part7' ? (
        <div className="flex-1 min-h-0">
          <ReadingPracticeSection
            flashcards={flashcards}
            apiKey={apiKey}
            onCloseMobileMenu={onCloseMobileMenu}
            onOpenMobileMenu={onOpenMobileMenu}
          />
        </div>
      ) : (
        /* Part 5 & 6 Grammar MCQ Subsection */
        <div className="flex-1 min-h-0 flex flex-col">
          {quizState === 'quiz' && (
            <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 sm:px-6 shrink-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    Câu {currentIndex + 1} / {questions.length}
                  </span>
                  <div className="w-24 sm:w-32 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 dark:bg-emerald-400 transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    <Timer className="size-4 text-indigo-500 dark:text-emerald-400 animate-pulse" />
                    <span className="font-mono tabular-nums">{formatTime(elapsedTime)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setCustomDialog({
                        isOpen: true,
                        message: 'Bạn có chắc muốn dừng làm bài và quay lại màn hình chính? Tiến trình bài làm hiện tại sẽ bị hủy.',
                        type: 'confirm',
                        variant: 'warning',
                        onConfirm: () => {
                          if (timerRef.current) window.clearInterval(timerRef.current)
                          setQuizState('idle')
                          setCustomDialog(prev => ({ ...prev, isOpen: false }))
                        }
                      })
                    }}
                    className="rounded-xl border border-rose-200 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-500/10 px-3 py-1 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    Dừng làm
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 bg-slate-50/20 dark:bg-transparent">
            <div className="mx-auto max-w-2xl">
              
              {/* Error Banner */}
              {error && (
                <div className="mb-6 p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 space-y-2 select-text">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-5 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider">Lỗi kết nối hoặc Cấu hình</h4>
                      <p className="text-xs mt-1 leading-relaxed font-semibold">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading AI Screen */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 space-y-6 text-center select-none max-w-md mx-auto">
                  <div className="relative">
                    <div className="size-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin flex items-center justify-center">
                      <Sparkles className="size-6 text-violet-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-slate-800 dark:text-white">Gemini AI Grammar Writer</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                      {loadingStepText}
                    </p>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${((loadingStep + 1) / 4) * 100}%` }}
                    />
                  </div>
                </div>
              ) : quizState === 'idle' ? (
                <div className="text-center rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm space-y-6">
                  <div className="mx-auto size-16 bg-indigo-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-indigo-650 dark:text-emerald-400">
                    <Award className="size-8 animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">Luyện Ngữ Pháp TOEIC</h3>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Luyện tập 15 hoặc 30 câu hỏi trắc nghiệm ngữ pháp chất lượng cao, bám sát các cấu trúc ngữ pháp thương mại nâng cao của TOEIC Part 5 & 6 năm 2026.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-3.5 pt-2">
                    <button
                      onClick={() => startQuiz(false)}
                      className="inline-flex min-h-11 h-auto py-3 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 px-8 text-[11px] font-black uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
                    >
                      Làm đề ngẫu nhiên (Offline)
                    </button>
                    <button
                      onClick={startQuizAi}
                      className="inline-flex min-h-11 h-auto py-3 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white px-8 text-[11px] font-black uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-sm shadow-indigo-500/10 whitespace-nowrap"
                    >
                      <Sparkles className="size-4 fill-current animate-pulse" />
                      Sinh đề bằng AI (Online)
                    </button>
                  </div>
                </div>
              ) : null}

              {quizState === 'quiz' && currentQuestion && (
                <div className="space-y-6">
                  {/* Question Card */}
                  <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 dark:bg-emerald-500/10 text-indigo-700 dark:text-emerald-400 px-3 py-1 rounded-lg">
                        {TOEIC_GRAMMAR_FORMULAS.find((f) => f.id === currentQuestion.topic)?.title || 'TOEIC Grammar'}
                      </span>
                    </div>
                    <h4 className="text-base font-bold leading-relaxed text-zinc-900 dark:text-white select-text">
                      {currentQuestion.question}
                    </h4>
                  </div>

                  {/* Options Grid */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const optText = currentQuestion.options[opt]
                      const isSelected = userAnswer === opt
                      const isCorrectOpt = currentQuestion.correctAnswer === opt

                      let buttonStyle = 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-indigo-300 dark:hover:border-emerald-600 cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                      
                      if (isAnswered) {
                        if (isCorrectOpt) {
                          buttonStyle = 'border-emerald-500 dark:border-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 font-bold'
                        } else if (isSelected) {
                          buttonStyle = 'border-red-500 dark:border-red-450 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold'
                        } else {
                          buttonStyle = 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-400 opacity-60 cursor-default'
                        }
                      }

                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectOption(opt)}
                          disabled={isAnswered}
                          className={`flex items-center gap-3 w-full border text-left p-4 rounded-2xl font-medium transition duration-200 ${buttonStyle}`}
                        >
                          <span className={`flex size-6 items-center justify-center rounded-full text-[10px] font-black shrink-0 ${
                            isAnswered && isCorrectOpt
                              ? 'bg-emerald-500 text-white dark:bg-emerald-400 dark:text-zinc-950'
                              : isAnswered && isSelected
                                ? 'bg-red-500 text-white dark:bg-red-400 dark:text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                          }`}>
                            {isAnswered && isCorrectOpt ? <Check className="size-3.5" /> : isAnswered && isSelected ? <X className="size-3.5" /> : opt}
                          </span>
                          <span className="flex-1 text-xs font-semibold leading-relaxed">{optText}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Feedback and Explanation */}
                  {isAnswered && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 select-text">
                      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                        <div className="flex gap-2.5 items-start text-zinc-800 dark:text-zinc-200">
                          <AlertCircle className="size-4.5 shrink-0 mt-0.5 text-indigo-500 dark:text-emerald-400" />
                          <div className="space-y-1.5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Giải thích ngữ pháp chi tiết</p>
                            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium whitespace-pre-line">
                              {currentQuestion.explanation}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleNext}
                        className="w-full flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-emerald-500 dark:to-emerald-600 text-xs font-black tracking-wider uppercase text-white dark:text-zinc-950 hover:scale-[1.01] active:scale-[0.99] transition shadow-sm cursor-pointer"
                      >
                        {currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành và chấm điểm'}
                        <ArrowRight className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {quizState === 'result' && (
                <div className="space-y-6">
                  {/* Score Dashboard Card */}
                  <div className="text-center rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Kết quả làm bài trắc nghiệm</h3>
                    <div className="inline-flex flex-col items-center">
                      <span className="text-5xl font-black text-indigo-600 dark:text-emerald-400 tracking-tight">
                        {score} / {questions.length}
                      </span>
                      <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-1">
                        Đúng {Math.round((score / questions.length) * 100)}% (Thời gian: {formatTime(elapsedTime)})
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          // If current set is AI generated, reload AI set, else offline
                          if (questions[0]?.id.startsWith('gq-ai-')) {
                            startQuizAi();
                          } else {
                            startQuiz(false);
                          }
                        }}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 dark:bg-emerald-500 px-5 text-xs font-black text-white dark:text-zinc-950 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm uppercase tracking-wider"
                      >
                        <RefreshCw className="size-3.5" />
                        Làm đề mới
                      </button>
                      {incorrectQuestionIds.length > 0 && (
                        <button
                          onClick={() => startQuiz(true)}
                          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-5 text-xs font-black text-red-650 dark:text-red-400 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer uppercase tracking-wider"
                        >
                          <RotateCcw className="size-3.5" />
                          Luyện câu sai ({incorrectQuestionIds.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Topic performance breakdown */}
                  <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-widest">
                      Phân tích hiệu suất theo chủ điểm ngữ pháp
                    </h4>
                    <div className="divide-y divide-zinc-150 dark:divide-zinc-800">
                      {topicStats.map((topic) => (
                        <div key={topic.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="space-y-0.5 text-left">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{topic.title}</span>
                            <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wide">
                              Đúng {topic.correct}/{topic.total} câu ({topic.percentage}%)
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden shrink-0">
                              <div
                                className={`h-full rounded-full ${
                                  topic.percentage >= 80
                                    ? 'bg-emerald-500'
                                    : topic.percentage >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                                    }`}
                                style={{ width: `${topic.percentage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-black min-w-[2.2rem] text-right ${
                              topic.percentage >= 80
                                ? 'text-emerald-500'
                                : topic.percentage >= 50
                                  ? 'text-amber-500'
                                  : 'text-red-500'
                            }`}>
                              {topic.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
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
