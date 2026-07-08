import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth.api'
import { setAccessToken } from '../api/tokenStore'
import { broadcastLogin, broadcastLogout, subscribeAuthBroadcast } from '../api/authBroadcast'
import type { AuthUser } from '../types/user'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string, turnstileToken: string) => Promise<AuthUser>
  register: (
    input: { email: string; password: string; firstName: string; lastName: string; phone?: string } & {
      turnstileToken: string
    },
  ) => Promise<{ email: string }>
  verifyEmail: (email: string, code: string) => Promise<AuthUser>
  logout: () => Promise<void>
  updateProfile: (input: { firstName?: string; lastName?: string; phone?: string }) => Promise<AuthUser>
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>
  uploadAvatar: (file: File) => Promise<AuthUser>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Module-level (not component-level) so React StrictMode's mount->cleanup->
// remount in dev shares a single in-flight request instead of firing two -
// the refresh token rotates on use, so a genuine second call would look like
// a replay and get the whole session revoked by reuse detection.
let bootRefreshPromise: ReturnType<typeof authApi.refresh> | null = null

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Boot-time silent refresh: if a valid refresh cookie exists, this
    // re-establishes the session without the user re-entering credentials.
    if (!bootRefreshPromise) bootRefreshPromise = authApi.refresh()

    bootRefreshPromise
      .then((res) => {
        setAccessToken(res.accessToken)
        setUser(res.user)
      })
      .catch(() => {
        setAccessToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    // Every tab shares the same httpOnly refresh cookie, so there's only ever
    // one real session - this keeps each tab's in-memory state in sync with
    // it instead of only discovering a change on the next failed request.
    return subscribeAuthBroadcast((message) => {
      if (message.type === 'LOGGED_OUT') {
        setAccessToken(null)
        setUser(null)
        return
      }
      // LOGGED_IN in another tab: this tab's own access token is stale (still
      // tied to whatever session it had, or none) - re-pull the current user
      // from the now-shared cookie.
      authApi
        .refresh()
        .then((res) => {
          setAccessToken(res.accessToken)
          setUser(res.user)
        })
        .catch(() => {
          setAccessToken(null)
          setUser(null)
        })
    })
  }, [])

  async function login(email: string, password: string, turnstileToken: string) {
    const res = await authApi.login({ email, password, turnstileToken })
    setAccessToken(res.accessToken)
    setUser(res.user)
    broadcastLogin()
    return res.user
  }

  async function register(
    input: { email: string; password: string; firstName: string; lastName: string; phone?: string } & {
      turnstileToken: string
    },
  ) {
    return authApi.register(input)
  }

  async function verifyEmail(email: string, code: string) {
    const res = await authApi.verifyEmail({ email, code })
    setAccessToken(res.accessToken)
    setUser(res.user)
    broadcastLogin()
    return res.user
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
      broadcastLogout()
    }
  }

  async function updateProfile(input: { firstName?: string; lastName?: string; phone?: string }) {
    const res = await authApi.updateProfile(input)
    setUser(res.user)
    return res.user
  }

  async function changePassword(input: { currentPassword: string; newPassword: string }) {
    await authApi.changePassword(input)
  }

  async function uploadAvatar(file: File) {
    const res = await authApi.uploadAvatar(file)
    setUser(res.user)
    return res.user
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, verifyEmail, logout, updateProfile, changePassword, uploadAvatar }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
