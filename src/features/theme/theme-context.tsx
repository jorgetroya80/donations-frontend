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

// Reading localStorage throws when site data is blocked. Then the theme just
// follows the OS and nothing is saved, like the inline script in index.html.
let store: Storage | undefined
try {
  store = localStorage
} catch {
  store = undefined
}

function isTheme(value: string | null | undefined): value is Theme {
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
  const saved = store?.getItem(STORAGE_KEY)
  if (saved == null || store?.getItem(MIGRATED_KEY) != null) return
  store?.setItem(MIGRATED_KEY, '1')
  if (saved === getSystemTheme()) store?.removeItem(STORAGE_KEY)
}

function readTheme(): Theme {
  const saved = store?.getItem(STORAGE_KEY)
  return isTheme(saved) ? saved : getSystemTheme()
}

export function getInitialTheme(): Theme {
  migrateLegacyTheme()
  return readTheme()
}

// Native UI (scrollbars, form controls) follows color-scheme, colors follow
// .dark. 'light dark' lets the browser follow the OS; a single value pins it.
// The inline script in index.html does the same before first paint.
function applyScheme(theme: Theme) {
  const saved = store?.getItem(STORAGE_KEY)
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
      store?.removeItem(STORAGE_KEY)
    } else {
      store?.setItem(STORAGE_KEY, next)
      store?.setItem(MIGRATED_KEY, '1')
    }
    setTheme(next)
  }

  useEffect(() => {
    applyScheme(theme)
  }, [theme])

  // Re-resolve when the OS scheme changes or another tab writes storage. Any
  // key triggers it, which is harmless: an unrelated write re-applies the same
  // theme. applyScheme runs here too: a removed override can leave the theme
  // unchanged while the meta still has to go back to 'light dark'.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function sync() {
      const next = readTheme()
      setTheme(next)
      applyScheme(next)
    }
    media.addEventListener('change', sync)
    window.addEventListener('storage', sync)
    return () => {
      media.removeEventListener('change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

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
