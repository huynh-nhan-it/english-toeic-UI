import { memo } from 'react'
import type { AnswerChoice, ToeicPart } from '../lib/toeic'
import { AnswerInput } from './AnswerInput'

type PartSectionProps = {
  part: ToeicPart
  answers: Record<number, AnswerChoice>
  onAnswerChange: (questionNumber: number, answer: AnswerChoice) => void
  onFocusQuestion: (questionNumber: number) => void
  registerInput: (questionNumber: number, node: HTMLSelectElement | null) => void
}

export const PartSection = memo(function PartSection({
  part,
  answers,
  onAnswerChange,
  onFocusQuestion,
  registerInput,
}: PartSectionProps) {
  return (
    <section className="rounded border border-zinc-800 bg-zinc-950/55">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <h3 className="text-sm font-semibold text-zinc-100">{part.title}</h3>
        <span className="text-xs text-zinc-500">{part.range}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 xl:grid-cols-4">
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
