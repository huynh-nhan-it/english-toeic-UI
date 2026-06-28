import { useState, useCallback } from 'react'
import { Layers, Award, HelpCircle, ArrowRight, Sparkles } from 'lucide-react'
import type { ToeicReadingPassage } from '../../services/gemini.service'
import { useToeicStore, useResolvedGeminiApiKey } from '../../store/useToeicStore'

type ReadingQuestionsProps = {
  currentPassage: ToeicReadingPassage
  userAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>
  onSelectAnswer: (questionId: string, option: 'A' | 'B' | 'C' | 'D') => void
  isSubmitted: boolean
  onSubmit: () => void
  onRetry: () => void
  stats: { correct: number; total: number; percentage: number }
  documentsContent: string
}

export function ReadingQuestions({
  currentPassage,
  userAnswers,
  onSelectAnswer,
  isSubmitted,
  onSubmit,
  onRetry,
  stats,
  documentsContent,
}: ReadingQuestionsProps) {
  const geminiApiKey = useResolvedGeminiApiKey()
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [loadingExplainer, setLoadingExplainer] = useState<Record<string, boolean>>({})

  // Ask AI Explainer Handler
  const handleAskAiExplainer = useCallback(async (qId: string, questionText: string, options: Record<'A' | 'B' | 'C' | 'D', string>, userAns: string, correctAns: string) => {
    if (!geminiApiKey) {
      useToeicStore.getState().showToast(
        'Vui lòng thêm API Key Google Gemini trong tab Cài đặt cấu hình để kích hoạt tính năng trợ lý AI giải thích.',
        'warning',
        'Thiếu API Key'
      )
      return
    }

    setLoadingExplainer((prev) => ({ ...prev, [qId]: true }))

    try {
      const prompt = `You are an elite English teacher and TOEIC expert.
A student did a Part 7 reading question:
Question: "${questionText}"
Options:
A: ${options.A}
B: ${options.B}
C: ${options.C}
D: ${options.D}

The student answered: "${userAns || 'No Answer'}"
The correct answer is: "${correctAns}"

Here is the document context the question refers to:
"""
${documentsContent}
"""

Provide a detailed, encouraging explanation in Vietnamese.
Analyze:
1. Why the student's answer "${userAns || 'No Answer'}" is incorrect (or why it is correct if they chose right).
2. Direct proof and clues from the document (translate the exact sentences to Vietnamese).
3. The grammatical or contextual logic for the correct answer "${correctAns}".
4. Key TOEIC vocabulary words found in this question with their definitions and Vietnamese translations.

Keep the tone supportive, premium, and structured using clean markdown bullet points.`

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey.trim()}`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6 }
        })
      })

      if (!res.ok) throw new Error('API call failed')
      
      const resData = await res.json()
      const explanation = resData?.candidates?.[0]?.content?.parts?.[0]?.text || 'Không nhận được câu trả lời từ AI.'
      
      setAiExplanations((prev) => ({ ...prev, [qId]: explanation }))
    } catch (err) {
      console.error(err)
      setAiExplanations((prev) => ({ ...prev, [qId]: 'Có lỗi kết nối xảy ra khi liên hệ Trợ lý AI. Vui lòng thử lại sau.' }))
    } finally {
      setLoadingExplainer((prev) => ({ ...prev, [qId]: false }))
    }
  }, [geminiApiKey, documentsContent])

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-slate-50/10 dark:bg-transparent animate-in fade-in duration-200">
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

      {/* Questions Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 min-h-0">
        {/* Result Dashboard */}
        {isSubmitted && (
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950/60 border border-slate-200/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5 select-none animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-gradient-to-tr from-violet-100 to-indigo-100 dark:from-violet-500/10 dark:to-indigo-500/10 flex items-center justify-center border border-indigo-100/10 shrink-0">
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
              <div className="text-right">
                <span className="block text-2xl font-black text-slate-800 dark:text-white leading-none">{stats.percentage}%</span>
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest">Tỉ lệ chính xác</span>
              </div>
              <button
                onClick={onRetry}
                className="rounded-2xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 px-4 py-2.5 text-xs font-black tracking-wider uppercase transition cursor-pointer"
              >
                Làm lại
              </button>
            </div>
          </div>
        )}

        {/* Questions map */}
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
                <span className="size-6 bg-slate-100 dark:bg-zinc-900 text-slate-705 dark:text-zinc-300 text-xs font-black rounded-lg flex items-center justify-center shrink-0">
                  {qIdx + 1}
                </span>
                <h4 className="text-sm font-bold text-slate-805 dark:text-white leading-relaxed select-text text-left">
                  {q.question}
                </h4>
              </div>

              {/* Options */}
              <div className="mt-4 grid grid-cols-1 gap-2.5 select-none">
                {(Object.keys(q.options) as Array<'A' | 'B' | 'C' | 'D'>).map((optKey) => {
                  const optText = q.options[optKey]
                  const isThisSelected = selectedOpt === optKey
                  const isThisCorrect = q.correctAnswer === optKey

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
                      onClick={() => onSelectAnswer(q.id, optKey)}
                      disabled={showExplanation}
                      className={`w-full text-left rounded-2xl border px-4 py-3.5 text-xs transition-all duration-205 flex items-center gap-3 cursor-pointer ${btnStyle}`}
                    >
                      <span className={`size-5.5 rounded-full border text-[10px] font-black flex items-center justify-center shrink-0 ${
                        isThisSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : showExplanation && isThisCorrect
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-zinc-700 text-slate-500 dark:text-zinc-500'
                      }`}>
                        {optKey}
                      </span>
                      <span className="leading-relaxed font-semibold">{optText}</span>
                    </button>
                  )
                })}
              </div>

              {/* Standard Explanation */}
              {showExplanation && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/10 space-y-3 select-text text-left">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/20 dark:border-zinc-800 pb-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      <HelpCircle className="size-3.5 text-indigo-600 dark:text-violet-400" />
                      Giải thích & Dịch nghĩa
                    </div>
                    {/* Ask AI explainer trigger */}
                    {geminiApiKey && (
                      <button
                        onClick={() => handleAskAiExplainer(q.id, q.question, q.options, selectedOpt || '', q.correctAnswer)}
                        disabled={loadingExplainer[q.id]}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold rounded-lg bg-gradient-to-r from-violet-605 to-indigo-605 text-white dark:from-violet-500 dark:to-indigo-500 hover:scale-[1.03] transition spring-transition cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="size-2.5 fill-current animate-pulse" />
                        {loadingExplainer[q.id] ? 'AI đang phân tích...' : 'Hỏi Trợ lý AI giải thích'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-605 dark:text-zinc-300 font-semibold whitespace-pre-line">
                    {q.explanation}
                  </p>

                  {/* Dynamic AI Explanation */}
                  {aiExplanations[q.id] && (
                    <div className="mt-3 p-4 rounded-xl bg-violet-50/30 dark:bg-violet-950/10 border border-violet-500/20 dark:border-violet-500/20 text-left animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">
                        <Sparkles className="size-3 fill-current" />
                        Trợ lý giải thích chuyên sâu (Ask AI Explainer)
                      </div>
                      <div className="text-[11px] leading-relaxed text-slate-700 dark:text-zinc-300 whitespace-pre-line select-text font-medium font-sans">
                        {aiExplanations[q.id]}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Submit footer bar */}
      {!isSubmitted && (
        <div className="p-4 border-t border-slate-200/80 dark:border-zinc-800 shrink-0 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-sm select-none">
          <button
            onClick={onSubmit}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white py-3.5 text-xs font-black tracking-wider uppercase transition hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            Nộp bài và xem giải thích
            <ArrowRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
