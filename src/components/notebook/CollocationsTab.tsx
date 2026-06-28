import { useState, useEffect, useMemo, useCallback } from 'react'
import { Sparkles, Search, Volume2, Copy, Check, Plus } from 'lucide-react'
import { fetchOnlineCollocations } from '../../services/dictionary.service'
import { TOEIC_COLLOCATIONS } from '../../lib/toeic'
import type { ToeicCollocation } from '../../types'

type CollocationsTabProps = {
  notesText: string
  onNoteChange: (text: string) => void
  onAddFlashcard: (word: string, phonetic: string, definition: string, translation: string, example: string, audioUrl?: string) => void
  flashcardWords: string[]
  colloCategory: string
  onColloCategoryChange: (cat: string) => void
}

export function CollocationsTab({
  notesText,
  onNoteChange,
  onAddFlashcard,
  flashcardWords,
  colloCategory,
}: CollocationsTabProps) {
  const [colloQuery, setColloQuery] = useState('')
  const [onlineCollocations, setOnlineCollocations] = useState<ToeicCollocation[]>([])
  const [isLoadingOnlineCollo, setIsLoadingOnlineCollo] = useState(false)

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

  const handleSearchOnlineCollo = useCallback(async () => {
    const query = colloQuery.trim()
    if (query.length < 2) return

    setIsLoadingOnlineCollo(true)
    setOnlineCollocations([])
    try {
      const results = await fetchOnlineCollocations(query)
      setOnlineCollocations(results)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingOnlineCollo(false)
    }
  }, [colloQuery])

  const handleInsertColloToNote = useCallback((phrase: string, translation: string) => {
    const entry = `\n- ${phrase}: ${translation}\n`
    setLocalNote((curr) => curr ? curr + entry : entry.trim())
  }, [])

  const handleAddColloFlashcard = useCallback((phrase: string, translation: string, example: string) => {
    onAddFlashcard(phrase, '', 'TOEIC Collocation', translation, example)
  }, [onAddFlashcard])

  // Collocations Filter
  const filteredCollocations = useMemo(() => {
    const query = colloQuery.trim().toLowerCase()
    return TOEIC_COLLOCATIONS.filter((collo) => {
      const matchQuery =
        collo.phrase.toLowerCase().includes(query) ||
        collo.translation.toLowerCase().includes(query)
      const matchCat = colloCategory === 'All' || collo.category === colloCategory
      return matchQuery && matchCat
    })
  }, [colloQuery, colloCategory])

  return (
    <div className="animate-in fade-in duration-200 flex-1 flex flex-col min-h-0 space-y-4">
      <section className="glass-panel rounded-3xl p-5 space-y-4 shadow-sm flex-1 flex flex-col min-h-0">
        <div className="hidden sm:flex items-center justify-between gap-2 select-none shrink-0 border-b border-slate-100 dark:border-zinc-900 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500 dark:text-cyan-400 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
              TOEIC Collocations (Cụm từ thường gặp)
            </h3>
          </div>
        </div>

        {/* Search bar */}
        <div className="shrink-0 flex flex-col gap-3 select-none">
          <div className="relative">
            <input
              aria-label="Search Collocations"
              className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 pr-10 text-xs text-slate-800 dark:text-zinc-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 spring-transition sleek-input"
              onChange={(e) => setColloQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && colloQuery.trim().length > 0) {
                  handleSearchOnlineCollo()
                }
              }}
              placeholder="Tìm cụm từ: meet, issue, contract, quy định..."
              value={colloQuery}
            />
            <button
              onClick={() => colloQuery.trim().length > 0 && handleSearchOnlineCollo()}
              className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-violet-400 transition cursor-pointer"
              type="button"
              title="Tìm trực tuyến"
            >
              <Search className="size-4" />
            </button>
          </div>

          {/* Online Search trigger button */}
          {colloQuery.trim().length >= 2 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSearchOnlineCollo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-violet-500/30 bg-indigo-50/50 dark:bg-violet-500/10 text-[10px] font-bold text-indigo-600 dark:text-violet-400 hover:bg-indigo-100 dark:hover:bg-violet-500/25 transition spring-transition cursor-pointer"
              >
                <Sparkles className="size-3 text-indigo-500 dark:text-violet-400" />
                Tìm cụm từ trực tuyến mới nhất cho "{colloQuery.trim()}"
              </button>
            </div>
          )}
        </div>

        {/* Collocations lists container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">
          {isLoadingOnlineCollo && (
            <div className="flex items-center justify-center p-6 text-slate-500 dark:text-zinc-400 text-xs select-none">
              <Sparkles className="size-4 animate-spin text-violet-500 dark:text-cyan-400 mr-2" />
              Đang phân tích cụm từ trực tuyến song ngữ...
            </div>
          )}

          {/* Online Results Header */}
          {onlineCollocations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 select-none">
                <span className="h-px w-2 bg-slate-300 dark:bg-zinc-800" />
                Kết quả trực tuyến mới nhất (Online Search)
              </div>
              <div className="space-y-3">
                {onlineCollocations.map((collo) => {
                  const isAdded = flashcardWords.includes(collo.phrase.toLowerCase())
                  return (
                    <div
                      key={`online-${collo.phrase}`}
                      className="rounded-2xl border border-indigo-100 dark:border-violet-500/20 bg-indigo-50/10 dark:bg-violet-500/5 p-4 space-y-2.5 relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 text-[8px] font-bold uppercase tracking-wider text-indigo-500 dark:text-violet-400 bg-indigo-50 dark:bg-violet-500/20 px-2 py-0.5 rounded-bl-xl select-none">
                        Online
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                            {collo.phrase}
                          </h4>
                          <p className="text-xs font-bold text-indigo-606 dark:text-violet-400">
                            {collo.translation}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 select-none">
                          <button
                            type="button"
                            onClick={(e) => handleSpeakText(e, collo.phrase)}
                            className="p-1.5 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            title="Phát âm"
                          >
                            <Volume2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertColloToNote(collo.phrase, collo.translation)}
                            className="p-1.5 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            title="Thêm vào ghi chú"
                          >
                            <Copy className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddColloFlashcard(collo.phrase, collo.translation, collo.example)}
                            disabled={isAdded}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isAdded
                                ? 'bg-slate-100 text-slate-400 dark:bg-zinc-900 dark:text-zinc-600 cursor-not-allowed'
                                : 'bg-indigo-50 dark:bg-violet-500/10 text-indigo-600 dark:text-violet-400 hover:bg-indigo-100 dark:hover:bg-violet-500/20'
                            }`}
                            title={isAdded ? 'Đã thêm vào Flashcard' : 'Thêm vào Flashcard'}
                          >
                            {isAdded ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="mt-2.5 rounded-2xl bg-slate-100/50 dark:bg-zinc-950/40 p-3 border border-slate-200/40 dark:border-zinc-800/40 border-l-4 border-l-indigo-500 dark:border-l-violet-500">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 leading-relaxed select-text">“{collo.example}”</p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 font-medium select-text">{collo.exampleTranslation}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Static Results Header */}
          {onlineCollocations.length > 0 && (
            <div className="pt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 select-none">
              <span className="h-px w-2 bg-slate-300 dark:bg-zinc-800" />
              Cụm từ biên soạn sẵn (TOEIC Library)
            </div>
          )}

          {filteredCollocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400 dark:text-zinc-500 text-xs">
              Không tìm thấy cụm từ nào phù hợp trong thư viện có sẵn.
            </div>
          ) : (
            filteredCollocations.map((collo) => {
              const isAdded = flashcardWords.includes(collo.phrase.toLowerCase())

              return (
                <div
                  key={collo.phrase}
                  className="rounded-2xl border border-slate-100 dark:border-zinc-800/60 bg-slate-50/20 dark:bg-zinc-950/10 p-4 space-y-2.5 transition-all hover:bg-slate-50/40 dark:hover:bg-zinc-950/15 text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        {collo.phrase}
                      </h4>
                      <p className="text-xs font-bold text-indigo-605 dark:text-violet-400">
                        {collo.translation}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 select-none">
                      <button
                        type="button"
                        onClick={(e) => handleSpeakText(e, collo.phrase)}
                        className="p-1.5 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                        title="Phát âm"
                      >
                        <Volume2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertColloToNote(collo.phrase, collo.translation)}
                        className="p-1.5 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                        title="Thêm vào ghi chú"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddColloFlashcard(collo.phrase, collo.translation, collo.example)}
                        disabled={isAdded}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isAdded
                            ? 'bg-slate-100 text-slate-400 dark:bg-zinc-900 dark:text-zinc-600 cursor-not-allowed'
                            : 'bg-indigo-50 dark:bg-violet-500/10 text-indigo-600 dark:text-violet-400 hover:bg-indigo-100 dark:hover:bg-violet-500/20'
                        }`}
                        title={isAdded ? 'Đã thêm vào Flashcard' : 'Thêm vào Flashcard'}
                      >
                        {isAdded ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2.5 rounded-2xl bg-slate-100/50 dark:bg-zinc-950/40 p-3 border border-slate-200/40 dark:border-zinc-800/40 border-l-4 border-l-indigo-500 dark:border-l-violet-500">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 leading-relaxed select-text">“{collo.example}”</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 font-medium select-text">{collo.exampleTranslation}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Custom Text notes */}
        <div className="space-y-1.5 shrink-0 flex flex-col h-56 sm:h-72">
          <label htmlFor="custom-collo-textarea" className="text-xs font-bold text-slate-500 dark:text-zinc-400 block select-none">
            Vở ghi chép cụm từ thương mại
          </label>
          <textarea
            id="custom-collo-textarea"
            className="flex-1 w-full resize-none rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-3.5 py-3 text-xs leading-6 text-slate-800 dark:text-zinc-200 outline-none transition placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 spring-transition sleek-input font-medium"
            onChange={(event) => setLocalNote(event.target.value)}
            placeholder="Nhập ghi chép của bạn về các cụm từ TOEIC tại đây..."
            value={localNote}
          />
        </div>
      </section>
    </div>
  )
}
