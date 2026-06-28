import type { ToeicProgressData, CloudConfig } from '../types'

export interface AuthResponse {
  email: string
  uid: string
  idToken: string
  refreshToken: string
  expiresAt: number
}

// Firebase Auth REST: Sign Up with Email and Password
export async function signUpWithEmail(
  email: string,
  password: string,
  apiKey: string
): Promise<AuthResponse> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData?.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
    throw new Error(message)
  }

  const data = await response.json()
  const expiresIn = Number(data.expiresIn) || 3600
  return {
    email: data.email,
    uid: data.localId,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}

// Firebase Auth REST: Sign In with Email and Password
export async function signInWithEmail(
  email: string,
  password: string,
  apiKey: string
): Promise<AuthResponse> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData?.error?.message || 'Đăng nhập thất bại. Sai tài khoản hoặc mật khẩu.'
    throw new Error(message)
  }

  const data = await response.json()
  const expiresIn = Number(data.expiresIn) || 3600
  return {
    email: data.email,
    uid: data.localId,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}

// Firebase Auth REST: Sign In with Google ID Token (Federated Identity)
export async function signInWithGoogle(
  googleIdToken: string,
  apiKey: string
): Promise<AuthResponse> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postBody: `id_token=${googleIdToken}&providerId=google.com`,
      requestUri: 'http://localhost',
      returnSecureToken: true,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData?.error?.message || 'Đăng nhập bằng Google thất bại.'
    throw new Error(message)
  }

  const data = await response.json()
  const expiresIn = Number(data.expiresIn) || 3600
  return {
    email: data.email,
    uid: data.localId,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}

// Firebase Auth REST: Refresh expired ID Token using Refresh Token
export async function refreshAuthToken(
  refreshToken: string,
  apiKey: string
): Promise<{ idToken: string; refreshToken: string; expiresAt: number }> {
  const url = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  })

  if (!response.ok) {
    throw new Error('Không thể làm mới token đăng nhập.')
  }

  const data = await response.json()
  const expiresIn = Number(data.expires_in) || 3600
  return {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}

// Firestore REST: Upload Progress
export async function uploadToFirebase(progress: ToeicProgressData): Promise<boolean> {
  const { projectId, enabled, user } = progress.cloudConfig
  if (!enabled || !user || !user.uid || !user.idToken) return false

  try {
    const cleanProjectId = projectId.trim()
    const url = `https://firestore.googleapis.com/v1/projects/${cleanProjectId}/databases/(default)/documents/toeic_progress/${user.uid}?updateMask.fieldPaths=data&updateMask.fieldPaths=updatedAt`

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.idToken}`,
      },
      body: JSON.stringify({
        fields: {
          data: {
            stringValue: JSON.stringify(progress),
          },
          updatedAt: {
            stringValue: progress.updatedAt,
          },
        },
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error uploading to Firebase Firestore:', error)
    return false
  }
}

// Firestore REST: Download Progress
export async function downloadFromFirebase(config: CloudConfig): Promise<ToeicProgressData | null> {
  const { projectId, user } = config
  if (!user || !user.uid || !user.idToken) return null

  try {
    const cleanProjectId = projectId.trim()
    const url = `https://firestore.googleapis.com/v1/projects/${cleanProjectId}/databases/(default)/documents/toeic_progress/${user.uid}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.idToken}`,
      },
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) return null

    const resData = await response.json()
    if (resData && resData.fields && resData.fields.data && resData.fields.data.stringValue) {
      return JSON.parse(resData.fields.data.stringValue) as ToeicProgressData
    }
    
    return null
  } catch (error) {
    console.error('Error downloading from Firebase Firestore:', error)
    return null
  }
}
