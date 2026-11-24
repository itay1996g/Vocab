import { db, deckNameKey, termKey, type Word } from './db'

const BACKUP_APP = 'vocab'
const BACKUP_VERSION = 1

type BackupWord = Omit<Word, 'id' | 'deckId'> & { deck: string | null }

interface Backup {
  app: string
  version: number
  exportedAt: string
  decks: string[]
  words: BackupWord[]
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
    (word: BackupWord) => typeof word?.term === 'string' && typeof word?.translation === 'string',
  )
  if (!wordsAreValid) throw new Error('This backup file is damaged.')
  return backup
}

// Merges the backup into the bank. A word that is already in the bank is skipped, also with another translation.
export async function importBackup(file: File): Promise<{ added: number; skipped: number }> {
  const backup = parseBackup(await file.text())

  return db.transaction('rw', db.decks, db.words, async () => {
    const deckIds = new Map((await db.decks.toArray()).map((deck) => [deckNameKey(deck.name), deck.id]))
    for (const deckName of backup.decks) {
      if (deckIds.has(deckNameKey(deckName))) continue
      deckIds.set(deckNameKey(deckName), await db.decks.add({ name: deckName.trim() }))
    }

    const existingTerms = new Set((await db.words.toArray()).map((word) => termKey(word.term)))
    let added = 0
    for (const { deck, ...word } of backup.words) {
      if (existingTerms.has(termKey(word.term))) continue
      existingTerms.add(termKey(word.term))
      await db.words.add({ ...word, deckId: deck === null ? null : (deckIds.get(deckNameKey(deck)) ?? null) })
      added += 1
    }
    return { added, skipped: backup.words.length - added }
  })
}
