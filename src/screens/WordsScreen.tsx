import { useState } from 'react'
import { normalizeText } from '../answer'
import { isHard, type Deck, type Word } from '../db'
import { DecksModal } from '../components/DecksModal'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { Mastery } from '../components/Mastery'
import { ScopeChips } from '../components/ScopeChips'
import { Screen } from '../components/Screen'
import { WordModal } from '../components/WordModal'
import { plural, validScope, wordsInScope, type Scope } from '../practice'

interface WordsScreenProps {
  words: Word[]
  decks: Deck[]
}

export function WordsScreen({ words, decks }: WordsScreenProps) {
  const [searchText, setSearchText] = useState('')
  const [selectedScope, setSelectedScope] = useState<Scope>('all')
  const [editedWord, setEditedWord] = useState<Word | 'new' | null>(null)
  const [decksOpen, setDecksOpen] = useState(false)

  const scope = validScope(selectedScope, decks)
  const deckNames = new Map(decks.map((deck) => [deck.id, deck.name]))
  const query = normalizeText(searchText)
  const visibleWords = wordsInScope(words, scope)
    .filter((word) => normalizeText(word.term).includes(query) || normalizeText(word.translation).includes(query))
    .sort((first, second) => second.createdAt - first.createdAt)
  const selectedDeckId = scope.startsWith('deck:') ? Number(scope.slice('deck:'.length)) : null

  return (
    <Screen
      title="Words"
      subtitle={plural(words.length, 'word')}
      action={
        <button className="header-button" onClick={() => setDecksOpen(true)}>
          <Icon name="folder" size={18} />
          Decks
        </button>
      }
    >
      {words.length === 0 ? (
        <EmptyState icon="words" title="Your words bank is empty" text="Add a word and its translation to start.">
          <button className="button primary" onClick={() => setEditedWord('new')}>
            Add your first word
          </button>
        </EmptyState>
      ) : (
        <>
          <label className="search">
            <Icon name="search" size={19} />
            <input
              type="search"
              dir="auto"
              placeholder="Search words"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              autoCapitalize="off"
              enterKeyHint="search"
            />
          </label>
          <ScopeChips words={words} decks={decks} value={scope} onChange={setSelectedScope} />

          {visibleWords.length === 0 && <p className="hint">No words match your search.</p>}
          <ul className="word-list">
            {visibleWords.map((word) => (
              <li key={word.id}>
                <button className="word-row" onClick={() => setEditedWord(word)}>
                  <span className="word-text">
                    <span className="word-term" dir="auto">
                      {word.term}
                    </span>
                    <span className="word-translation" dir="auto">
                      {word.translation}
                    </span>
                  </span>
                  <span className="word-meta">
                    <Mastery strength={word.strength} />
                    {isHard(word) && <span className="badge hard">Hard</span>}
                    {word.skipQuiz && <span className="badge muted">No quiz</span>}
                    {scope === 'all' && word.deckId !== null && (
                      <span className="badge">{deckNames.get(word.deckId)}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <button className="fab" onClick={() => setEditedWord('new')} aria-label="Add word">
        <Icon name="plus" size={28} />
      </button>

      {editedWord && (
        <WordModal
          word={editedWord === 'new' ? undefined : editedWord}
          words={words}
          decks={decks}
          defaultDeckId={selectedDeckId}
          onClose={() => setEditedWord(null)}
        />
      )}
      {decksOpen && <DecksModal decks={decks} words={words} onClose={() => setDecksOpen(false)} />}
    </Screen>
  )
}
