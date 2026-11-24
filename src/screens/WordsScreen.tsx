import { useState } from 'react'
import { normalizeText } from '../answer'
import { db, isHard, type Deck, type Word } from '../db'
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
  // Null when you are not selecting words.
  const [selectedIds, setSelectedIds] = useState<Set<number> | null>(null)

  const scope = validScope(selectedScope, decks)
  const deckNames = new Map(decks.map((deck) => [deck.id, deck.name]))
  const query = normalizeText(searchText)
  const visibleWords = wordsInScope(words, scope)
    .filter((word) => normalizeText(word.term).includes(query) || normalizeText(word.translation).includes(query))
    .sort((first, second) => second.createdAt - first.createdAt)
  const selectedDeckId = scope.startsWith('deck:') ? Number(scope.slice('deck:'.length)) : null
  const allVisibleSelected = visibleWords.length > 0 && visibleWords.every((word) => selectedIds?.has(word.id))

  function toggleSelected(wordId: number) {
    const nextSelectedIds = new Set(selectedIds)
    if (nextSelectedIds.has(wordId)) {
      nextSelectedIds.delete(wordId)
    } else {
      nextSelectedIds.add(wordId)
    }
    setSelectedIds(nextSelectedIds)
  }

  function toggleSelectAll() {
    setSelectedIds(allVisibleSelected ? new Set() : new Set(visibleWords.map((word) => word.id)))
  }

  async function deleteSelected() {
    if (!selectedIds?.size) return
    if (!confirm(`Delete ${plural(selectedIds.size, 'word')}? You cannot undo this.`)) return
    await db.words.bulkDelete([...selectedIds])
    setSelectedIds(null)
  }

  const headerAction = selectedIds ? (
    <button className="header-button" onClick={() => setSelectedIds(null)}>
      Cancel
    </button>
  ) : (
    <div className="header-actions">
      {words.length > 0 && (
        <button className="header-button" onClick={() => setSelectedIds(new Set())}>
          <Icon name="select" size={18} />
          Select
        </button>
      )}
      <button className="header-button" onClick={() => setDecksOpen(true)}>
        <Icon name="folder" size={18} />
        Decks
      </button>
    </div>
  )

  return (
    <Screen
      title="Words"
      subtitle={selectedIds ? `${selectedIds.size} selected` : plural(words.length, 'word')}
      action={headerAction}
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
          <ul className={selectedIds ? 'word-list selecting' : 'word-list'}>
            {visibleWords.map((word) => (
              <li key={word.id}>
                <button
                  className={selectedIds?.has(word.id) ? 'word-row selected' : 'word-row'}
                  onClick={() => (selectedIds ? toggleSelected(word.id) : setEditedWord(word))}
                >
                  {selectedIds && (
                    <span className="select-mark">
                      <Icon name="check" size={15} />
                    </span>
                  )}
                  <span className="word-text">
                    <span className="word-term" dir="auto">
                      {word.term}
                    </span>
                    <span className="word-translation" dir="auto">
                      {word.translation}
                    </span>
                    {word.comment && (
                      <span className="word-comment" dir="auto">
                        {word.comment}
                      </span>
                    )}
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

      {selectedIds ? (
        <div className="selection-bar">
          <button className="button secondary" onClick={toggleSelectAll} disabled={visibleWords.length === 0}>
            {allVisibleSelected ? 'Select none' : 'Select all'}
          </button>
          <button className="button bad-soft" onClick={deleteSelected} disabled={selectedIds.size === 0}>
            <Icon name="trash" size={19} />
            Delete {selectedIds.size || ''}
          </button>
        </div>
      ) : (
        <button className="fab" onClick={() => setEditedWord('new')} aria-label="Add word">
          <Icon name="plus" size={28} />
        </button>
      )}

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
