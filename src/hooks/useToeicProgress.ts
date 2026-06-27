import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadProgress, saveProgress } from '../lib/storage'
import {
  createExam,
  type AnswerChoice,
  type NoteKey,
  type StudyNotes,
  type ToeicExam,
  type ToeicProgressData,
  type FlashcardItem,
  type CloudConfig,
} from '../lib/toeic'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  refreshAuthToken,
  uploadToFirebase,
  downloadFromFirebase,
} from '../lib/firebaseSync'

const NOTE_SAVE_DELAY_MS = 500
const SYNC_DEBOUNCE_MS = 2000

// Safe defaults so compilation/auth doesn't fail
const DEFAULT_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'toeic-progress-web'
const DEFAULT_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA-mock-key-for-toeic-progress'

function areNumberArraysEqual(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function areNotesEqual(left: StudyNotes, right: StudyNotes): boolean {
  return (
    left.businessVocabulary === right.businessVocabulary &&
    left.grammarTraps === right.grammarTraps &&
    left.transcriptShadowing === right.transcriptShadowing &&
    left.activeShadowingLine === right.activeShadowingLine &&
    areStringArraysEqual(left.selectedGrammarFormulaIds, right.selectedGrammarFormulaIds) &&
    areNumberArraysEqual(left.completedShadowingLines, right.completedShadowingLines)
  )
}

function replaceActiveExam(progress: ToeicProgressData, updater: (exam: ToeicExam) => ToeicExam): ToeicProgressData {
  return {
    ...progress,
    exams: progress.exams.map((exam) =>
      exam.id === progress.activeExamId ? { ...updater(exam), updatedAt: new Date().toISOString() } : exam,
    ),
  }
}

function getActiveExam(progress: ToeicProgressData): ToeicExam {
  return progress.exams.find((exam) => exam.id === progress.activeExamId) ?? progress.exams[0]
}

export function useToeicProgress() {
  const [progress, setProgress] = useState<ToeicProgressData>(() => loadProgress())
  const activeExam = getActiveExam(progress)
  const [notesDraft, setNotesDraft] = useState(() => activeExam.notes)

  const resolvedCloudConfig = useMemo(() => {
    return {
      ...progress.cloudConfig,
      projectId: progress.cloudConfig.projectId.trim() || import.meta.env.VITE_FIREBASE_PROJECT_ID || 'toeic-progress-web',
      apiKey: progress.cloudConfig.apiKey.trim() || import.meta.env.VITE_FIREBASE_API_KEY || '',
      googleClientId: progress.cloudConfig.googleClientId?.trim() || import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    }
  }, [progress.cloudConfig])

  const resolvedGeminiApiKey = useMemo(() => {
    return progress.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || ''
  }, [progress.geminiApiKey])

  // Helper to get active API Key & Project ID
  const getFirebaseConfig = useCallback(() => {
    const pId = progress.cloudConfig.projectId.trim() || DEFAULT_PROJECT_ID
    const key = progress.cloudConfig.apiKey.trim() || DEFAULT_API_KEY
    return { projectId: pId, apiKey: key }
  }, [progress.cloudConfig.projectId, progress.cloudConfig.apiKey])

  // Token Auto-Refresh check wrapper
  const ensureValidToken = useCallback(async (currentProgress: ToeicProgressData): Promise<ToeicProgressData> => {
    const { user } = currentProgress.cloudConfig
    if (!user) return currentProgress

    // If token expires in less than 5 minutes, refresh it
    if (user.expiresAt < Date.now() + 5 * 60 * 1000) {
      const { apiKey } = getFirebaseConfig()
      try {
        const refreshed = await refreshAuthToken(user.refreshToken, apiKey)
        const updatedProgress: ToeicProgressData = {
          ...currentProgress,
          cloudConfig: {
            ...currentProgress.cloudConfig,
            user: {
              ...user,
              idToken: refreshed.idToken,
              refreshToken: refreshed.refreshToken,
              expiresAt: refreshed.expiresAt,
            },
          },
        }
        saveProgress(updatedProgress)
        return updatedProgress
      } catch (e) {
        console.error('Failed to refresh Firebase token, logging out user:', e)
        // Log out on persistent token error
        const loggedOutProgress: ToeicProgressData = {
          ...currentProgress,
          cloudConfig: {
            ...currentProgress.cloudConfig,
            user: null,
          },
        }
        saveProgress(loggedOutProgress)
        return loggedOutProgress
      }
    }
    return currentProgress
  }, [getFirebaseConfig])

  // Sync on mount
  useEffect(() => {
    const initSync = async () => {
      let current = loadProgress()
      if (current.cloudConfig.enabled && current.cloudConfig.user) {
        try {
          current = await ensureValidToken(current)
          if (!current.cloudConfig.user) {
            setProgress(current)
            return
          }
          const cloudData = await downloadFromFirebase(current.cloudConfig)
          if (cloudData) {
            const localTime = new Date(current.updatedAt).getTime()
            const cloudTime = new Date(cloudData.updatedAt).getTime()

            if (cloudTime > localTime) {
              const mergedProgress = {
                ...cloudData,
                // Keep the current local auth/cloud config
                cloudConfig: current.cloudConfig,
              }
              setProgress(mergedProgress)
              saveProgress(mergedProgress)
            } else if (localTime > cloudTime) {
              await uploadToFirebase(current)
            }
          } else {
            // Document doesn't exist in cloud, upload current local state
            await uploadToFirebase(current)
          }
        } catch (e) {
          console.error('Initial cloud sync failed:', e)
        }
      }
    }
    initSync()
  }, [ensureValidToken])

  // Keep draft note sync
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotesDraft(activeExam.notes)
  }, [activeExam.id, activeExam.notes])

  // Debounced note autosave
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProgress((current) =>
        saveProgress(
          replaceActiveExam(current, (exam) => {
            if (exam.id !== current.activeExamId || areNotesEqual(exam.notes, notesDraft)) {
              return exam
            }

            return {
              ...exam,
              notes: notesDraft,
            }
          }),
        ),
      )
    }, NOTE_SAVE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [notesDraft])

  // Debounced auto cloud sync on progress changes
  useEffect(() => {
    if (progress.cloudConfig.enabled && progress.cloudConfig.user) {
      const timeoutId = window.setTimeout(async () => {
        const validated = await ensureValidToken(progress)
        if (validated.cloudConfig.user) {
          await uploadToFirebase(validated)
        }
      }, SYNC_DEBOUNCE_MS)
      return () => window.clearTimeout(timeoutId)
    }
  }, [progress, ensureValidToken])

  const updateAnswer = useCallback((questionNumber: number, answer: AnswerChoice) => {
    setProgress((current) =>
      saveProgress(
        replaceActiveExam(current, (exam) => ({
          ...exam,
          answers: {
            ...exam.answers,
            [questionNumber]: answer,
          },
        })),
      ),
    )
  }, [])

  const updateNote = useCallback(<K extends NoteKey>(key: K, value: StudyNotes[K]) => {
    setNotesDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }, [])

  const selectExam = useCallback((examId: string) => {
    setProgress((current) => {
      if (!current.exams.some((exam) => exam.id === examId)) {
        return current
      }

      return saveProgress({
        ...current,
        activeExamId: examId,
      })
    })
  }, [])

  const createNewExam = useCallback(() => {
    setProgress((current) => {
      const nextNumber = current.exams.length + 1
      const nextExam = createExam(`exam-${nextNumber}`, `TOEIC Test ${nextNumber}`)

      return saveProgress({
        ...current,
        activeExamId: nextExam.id,
        exams: [...current.exams, nextExam],
      })
    })
  }, [])

  const renameActiveExam = useCallback((title: string) => {
    setProgress((current) =>
      saveProgress(
        replaceActiveExam(current, (exam) => ({
          ...exam,
          title,
        })),
      ),
    )
  }, [])

  // Flashcards state modifiers
  const addFlashcard = useCallback((
    word: string,
    phonetic: string,
    definition: string,
    translation: string,
    example: string,
    audioUrl?: string
  ) => {
    setProgress((current) => {
      const normalizedWord = word.trim().toLowerCase()
      if (current.flashcards.some((f) => f.word.toLowerCase() === normalizedWord)) {
        return current
      }
      
      const newCard: FlashcardItem = {
        id: Math.random().toString(36).substring(2, 9),
        word: word.trim(),
        phonetic,
        definition,
        translation,
        example,
        audioUrl,
        box: 1,
        nextReview: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        starred: false,
      }

      const next = {
        ...current,
        flashcards: [...current.flashcards, newCard],
      }
      
      return saveProgress(next)
    })
  }, [])

  const updateFlashcard = useCallback((updatedCard: FlashcardItem) => {
    setProgress((current) => {
      const next = {
        ...current,
        flashcards: current.flashcards.map((c) =>
          c.id === updatedCard.id ? updatedCard : c
        ),
      }
      return saveProgress(next)
    })
  }, [])

  const deleteFlashcard = useCallback((id: string) => {
    setProgress((current) => {
      const next = {
        ...current,
        flashcards: current.flashcards.filter((c) => c.id !== id),
      }
      return saveProgress(next)
    })
  }, [])

  // Advanced Config Modifier
  const saveCloudConfig = useCallback((projectId: string, apiKey: string, googleClientId: string, enabled: boolean) => {
    setProgress((current) => {
      const next = {
        ...current,
        cloudConfig: {
          ...current.cloudConfig,
          projectId,
          apiKey,
          googleClientId,
          enabled,
        },
      }
      return saveProgress(next)
    })
  }, [])

  const updateLeitnerIntervals = useCallback((intervals: number[]) => {
    setProgress((current) => {
      const next = {
        ...current,
        leitnerIntervals: intervals,
        updatedAt: new Date().toISOString(),
      }
      return saveProgress(next)
    })
  }, [])

  const updateGeminiApiKey = useCallback((apiKey: string) => {
    setProgress((current) => {
      const next = {
        ...current,
        geminiApiKey: apiKey.trim(),
        updatedAt: new Date().toISOString(),
      }
      return saveProgress(next)
    })
  }, [])

  // Cloud Accounts Handlers
  const login = useCallback(async (email: string, password: string) => {
    const { apiKey } = getFirebaseConfig()
    if (!apiKey) throw new Error('API Key Firebase trống. Hãy cấu hình API Key.')

    const auth = await signInWithEmail(email, password, apiKey)
    
    // Once authenticated, load cloud data if exists
    const nextCloudConfig: CloudConfig = {
      ...progress.cloudConfig,
      enabled: true,
      user: auth,
    }

    const cloudData = await downloadFromFirebase(nextCloudConfig)
    setProgress((current) => {
      let nextProgress: ToeicProgressData
      if (cloudData) {
        nextProgress = {
          ...cloudData,
          cloudConfig: nextCloudConfig,
        }
      } else {
        nextProgress = {
          ...current,
          cloudConfig: nextCloudConfig,
        }
      }
      saveProgress(nextProgress)
      
      // Upload current if cloud was empty
      if (!cloudData) {
        uploadToFirebase(nextProgress)
      }
      
      return nextProgress
    })
  }, [progress.cloudConfig, getFirebaseConfig])

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const { apiKey } = getFirebaseConfig()
    if (!apiKey) throw new Error('API Key Firebase trống. Hãy cấu hình API Key.')

    const auth = await signInWithGoogle(idToken, apiKey)
    
    // Once authenticated, load cloud data if exists
    const nextCloudConfig: CloudConfig = {
      ...progress.cloudConfig,
      enabled: true,
      user: auth,
    }

    const cloudData = await downloadFromFirebase(nextCloudConfig)
    setProgress((current) => {
      let nextProgress: ToeicProgressData
      if (cloudData) {
        nextProgress = {
          ...cloudData,
          cloudConfig: nextCloudConfig,
        }
      } else {
        nextProgress = {
          ...current,
          cloudConfig: nextCloudConfig,
        }
      }
      saveProgress(nextProgress)
      
      // Upload current if cloud was empty
      if (!cloudData) {
        uploadToFirebase(nextProgress)
      }
      
      return nextProgress
    })
  }, [progress.cloudConfig, getFirebaseConfig])

  const register = useCallback(async (email: string, password: string) => {
    const { apiKey } = getFirebaseConfig()
    if (!apiKey) throw new Error('API Key Firebase trống. Hãy cấu hình API Key.')

    const auth = await signUpWithEmail(email, password, apiKey)
    
    const nextCloudConfig: CloudConfig = {
      ...progress.cloudConfig,
      enabled: true,
      user: auth,
    }

    setProgress((current) => {
      const nextProgress: ToeicProgressData = {
        ...current,
        cloudConfig: nextCloudConfig,
      }
      saveProgress(nextProgress)
      uploadToFirebase(nextProgress)
      return nextProgress
    })
  }, [progress.cloudConfig, getFirebaseConfig])

  const logout = useCallback(() => {
    setProgress((current) => {
      const nextProgress: ToeicProgressData = {
        ...current,
        cloudConfig: {
          ...current.cloudConfig,
          user: null,
        },
      }
      return saveProgress(nextProgress)
    })
  }, [])

  const clearData = useCallback(() => {
    localStorage.clear()
  }, [])

  const latestActiveExam = getActiveExam(progress)

  // Empty placeholders to retain backward compatibility in interfaces
  const linkStudyCode = useCallback(async () => false, [])
  const manualSync = useCallback(async () => {
    let current = loadProgress()
    if (!current.cloudConfig.enabled || !current.cloudConfig.user) {
      throw new Error('Chưa kích hoạt đồng bộ đám mây hoặc chưa đăng nhập tài khoản.')
    }

    current = await ensureValidToken(current)
    if (!current.cloudConfig.user) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }

    const cloudData = await downloadFromFirebase(current.cloudConfig)
    if (cloudData) {
      const localTime = new Date(current.updatedAt).getTime()
      const cloudTime = new Date(cloudData.updatedAt).getTime()

      if (cloudTime > localTime) {
        const mergedProgress = {
          ...cloudData,
          cloudConfig: current.cloudConfig,
        }
        setProgress(mergedProgress)
        saveProgress(mergedProgress)
      } else if (localTime > cloudTime) {
        const success = await uploadToFirebase(current)
        if (!success) {
          throw new Error('Không thể tải dữ liệu mới lên đám mây.')
        }
      } else {
        await uploadToFirebase(current)
      }
    } else {
      const success = await uploadToFirebase(current)
      if (!success) {
        throw new Error('Không thể tải dữ liệu ban đầu lên đám mây.')
      }
    }
  }, [ensureValidToken])

  return useMemo(
    () => ({
      activeExam: latestActiveExam,
      createNewExam,
      exams: progress.exams,
      notesDraft,
      progress,
      renameActiveExam,
      selectExam,
      updateAnswer,
      updateNote,
      flashcards: progress.flashcards,
      cloudConfig: resolvedCloudConfig,
      addFlashcard,
      updateFlashcard,
      deleteFlashcard,
      saveCloudConfig,
      onLogin: login,
      onRegister: register,
      onLoginWithGoogle: loginWithGoogle,
      onLogout: logout,
      clearData,
      linkStudyCode,
      manualSync,
      updateLeitnerIntervals,
      leitnerIntervals: progress.leitnerIntervals,
      geminiApiKey: resolvedGeminiApiKey,
      updateGeminiApiKey,
    }),
    [
      createNewExam,
      latestActiveExam,
      notesDraft,
      progress,
      renameActiveExam,
      selectExam,
      updateAnswer,
      updateNote,
      addFlashcard,
      updateFlashcard,
      deleteFlashcard,
      saveCloudConfig,
      login,
      register,
      loginWithGoogle,
      logout,
      clearData,
      linkStudyCode,
      manualSync,
      updateLeitnerIntervals,
      progress.leitnerIntervals,
      resolvedGeminiApiKey,
      resolvedCloudConfig,
      updateGeminiApiKey,
    ],
  )
}
