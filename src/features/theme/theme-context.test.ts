import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getInitialTheme, ThemeProvider, useTheme } from './theme-context'

function mockMatchMedia(matches: boolean) {
  vi.mocked(window.matchMedia).mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('getInitialTheme', () => {
  it('returns saved dark preference', () => {
    localStorage.setItem('theme', 'dark')
    expect(getInitialTheme()).toBe('dark')
  })

  it('returns saved light preference', () => {
    localStorage.setItem('theme', 'light')
    expect(getInitialTheme()).toBe('light')
  })

  it('returns dark when no saved pref and OS prefers dark', () => {
    mockMatchMedia(true)
    expect(getInitialTheme()).toBe('dark')
  })

  it('returns light when no saved pref and OS prefers light', () => {
    mockMatchMedia(false)
    expect(getInitialTheme()).toBe('light')
  })
})

describe('ThemeProvider + useTheme', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('reflects saved dark preference on mount', () => {
    localStorage.setItem('theme', 'dark')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(result.current.theme).toBe('dark')
  })

  it('saved preference overrides OS dark preference', () => {
    localStorage.setItem('theme', 'light')
    mockMatchMedia(true)
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(result.current.theme).toBe('light')
  })

  it('reflects OS dark preference when no saved pref', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(result.current.theme).toBe('dark')
  })

  it('toggleTheme flips light to dark', () => {
    localStorage.setItem('theme', 'light')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('toggleTheme flips dark to light', () => {
    localStorage.setItem('theme', 'dark')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })

  it('toggleTheme persists new theme to localStorage', () => {
    mockMatchMedia(false)
    localStorage.setItem('theme', 'light')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggleTheme())
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('toggleTheme adds dark class to <html>', () => {
    localStorage.setItem('theme', 'light')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggleTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTheme removes dark class from <html>', () => {
    localStorage.setItem('theme', 'dark')
    document.documentElement.classList.add('dark')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggleTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('override storage', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('stores nothing on first mount', () => {
    mockMatchMedia(false)
    renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(localStorage.length).toBe(0)
  })

  it('stores a toggle that differs from the OS scheme as an override', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggleTheme())
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(localStorage.getItem('theme-migrated')).toBe('1')
  })

  it('removes the override when toggling back to the OS scheme', () => {
    mockMatchMedia(false)
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('theme-migrated', '1')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('keeps an override that now matches the OS scheme', () => {
    mockMatchMedia(true)
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('theme-migrated', '1')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })
})

describe('color-scheme', () => {
  let meta: HTMLMetaElement

  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.removeProperty('color-scheme')
    meta = document.createElement('meta')
    meta.name = 'color-scheme'
    meta.content = 'light dark'
    document.head.append(meta)
  })

  afterEach(() => {
    meta.remove()
  })

  it('follows the OS scheme when there is no override', () => {
    mockMatchMedia(true)
    renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(meta.content).toBe('light dark')
    expect(
      document.documentElement.style.getPropertyValue('color-scheme')
    ).toBe('light dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('pins the stored override', () => {
    mockMatchMedia(false)
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('theme-migrated', '1')
    renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(meta.content).toBe('dark')
    expect(
      document.documentElement.style.getPropertyValue('color-scheme')
    ).toBe('dark')
  })

  it('pins on toggle away from the OS and releases on toggle back', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggleTheme())
    expect(meta.content).toBe('dark')
    act(() => result.current.toggleTheme())
    expect(meta.content).toBe('light dark')
    expect(
      document.documentElement.style.getPropertyValue('color-scheme')
    ).toBe('light dark')
  })
})

describe('live sync', () => {
  let meta: HTMLMetaElement
  let osDark: boolean
  const osListeners = new Set<() => void>()

  function setOsDark(dark: boolean) {
    osDark = dark
    act(() => osListeners.forEach((listener) => listener()))
  }

  beforeEach(() => {
    osDark = false
    osListeners.clear()
    vi.mocked(window.matchMedia).mockImplementation(
      (query) =>
        ({
          get matches() {
            return osDark
          },
          media: query,
          addEventListener: (_type: string, listener: () => void) =>
            osListeners.add(listener),
          removeEventListener: (_type: string, listener: () => void) =>
            osListeners.delete(listener),
        }) as unknown as MediaQueryList
    )
    document.documentElement.classList.remove('dark')
    meta = document.createElement('meta')
    meta.name = 'color-scheme'
    meta.content = 'light dark'
    document.head.append(meta)
  })

  afterEach(() => {
    meta.remove()
    mockMatchMedia(false)
  })

  it('follows an OS change when there is no override', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    setOsDark(true)
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(meta.content).toBe('light dark')
  })

  it('ignores an OS change while an override is stored', () => {
    localStorage.setItem('theme', 'light')
    localStorage.setItem('theme-migrated', '1')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    setOsDark(true)
    expect(result.current.theme).toBe('light')
  })

  it('applies an override set in another tab', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    localStorage.setItem('theme', 'dark')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme' }))
    })
    expect(result.current.theme).toBe('dark')
    expect(meta.content).toBe('dark')
  })

  it('releases the override when another tab removes it', () => {
    localStorage.setItem('theme', 'light')
    localStorage.setItem('theme-migrated', '1')
    renderHook(() => useTheme(), { wrapper: ThemeProvider })
    localStorage.removeItem('theme')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme' }))
    })
    expect(meta.content).toBe('light dark')
  })

  it('stops listening to the OS on unmount', () => {
    const { unmount } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    unmount()
    expect(osListeners.size).toBe(0)
  })
})

describe('blocked storage', () => {
  it('follows the OS scheme and still toggles', async () => {
    vi.resetModules()
    const blocked = vi
      .spyOn(window, 'localStorage', 'get')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError')
      })
    try {
      const theme = await import('./theme-context')
      mockMatchMedia(true)
      const { result } = renderHook(() => theme.useTheme(), {
        wrapper: theme.ThemeProvider,
      })
      expect(result.current.theme).toBe('dark')
      act(() => result.current.toggleTheme())
      expect(result.current.theme).toBe('light')
    } finally {
      blocked.mockRestore()
      mockMatchMedia(false)
    }
  })
})

describe('legacy theme migration', () => {
  // The migration runs at module load, so each test loads a fresh copy.
  async function mountFresh() {
    vi.resetModules()
    const theme = await import('./theme-context')
    return renderHook(() => theme.useTheme(), { wrapper: theme.ThemeProvider })
  }

  it('drops an unmarked value equal to the OS scheme', async () => {
    mockMatchMedia(true)
    localStorage.setItem('theme', 'dark')
    const { result } = await mountFresh()
    expect(result.current.theme).toBe('dark')
    expect(getInitialTheme()).toBe('dark')
    expect(localStorage.getItem('theme')).toBeNull()
    expect(localStorage.getItem('theme-migrated')).toBe('1')
    expect(document.documentElement.style.colorScheme).toBe('light dark')
  })

  it('keeps an unmarked value that differs from the OS scheme', async () => {
    mockMatchMedia(false)
    localStorage.setItem('theme', 'dark')
    const { result } = await mountFresh()
    expect(result.current.theme).toBe('dark')
    expect(getInitialTheme()).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(localStorage.getItem('theme-migrated')).toBe('1')
  })
})

describe('useTheme outside ThemeProvider', () => {
  it('throws when used outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within ThemeProvider'
    )
  })
})
