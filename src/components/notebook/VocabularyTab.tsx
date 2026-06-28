import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Sparkles, Volume2, Plus, Check } from 'lucide-react'
import { fetchVocabularySuggestions, fetchWordDetails } from '../../services/dictionary.service'
import { TOEIC_VOCAB_PHRASES } from '../../lib/toeic'
import type { DictionaryDetails } from '../../types'

type VocabularyTabProps = {
  notesText: string
  onNoteChange: (text: string) => void
  onAddFlashcard: (word: string, phonetic: string, definition: string, translation: string, example: string, audioUrl?: string) => void
  flashcardWords: string[]
}

export function VocabularyTab({
  notesText,
  onNoteChange,
  onAddFlashcard,
  flashcardWords,
}: VocabularyTabProps) {
  const [vocabularyQuery, setVocabularyQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ word: string }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedWord, setSelectedWord] = useState<DictionaryDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Local note state for debouncing typing lag
  const [localNote, setLocalNote] = useState(notesText)
  const [prevNotesText, setPrevNotesText] = useState(notesText)

  if (notesText !== prevNotesText) {
    setPrevNotesText(notesText)
    setLocalNote(notesText)
  }

  const handleQueryChange = (val: string) => {
    setVocabularyQuery(val)
    if (val.trim().length < 2) {
      setSuggestions([])
      setIsSearching(false)
    } else {
      setIsSearching(true)
    }
  }

  // Debounce sync to parent store
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localNote !== notesText) {
        onNoteChange(localNote)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [localNote, notesText, onNoteChange])

  // Autocomplete suggestions
  useEffect(() => {
    const query = vocabularyQuery.trim()

    if (query.length < 2) {
      return
    }

    const controller = new AbortController()

    fetchVocabularySuggestions(query, controller.signal)
      .then((results) => setSuggestions(results))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setSuggestions([])
      })
      .finally(() => setIsSearching(false))

    return () => controller.abort()
  }, [vocabularyQuery])

  // Common TOEIC phrase suggestions
  const phraseSuggestions = useMemo(() => {
    const query = vocabularyQuery.trim().toLowerCase()

    if (query.length < 2) {
      return []
    }

    return TOEIC_VOCAB_PHRASES.filter((phrase) => phrase.toLowerCase().includes(query)).slice(0, 6)
  }, [vocabularyQuery])

  const combinedSuggestions = useMemo(() => {
    const seen = new Set<string>()
    return [
      ...phraseSuggestions.map((word) => ({ word })),
      ...suggestions,
    ].filter((suggestion) => {
      const key = suggestion.word.toLowerCase()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    }).slice(0, 8)
  }, [phraseSuggestions, suggestions])

  // Fetch complete word details
  const handleSelectWord = useCallback(async (word: string) => {
    setIsLoadingDetails(true)
    setSelectedWord(null)
    setVocabularyQuery('')
    setSuggestions([])

    try {
      const details = await fetchWordDetails(word)
      setSelectedWord(details)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingDetails(false)
    }
  }, [])

  const handleSpeak = useCallback((e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const isAlreadyFlashcard = useMemo(() => {
    if (!selectedWord) return false
    return flashcardWords.includes(selectedWord.word.toLowerCase())
  }, [selectedWord, flashcardWords])

  const handleAddFlashcard = () => {
    if (!selectedWord) return
    onAddFlashcard(
      selectedWord.word,
      selectedWord.phonetic,
      selectedWord.definition,
      selectedWord.translation,
      selectedWord.example,
      selectedWord.audioUrl
    )
  }

  return (
    <div className="animate-in fade-in duration-200 flex-1 flex flex-col min-h-0 space-y-4">
      <section className="glass-panel rounded-3xl p-5 space-y-4 shadow-sm flex-1 flex flex-col min-h-0">
        <div className="hidden sm:flex items-center gap-2 select-none shrink-0">
          <Search aria-hidden="true" className="size-4 text-violet-500 dark:text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
            Business Vocabulary (Từ vựng)
          </h3>
        </div>

        {/* Search bar */}
        <div className="relative shrink-0">
          <input
            aria-label="Vocabulary Search"
            className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 pr-10 text-xs text-slate-800 dark:text-zinc-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 spring-transition sleek-input"
            onChange={(event) => handleQueryChange(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && vocabularyQuery.trim().length > 0) {
                handleSelectWord(vocabularyQuery.trim())
              }
            }}
            placeholder="Tra từ nhanh: invoice, contract, shipment..."
            value={vocabularyQuery}
          />
          <button
            onClick={() => vocabularyQuery.trim().length > 0 && handleSelectWord(vocabularyQuery.trim())}
            className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-violet-400 transition cursor-pointer"
            type="button"
          >
            <Search className="size-4" />
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {combinedSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 p-1.5 border border-slate-200/40 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-zinc-950/20 backdrop-blur shrink-0">
            {isSearching ? <span className="text-[10px] text-slate-400 dark:text-zinc-500 px-2 py-1">Searching...</span> : null}
            {combinedSuggestions.map((suggestion) => (
              <button
                key={suggestion.word}
                className="rounded-lg border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition spring-transition hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                onClick={() => handleSelectWord(suggestion.word)}
                type="button"
              >
                {suggestion.word}
              </button>
            ))}
          </div>
        )}

        {/* Details results panel */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-4">
          {isLoadingDetails && (
            <div className="flex items-center justify-center p-6 text-slate-500 dark:text-zinc-400 text-xs select-none">
              <Sparkles className="size-4 animate-spin text-violet-500 dark:text-cyan-400 mr-2" />
              Đang phân tích nghĩa từ vựng...
            </div>
          )}

          {selectedWord && (
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#0c0c14]/40 p-4 space-y-4 relative overflow-hidden transition-all">
              <div className="absolute right-0 top-0 size-24 bg-indigo-500/5 dark:bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
                    {selectedWord.word}
                  </h4>
                  {selectedWord.phonetic && (
                    <p className="text-xs font-mono text-slate-400 dark:text-zinc-500">
                      {selectedWord.phonetic}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 select-none">
                  <button
                    onClick={(e) => handleSpeak(e, selectedWord.word)}
                    className="p-2 bg-indigo-50 dark:bg-violet-500/10 text-indigo-600 dark:text-violet-400 hover:bg-indigo-100 dark:hover:bg-violet-500/20 rounded-xl transition spring-transition hover:scale-[1.05] active:scale-[0.95] cursor-pointer"
                    title="Phát âm"
                  >
                    <Volume2 className="size-4" />
                  </button>
                  <button
                    onClick={handleAddFlashcard}
                    disabled={isAlreadyFlashcard}
                    className={`inline-flex h-8 items-center gap-1.5 px-3.5 text-[10px] font-bold rounded-xl transition spring-transition hover:scale-[1.03] active:scale-[0.96] cursor-pointer ${
                      isAlreadyFlashcard
                        ? 'bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white shadow-sm'
                    }`}
                  >
                    {isAlreadyFlashcard ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                    {isAlreadyFlashcard ? 'Đã thêm' : 'Add Flashcard'}
                  </button>
                </div>
              </div>

              {/* Translation */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-bold uppercase tracking-wider block">Nghĩa tiếng Việt</span>
                <p className="text-sm font-bold text-indigo-605 dark:text-violet-400">
                  {selectedWord.translation || 'Không có dịch nghĩa'}
                </p>
              </div>

              {/* English Definition */}
              {selectedWord.definition && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-bold uppercase tracking-wider block">Định nghĩa Anh-Anh</span>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed select-text">
                    {selectedWord.definition}
                  </p>
                </div>
              )}

              {/* Example sentence */}
              {selectedWord.example && (
                <div className="mt-2.5 rounded-2xl bg-slate-100/50 dark:bg-zinc-950/40 p-3 border border-slate-200/40 dark:border-zinc-800/40 border-l-4 border-l-indigo-500 dark:border-l-violet-500 text-left">
                  <span className="text-[10px] text-slate-405 dark:text-zinc-500 font-black uppercase tracking-wider block select-none mb-1">Ví dụ minh họa</span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 leading-relaxed select-text">
                    “{selectedWord.example}”
                  </p>
                </div>
              )}

              {/* Synonyms list */}
              {selectedWord.synonyms && selectedWord.synonyms.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-bold uppercase tracking-wider block">Từ đồng nghĩa & Ví dụ (Synonyms & Examples)</span>
                  <div className="space-y-2.5">
                    {selectedWord.synonyms.map((syn) => (
                      <div key={syn.word} className="space-y-1 p-2.5 rounded-xl bg-white/40 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900/50">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectWord(syn.word)}
                            className="text-xs font-bold text-indigo-600 dark:text-violet-400 hover:underline cursor-pointer"
                          >
                            {syn.word}
                          </button>
                          {syn.translation && (
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                              ({syn.translation})
                            </span>
                          )}
                        </div>
                        {syn.example && (
                          <div className="mt-1.5 rounded-xl bg-slate-100/30 dark:bg-zinc-950/30 p-2 border border-slate-300/20 dark:border-zinc-800/30 pl-2.5 border-l-2 border-l-indigo-500 dark:border-l-violet-400 text-left">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 leading-relaxed select-text">
                              e.g. “{syn.example}”
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom Text notes */}
        <div className="space-y-1.5 shrink-0 flex flex-col h-56 sm:h-72">
          <label htmlFor="custom-vocab-textarea" className="text-xs font-bold text-slate-500 dark:text-zinc-400 block select-none">
            Ghi chú từ vựng tự do
          </label>
          <textarea
            id="custom-vocab-textarea"
            aria-label="Business Vocabulary"
            className="flex-1 w-full resize-none rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-3.5 py-3 text-xs leading-6 text-slate-800 dark:text-zinc-200 outline-none transition placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 spring-transition sleek-input"
            onChange={(event) => setLocalNote(event.target.value)}
            placeholder="Nhập ghi chú thêm về các từ vựng thương mại..."
            value={localNote}
          />
        </div>
      </section>
    </div>
  )
}
