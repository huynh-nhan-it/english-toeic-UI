import { memo } from 'react'
import type { AnswerChoice, ToeicPart } from '../lib/toeic'
import { AnswerInput } from './AnswerInput'

type PartSectionProps = {
  part: ToeicPart
  answers: Record<number, AnswerChoice>
  onAnswerChange: (questionNumber: number, answer: AnswerChoice) => void
  onFocusQuestion: (questionNumber: number) => void
  registerInput: (questionNumber: number, node: HTMLDivElement | null) => void
}

export const PartSection = memo(function PartSection({
  part,
  answers,
  onAnswerChange,
  onFocusQuestion,
  registerInput,
}: PartSectionProps) {
  return (
    <section className="glass-panel rounded-3xl p-5 spring-transition">
      {/* SaaS-style section divider header */}
      <div className="flex items-center gap-3 mb-4 select-none">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
          {part.title}
        </h3>
        <span className="text-[9px] font-extrabold px-2 py-0.5 bg-slate-100 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 rounded-lg border border-slate-200/40 dark:border-zinc-800">
          {part.range}
        </span>

        <div className="h-px flex-1 bg-slate-200/80 dark:bg-zinc-800/40" />
      </div>

      {/* Responsive Questions Grid: falls back to 1 column on narrow screens (<380px) to prevent button squishing */}
      <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-x-2 sm:gap-x-6 gap-y-1 sm:gap-y-1.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {part.questions.map((questionNumber) => (
          <AnswerInput
            key={questionNumber}
            ref={(node) => registerInput(questionNumber, node)}
            questionNumber={questionNumber}
            value={answers[questionNumber]}
            onAnswerChange={onAnswerChange}
            onFocusQuestion={onFocusQuestion}
          />
        ))}
      </div>

    </section>
  )
})
