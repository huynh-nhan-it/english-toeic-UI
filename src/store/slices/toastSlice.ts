import { StateCreator } from 'zustand'
import type { ToeicState } from '../useToeicStore'

export interface ToastItem {
  id: string
  title?: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  duration?: number
}

export interface ToastSlice {
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastItem['type'], title?: string, duration?: number) => void
  dismissToast: (id: string) => void
}

export const createToastSlice: StateCreator<ToeicState, [], [], ToastSlice> = (set) => ({
  toasts: [],
  showToast: (message, type = 'info', title, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, title, duration }],
    }))

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
})
