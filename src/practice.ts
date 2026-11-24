import { MAX_STRENGTH, isHard, type Deck, type Word } from './db'

export type Direction = 'forward' | 'backward' | 'mixed'

// 'all', 'hard' or 'deck:<id>'.
export type Scope = string

export interface PracticeItem {
  word: Word
  reversed: boolean
}

export interface Session {
  items: PracticeItem[]
  results: boolean[]
}

export const ALL_WORDS = 0

export function validScope(scope: Scope, decks: Deck[]): Scope {
  if (!scope.startsWith('deck:')) return scope
  const deckExists = decks.some((deck) => `deck:${deck.id}` === scope)
  return deckExists ? scope : 'all'
}

export function wordsInScope(words: Word[], scope: Scope): Word[] {
  if (scope === 'all') return words
  if (scope === 'hard') return words.filter(isHard)
  return words.filter((word) => `deck:${word.deckId}` === scope)
}

// Weighted pick: a new or missed word is up to 6 times more likely than a word you know well.
export function pickItems(words: Word[], size: number, direction: Direction): PracticeItem[] {
  const ranked = words
    .map((word) => ({ word, rank: Math.random() ** (1 / (MAX_STRENGTH + 1 - word.strength)) }))
    .sort((first, second) => second.rank - first.rank)
  const picked = size === ALL_WORDS ? ranked : ranked.slice(0, size)
  return picked.map(({ word }) => ({
    word,
    reversed: direction === 'backward' || (direction === 'mixed' && Math.random() < 0.5),
  }))
}

export function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

export function promptOf(item: PracticeItem): string {
  return item.reversed ? item.word.translation : item.word.term
}

export function answerOf(item: PracticeItem): string {
  return item.reversed ? item.word.term : item.word.translation
}

export function missedItems(session: Session): PracticeItem[] {
  return session.items.filter((_, index) => !session.results[index])
}

export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}
