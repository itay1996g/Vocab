import { useState, type ChangeEvent } from 'react'
import { exportBackup, importBackup } from '../backup'
import type { Deck, Word } from '../db'
import { Screen } from '../components/Screen'
import { Segmented } from '../components/Segmented'
import { plural } from '../practice'
import { readTheme, saveTheme, type Theme } from '../theme'

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

interface SettingsScreenProps {
  words: Word[]
  decks: Deck[]
}

export function SettingsScreen({ words, decks }: SettingsScreenProps) {
  const [theme, setTheme] = useState(readTheme)
  const [backupMessage, setBackupMessage] = useState('')

  function changeTheme(nextTheme: Theme) {
    setTheme(nextTheme)
    saveTheme(nextTheme)
  }

  async function handleExport() {
    try {
      await exportBackup()
      setBackupMessage('')
    } catch (error) {
      // The user closed the share sheet without saving: this is not an error.
      if (error instanceof DOMException && error.name === 'AbortError') return
      setBackupMessage(`Export failed: ${(error as Error).message}`)
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const { added, skipped } = await importBackup(file)
      setBackupMessage(`Imported ${plural(added, 'word')}. Skipped ${skipped} that you already have.`)
    } catch (error) {
      setBackupMessage(`Import failed: ${(error as Error).message}`)
    }
  }

  return (
    <Screen title="Settings">
      <section className="card">
        <h2>Appearance</h2>
        <Segmented options={THEME_OPTIONS} value={theme} onChange={changeTheme} />
      </section>

      <section className="card">
        <h2>Backup</h2>
        <p className="card-text">
          Your words are saved only on this device. Export a backup file from time to time, and import it on a new
          phone.
        </p>
        <div className="button-row">
          <button className="button secondary" onClick={handleExport} disabled={words.length === 0}>
            Export
          </button>
          <label className="button secondary">
            Import
            <input type="file" accept=".json,application/json" onChange={handleImport} hidden />
          </label>
        </div>
        {backupMessage && <p className="card-text message">{backupMessage}</p>}
      </section>

      <section className="card">
        <h2>About</h2>
        <p className="card-text">
          Vocab keeps {plural(words.length, 'word')} in {plural(decks.length, 'deck')}.
        </p>
      </section>
    </Screen>
  )
}
