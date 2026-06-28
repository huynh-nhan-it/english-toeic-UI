import type { CloudConfig } from '../types'

export const ADMIN_EMAIL = 'nopecode684@gmail.com'

export function isAuthenticated(cloudConfig: CloudConfig): boolean {
  return Boolean(cloudConfig.user?.email && cloudConfig.user?.uid)
}

export function canSeeSettings(cloudConfig: CloudConfig): boolean {
  return isAuthenticated(cloudConfig) && cloudConfig.user!.email === ADMIN_EMAIL
}
