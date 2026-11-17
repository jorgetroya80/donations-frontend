import {
  createContext,
  type ReactNode,
  useContext,
  useSyncExternalStore,
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

// Reading localStorage throws when site data is blocked. Then a Map stands in
// for it: a toggle lasts until reload, and the inline script in index.html
// follows the OS on the next load.
let store: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
try {
  store = localStorage
} catch {
  const memory = new Map<string, string>()
  store = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
    removeItem: (key) => void memory.delete(key),
  }
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
  const saved = store.getItem(STORAGE_KEY)
  if (saved == null || store.getItem(MIGRATED_KEY) != null) return
  store.setItem(MIGRATED_KEY, '1')
  if (saved === getSystemTheme()) store.removeItem(STORAGE_KEY)
}

// Once per page load, before any subscriber. It never changes the resolved
// theme, only the stored override, so the inline script's first paint stands.
migrateLegacyTheme()

function readTheme(): Theme {
  const saved = store.getItem(STORAGE_KEY)
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
  const saved = store.getItem(STORAGE_KEY)
  const scheme = isTheme(saved) ? saved : 'light dark'
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.setProperty('color-scheme', scheme)
  document
    .querySelector('meta[name="color-scheme"]')
    ?.setAttribute('content', scheme)
}

// Subscribers in this tab, notified when toggleTheme writes the store.
const listeners = new Set<() => void>()

// Store the choice only when it overrides the OS scheme. Toggling back to the
// OS scheme removes it, so the app follows the system again.
function toggleTheme() {
  const next = readTheme() === 'light' ? 'dark' : 'light'
  if (next === getSystemTheme()) {
    store.removeItem(STORAGE_KEY)
  } else {
    store.setItem(STORAGE_KEY, next)
    store.setItem(MIGRATED_KEY, '1')
  }
  // The storage event only reaches other tabs, so tell this one directly.
  for (const notify of listeners) notify()
}

// Re-resolve when the OS scheme changes or any tab writes storage. Any key
// triggers it, which is harmless: an unrelated write re-applies the same
// theme. applyScheme runs on every event: a removed override can leave the
// theme unchanged while the meta still has to go back to 'light dark'.
function subscribe(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  function sync() {
    applyScheme(readTheme())
    onChange()
  }
  media.addEventListener('change', sync)
  window.addEventListener('storage', sync)
  listeners.add(sync)
  // The migration may have dropped the override the inline script pinned.
  applyScheme(readTheme())
  return () => {
    media.removeEventListener('change', sync)
    window.removeEventListener('storage', sync)
    listeners.delete(sync)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme)

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
