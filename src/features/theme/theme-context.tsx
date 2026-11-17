import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

type Theme = 'light' | 'dark'

// Holds a user override only. No value means follow the OS scheme.
const STORAGE_KEY = 'theme'
// Marks a stored value as a deliberate override rather than one written by
// the pre-2026-11 code. Remove it and the migration after 2027-05-17.
const MIGRATED_KEY = 'theme-migrated'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark'
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

// The old code saved the OS scheme on the first visit, so an unmarked value
// equal to the OS scheme is most likely that bug rather than a choice.
function migrateLegacyTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === null || localStorage.getItem(MIGRATED_KEY) !== null) return
  localStorage.setItem(MIGRATED_KEY, '1')
  if (saved === getSystemTheme()) localStorage.removeItem(STORAGE_KEY)
}

export function getInitialTheme(): Theme {
  migrateLegacyTheme()
  const saved = localStorage.getItem(STORAGE_KEY)
  return isTheme(saved) ? saved : getSystemTheme()
}

// Native UI (scrollbars, form controls) follows color-scheme, colors follow
// .dark. 'light dark' lets the browser follow the OS; a single value pins it.
// The inline script in index.html does the same before first paint.
function applyScheme(theme: Theme) {
  const saved = localStorage.getItem(STORAGE_KEY)
  const scheme = isTheme(saved) ? saved : 'light dark'
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.setProperty('color-scheme', scheme)
  document
    .querySelector('meta[name="color-scheme"]')
    ?.setAttribute('content', scheme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // Store the choice only when it overrides the OS scheme. Toggling back to
  // the OS scheme removes it, so the app follows the system again.
  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    if (next === getSystemTheme()) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, next)
      localStorage.setItem(MIGRATED_KEY, '1')
    }
    setTheme(next)
  }

  useEffect(() => {
    applyScheme(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
