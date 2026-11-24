import Dexie, { type EntityTable } from 'dexie'

export interface Deck {
  id: number
  name: string
}

export interface Word {
  id: number
  term: string
  translation: string
  deckId: number | null
  createdAt: number
  correctCount: number
  wrongCount: number
  // 0 for a new or just-missed word, MAX_STRENGTH for a word you know well.
  strength: number
  lastReviewedAt: number | null
  // Missing on words saved before this option existed: they are in the quiz.
  skipQuiz?: boolean
}

export const MAX_STRENGTH = 5

export const db = new Dexie('vocab') as Dexie & {
  decks: EntityTable<Deck, 'id'>
  words: EntityTable<Word, 'id'>
}

db.version(1).stores({
  decks: '++id',
  words: '++id, deckId',
})

export function isHard(word: Word): boolean {
  return word.wrongCount > 0 && word.strength < 2
}

export function deckNameKey(name: string): string {
  return name.trim().toLowerCase()
}

export async function addWord(fields: Pick<Word, 'term' | 'translation' | 'deckId' | 'skipQuiz'>) {
  await db.words.add({
    ...fields,
    createdAt: Date.now(),
    correctCount: 0,
    wrongCount: 0,
    strength: 0,
    lastReviewedAt: null,
  })
}

export async function recordReview(wordId: number, correct: boolean) {
  await db.words.update(wordId, (word) => {
    word.lastReviewedAt = Date.now()
    if (correct) {
      word.correctCount += 1
      word.strength = Math.min(MAX_STRENGTH, word.strength + 1)
      return
    }
    word.wrongCount += 1
    word.strength = 0
  })
}

export async function deleteDeck(deckId: number) {
  await db.transaction('rw', db.decks, db.words, async () => {
    await db.words.where('deckId').equals(deckId).modify({ deckId: null })
    await db.decks.delete(deckId)
  })
}
