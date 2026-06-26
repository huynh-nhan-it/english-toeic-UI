import { memo, useCallback, useRef } from 'react'
import { PARTS, type AnswerChoice } from '../lib/toeic'
import { PartSection } from './PartSection'

type AnswerSheetProps = {
  answers: Record<number, AnswerChoice>
  onAnswerChange: (questionNumber: number, answer: AnswerChoice) => void
}

export const AnswerSheet = memo(function AnswerSheet({ answers, onAnswerChange }: AnswerSheetProps) {
  const inputRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const registerInput = useCallback((questionNumber: number, node: HTMLDivElement | null) => {
    inputRefs.current[questionNumber] = node
  }, [])

  const focusQuestion = useCallback((questionNumber: number) => {
    inputRefs.current[questionNumber]?.focus()
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      {/* Answer Sheet Tab Header */}
      <div className="border-b border-slate-200/80 dark:border-zinc-800/80 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Bảng trả lời (Answer Sheet)</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              200 câu hỏi TOEIC được chia thành 7 phần nghe và đọc.
            </p>

          </div>
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800/80 px-3 py-1 text-xs font-bold text-slate-500 dark:text-zinc-400 bg-white/40 dark:bg-zinc-950/20 backdrop-blur">
            A-D
          </div>
        </div>
      </div>

      {/* Grid wrapper scroll area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="space-y-6">
          {PARTS.map((part) => (
            <PartSection
              key={part.id}
              answers={answers}
              onAnswerChange={onAnswerChange}
              onFocusQuestion={focusQuestion}
              part={part}
              registerInput={registerInput}
            />
          ))}
        </div>
      </div>
    </div>
  )
})
