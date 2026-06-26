import { forwardRef, memo, useCallback } from 'react'
import { ANSWER_CHOICES, isAnswerChoice, type AnswerChoice } from '../lib/toeic'

type AnswerInputProps = {
  questionNumber: number
  value: AnswerChoice
  onAnswerChange: (questionNumber: number, answer: AnswerChoice) => void
  onFocusQuestion: (questionNumber: number) => void
}

export const AnswerInput = memo(
  forwardRef<HTMLDivElement, AnswerInputProps>(function AnswerInput(
    { questionNumber, value, onAnswerChange, onFocusQuestion },
    ref,
  ) {
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
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

    const handleBubbleClick = useCallback(
      (choice: AnswerChoice) => {
        const nextValue = value === choice ? '' : choice
        onAnswerChange(questionNumber, nextValue)
        
        if (nextValue !== '' && questionNumber < 200) {
          window.requestAnimationFrame(() => onFocusQuestion(questionNumber + 1))
        }
      },
      [onAnswerChange, onFocusQuestion, questionNumber, value],
    )

    return (
      <div
        ref={ref}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex items-center justify-start gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-xl text-sm outline-none transition-all duration-200 hover:bg-slate-100/60 dark:hover:bg-zinc-900/30 focus-within:bg-indigo-50/50 dark:focus-within:bg-violet-950/15 focus-within:ring-1 focus-within:ring-indigo-500/30 dark:focus-within:ring-violet-500/30 select-none spring-transition border border-transparent"
        aria-label={`Question ${questionNumber}`}
      >
        <span className="tabular-nums font-black text-right text-slate-700 dark:text-zinc-300 w-5 sm:w-7 select-none text-xs shrink-0">
          {questionNumber}
        </span>
        
        <div className="flex gap-1">
          {ANSWER_CHOICES.map((choice) => {
            const isSelected = value === choice
            
            return (
              <button
                key={choice}
                type="button"
                onClick={() => handleBubbleClick(choice)}
                className={`size-7 sm:size-8 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-extrabold transition spring-transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white shadow-md shadow-indigo-500/20 choice-glow-active scale-105'
                    : 'bg-slate-100 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 border border-slate-200/50 dark:border-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-350 dark:hover:border-zinc-700'
                }`}
              >
                {choice}
              </button>
            )
          })}
        </div>
      </div>

    )
  }),
)
