import { useState } from 'react'
import type { Deck, Word } from '../db'
import {
  ALL_WORDS,
  pickItems,
  plural,
  validScope,
  wordsInScope,
  type Direction,
  type PracticeItem,
  type Scope,
} from '../practice'
import { EmptyState } from './EmptyState'
import { ScopeChips } from './ScopeChips'
import { Segmented } from './Segmented'

interface Setup {
  scope: Scope
  size: number
  direction: Direction
}

const DEFAULT_SETUP: Setup = { scope: 'all', size: 10, direction: 'forward' }

const SIZE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: ALL_WORDS, label: 'All' },
]

const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: 'forward', label: 'Word' },
  { value: 'backward', label: 'Translation' },
  { value: 'mixed', label: 'Mixed' },
]

interface PracticeSetupProps {
  mode: 'cards' | 'quiz'
  words: Word[]
  decks: Deck[]
  onStart: (items: PracticeItem[]) => void
  onGoToWords: () => void
}

export function PracticeSetup({ mode, words, decks, onStart, onGoToWords }: PracticeSetupProps) {
  const setupKey = `setup:${mode}`
  const [setup, setSetup] = useState<Setup>(() => {
    const savedSetup = localStorage.getItem(setupKey)
    return savedSetup ? { ...DEFAULT_SETUP, ...JSON.parse(savedSetup) } : DEFAULT_SETUP
  })

  if (words.length === 0) {
    return (
      <EmptyState icon={mode} title="No words yet" text="Add some words to your bank, then come back to practice.">
        <button className="button primary" onClick={onGoToWords}>
          Add words
        </button>
      </EmptyState>
    )
  }

  function updateSetup(change: Partial<Setup>) {
    const nextSetup = { ...setup, ...change }
    setSetup(nextSetup)
    localStorage.setItem(setupKey, JSON.stringify(nextSetup))
  }

  const scope = validScope(setup.scope, decks)
  const scopeWords = wordsInScope(words, scope)
  const sessionSize = setup.size === ALL_WORDS ? scopeWords.length : Math.min(setup.size, scopeWords.length)

  return (
    <>
      <section className="card">
        <h2>Practice</h2>
        <ScopeChips words={words} decks={decks} value={scope} onChange={(nextScope) => updateSetup({ scope: nextScope })} />
      </section>

      <section className="card">
        <h2>Number of words</h2>
        <Segmented options={SIZE_OPTIONS} value={setup.size} onChange={(size) => updateSetup({ size })} />
      </section>

      <section className="card">
        <h2>Show first</h2>
        <Segmented
          options={DIRECTION_OPTIONS}
          value={setup.direction}
          onChange={(direction) => updateSetup({ direction })}
        />
      </section>

      <button
        className="button primary block start-button"
        disabled={sessionSize === 0}
        onClick={() => onStart(pickItems(scopeWords, setup.size, setup.direction))}
      >
        Start {mode === 'cards' ? 'flashcards' : 'quiz'} with {plural(sessionSize, 'word')}
      </button>
      <p className="hint">Words you miss come back more often.</p>
    </>
  )
}
