import type { CloudConfig } from '../types'

/** Vite inlines VITE_* vars at build time — set them on Vercel before deploy. */
function readEnv(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

export const ENV = {
  geminiApiKey: readEnv(import.meta.env.VITE_GEMINI_API_KEY),
  googleClientId: readEnv(import.meta.env.VITE_GOOGLE_CLIENT_ID),
  firebaseApiKey: readEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  firebaseProjectId: readEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID) || 'toeic-progress-web',
} as const

export function resolveGeminiApiKey(stored?: string): string {
  return stored?.trim() || ENV.geminiApiKey
}

export function resolveCloudConfig(stored: CloudConfig): CloudConfig {
  return {
    ...stored,
    projectId: stored.projectId.trim() || ENV.firebaseProjectId,
    apiKey: stored.apiKey.trim() || ENV.firebaseApiKey,
    googleClientId: stored.googleClientId?.trim() || ENV.googleClientId,
  }
}
