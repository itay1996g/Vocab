import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { limitKeyboardScroll } from './keyboard'
import './styles.css'

limitKeyboardScroll()

// Best effort: asks the browser not to clear the words when the device is low on storage.
// The app works the same if the browser says no.
navigator.storage?.persist?.()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
