import { Star, Shuffle, Volume2, Zap } from 'lucide-react'

type FlashcardConfigPanelProps = {
  reviewMode: 'due' | 'all'
  setReviewMode: (mode: 'due' | 'all') => void
  studyMode: 'review' | 'spelling'
  setStudyMode: (mode: 'review' | 'spelling') => void
  showStarredOnly: boolean
  setShowStarredOnly: (show: boolean) => void
  isShuffled: boolean
  setIsShuffled: (shuffle: boolean) => void
  autoPronounce: boolean
  setAutoPronounce: (pronounce: boolean) => void
  cramMode: boolean
  setCramMode: (cram: boolean) => void
  dueCount: number
  totalCount: number
}

export function FlashcardConfigPanel({
  reviewMode,
  setReviewMode,
  studyMode,
  setStudyMode,
  showStarredOnly,
  setShowStarredOnly,
  isShuffled,
  setIsShuffled,
  autoPronounce,
  setAutoPronounce,
  cramMode,
  setCramMode,
  dueCount,
  totalCount,
}: FlashcardConfigPanelProps) {
  return (
    <div className="space-y-4 py-2 select-none text-left">
      {/* Study Mode Selector */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
          Chế độ học
        </span>
        <div className="flex bg-slate-100 dark:bg-zinc-950/80 p-1 rounded-2xl border border-slate-200/30 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setStudyMode('review')}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer ${
              studyMode === 'review'
                ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-sm shadow-indigo-500/5'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            Lật thẻ
          </button>
          <button
            type="button"
            onClick={() => setStudyMode('spelling')}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer ${
              studyMode === 'spelling'
                ? 'bg-white dark:bg-zinc-800 text-slate-855 dark:text-white shadow-sm shadow-indigo-500/5'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            Chính tả
          </button>
        </div>
      </div>

      {/* Deck Selector */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
          Bộ thẻ hiển thị
        </span>
        <div className="flex bg-slate-100 dark:bg-zinc-950/80 p-1 rounded-2xl border border-slate-200/30 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setReviewMode('due')
              if (cramMode) setCramMode(false)
            }}
            disabled={cramMode}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer disabled:opacity-50 ${
              reviewMode === 'due' && !cramMode
                ? 'bg-white dark:bg-zinc-800 text-slate-855 dark:text-white shadow-sm shadow-indigo-500/5'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            Cần ôn ({dueCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setReviewMode('all')
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition cursor-pointer ${
              reviewMode === 'all' || cramMode
                ? 'bg-white dark:bg-zinc-800 text-slate-855 dark:text-white shadow-sm shadow-indigo-500/5'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            Tất cả ({totalCount})
          </button>
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
          Tùy chọn bổ sung
        </span>
        <div className="grid grid-cols-2 gap-2">
          {/* Star Option */}
          <button
            type="button"
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              showStarredOnly
                ? 'bg-amber-500/10 border-amber-500/35 text-amber-600 dark:text-amber-405'
                : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200/50 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Star className="size-4 shrink-0" fill={showStarredOnly ? 'currentColor' : 'none'} />
            <span>Gắn sao</span>
          </button>

          {/* Shuffle Option */}
          <button
            type="button"
            onClick={() => setIsShuffled(!isShuffled)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              isShuffled
                ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-600 dark:text-indigo-405'
                : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200/50 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Shuffle className="size-4 shrink-0" />
            <span>Xáo trộn</span>
          </button>

          {/* Pronounce Option */}
          <button
            type="button"
            onClick={() => setAutoPronounce(!autoPronounce)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              autoPronounce
                ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-405'
                : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200/50 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Volume2 className="size-4 shrink-0" />
            <span>Phát âm</span>
          </button>

          {/* Cram Option */}
          <button
            type="button"
            onClick={() => {
              setCramMode(!cramMode)
              if (!cramMode) {
                setReviewMode('all')
              }
            }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              cramMode
                ? 'bg-amber-500/10 border-amber-500/35 text-amber-600 dark:text-amber-405 animate-pulse'
                : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200/50 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Zap className="size-4 shrink-0" />
            <span>Cấp tốc</span>
          </button>
        </div>
      </div>
    </div>
  )
}
