import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const THEMES = ['light', 'dark', 'reading']
const STORAGE_KEY = 'review-well-theme'

const readStoredTheme = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return THEMES.includes(stored) ? stored : 'light'
  } catch {
    return 'light'
  }
}

const fallbackTheme = { theme: 'light', setTheme: () => {}, themes: THEMES }

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    return fallbackTheme
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(readStoredTheme)

  useEffect(() => {
    if (theme === 'light') {
      delete document.documentElement.dataset.theme
    } else {
      document.documentElement.dataset.theme = theme
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Private browsing — theme applies for this visit only.
    }
  }, [theme])

  const setTheme = useCallback((next) => {
    if (THEMES.includes(next)) setThemeState(next)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export { THEMES, STORAGE_KEY }
