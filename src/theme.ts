export type Theme = 'system' | 'light' | 'dark'

const THEME_KEY = 'theme'

export function readTheme(): Theme {
  const savedTheme = localStorage.getItem(THEME_KEY)
  return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'system'
}

export function saveTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme)
  if (theme === 'system') {
    delete document.documentElement.dataset.theme
    return
  }
  document.documentElement.dataset.theme = theme
}
