import { db, mergeWords, type WordList } from './db'

const BACKUP_APP = 'vocab'
const BACKUP_VERSION = 1

interface Backup extends WordList {
  app: string
  version: number
  exportedAt: string
}

export async function exportBackup() {
  const [decks, words] = await Promise.all([db.decks.toArray(), db.words.toArray()])
  const deckNames = new Map(decks.map((deck) => [deck.id, deck.name]))
  const backup: Backup = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    decks: decks.map((deck) => deck.name),
    words: words.map(({ id: _id, deckId, ...word }) => ({
      ...word,
      deck: deckId === null ? null : (deckNames.get(deckId) ?? null),
    })),
  }
  const date = new Date().toISOString().slice(0, 10)
  const file = new File([JSON.stringify(backup, null, 2)], `vocab-backup-${date}.json`, { type: 'application/json' })

  // On iPhone the share sheet has "Save to Files". Other browsers download the file.
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] })
    return
  }
  const link = document.createElement('a')
  link.href = URL.createObjectURL(file)
  link.download = file.name
  link.click()
  URL.revokeObjectURL(link.href)
}

function parseBackup(text: string): Backup {
  const backup = JSON.parse(text)
  if (backup?.app !== BACKUP_APP) throw new Error('This file is not a Vocab backup.')
  if (!Array.isArray(backup.decks)) throw new Error('This backup file is damaged.')
  if (!Array.isArray(backup.words)) throw new Error('This backup file is damaged.')
  const wordsAreValid = backup.words.every(
    (word: WordList['words'][number]) => typeof word?.term === 'string' && typeof word?.translation === 'string',
  )
  if (!wordsAreValid) throw new Error('This backup file is damaged.')
  return backup
}

export async function importBackup(file: File): Promise<{ added: number; skipped: number }> {
  const backup = parseBackup(await file.text())
  return db.transaction('rw', db.decks, db.words, () => mergeWords(backup, db.decks, db.words))
}
