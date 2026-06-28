import { useState, useEffect, useRef, useCallback } from 'react'
import { Volume2, Trash2, Star, SpellCheck, Check, X, Languages, RotateCcw, ChevronRight } from 'lucide-react'
import type { FlashcardItem } from '../../types'

type FlashcardDeckProps = {
  currentCard: FlashcardItem
  studyMode: 'review' | 'spelling'
  onGrade: (grade: 'again' | 'good' | 'easy') => void
  onToggleStar: (e: React.MouseEvent, card: FlashcardItem) => void
  onDeleteCard: (e: React.MouseEvent, id: string) => void
  autoPronounce: boolean
  cramMode: boolean
}

export function FlashcardDeck({
  currentCard,
  studyMode,
  onGrade,
  onToggleStar,
  onDeleteCard,
  autoPronounce,
}: FlashcardDeckProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  // Spelling Mode States
  const [spellingInput, setSpellingInput] = useState('')
  const [spellingSubmitted, setSpellingSubmitted] = useState(false)
  const [isSpellingCorrect, setIsSpellingCorrect] = useState<boolean | null>(null)

  // Touch/Swipe Gesture States
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 })
  const [isSwiping, setIsSwiping] = useState(false)

  // Card element ref for 3D Tilt
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const spellingInputRef = useRef<HTMLInputElement>(null)

  const boxColors = [
    'bg-rose-500 dark:bg-rose-500/80',
    'bg-orange-500 dark:bg-orange-500/80',
    'bg-amber-500 dark:bg-amber-500/80',
    'bg-sky-500 dark:bg-sky-500/80',
    'bg-emerald-500 dark:bg-emerald-500/80',
  ]

  const [prevCardId, setPrevCardId] = useState(currentCard.id)
  const [prevStudyMode, setPrevStudyMode] = useState(studyMode)

  if (currentCard.id !== prevCardId || studyMode !== prevStudyMode) {
    setPrevCardId(currentCard.id)
    setPrevStudyMode(studyMode)
    setIsFlipped(false)
    setSpellingInput('')
    setSpellingSubmitted(false)
    setIsSpellingCorrect(null)
  }

  // Auto-focus spelling input on transition
  useEffect(() => {
    if (studyMode === 'spelling') {
      setTimeout(() => {
        spellingInputRef.current?.focus()
      }, 100)
    }
  }, [currentCard.id, studyMode])

  // Text-to-speech
  const speakWord = useCallback((word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.85
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // Auto-pronounce on card load
  useEffect(() => {
    if (autoPronounce) {
      if (studyMode === 'review') {
        const timer = setTimeout(() => {
          speakWord(currentCard.word)
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [currentCard.id, isFlipped, autoPronounce, studyMode, speakWord])

  const handleCheckSpelling = () => {
    if (spellingSubmitted) return
    const isCorrect = spellingInput.trim().toLowerCase() === currentCard.word.trim().toLowerCase()
    setIsSpellingCorrect(isCorrect)
    setSpellingSubmitted(true)

    if (isCorrect) {
      if (autoPronounce) {
        speakWord(currentCard.word)
      }
    }
  }

  // Keyboard Shortcuts for spelling inputs and card operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcuts when focused on input
      if (document.activeElement?.tagName === 'INPUT') {
        if (studyMode === 'spelling' && e.key === 'Enter') {
          e.preventDefault()
          if (!spellingSubmitted) {
            handleCheckSpelling()
          } else {
            onGrade(isSpellingCorrect ? 'good' : 'again')
          }
        }
        return
      }

      // Desktop shortcuts for review mode
      if (studyMode === 'review') {
        switch (e.key) {
          case ' ':
            e.preventDefault()
            setIsFlipped((f) => !f)
            break
          case '1':
            onGrade('again')
            break
          case '2':
            onGrade('good')
            break
          case '3':
            onGrade('easy')
            break
          default:
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [studyMode, spellingInput, spellingSubmitted, isSpellingCorrect, onGrade])

  // Swipe Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isSwiping) return
    const touch = e.touches[0]
    const diffX = touch.clientX - touchStart.x
    const diffY = touch.clientY - touchStart.y

    setSwipeOffset({
      x: diffX,
      y: diffY < 0 ? diffY : 0,
    })
  }

  const handleTouchEnd = () => {
    if (!touchStart || !isSwiping) return
    setIsSwiping(false)

    const threshold = 120
    const verticalThreshold = -100

    if (swipeOffset.x > threshold) {
      onGrade('good')
    } else if (swipeOffset.x < -threshold) {
      onGrade('again')
    } else if (swipeOffset.y < verticalThreshold) {
      if (studyMode === 'review') {
        setIsFlipped((prev) => !prev)
      }
    }

    setSwipeOffset({ x: 0, y: 0 })
    setTouchStart(null)
  }

  // 3D Tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardContainerRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = ((y - centerY) / centerY) * -12
    const rotateY = ((x - centerX) / centerX) * 12

    card.style.setProperty('--rotate-x', `${rotateX}deg`)
    card.style.setProperty('--rotate-y', `${rotateY}deg`)
  }

  const handleMouseLeave = () => {
    const card = cardContainerRef.current
    if (!card) return
    card.style.setProperty('--rotate-x', '0deg')
    card.style.setProperty('--rotate-y', '0deg')
  }

  if (studyMode === 'spelling') {
    return (
      <div className="w-full h-full glass-panel rounded-3xl p-6 flex flex-col justify-between shadow-xl border border-indigo-500/10 transition-all duration-300">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg border border-violet-500/20 flex items-center gap-1">
            <SpellCheck className="size-3" />
            Chế độ chính tả
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => onToggleStar(e, currentCard)}
              className={`p-2 rounded-xl transition hover:scale-[1.1] active:scale-[0.9] cursor-pointer ${
                currentCard.starred
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                  : 'text-slate-400 hover:text-amber-500'
              }`}
              title={currentCard.starred ? 'Bỏ gắn sao' : 'Gắn sao từ khó'}
            >
              <Star className="size-4" fill={currentCard.starred ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => onDeleteCard(e, currentCard.id)}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition hover:scale-[1.08] active:scale-[0.9] cursor-pointer"
              title="Xóa thẻ"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 text-center py-2">
          <div className="space-y-1 select-none">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Gõ từ tiếng Anh tương ứng với nghĩa:</span>
            <h3 className="text-2xl font-black text-indigo-606 dark:text-violet-400 leading-tight">
              {currentCard.translation}
            </h3>
          </div>

          {currentCard.definition && (
            <p className="text-xs text-slate-600 dark:text-zinc-300 max-w-sm mx-auto leading-relaxed italic bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/10">
              "{currentCard.definition.replace(new RegExp(currentCard.word, 'gi'), '_____')}"
            </p>
          )}

          {currentCard.example && (
            <div className="mt-2.5 rounded-2xl bg-slate-100/50 dark:bg-zinc-950/40 p-3.5 border border-slate-200/40 dark:border-zinc-800/40 border-l-4 border-l-indigo-500 dark:border-l-violet-500 text-left max-w-md mx-auto">
              <span className="text-[10px] text-slate-405 dark:text-zinc-500 font-black uppercase tracking-wider block select-none mb-1">Ví dụ minh họa</span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 leading-relaxed select-text">
                “{currentCard.example.replace(new RegExp(currentCard.word, 'gi'), '_____')}”
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3 shrink-0">
          {!spellingSubmitted ? (
            <div className="flex gap-2.5">
              <input
                ref={spellingInputRef}
                type="text"
                placeholder="Gõ từ tại đây..."
                value={spellingInput}
                onChange={(e) => setSpellingInput(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/50 px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-slate-400"
                autoFocus
              />
              <button
                onClick={handleCheckSpelling}
                disabled={!spellingInput.trim()}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white px-5 py-2.5 text-xs font-black tracking-wider uppercase transition hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                Kiểm tra
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                isSpellingCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-500'
              }`}>
                {isSpellingCorrect ? (
                  <Check className="size-5 shrink-0 animate-bounce" />
                ) : (
                  <X className="size-5 shrink-0 animate-pulse" />
                )}
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-wider leading-none">
                    {isSpellingCorrect ? 'Hoàn hảo! Chính xác.' : 'Chưa đúng rồi!'}
                  </p>
                  <p className="text-sm font-black mt-1 leading-tight flex items-center gap-2">
                    Đáp án đúng: <span className="underline font-black tracking-wide text-indigo-600 dark:text-cyan-400 uppercase">{currentCard.word}</span>
                    {currentCard.phonetic && <span className="text-[10px] text-slate-400 font-mono font-medium">{currentCard.phonetic}</span>}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {isSpellingCorrect ? (
                  <>
                    <button
                      onClick={() => onGrade('good')}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-black text-xs uppercase tracking-wider py-3 rounded-2xl hover:bg-emerald-600 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                    >
                      Tiếp tục (Good)
                      <ChevronRight className="size-4" />
                    </button>
                    <button
                      onClick={() => speakWord(currentCard.word)}
                      className="p-3 bg-slate-100 dark:bg-zinc-900 border border-slate-200/40 dark:border-zinc-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                      title="Nghe lại phát âm"
                    >
                      <Volume2 className="size-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onGrade('again')}
                      className="flex-1 flex items-center justify-center gap-2 bg-rose-500 text-white font-black text-xs uppercase tracking-wider py-3 rounded-2xl hover:bg-rose-600 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                    >
                      Học lại (Again)
                      <RotateCcw className="size-4" />
                    </button>
                    <button
                      onClick={() => speakWord(currentCard.word)}
                      className="p-3 bg-slate-100 dark:bg-zinc-900 border border-slate-200/40 dark:border-zinc-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                      title="Nghe phát âm đáp án"
                    >
                      <Volume2 className="size-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={cardContainerRef}
      onClick={() => setIsFlipped(!isFlipped)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full perspective-1000 relative cursor-pointer select-none"
      style={{
        perspective: '1000px',
        transform: isSwiping
          ? `rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg)) translate3d(${swipeOffset.x}px, ${swipeOffset.y}px, 0px) rotate(${swipeOffset.x * 0.05}deg)`
          : `rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg))`,
        transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
      }}
    >
      <div
        className={`w-full h-full relative preserve-3d transition-transform duration-500 ease-out ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Card Front */}
        <div className="absolute inset-0 w-full h-full glass-panel rounded-3xl p-6 flex flex-col justify-between shadow-xl dark:shadow-black/60 backface-hidden border border-indigo-500/10">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg text-white shadow-sm shadow-black/10 tracking-wider ${boxColors[currentCard.box - 1]}`}>
              Hộp {currentCard.box}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => onToggleStar(e, currentCard)}
                className={`p-2 rounded-xl transition hover:scale-[1.1] active:scale-[0.9] cursor-pointer ${
                  currentCard.starred
                    ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                    : 'text-slate-400 hover:text-amber-500'
                }`}
                title={currentCard.starred ? 'Bỏ gắn sao' : 'Gắn sao từ khó'}
              >
                <Star className="size-4" fill={currentCard.starred ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={(e) => onDeleteCard(e, currentCard.id)}
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition hover:scale-[1.08] active:scale-[0.9] cursor-pointer"
                title="Xóa thẻ"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="text-center space-y-3 my-auto">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 dark:text-white tracking-tight capitalize select-text">
              {currentCard.word}
            </h3>
            {currentCard.phonetic && (
              <p className="text-xs sm:text-sm lg:text-base font-mono font-semibold text-slate-500 dark:text-zinc-500 bg-slate-50/50 dark:bg-zinc-950/45 inline-block px-3 py-1 rounded-xl border border-slate-200/5">
                {currentCard.phonetic}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center shrink-0 pt-2 border-t border-slate-200/10">
            <button
              onClick={(e) => {
                e.stopPropagation()
                speakWord(currentCard.word)
              }}
              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-violet-405 bg-indigo-50/60 dark:bg-violet-500/10 px-3.5 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-violet-500/20 transition hover:scale-[1.05] active:scale-[0.95] cursor-pointer"
            >
              <Volume2 className="size-4 animate-pulse" />
              Phát âm
            </button>
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider select-none">Click hoặc vuốt để lật thẻ</span>
          </div>
        </div>

        {/* Card Back */}
        <div className="absolute inset-0 w-full h-full glass-panel rounded-3xl p-6 flex flex-col justify-between shadow-xl dark:shadow-black/60 backface-hidden rotate-y-180 border border-indigo-500/10">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-slate-100 text-slate-600 dark:bg-zinc-950 dark:text-zinc-400 rounded-lg border border-slate-200/50 dark:border-zinc-800/40 flex items-center gap-1">
              <Languages className="size-3 text-violet-500" />
              Định nghĩa & Nghĩa
            </span>
            <button
              onClick={(e) => onToggleStar(e, currentCard)}
              className={`p-2 rounded-xl transition hover:scale-[1.1] active:scale-[0.9] cursor-pointer ${
                currentCard.starred
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
                  : 'text-slate-400 hover:text-amber-500'
              }`}
            >
              <Star className="size-4" fill={currentCard.starred ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-4 text-left py-3 pr-1">
            <div className="space-y-1 bg-violet-50/20 dark:bg-violet-950/10 p-3 rounded-2xl border border-violet-500/10">
              <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider">Nghĩa tiếng Việt</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-black text-indigo-606 dark:text-violet-400 leading-tight select-text">
                {currentCard.translation || 'Chưa cập nhật dịch nghĩa'}
              </p>
            </div>

            {currentCard.definition && (
              <div className="space-y-1 pl-1">
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider">Định nghĩa tiếng Anh</p>
                <p className="text-xs sm:text-sm lg:text-base leading-relaxed text-slate-700 dark:text-zinc-300 select-text">
                  {currentCard.definition}
                </p>
              </div>
            )}

            {currentCard.example && (
              <div className="mt-2.5 rounded-2xl bg-slate-100/50 dark:bg-zinc-950/40 p-3.5 border border-slate-200/40 dark:border-zinc-800/40 border-l-4 border-l-indigo-500 dark:border-l-violet-500 text-left">
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider select-none mb-1">Ví dụ minh họa</p>
                <p className="text-xs sm:text-sm lg:text-base font-bold text-slate-800 dark:text-zinc-200 leading-relaxed select-text">
                  “{currentCard.example}”
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center shrink-0 pt-2 border-t border-slate-200/10">
            <button
              onClick={(e) => {
                e.stopPropagation()
                speakWord(currentCard.word)
              }}
              className="flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-violet-405 hover:bg-slate-100 dark:hover:bg-zinc-800 p-2 rounded-xl cursor-pointer"
            >
              <Volume2 className="size-4" />
            </button>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">Click để lật lại mặt trước</span>
          </div>
        </div>
      </div>
    </div>
  )
}
