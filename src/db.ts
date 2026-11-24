import Dexie, { type EntityTable, type Transaction } from 'dexie'
import starterWords from './data/starter-words.json'

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
  // An explanation shown next to the translation. The quiz does not check it.
  comment?: string
}

export const MAX_STRENGTH = 5

export const db = new Dexie('vocab') as Dexie & {
  decks: EntityTable<Deck, 'id'>
  words: EntityTable<Word, 'id'>
}

export interface WordList {
  decks: string[]
  words: (Omit<Word, 'id' | 'deckId'> & { deck: string | null })[]
}

const STARTER_WORDS = starterWords as WordList

// A new install gets the starter words when the database is created, and an older install gets the missing ones at each upgrade.
// Add 1 to the version when the starter words change.
db.version(3)
  .stores({ decks: '++id', words: '++id, deckId' })
  .upgrade(async (transaction) => {
    // An empty bank was deleted on purpose, so it stays empty.
    if ((await transaction.table('words').count()) === 0) return
    await addStarterWords(transaction)
    await moveStarterWordsOutOfNouns(transaction)
  })
db.on('populate', (transaction) => addStarterWords(transaction))

function addStarterWords(transaction: Transaction) {
  return mergeWords(STARTER_WORDS, transaction.table('decks'), transaction.table('words'))
}

// Version 3 moved some starter words from Nouns to topic decks, like mesa to House. A word that is still in Nouns moves too.
async function moveStarterWordsOutOfNouns(transaction: Transaction) {
  const decks: Deck[] = await transaction.table('decks').toArray()
  const deckIds = new Map(decks.map((deck) => [deckNameKey(deck.name), deck.id]))
  const nounsDeckId = deckIds.get(deckNameKey('Nouns'))
  if (nounsDeckId === undefined) return

  const starterDeckIds = new Map(
    STARTER_WORDS.words.map((word) => [termKey(word.term), deckIds.get(deckNameKey(word.deck ?? ''))]),
  )
  await transaction
    .table('words')
    .where('deckId')
    .equals(nounsDeckId)
    .modify((word: Word) => {
      const starterDeckId = starterDeckIds.get(termKey(word.term))
      if (starterDeckId === undefined) return
      word.deckId = starterDeckId
    })
}

// A word that is already in the bank is skipped, also with another translation.
export async function mergeWords(list: WordList, decks: EntityTable<Deck, 'id'>, words: EntityTable<Word, 'id'>) {
  const deckIds = new Map((await decks.toArray()).map((deck) => [deckNameKey(deck.name), deck.id]))
  for (const deckName of list.decks) {
    if (deckIds.has(deckNameKey(deckName))) continue
    deckIds.set(deckNameKey(deckName), await decks.add({ name: deckName.trim() }))
  }

  const existingTerms = new Set((await words.toArray()).map((word) => termKey(word.term)))
  let added = 0
  for (const { deck, ...word } of list.words) {
    if (existingTerms.has(termKey(word.term))) continue
    existingTerms.add(termKey(word.term))
    await words.add({ ...word, deckId: deck === null ? null : (deckIds.get(deckNameKey(deck)) ?? null) })
    added += 1
  }
  return { added, skipped: list.words.length - added }
}

export function isHard(word: Word): boolean {
  return word.wrongCount > 0 && word.strength < 2
}

// A word exists once in the bank. Case and spaces do not count, accents do: si and sí are different words.
export function termKey(term: string): string {
  return term.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function deckNameKey(name: string): string {
  return name.trim().toLowerCase()
}

export async function addWord(fields: Pick<Word, 'term' | 'translation' | 'comment' | 'deckId' | 'skipQuiz'>) {
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

export async function deleteDeck(deckId: number, { withWords }: { withWords: boolean }) {
  await db.transaction('rw', db.decks, db.words, async () => {
    const deckWords = db.words.where('deckId').equals(deckId)
    await (withWords ? deckWords.delete() : deckWords.modify({ deckId: null }))
    await db.decks.delete(deckId)
  })
}

export async function clearAllData() {
  await db.transaction('rw', db.decks, db.words, async () => {
    await db.words.clear()
    await db.decks.clear()
  })
}
