import { StateCreator } from 'zustand'
import type { ToeicState } from '../useToeicStore'
import type { CloudConfig, ToeicProgressData } from '../../types'
import {
  signInWithEmail as apiSignInWithEmail,
  signUpWithEmail as apiSignUpWithEmail,
  signInWithGoogle as apiSignInWithGoogle,
  refreshAuthToken as apiRefreshAuthToken,
  uploadToFirebase,
  downloadFromFirebase,
} from '../../services/firebase.service'

const DEFAULT_PROJECT_ID = 'toeic-progress-web'
const DEFAULT_API_KEY = 'AIzaSyA-mock-key-for-toeic-progress'

export interface CloudSlice {
  cloudConfig: CloudConfig
  saveCloudConfig: (projectId: string, apiKey: string, googleClientId: string, enabled: boolean) => void
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string) => Promise<void>
  onLoginWithGoogle: (idToken: string) => Promise<void>
  onLogout: () => void
  clearData: () => void
  manualSync: () => Promise<void>
  ensureValidToken: () => Promise<boolean>
}

export const createCloudSlice: StateCreator<ToeicState, [["zustand/persist", unknown]], [], CloudSlice> = (set, get) => {
  const getFirebaseConfig = () => {
    const config = get().cloudConfig
    const pId = config.projectId.trim() || DEFAULT_PROJECT_ID
    const key = config.apiKey.trim() || DEFAULT_API_KEY
    return { projectId: pId, apiKey: key }
  }

  return {
    cloudConfig: {
      projectId: 'toeic-progress-web',
      apiKey: '',
      googleClientId: '',
      enabled: true,
      user: null,
    },

    saveCloudConfig: (projectId: string, apiKey: string, googleClientId: string, enabled: boolean) => {
      set((state) => ({
        cloudConfig: {
          ...state.cloudConfig,
          projectId,
          apiKey,
          googleClientId,
          enabled,
        },
        updatedAt: new Date().toISOString(),
      }))
    },

    ensureValidToken: async (): Promise<boolean> => {
      const state = get()
      const { user } = state.cloudConfig
      if (!user) return false

      if (user.expiresAt < Date.now() + 5 * 60 * 1000) {
        const { apiKey } = getFirebaseConfig()
        try {
          const refreshed = await apiRefreshAuthToken(user.refreshToken, apiKey)
          
          set((s) => ({
            cloudConfig: {
              ...s.cloudConfig,
              user: {
                ...user,
                idToken: refreshed.idToken,
                refreshToken: refreshed.refreshToken,
                expiresAt: refreshed.expiresAt,
              },
            },
            updatedAt: new Date().toISOString(),
          }))
          return true
        } catch (e) {
          console.error('Failed to refresh Firebase token, logging out user:', e)
          set((s) => ({
            cloudConfig: {
              ...s.cloudConfig,
              user: null,
            },
            updatedAt: new Date().toISOString(),
          }))
          return false
        }
      }
      return true
    },

    onLogin: async (email: string, password: string) => {
      const { apiKey } = getFirebaseConfig()
      if (!apiKey) throw new Error('API Key Firebase trống. Hãy cấu hình API Key.')

      const auth = await apiSignInWithEmail(email, password, apiKey)
      
      const nextCloudConfig: CloudConfig = {
        ...get().cloudConfig,
        enabled: true,
        user: auth,
      }

      const cloudData = await downloadFromFirebase(nextCloudConfig)
      
      set((state) => {
        let merged: Partial<ToeicState> = {
          cloudConfig: nextCloudConfig,
          updatedAt: new Date().toISOString(),
        }

        if (cloudData) {
          merged = {
            ...merged,
            activeExamId: cloudData.activeExamId,
            exams: cloudData.exams,
            flashcards: cloudData.flashcards,
            leitnerIntervals: cloudData.leitnerIntervals || state.leitnerIntervals,
            geminiApiKey: cloudData.geminiApiKey || state.geminiApiKey,
          }
        }

        return merged
      })

      // Upload if cloud was empty
      if (!cloudData) {
        const updatedState = get()
        const progressData: ToeicProgressData = {
          version: 5,
          activeExamId: updatedState.activeExamId,
          exams: updatedState.exams,
          flashcards: updatedState.flashcards,
          cloudConfig: updatedState.cloudConfig,
          updatedAt: updatedState.updatedAt,
          leitnerIntervals: updatedState.leitnerIntervals,
          geminiApiKey: updatedState.geminiApiKey,
        }
        await uploadToFirebase(progressData)
      }
    },

    onRegister: async (email: string, password: string) => {
      const { apiKey } = getFirebaseConfig()
      if (!apiKey) throw new Error('API Key Firebase trống. Hãy cấu hình API Key.')

      const auth = await apiSignUpWithEmail(email, password, apiKey)
      
      const nextCloudConfig: CloudConfig = {
        ...get().cloudConfig,
        enabled: true,
        user: auth,
      }

      set({
        cloudConfig: nextCloudConfig,
        updatedAt: new Date().toISOString(),
      })

      const updatedState = get()
      const progressData: ToeicProgressData = {
        version: 5,
        activeExamId: updatedState.activeExamId,
        exams: updatedState.exams,
        flashcards: updatedState.flashcards,
        cloudConfig: updatedState.cloudConfig,
        updatedAt: updatedState.updatedAt,
        leitnerIntervals: updatedState.leitnerIntervals,
        geminiApiKey: updatedState.geminiApiKey,
      }
      await uploadToFirebase(progressData)
    },

    onLoginWithGoogle: async (idToken: string) => {
      const { apiKey } = getFirebaseConfig()
      if (!apiKey) throw new Error('API Key Firebase trống. Hãy cấu hình API Key.')

      const auth = await apiSignInWithGoogle(idToken, apiKey)
      
      const nextCloudConfig: CloudConfig = {
        ...get().cloudConfig,
        enabled: true,
        user: auth,
      }

      const cloudData = await downloadFromFirebase(nextCloudConfig)
      
      set((state) => {
        let merged: Partial<ToeicState> = {
          cloudConfig: nextCloudConfig,
          updatedAt: new Date().toISOString(),
        }

        if (cloudData) {
          merged = {
            ...merged,
            activeExamId: cloudData.activeExamId,
            exams: cloudData.exams,
            flashcards: cloudData.flashcards,
            leitnerIntervals: cloudData.leitnerIntervals || state.leitnerIntervals,
            geminiApiKey: cloudData.geminiApiKey || state.geminiApiKey,
          }
        }

        return merged
      })

      // Upload if cloud was empty
      if (!cloudData) {
        const updatedState = get()
        const progressData: ToeicProgressData = {
          version: 5,
          activeExamId: updatedState.activeExamId,
          exams: updatedState.exams,
          flashcards: updatedState.flashcards,
          cloudConfig: updatedState.cloudConfig,
          updatedAt: updatedState.updatedAt,
          leitnerIntervals: updatedState.leitnerIntervals,
          geminiApiKey: updatedState.geminiApiKey,
        }
        await uploadToFirebase(progressData)
      }
    },

    onLogout: () => {
      set((state) => ({
        cloudConfig: {
          ...state.cloudConfig,
          user: null,
        },
        updatedAt: new Date().toISOString(),
      }))
    },

    clearData: () => {
      localStorage.clear()
    },

    manualSync: async () => {
      const state = get()
      if (!state.cloudConfig.enabled || !state.cloudConfig.user) {
        throw new Error('Chưa kích hoạt đồng bộ đám mây hoặc chưa đăng nhập tài khoản.')
      }

      const validToken = await get().ensureValidToken()
      if (!validToken) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      }

      const freshState = get()
      const cloudData = await downloadFromFirebase(freshState.cloudConfig)
      
      if (cloudData) {
        const localTime = new Date(freshState.updatedAt).getTime()
        const cloudTime = new Date(cloudData.updatedAt).getTime()

        if (cloudTime > localTime) {
          set({
            activeExamId: cloudData.activeExamId,
            exams: cloudData.exams,
            flashcards: cloudData.flashcards,
            leitnerIntervals: cloudData.leitnerIntervals || freshState.leitnerIntervals,
            geminiApiKey: cloudData.geminiApiKey || freshState.geminiApiKey,
            updatedAt: new Date().toISOString(),
          })
        } else if (localTime > cloudTime) {
          const progressData: ToeicProgressData = {
            version: 5,
            activeExamId: freshState.activeExamId,
            exams: freshState.exams,
            flashcards: freshState.flashcards,
            cloudConfig: freshState.cloudConfig,
            updatedAt: freshState.updatedAt,
            leitnerIntervals: freshState.leitnerIntervals,
            geminiApiKey: freshState.geminiApiKey,
          }
          const success = await uploadToFirebase(progressData)
          if (!success) {
            throw new Error('Không thể tải dữ liệu mới lên đám mây.')
          }
        } else {
          // equal, upload to be safe
          const progressData: ToeicProgressData = {
            version: 5,
            activeExamId: freshState.activeExamId,
            exams: freshState.exams,
            flashcards: freshState.flashcards,
            cloudConfig: freshState.cloudConfig,
            updatedAt: freshState.updatedAt,
            leitnerIntervals: freshState.leitnerIntervals,
            geminiApiKey: freshState.geminiApiKey,
          }
          await uploadToFirebase(progressData)
        }
      } else {
        const progressData: ToeicProgressData = {
          version: 5,
          activeExamId: freshState.activeExamId,
          exams: freshState.exams,
          flashcards: freshState.flashcards,
          cloudConfig: freshState.cloudConfig,
          updatedAt: freshState.updatedAt,
          leitnerIntervals: freshState.leitnerIntervals,
          geminiApiKey: freshState.geminiApiKey,
        }
        const success = await uploadToFirebase(progressData)
        if (!success) {
          throw new Error('Không thể tải dữ liệu ban đầu lên đám mây.')
        }
      }
    },
  }
}
