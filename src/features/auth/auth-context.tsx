import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

const AUTH_STORAGE_KEY = 'auth_user'

export const FORCE_ROTATION_EVENT = 'auth:force-rotation'

interface AuthUser {
  username: string
  roles: string[]
  mustChangePassword: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
  clearMustChangePassword: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthUser> & {
      username: string
      roles: string[]
    }
    return {
      username: parsed.username,
      roles: parsed.roles,
      mustChangePassword: parsed.mustChangePassword ?? false,
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)

  const login = useCallback((user: AuthUser) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setUser(null)
  }, [])

  const clearMustChangePassword = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, mustChangePassword: false }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // Syncs React state when the ky 403 hook flips the flag in localStorage
  // — otherwise the in-memory copy stays stale on the same-path case.
  useEffect(() => {
    function handleForceRotation() {
      setUser((prev) => (prev ? { ...prev, mustChangePassword: true } : prev))
    }
    window.addEventListener(FORCE_ROTATION_EVENT, handleForceRotation)
    return () => {
      window.removeEventListener(FORCE_ROTATION_EVENT, handleForceRotation)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, login, logout, clearMustChangePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
