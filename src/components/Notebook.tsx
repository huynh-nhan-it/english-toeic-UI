import { memo } from 'react'
import { VocabularyTab } from './notebook/VocabularyTab'
import { CollocationsTab } from './notebook/CollocationsTab'
import { GrammarTab } from './notebook/GrammarTab'
import { ShadowingTab } from './notebook/ShadowingTab'
import type { StudyNotes, NoteKey } from '../types'

type NotebookProps = {
  notes: StudyNotes
  onNoteChange: <K extends NoteKey>(key: K, value: StudyNotes[K]) => void
  onAddFlashcard: (word: string, phonetic: string, definition: string, translation: string, example: string, audioUrl?: string) => void
  flashcardWords: string[]
  subTab: 'vocab' | 'collo' | 'grammar' | 'shadowing'
  onSubTabChange: (tab: 'vocab' | 'collo' | 'grammar' | 'shadowing') => void
  colloCategory: string
  onColloCategoryChange: (cat: string) => void
}

export const Notebook = memo(function Notebook({
  notes,
  onNoteChange,
  onAddFlashcard,
  flashcardWords,
  subTab,
  onSubTabChange,
  colloCategory,
  onColloCategoryChange,
}: NotebookProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* Sub-tab Navigation Header */}
      <div className="flex border-b border-slate-200/80 dark:border-zinc-800/80 pb-px shrink-0 select-none">
        {(['vocab', 'collo', 'grammar', 'shadowing'] as const).map((tab) => {
          const labels = {
            vocab: 'Từ vựng',
            collo: 'Collocations',
            grammar: 'Ngữ pháp',
            shadowing: 'Shadowing',
          }
          const isActive = subTab === tab
          return (
            <button
              key={tab}
              onClick={() => onSubTabChange(tab)}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition duration-150 cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:border-violet-500 dark:text-violet-400 font-extrabold'
                  : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              {labels[tab]}
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className={subTab === 'vocab' ? 'flex-1 flex flex-col min-h-0' : 'hidden'}>
          <VocabularyTab
            notesText={notes.businessVocabulary}
            onNoteChange={(text) => onNoteChange('businessVocabulary', text)}
            onAddFlashcard={onAddFlashcard}
            flashcardWords={flashcardWords}
          />
        </div>

        <div className={subTab === 'collo' ? 'flex-1 flex flex-col min-h-0' : 'hidden'}>
          <CollocationsTab
            notesText={notes.grammarTraps} // Uses grammarTraps for collocations notes per legacy spec
            onNoteChange={(text) => onNoteChange('grammarTraps', text)}
            onAddFlashcard={onAddFlashcard}
            flashcardWords={flashcardWords}
            colloCategory={colloCategory}
            onColloCategoryChange={onColloCategoryChange}
          />
        </div>

        <div className={subTab === 'grammar' ? 'flex-1 flex flex-col min-h-0' : 'hidden'}>
          <GrammarTab
            notesText={notes.grammarTraps} // Also writes to grammarTraps notes per legacy spec
            onNoteChange={(text) => onNoteChange('grammarTraps', text)}
            selectedGrammarFormulaIds={notes.selectedGrammarFormulaIds}
            toggleGrammarFormula={(id) => {
              const list = notes.selectedGrammarFormulaIds
              const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
              onNoteChange('selectedGrammarFormulaIds', next)
            }}
          />
        </div>

        <div className={subTab === 'shadowing' ? 'flex-1 flex flex-col min-h-0' : 'hidden'}>
          <ShadowingTab
            notesText={notes.transcriptShadowing}
            onNoteChange={(keyOrText: string, value?: unknown) => {
              if (value !== undefined) {
                // Handle complex updates (activeShadowingLine, completedShadowingLines)
                onNoteChange(keyOrText as NoteKey, value as never)
              } else {
                // Handle basic text change
                onNoteChange('transcriptShadowing', keyOrText)
              }
            }}
            activeShadowingLine={notes.activeShadowingLine}
            completedShadowingLines={notes.completedShadowingLines}
          />
        </div>
      </div>
    </div>
  )
})
