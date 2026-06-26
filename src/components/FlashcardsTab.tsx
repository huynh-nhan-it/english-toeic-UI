import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  Volume2,
  RotateCcw,
  Trash2,
  Award,
  BookOpen,
  Layers,
  Star,
  Shuffle,
  Keyboard,
  SpellCheck,
  Zap,
  Check,
  X,
  Languages,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import type { FlashcardItem } from '../lib/toeic'
import { CustomDialog } from './CustomDialog'
import { generateAiFlashcards } from '../lib/geminiApi'

type FlashcardsTabProps = {
  flashcards: FlashcardItem[]
  onUpdateCard: (card: FlashcardItem) => void
  onDeleteCard: (id: string) => void
  onAddCard: (
    word: string,
    phonetic: string,
    definition: string,
    translation: string,
    example: string
  ) => void
  apiKey?: string
  leitnerIntervals?: number[]
  
  // Lifted Config States & Setters
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
}

export function FlashcardsTab({
  flashcards,
  onUpdateCard,
  onDeleteCard,
  onAddCard,
  apiKey,
  leitnerIntervals,
  
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
  setCramMode
}: FlashcardsTabProps) {

  // Learning States
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Custom Dialog State
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean
    message: string
    type: 'alert' | 'confirm'
    onConfirm: () => void
    variant?: 'info' | 'warning' | 'danger'
  }>({
    isOpen: false,
    message: '',
    type: 'alert',
    onConfirm: () => {},
    variant: 'info'
  })


  
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

  // Leitner system intervals
  const intervals = useMemo(() => {
    return leitnerIntervals || [
      60 * 1000, // Box 1: 1 min
      10 * 60 * 1000, // Box 2: 10 min
      24 * 60 * 60 * 1000, // Box 3: 1 day
      4 * 24 * 60 * 60 * 1000, // Box 4: 4 days
      10 * 24 * 60 * 60 * 1000, // Box 5: 10 days
    ]
  }, [leitnerIntervals])

  const boxColors = [
    'bg-rose-500 dark:bg-rose-500/80',
    'bg-orange-500 dark:bg-orange-500/80',
    'bg-amber-500 dark:bg-amber-500/80',
    'bg-sky-500 dark:bg-sky-500/80',
    'bg-emerald-500 dark:bg-emerald-500/80'
  ]
  
  const boxNames = ['Hộp 1', 'Hộp 2', 'Hộp 3', 'Hộp 4', 'Hộp 5']

  // Statistics
  const stats = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    flashcards.forEach((card) => {
      const bIdx = Math.max(1, Math.min(5, card.box)) - 1
      counts[bIdx]++
    })
    return counts
  }, [flashcards])

  // Filter due cards
  const dueCards = useMemo(() => {
    const now = new Date()
    return flashcards.filter((card) => new Date(card.nextReview) <= now)
  }, [flashcards])

  // Active Deck creation based on filters
  const activeDeck = useMemo(() => {
    let deck = [...flashcards]
    
    // 1. Apply Due vs All filter (cramMode overrides due filter to show all cards)
    if (reviewMode === 'due' && !cramMode) {
      deck = dueCards
    }

    // 2. Apply Starred Only filter
    if (showStarredOnly) {
      deck = deck.filter(card => card.starred)
    }

    return deck
  }, [flashcards, dueCards, reviewMode, showStarredOnly, cramMode])

  // Shuffled mapping logic to avoid breaking index when switching shuffle state
  const shuffledIndices = useMemo(() => {
    const indices = Array.from({ length: activeDeck.length }, (_, i) => i)
    if (isShuffled) {
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]]
      }
    }
    return indices
  }, [activeDeck.length, isShuffled])

  // Get current active card
  const currentCardIndex = shuffledIndices[currentIndex] ?? 0
  const currentCard = activeDeck[currentCardIndex] || null

  // Reset index if deck size changes
  useEffect(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setSpellingInput('')
    setSpellingSubmitted(false)
    setIsSpellingCorrect(null)
  }, [activeDeck.length, isShuffled, studyMode])

  // Text-to-speech function
  const speakWord = useCallback((word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.85
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // Auto-pronounce on card change or flip
  useEffect(() => {
    if (currentCard && autoPronounce) {
      // In spelling mode, only pronounce when correct
      if (studyMode === 'review') {
        const timer = setTimeout(() => {
          speakWord(currentCard.word)
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [currentCard?.id, isFlipped, autoPronounce, studyMode, speakWord])

  // Grade/Leitner Box update
  const handleGrade = useCallback((grade: 'again' | 'good' | 'easy') => {
    if (!currentCard) return

    if (!cramMode) {
      let nextBox = currentCard.box
      if (grade === 'again') {
        nextBox = 1
      } else if (grade === 'good') {
        nextBox = Math.min(5, currentCard.box + 1)
      } else if (grade === 'easy') {
        nextBox = Math.min(5, currentCard.box + 2)
      }

      const interval = intervals[nextBox - 1]
      const nextReviewTime = new Date(Date.now() + interval)

      const updatedCard: FlashcardItem = {
        ...currentCard,
        box: nextBox,
        nextReview: nextReviewTime.toISOString(),
        updatedAt: new Date().toISOString(),
      }
      onUpdateCard(updatedCard)
    }

    // Move to next card
    setIsFlipped(false)
    setSpellingInput('')
    setSpellingSubmitted(false)
    setIsSpellingCorrect(null)

    setTimeout(() => {
      if (currentIndex >= activeDeck.length - 1) {
        setCurrentIndex(0)
      } else {
        setCurrentIndex((prev) => prev + 1)
      }
    }, 250)
  }, [currentCard, activeDeck.length, currentIndex, onUpdateCard, intervals, cramMode])

  // Handle Star/Starred toggle
  const handleToggleStar = useCallback((e: React.MouseEvent, card: FlashcardItem) => {
    e.stopPropagation()
    const updatedCard: FlashcardItem = {
      ...card,
      starred: !card.starred,
      updatedAt: new Date().toISOString(),
    }
    onUpdateCard(updatedCard)
  }, [onUpdateCard])

  // Delete card handler
  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setCustomDialog({
      isOpen: true,
      message: 'Bạn có chắc chắn muốn xóa thẻ từ vựng này khỏi Sổ tay Flashcard của bạn không? Hành động này sẽ không thể hoàn tác.',
      type: 'confirm',
      variant: 'danger',
      onConfirm: () => {
        onDeleteCard(id)
        setIsFlipped(false)
        setSpellingInput('')
        setSpellingSubmitted(false)
        setIsSpellingCorrect(null)
        if (currentIndex >= activeDeck.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
        }
        setCustomDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }, [activeDeck.length, currentIndex, onDeleteCard])

  const handleNext = () => {
    setIsFlipped(false)
    setSpellingInput('')
    setSpellingSubmitted(false)
    setIsSpellingCorrect(null)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeDeck.length)
    }, 200)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setSpellingInput('')
    setSpellingSubmitted(false)
    setIsSpellingCorrect(null)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length)
    }, 200)
  }

  // Spelling checker
  const handleCheckSpelling = () => {
    if (!currentCard || spellingSubmitted) return
    const isCorrect = spellingInput.trim().toLowerCase() === currentCard.word.trim().toLowerCase()
    setIsSpellingCorrect(isCorrect)
    setSpellingSubmitted(true)
    
    if (isCorrect) {
      if (autoPronounce) {
        speakWord(currentCard.word)
      }
    }
  }

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering shortcuts when user is typing in the input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (studyMode === 'spelling' && e.key === 'Enter') {
          e.preventDefault()
          if (!spellingSubmitted) {
            handleCheckSpelling()
          } else {
            // If correct, auto grade good. If incorrect, auto grade again
            handleGrade(isSpellingCorrect ? 'good' : 'again')
          }
        }
        return
      }

      if (!currentCard) return

      switch (e.key) {
        case ' ': // Space: Flip Card
          e.preventDefault()
          if (studyMode === 'review') {
            setIsFlipped((f) => !f)
          }
          break
        case '1': // Again
          handleGrade('again')
          break
        case '2': // Good
          handleGrade('good')
          break
        case '3': // Easy
          handleGrade('easy')
          break
        case 'ArrowRight': // Next
          handleNext()
          break
        case 'ArrowLeft': // Prev
          handlePrev()
          break
        case 's': // Star hotkey
        case 'S':
          const target = currentCard
          const mockEvent = { stopPropagation: () => {} } as React.MouseEvent
          handleToggleStar(mockEvent, target)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentCard, studyMode, spellingInput, spellingSubmitted, isSpellingCorrect, handleGrade, handleToggleStar])

  // Mobile Touch Gestures
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
    
    // Only allow horizontal swiping, and vertical up swiping (for flip)
    setSwipeOffset({
      x: diffX,
      y: diffY < 0 ? diffY : 0 // Drag up is negative y
    })
  }

  const handleTouchEnd = () => {
    if (!touchStart || !isSwiping) return
    setIsSwiping(false)

    const threshold = 120 // Swipe threshold in pixels
    const verticalThreshold = -100 // Up swipe threshold

    if (swipeOffset.x > threshold) {
      // Swipe Right -> Good
      handleGrade('good')
    } else if (swipeOffset.x < -threshold) {
      // Swipe Left -> Again
      handleGrade('again')
    } else if (swipeOffset.y < verticalThreshold) {
      // Swipe Up -> Flip
      if (studyMode === 'review') {
        setIsFlipped((prev) => !prev)
      }
    }

    // Reset offsets
    setSwipeOffset({ x: 0, y: 0 })
    setTouchStart(null)
  }

  // Mouse 3D Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardContainerRef.current
    if (!card) return
    
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Calculate tilt angles (limit to 12 degrees max)
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

  // Render Card Content helper (Front & Back)
  const renderCardContent = () => {
    if (!currentCard) return null

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
                onClick={(e) => handleToggleStar(e, currentCard)}
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
                onClick={(e) => handleDelete(e, currentCard.id)}
                className="text-slate-400 hover:text-rose-650 dark:hover:text-rose-450 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition hover:scale-[1.08] active:scale-[0.9] cursor-pointer"
                title="Xóa thẻ"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-4 text-center py-2">
            {/* Vietnamese meaning prompts the spelling */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Gõ từ tiếng Anh tương ứng với nghĩa:</span>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-violet-400 leading-tight">
                {currentCard.translation}
              </h3>
            </div>

            {/* English Definition with blank space */}
            {currentCard.definition && (
              <p className="text-xs text-slate-650 dark:text-zinc-300 max-w-sm mx-auto leading-relaxed italic bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/10">
                "{currentCard.definition.replace(new RegExp(currentCard.word, 'gi'), '_____')}"
              </p>
            )}

            {/* Example sentence with blanks */}
            {currentCard.example && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                <span className="font-semibold block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Ví dụ minh họa:</span>
                "{currentCard.example.replace(new RegExp(currentCard.word, 'gi'), '_____')}"
              </p>
            )}
          </div>

          {/* Interactive spelling checker box */}
          <div className="space-y-3 shrink-0">
            {!spellingSubmitted ? (
              <div className="flex gap-2.5">
                <input
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
                {/* Result Feedback Banner */}
                <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                  isSpellingCorrect
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-650 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-650 dark:text-rose-400'
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

                {/* Grade buttons based on spelling result */}
                <div className="flex gap-3">
                  {isSpellingCorrect ? (
                    <>
                      <button
                        onClick={() => handleGrade('good')}
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
                        onClick={() => handleGrade('again')}
                        className="flex-1 flex items-center justify-center gap-2 bg-rose-500 text-white font-black text-xs uppercase tracking-wider py-3 rounded-2xl hover:bg-rose-650 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
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

    // Default Review Mode (Flip Card)
    return (
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
                onClick={(e) => handleToggleStar(e, currentCard)}
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
                onClick={(e) => handleDelete(e, currentCard.id)}
                className="text-slate-400 hover:text-rose-650 dark:hover:text-rose-450 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition hover:scale-[1.08] active:scale-[0.9] cursor-pointer"
                title="Xóa thẻ"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="text-center space-y-3 my-auto">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-850 dark:text-white tracking-tight capitalize select-text">
              {currentCard.word}
            </h3>
            {currentCard.phonetic && (
              <p className="text-xs sm:text-sm lg:text-base font-mono font-semibold text-slate-450 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-950/40 inline-block px-3 py-1 rounded-xl border border-slate-200/5">
                {currentCard.phonetic}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center shrink-0 pt-2 border-t border-slate-200/10">
            <button
              onClick={(e) => { e.stopPropagation(); speakWord(currentCard.word); }}
              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-violet-450 bg-indigo-50/60 dark:bg-violet-500/10 px-3.5 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-violet-500/20 transition hover:scale-[1.05] active:scale-[0.95] cursor-pointer"
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
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-slate-100 text-slate-650 dark:bg-zinc-950 dark:text-zinc-400 rounded-lg border border-slate-200/50 dark:border-zinc-800/40 flex items-center gap-1">
              <Languages className="size-3 text-violet-500" />
              Định nghĩa & Nghĩa
            </span>
            <button
              onClick={(e) => handleToggleStar(e, currentCard)}
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
              <p className="text-lg sm:text-xl lg:text-2xl font-black text-indigo-600 dark:text-violet-400 leading-tight select-text">
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
              <div className="space-y-1 border-l-2 border-slate-200 dark:border-zinc-800 pl-3">
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider">Ví dụ minh họa</p>
                <p className="text-xs sm:text-sm lg:text-base italic text-slate-600 dark:text-zinc-400 leading-relaxed select-text">
                  "{currentCard.example}"
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center shrink-0 pt-2 border-t border-slate-200/10">
            <button
              onClick={(e) => { e.stopPropagation(); speakWord(currentCard.word); }}
              className="flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-violet-450 hover:bg-slate-100 dark:hover:bg-zinc-800 p-2 rounded-xl cursor-pointer"
            >
              <Volume2 className="size-4" />
            </button>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">Click để lật lại mặt trước</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent select-none">
      {/* Compact Header */}
      <div className="border-b border-slate-200/85 dark:border-zinc-800/85 px-4 py-2.5 sm:px-6 shrink-0 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-slate-800 dark:text-white">Thẻ Từ Vựng (Flashcards)</h2>
          {cramMode && (
            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 animate-pulse">
              <Zap className="size-3 fill-amber-500" />
              Cram Mode
            </span>
          )}
        </div>
      </div>

      {/* Non-scrolling flex layout */}
      <div className="min-h-0 flex-1 flex flex-col px-3 pt-3 pb-3 sm:px-5 bg-slate-50/30 dark:bg-transparent gap-3">
        <div className="mx-auto w-full max-w-lg flex flex-col flex-1 min-h-0 gap-3">

          {/* Compact Leitner Box Stats */}
          <div className={`glass-panel rounded-2xl px-3 py-2 shadow-sm transition-all duration-300 shrink-0 ${cramMode ? 'opacity-45 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">
                <Layers className="size-3.5 text-violet-500 dark:text-cyan-400" />
                Leitner
              </div>
              <div className="flex flex-1 gap-1.5">
                {stats.map((count, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="h-9 w-full bg-slate-100/50 dark:bg-zinc-950/60 rounded-xl relative overflow-hidden flex items-end border border-slate-200/20 dark:border-zinc-800">
                      <div
                        className={`w-full ${boxColors[idx]} opacity-70 dark:opacity-40 transition-all duration-700`}
                        style={{ height: `${flashcards.length > 0 ? (count / flashcards.length) * 100 : 0}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-850 dark:text-zinc-200">
                        {count}
                      </span>
                    </div>
                    <span className="text-[8px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-wider">{boxNames[idx]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {currentCard ? (
            <div className="flex flex-col flex-1 min-h-0 gap-2">
              {/* Card — fills available height */}
              <div
                ref={cardContainerRef}
                onClick={() => {
                  if (studyMode === 'review' && !isSwiping) {
                    const card = cardContainerRef.current
                    if (card) {
                      card.style.setProperty('--rotate-x', '0deg')
                      card.style.setProperty('--rotate-y', '0deg')
                    }
                    setIsFlipped(!isFlipped)
                  }
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="w-full flex-1 min-h-0 perspective-1000 relative cursor-pointer select-none"
                style={{
                  perspective: '1000px',
                  transform: isSwiping
                    ? `rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg)) translate3d(${swipeOffset.x}px, ${swipeOffset.y}px, 0px) rotate(${swipeOffset.x * 0.05}deg)`
                    : `rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg))`,
                  transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
                }}
              >
                {renderCardContent()}
              </div>

              {/* Nav + Rating row — compact, always visible at bottom */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Prev/Next navigation */}
                <div className="flex items-center gap-1 bg-slate-100/60 dark:bg-zinc-950/60 px-2 py-1.5 rounded-xl border border-slate-200/10 shrink-0">
                  <button
                    onClick={handlePrev}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition active:scale-[0.92] cursor-pointer"
                    aria-label="Thẻ trước"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-[11px] font-black tracking-wider tabular-nums px-1 text-slate-600 dark:text-zinc-300">
                    {currentIndex + 1} / {activeDeck.length}
                  </span>
                  <button
                    onClick={handleNext}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition active:scale-[0.92] cursor-pointer"
                    aria-label="Thẻ tiếp theo"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                {/* Rating buttons — inline, compact */}
                {studyMode === 'review' && (
                  <div className="flex flex-1 gap-2">
                    <button
                      onClick={() => handleGrade('again')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 py-2 rounded-xl hover:bg-rose-500/20 transition active:scale-[0.97] cursor-pointer"
                    >
                      <span className="text-[11px] font-black uppercase">Again</span>
                    </button>
                    <button
                      onClick={() => handleGrade('good')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 py-2 rounded-xl hover:bg-amber-500/20 transition active:scale-[0.97] cursor-pointer"
                    >
                      <span className="text-[11px] font-black uppercase">Good</span>
                    </button>
                    <button
                      onClick={() => handleGrade('easy')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 py-2 rounded-xl hover:bg-emerald-500/20 transition active:scale-[0.97] cursor-pointer"
                    >
                      <span className="text-[11px] font-black uppercase">Easy</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Keyboard shortcut guide — desktop only */}
              <div className="hidden sm:flex items-center gap-4 text-[10px] text-slate-400 dark:text-zinc-550 font-semibold uppercase tracking-wider shrink-0">
                <span className="flex items-center gap-1"><Keyboard className="size-3" /> [Space] Lật</span>
                <span>[1] Again · [2] Good · [3] Easy</span>
              </div>
            </div>
          ) : (
            <div className="text-center glass-panel rounded-3xl p-8 shadow-sm space-y-4 border border-indigo-500/10">
              <div className="mx-auto size-16 bg-gradient-to-tr from-violet-100 to-indigo-100 dark:from-violet-500/10 dark:to-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600 dark:text-violet-400 border border-indigo-100/10">
                {reviewMode === 'due' && !cramMode ? <Award className="size-8 animate-bounce" /> : <BookOpen className="size-8" />}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-800 dark:text-white">
                  {showStarredOnly
                    ? 'Không tìm thấy thẻ nào được gắn sao ⭐'
                    : reviewMode === 'due' && !cramMode
                    ? 'Bạn đã ôn tập xong tất cả!'
                    : 'Chưa có thẻ flashcard nào'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  {showStarredOnly
                    ? 'Hãy gắn sao một số từ khó nhớ bằng cách nhấn vào biểu tượng ngôi sao trên thẻ để học riêng chúng.'
                    : reviewMode === 'due' && !cramMode
                    ? 'Tất cả các từ vựng đã được ôn tập đầy đủ. Hãy quay lại sau hoặc kích hoạt Cram Mode để ôn tập cấp tốc.'
                    : 'Hãy đi tới tab Sổ Tay (Notebook) và nhấn nút thêm từ vựng mới vào Flashcards của bạn.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-2">
                {showStarredOnly && (
                  <button
                    onClick={() => setShowStarredOnly(false)}
                    className="text-xs font-black text-indigo-600 dark:text-violet-400 bg-indigo-50 dark:bg-violet-500/10 hover:bg-indigo-100 dark:hover:bg-violet-500/20 px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Xem tất cả các thẻ
                  </button>
                )}
                {reviewMode === 'due' && !cramMode && flashcards.length > 0 && (
                  <button
                    onClick={() => setCramMode(true)}
                    className="text-xs font-black text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Zap className="size-3.5 fill-current" />
                    Bật Cram Mode ôn thi cấp tốc ({flashcards.length} từ)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Alert/Confirm Modal Dialog */}
      <CustomDialog
        isOpen={customDialog.isOpen}
        message={customDialog.message}
        type={customDialog.type}
        variant={customDialog.variant}
        onConfirm={customDialog.onConfirm}
        onCancel={() => setCustomDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
