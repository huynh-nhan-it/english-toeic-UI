import { useState, useEffect, useMemo, useCallback } from 'react'
import { Check, Volume2 } from 'lucide-react'

type ShadowingTabProps = {
  notesText: string
  onNoteChange: (keyOrText: string, value?: unknown) => void
  activeShadowingLine: number | null
  completedShadowingLines: number[]
}

export function ShadowingTab({
  notesText,
  onNoteChange,
  activeShadowingLine,
  completedShadowingLines,
}: ShadowingTabProps) {
  // Local note state for debouncing
  const [localNote, setLocalNote] = useState(notesText)
  const [prevNotesText, setPrevNotesText] = useState(notesText)
  const [shadowSpeed, setShadowSpeed] = useState<number>(1.0)
  const [autoAdvance, setAutoAdvance] = useState<boolean>(false)

  if (notesText !== prevNotesText) {
    setPrevNotesText(notesText)
    setLocalNote(notesText)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localNote !== notesText) {
        onNoteChange(localNote)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [localNote, notesText, onNoteChange])

  const handleSpeakText = useCallback((e: React.MouseEvent, text: string, speed = 1.0) => {
    e.stopPropagation()
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = speed
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const shadowingLines = useMemo(
    () =>
      localNote
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [localNote],
  )

  const toggleCompletedLine = useCallback(
    (lineIndex: number) => {
      const isCompleted = completedShadowingLines.includes(lineIndex)
      const nextCompleted = isCompleted
        ? completedShadowingLines.filter((item) => item !== lineIndex)
        : [...completedShadowingLines, lineIndex]
      
      onNoteChange('completedShadowingLines', nextCompleted)

      // Auto-advance logic
      if (!isCompleted && autoAdvance && lineIndex + 1 < shadowingLines.length) {
        onNoteChange('activeShadowingLine', lineIndex + 1)
      }
    },
    [completedShadowingLines, onNoteChange, autoAdvance, shadowingLines.length],
  )

  const completionPercentage = useMemo(() => {
    if (shadowingLines.length === 0) return 0
    return Math.round((completedShadowingLines.length / shadowingLines.length) * 100)
  }, [shadowingLines, completedShadowingLines])

  return (
    <div className="animate-in fade-in duration-200 flex-1 flex flex-col min-h-0 space-y-4">
      <section className="glass-panel rounded-3xl p-5 space-y-4 shadow-sm flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 select-none shrink-0 border-b border-slate-100 dark:border-zinc-900 pb-2">
          <Check aria-hidden="true" className="size-4 text-violet-500 dark:text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
            Transcript Shadowing (Hội thoại)
          </h3>
        </div>

        <textarea
          aria-label="Transcript Shadowing"
          className="h-24 sm:h-28 w-full resize-none rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-3.5 py-3 text-xs leading-6 text-slate-800 dark:text-zinc-200 outline-none transition placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 spring-transition sleek-input shrink-0 font-medium"
          onChange={(event) => setLocalNote(event.target.value)}
          placeholder="Dán các câu phụ đề/hội thoại tiếng Anh vào đây để tập shadowing đuổi..."
          value={localNote}
        />

        {/* Speed & Auto-Advance Control Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/40 dark:border-zinc-800/40 pb-3 shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Tốc độ phát:</span>
            <div className="flex rounded-lg bg-slate-100 dark:bg-zinc-900 p-0.5 border border-slate-200/50 dark:border-zinc-800/80">
              {[0.8, 0.9, 1.0, 1.2].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShadowSpeed(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer transition ${
                    shadowSpeed === s
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-violet-400 shadow-sm shadow-indigo-500/5'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="size-3.5 rounded accent-indigo-650 dark:accent-violet-400 cursor-pointer"
            />
            Tự động chuyển câu
          </label>
        </div>

        {/* Progress Indicator */}
        {shadowingLines.length > 0 && (
          <div className="space-y-1 shrink-0 select-none">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase">
              <span>Tiến độ Shadowing</span>
              <span>{completedShadowingLines.length} / {shadowingLines.length} câu ({completionPercentage}%)</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-cyan-400 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0 text-left">
          {shadowingLines.map((line, index) => {
            const isActive = activeShadowingLine === index
            const isCompleted = completedShadowingLines.includes(index)

            return (
              <div
                key={`${line}-${index}`}
                className={`rounded-2xl border p-3.5 transition spring-transition ${
                  isActive
                    ? 'border-indigo-200 dark:border-violet-500/40 bg-indigo-50/20 dark:bg-violet-500/5 shadow-sm'
                    : 'border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-950/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    aria-label={`Practice line ${index + 1}`}
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold transition spring-transition hover:scale-[1.08] active:scale-[0.9] cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white shadow-md shadow-indigo-500/15'
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700'
                    }`}
                    onClick={() => onNoteChange('activeShadowingLine', index)}
                    type="button"
                  >
                    {index + 1}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSpeakText(e, line, shadowSpeed)}
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-violet-500/20 dark:hover:text-violet-300 transition cursor-pointer"
                    title="Phát âm dòng này"
                  >
                    <Volume2 className="size-3.5" />
                  </button>
                  <p className="flex-1 text-xs leading-relaxed text-slate-700 dark:text-zinc-200 font-medium select-text">{line}</p>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-zinc-500 shrink-0 select-none cursor-pointer">
                    <input
                      aria-label={`Complete line ${index + 1}`}
                      checked={isCompleted}
                      className="size-4 rounded-md accent-violet-600 dark:accent-violet-400 cursor-pointer"
                      onChange={() => toggleCompletedLine(index)}
                      type="checkbox"
                    />
                    Done
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
