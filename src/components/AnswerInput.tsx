import { forwardRef, memo, useCallback } from 'react'
import { isAnswerChoice, type AnswerChoice } from '../lib/toeic'

type AnswerInputProps = {
  questionNumber: number
  value: AnswerChoice
  onAnswerChange: (questionNumber: number, answer: AnswerChoice) => void
  onFocusQuestion: (questionNumber: number) => void
}

export const AnswerInput = memo(
  forwardRef<HTMLInputElement, AnswerInputProps>(function AnswerInput(
    { questionNumber, value, onAnswerChange, onFocusQuestion },
    ref,
  ) {
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        const key = event.key.toUpperCase()

        if (isAnswerChoice(key)) {
          event.preventDefault()
          onAnswerChange(questionNumber, key)

          if (questionNumber < 200) {
            window.requestAnimationFrame(() => onFocusQuestion(questionNumber + 1))
          }

          return
        }

        if (event.key === 'Backspace' || event.key === 'Delete') {
          event.preventDefault()
          onAnswerChange(questionNumber, '')
        }
      },
      [onAnswerChange, onFocusQuestion, questionNumber],
    )

    const handlePaste = useCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault()
    }, [])

    return (
      <label className="grid grid-cols-[2.5rem_1fr] items-center gap-2 rounded border border-zinc-800 bg-zinc-900/80 px-2 py-2 text-sm">
        <span className="tabular-nums text-zinc-400">{questionNumber}</span>
        <input
          ref={ref}
          aria-label={`Question ${questionNumber}`}
          className="h-9 w-full rounded border border-zinc-700 bg-zinc-950 text-center text-base font-semibold text-emerald-300 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25"
          inputMode="text"
          maxLength={1}
          onChange={() => undefined}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          value={value}
        />
      </label>
    )
  }),
)
