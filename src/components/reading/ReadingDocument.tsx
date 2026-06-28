import { FileText } from 'lucide-react'
import type { ToeicReadingPassage } from '../../services/gemini.service'

type ReadingDocumentProps = {
  currentPassage: ToeicReadingPassage
  activeDocumentTab: number
  setActiveDocumentTab: (idx: number) => void
}

export function ReadingDocument({
  currentPassage,
  activeDocumentTab,
  setActiveDocumentTab,
}: ReadingDocumentProps) {
  const documents = currentPassage.documents

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-sm flex-1 flex flex-col min-h-0 select-none">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <FileText aria-hidden="true" className="size-4 text-violet-500 dark:text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
            Văn bản đọc hiểu (Documents)
          </h3>
        </div>
        {documents.length > 1 && (
          <span className="text-[9px] font-black uppercase bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-lg border border-violet-500/10">
            {currentPassage.type === 'double' ? 'Double Passage' : 'Triple Passage'}
          </span>
        )}
      </div>

      {/* Double/Triple Document Tabs */}
      {documents.length > 1 && (
        <div className="flex border-b border-slate-100 dark:border-zinc-800/80 mt-3 pb-px shrink-0 select-none">
          {documents.map((doc, idx) => {
            const isActive = activeDocumentTab === idx
            return (
              <button
                key={idx}
                onClick={() => setActiveDocumentTab(idx)}
                className={`px-4 py-2 text-[11px] font-extrabold border-b-2 transition duration-150 cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-606 dark:border-violet-500 dark:text-violet-400'
                    : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                }`}
              >
                {doc.title || `Văn bản ${idx + 1}`}
              </button>
            )
          })}
        </div>
      )}

      {/* Scrollable Document Content */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 min-h-0">
        <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/10 dark:bg-zinc-950/20 p-5 space-y-4 shadow-inner text-left">
          {documents.length > 1 && documents[activeDocumentTab] ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-extrabold text-slate-500 dark:text-zinc-500 uppercase tracking-widest pb-2 border-b border-slate-200/20 dark:border-zinc-800">
                {documents[activeDocumentTab].title}
              </h4>
              <p className="text-xs leading-relaxed text-slate-805 dark:text-zinc-200 whitespace-pre-wrap select-text font-medium font-sans">
                {documents[activeDocumentTab].content}
              </p>
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in duration-200">
              <p className="text-xs leading-relaxed text-slate-805 dark:text-zinc-200 whitespace-pre-wrap select-text font-medium font-sans">
                {documents[0]?.content}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
