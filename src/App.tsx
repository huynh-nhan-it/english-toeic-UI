import { BookOpenCheck } from 'lucide-react'
import { AnswerSheet } from './components/AnswerSheet'
import { ExportButton } from './components/ExportButton'
import { Notebook } from './components/Notebook'
import { SplitLayout } from './components/SplitLayout'
import { useToeicProgress } from './hooks/useToeicProgress'

export default function App() {
  const { progress, notesDraft, updateAnswer, updateNote } = useToeicProgress()

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded bg-emerald-500 text-zinc-950">
              <BookOpenCheck aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-normal text-white">TOEIC Progress</h1>
              <p className="text-sm text-zinc-400">Answer sheet and study notebook saved locally.</p>
            </div>
          </div>
          <ExportButton progress={progress} />
        </div>
      </header>

      <SplitLayout
        answerSheet={<AnswerSheet answers={progress.answers} onAnswerChange={updateAnswer} />}
        notebook={<Notebook notes={notesDraft} onNoteChange={updateNote} />}
      />
    </main>
  )
}
