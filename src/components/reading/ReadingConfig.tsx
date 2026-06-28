import { ChevronDown, Sparkles } from 'lucide-react'

export const BUSINESS_CATEGORIES = [
  'All Topics',
  'Marketing & Advertising',
  'Human Resources',
  'Finance & Accounting',
  'Logistics & Shipping',
  'IT & Technology',
  'Operations & Management',
  'Purchasing & Procurement',
  'Customer Service'
]

type ReadingConfigProps = {
  selectedCategory: string
  setSelectedCategory: (cat: string) => void
  passageSource: 'local' | 'ai'
  setPassageSource: (src: 'local' | 'ai') => void
  onLocalLoad: () => void
  onAiGenerate: () => void
  apiKeyMissing: boolean
}

export function ReadingConfig({
  selectedCategory,
  setSelectedCategory,
  passageSource,
  setPassageSource,
  onLocalLoad,
  onAiGenerate,
  apiKeyMissing
}: ReadingConfigProps) {
  return (
    <div className="flex flex-col gap-4 w-full select-none text-left animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Chủ đề bài đọc</span>
        <div className="relative w-full">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-4 pr-10 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer appearance-none"
          >
            {BUSINESS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Nguồn bài học</span>
        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200/35 dark:border-zinc-800 w-full">
          <button
            type="button"
            onClick={() => setPassageSource('local')}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer ${
              passageSource === 'local'
                ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 shadow-sm border border-slate-200/30'
                : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
            }`}
          >
            Đề có sẵn (Offline)
          </button>
          <button
            type="button"
            onClick={() => setPassageSource('ai')}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
              passageSource === 'ai'
                ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 shadow-sm border border-slate-200/30'
                : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
            }`}
          >
            <Sparkles className="size-3 text-violet-500 dark:text-cyan-400 fill-current animate-pulse" />
            Đề sinh AI (Realtime)
          </button>
        </div>
      </div>

      {passageSource === 'local' ? (
        <button
          onClick={onLocalLoad}
          className="w-full rounded-2xl bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white dark:text-zinc-200 py-3 text-xs font-black tracking-wider uppercase transition hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-sm"
        >
          Bắt đầu luyện tập
        </button>
      ) : (
        <button
          onClick={onAiGenerate}
          disabled={apiKeyMissing}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white py-3 text-xs font-black tracking-wider uppercase transition hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-md shadow-indigo-500/10 disabled:opacity-50 disabled:pointer-events-none"
        >
          Kích hoạt AI tạo đề thi
        </button>
      )}
    </div>
  )
}
