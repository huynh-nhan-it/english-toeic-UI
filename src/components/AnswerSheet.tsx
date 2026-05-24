import { memo, useCallback, useRef } from 'react'
import { PARTS, type AnswerChoice } from '../lib/toeic'
import { PartSection } from './PartSection'

type AnswerSheetProps = {
  answers: Record<number, AnswerChoice>
  onAnswerChange: (questionNumber: number, answer: AnswerChoice) => void
}

export const AnswerSheet = memo(function AnswerSheet({ answers, onAnswerChange }: AnswerSheetProps) {
  const inputRefs = useRef<Record<number, HTMLSelectElement | null>>({})

  const registerInput = useCallback((questionNumber: number, node: HTMLSelectElement | null) => {
    inputRefs.current[questionNumber] = node
  }, [])

  const focusQuestion = useCallback((questionNumber: number) => {
    inputRefs.current[questionNumber]?.focus()
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-zinc-800 px-4 py-4 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Answer Sheet</h2>
            <p className="text-sm text-zinc-400">200 TOEIC questions across 7 parts.</p>
          </div>
          <div className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-300">A-D</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="space-y-5">
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
