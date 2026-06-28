import { useState, useEffect, useCallback } from 'react'
import { Target, Copy } from 'lucide-react'
import { TOEIC_GRAMMAR_FORMULAS, GRAMMAR_VIETNAMESE_TITLES } from '../../lib/toeic'

type GrammarTabProps = {
  notesText: string
  onNoteChange: (text: string) => void
  selectedGrammarFormulaIds: string[]
  toggleGrammarFormula: (id: string) => void
}

export function GrammarTab({
  notesText,
  onNoteChange,
  selectedGrammarFormulaIds,
}: GrammarTabProps) {
  // Local note state for debouncing
  const [localNote, setLocalNote] = useState(notesText)
  const [prevNotesText, setPrevNotesText] = useState(notesText)

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

  const handleInsertGrammarFormula = useCallback((formula: typeof TOEIC_GRAMMAR_FORMULAS[0]) => {
    const viTitle = GRAMMAR_VIETNAMESE_TITLES[formula.id] || formula.title
    
    const template = [
      `📘 CẤU TRÚC: ${formula.title} (${viTitle})`,
      `──────────────────────────────────────────────────`,
      `⚙️ Công thức : ${formula.formula}`,
      `📝 Chi tiết  : ${formula.structure || ''}`,
      `💡 Giải thích: ${formula.explanation || ''}`,
      `🌟 Ví dụ mẫu : ${formula.example}`,
      `✍️ Lưu ý & Câu tự đặt của tôi:`,
      `   > `,
      `──────────────────────────────────────────────────`
    ].join('\n')
    
    setLocalNote((curr) => curr ? curr + '\n\n' + template : template)
  }, [])

  return (
    <div className="animate-in fade-in duration-200 flex-1 flex flex-col min-h-0 space-y-4">
      <section className="glass-panel rounded-3xl p-5 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="hidden sm:flex items-center gap-2 select-none shrink-0 border-b border-slate-100 dark:border-zinc-900 pb-3 mb-4">
          <Target aria-hidden="true" className="size-4 text-violet-500 dark:text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
            Grammar Traps (Bẫy Ngữ pháp)
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1 min-h-0 text-left mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5 block select-none">
              Chi tiết cấu trúc đã chọn
            </span>
            <div className="space-y-4">
              {selectedGrammarFormulaIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-400 dark:text-zinc-500 text-xs min-h-[140px]">
                  <Target className="size-8 text-slate-300 dark:text-zinc-700 mb-2 animate-pulse" />
                  <span className="text-center">Chọn cấu trúc ngữ pháp ở menu bên trái để xem chi tiết.</span>
                </div>
              ) : (
                TOEIC_GRAMMAR_FORMULAS.filter((f) => selectedGrammarFormulaIds.includes(f.id)).map((formula) => (
                  <div
                    key={formula.id}
                    className="rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-[#0c0c14]/40 p-4 space-y-4 relative overflow-hidden transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-indigo-605 dark:text-violet-400 font-bold uppercase tracking-wider">
                          {formula.partFocus}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                          {formula.title}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInsertGrammarFormula(formula)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-indigo-50 dark:bg-violet-500/10 text-indigo-600 dark:text-violet-400 hover:bg-indigo-100 dark:hover:bg-violet-500/20 transition cursor-pointer"
                      >
                        <Copy className="size-3" />
                        Chèn công thức
                      </button>
                    </div>
                    <div className="rounded-xl bg-slate-100/80 dark:bg-zinc-950/60 p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold tracking-wider uppercase">Cấu trúc</span>
                        <code className="text-xs font-mono font-bold text-violet-600 dark:text-cyan-400">
                          {formula.formula}
                        </code>
                      </div>
                      {formula.structure && (
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                          {formula.structure}
                        </p>
                      )}
                    </div>
                    <div className="mt-2.5 rounded-2xl bg-slate-100/50 dark:bg-zinc-950/40 p-3.5 border border-slate-200/40 dark:border-zinc-800/40 border-l-4 border-l-indigo-500 dark:border-l-violet-500 text-left">
                      <span className="text-[10px] text-slate-405 dark:text-zinc-500 font-black uppercase tracking-wider block select-none mb-1">Ví dụ tiêu biểu</span>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 leading-relaxed select-text">
                        “{formula.example}”
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[250px] text-left border-t border-slate-150 dark:border-zinc-900/65 pt-4">
          <label htmlFor="custom-grammar-textarea" className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5 block select-none">
            Vở ghi chép ngữ pháp mở rộng (Free-form Notes)
          </label>
          <textarea
            id="custom-grammar-textarea"
            aria-label="Grammar Traps"
            className="flex-1 w-full resize-none rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-4 py-3.5 text-xs leading-6 text-slate-800 dark:text-zinc-200 outline-none transition placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 spring-transition sleek-input font-medium"
            onChange={(event) => setLocalNote(event.target.value)}
            placeholder="Bấm nút 'Chèn công thức' để tự động tạo mẫu ghi chú học tập song ngữ cực đẹp, sau đó ghi chú lại lưu ý hoặc câu tự đặt của bạn tại đây..."
            value={localNote}
          />
        </div>

      </section>
    </div>
  )
}
