import { useState, type FormEvent } from 'react'
import { db, deckNameKey, deleteDeck, type Deck, type Word } from '../db'
import { plural } from '../practice'
import { Icon } from './Icon'
import { Modal } from './Modal'

interface DecksModalProps {
  decks: Deck[]
  words: Word[]
  onClose: () => void
}

export function DecksModal({ decks, words, onClose }: DecksModalProps) {
  const [newDeckName, setNewDeckName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null)

  const wordCountOf = (deck: Deck) => words.filter((word) => word.deckId === deck.id).length

  function nameIsTaken(name: string, deckId?: number): boolean {
    return decks.some((deck) => deck.id !== deckId && deckNameKey(deck.name) === deckNameKey(name))
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    const name = newDeckName.trim()
    if (!name) return
    if (nameIsTaken(name)) {
      setErrorMessage(`You already have a deck named "${name}".`)
      return
    }
    await db.decks.add({ name })
    setNewDeckName('')
    setErrorMessage('')
  }

  async function handleRename(deck: Deck, input: HTMLInputElement) {
    const name = input.value.trim()
    if (name === deck.name) return
    if (!name) {
      input.value = deck.name
      return
    }
    if (nameIsTaken(name, deck.id)) {
      input.value = deck.name
      setErrorMessage(`You already have a deck named "${name}".`)
      return
    }
    await db.decks.update(deck.id, { name })
    setErrorMessage('')
  }

  async function confirmDelete(deck: Deck, withWords: boolean) {
    await deleteDeck(deck.id, { withWords })
    setDeckToDelete(null)
  }

  if (deckToDelete) {
    const wordCount = wordCountOf(deckToDelete)
    return (
      <Modal title="Delete deck" onClose={onClose}>
        <p className="modal-text" dir="auto">
          {wordCount === 0
            ? `"${deckToDelete.name}" has no words.`
            : `"${deckToDelete.name}" has ${plural(wordCount, 'word')}. Do you want to delete them too?`}
        </p>
        <div className="stacked-buttons">
          {wordCount > 0 && (
            <button className="button bad-soft block" onClick={() => confirmDelete(deckToDelete, true)}>
              Delete the deck and its {plural(wordCount, 'word')}
            </button>
          )}
          <button
            className={wordCount > 0 ? 'button secondary block' : 'button bad-soft block'}
            onClick={() => confirmDelete(deckToDelete, false)}
          >
            {wordCount > 0 ? 'Delete only the deck, keep the words' : 'Delete the deck'}
          </button>
          <button className="button ghost block" onClick={() => setDeckToDelete(null)}>
            Cancel
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Decks" onClose={onClose}>
      <p className="modal-text">Group your words by topic. Tap a name to rename it.</p>

      {decks.length > 0 && (
        <ul className="deck-list">
          {decks.map((deck) => (
            <li key={`${deck.id}:${deck.name}`}>
              <input
                className="deck-name"
                dir="auto"
                defaultValue={deck.name}
                aria-label="Deck name"
                enterKeyHint="done"
                onBlur={(event) => handleRename(deck, event.target)}
                onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
              />
              <span className="deck-count">{wordCountOf(deck)}</span>
              <button className="icon-button plain" onClick={() => setDeckToDelete(deck)} aria-label={`Delete ${deck.name}`}>
                <Icon name="trash" size={19} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="inline-form" onSubmit={handleAdd}>
        <input
          className="input"
          dir="auto"
          placeholder="New deck, for example Food"
          value={newDeckName}
          onChange={(event) => setNewDeckName(event.target.value)}
          enterKeyHint="done"
        />
        <button className="button primary" type="submit" disabled={!newDeckName.trim()}>
          Add
        </button>
      </form>
      {errorMessage && <p className="field-hint warn">{errorMessage}</p>}
    </Modal>
  )
}
