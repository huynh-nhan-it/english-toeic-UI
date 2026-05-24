import { Check, Search, Target } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { TOEIC_GRAMMAR_FORMULAS, TOEIC_VOCAB_PHRASES, type NoteKey, type StudyNotes } from '../lib/toeic'
import { fetchVocabularySuggestions, type VocabularySuggestion } from '../lib/vocabularyApi'

type NotebookProps = {
  notes: StudyNotes
  onNoteChange: <K extends NoteKey>(key: K, value: StudyNotes[K]) => void
}

export const Notebook = memo(function Notebook({ notes, onNoteChange }: NotebookProps) {
  const [vocabularyQuery, setVocabularyQuery] = useState('')
  const [suggestions, setSuggestions] = useState<VocabularySuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const query = vocabularyQuery.trim()

    if (query.length < 2) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    setIsSearching(true)

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

  const shadowingLines = useMemo(
    () =>
      notes.transcriptShadowing
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [notes.transcriptShadowing],
  )

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
    })
  }, [phraseSuggestions, suggestions])

  const toggleGrammarFormula = useCallback(
    (formulaId: string) => {
      const isSelected = notes.selectedGrammarFormulaIds.includes(formulaId)
      onNoteChange(
        'selectedGrammarFormulaIds',
        isSelected
          ? notes.selectedGrammarFormulaIds.filter((id) => id !== formulaId)
          : [...notes.selectedGrammarFormulaIds, formulaId],
      )
    },
    [notes.selectedGrammarFormulaIds, onNoteChange],
  )

  const addVocabularyWord = useCallback(
    (word: string) => {
      const currentWords = notes.businessVocabulary
        .split(/[\n,]/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)

      if (currentWords.includes(word.toLowerCase())) {
        return
      }

      const prefix = notes.businessVocabulary.trim().length > 0 ? `${notes.businessVocabulary.trim()}\n` : ''
      onNoteChange('businessVocabulary', `${prefix}${word}`)
    },
    [notes.businessVocabulary, onNoteChange],
  )

  const toggleCompletedLine = useCallback(
    (lineIndex: number) => {
      const isCompleted = notes.completedShadowingLines.includes(lineIndex)
      onNoteChange(
        'completedShadowingLines',
        isCompleted
          ? notes.completedShadowingLines.filter((item) => item !== lineIndex)
          : [...notes.completedShadowingLines, lineIndex],
      )
    },
    [notes.completedShadowingLines, onNoteChange],
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-zinc-800 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-white">Notebook</h2>
        <p className="text-sm text-zinc-400">Grammar, vocabulary, and shadowing practice auto-save locally.</p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
        <section className="rounded border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Search aria-hidden="true" className="size-4 text-emerald-300" />
            <h3 className="text-sm font-semibold text-white">Business Vocabulary</h3>
          </div>
          <label className="mb-3 block">
            <span className="sr-only">Vocabulary Search</span>
            <input
              aria-label="Vocabulary Search"
              className="h-10 w-full rounded border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25"
              onChange={(event) => setVocabularyQuery(event.target.value)}
              placeholder="Search quick hints: invoice, contract, shipment..."
              value={vocabularyQuery}
            />
          </label>
          <div className="mb-3 flex min-h-9 flex-wrap gap-2">
            {isSearching ? <span className="text-xs text-zinc-500">Searching...</span> : null}
            {combinedSuggestions.map((suggestion) => (
              <button
                key={suggestion.word}
                className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20"
                onClick={() => addVocabularyWord(suggestion.word)}
                type="button"
              >
                Add {suggestion.word}
              </button>
            ))}
          </div>
          <textarea
            aria-label="Business Vocabulary"
            className="h-32 w-full resize-none rounded border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25"
            onChange={(event) => onNoteChange('businessVocabulary', event.target.value)}
            placeholder="Saved words and phrases..."
            value={notes.businessVocabulary}
          />
        </section>

        <section className="rounded border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Target aria-hidden="true" className="size-4 text-sky-300" />
            <h3 className="text-sm font-semibold text-white">Grammar Traps</h3>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {TOEIC_GRAMMAR_FORMULAS.map((formula) => {
              const isSelected = notes.selectedGrammarFormulaIds.includes(formula.id)

              return (
                <button
                  key={formula.id}
                  className={
                    isSelected
                      ? 'rounded border border-sky-400 bg-sky-400 p-3 text-left text-zinc-950'
                      : 'rounded border border-zinc-700 bg-zinc-950 p-3 text-left text-zinc-300 transition hover:border-sky-400 hover:text-sky-200'
                  }
                  onClick={() => toggleGrammarFormula(formula.id)}
                  title={formula.partFocus}
                  type="button"
                >
                  <span className="block text-xs font-semibold">{formula.title}</span>
                  <span className="block font-mono text-sm">{formula.formula}</span>
                  <span className="mt-1 block text-xs opacity-80">{formula.example}</span>
                </button>
              )
            })}
          </div>
          <textarea
            aria-label="Grammar Traps"
            className="h-32 w-full resize-none rounded border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25"
            onChange={(event) => onNoteChange('grammarTraps', event.target.value)}
            placeholder="Write examples and traps for selected grammar topics..."
            value={notes.grammarTraps}
          />
        </section>

        <section className="rounded border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Check aria-hidden="true" className="size-4 text-amber-300" />
            <h3 className="text-sm font-semibold text-white">Transcript Shadowing</h3>
          </div>
          <textarea
            aria-label="Transcript Shadowing"
            className="mb-3 h-32 w-full resize-none rounded border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25"
            onChange={(event) => onNoteChange('transcriptShadowing', event.target.value)}
            placeholder="Paste transcript lines. Each line becomes a shadowing practice item..."
            value={notes.transcriptShadowing}
          />
          <div className="space-y-2">
            {shadowingLines.map((line, index) => {
              const isActive = notes.activeShadowingLine === index
              const isCompleted = notes.completedShadowingLines.includes(index)

              return (
                <div
                  key={`${line}-${index}`}
                  className={
                    isActive
                      ? 'rounded border border-amber-300 bg-amber-300/10 p-3'
                      : 'rounded border border-zinc-800 bg-zinc-950 p-3'
                  }
                >
                  <div className="flex items-start gap-3">
                    <button
                      aria-label={`Practice line ${index + 1}`}
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded bg-amber-300 text-xs font-bold text-zinc-950"
                      onClick={() => onNoteChange('activeShadowingLine', index)}
                      type="button"
                    >
                      {index + 1}
                    </button>
                    <p className="flex-1 text-sm leading-6 text-zinc-100">{line}</p>
                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                      <input
                        aria-label={`Complete line ${index + 1}`}
                        checked={isCompleted}
                        className="size-4 accent-emerald-400"
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
    </div>
  )
})
