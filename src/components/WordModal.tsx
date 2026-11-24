import { useRef, useState, type FormEvent } from 'react'
import { normalizeText } from '../answer'
import { addWord, db, type Deck, type Word } from '../db'
import { Mastery } from './Mastery'
import { Modal } from './Modal'

interface WordModalProps {
  word?: Word
  words: Word[]
  decks: Deck[]
  defaultDeckId: number | null
  onClose: () => void
}

export function WordModal({ word, words, decks, defaultDeckId, onClose }: WordModalProps) {
  const [term, setTerm] = useState(word?.term ?? '')
  const [translation, setTranslation] = useState(word?.translation ?? '')
  const [comment, setComment] = useState(word?.comment ?? '')
  const [deckId, setDeckId] = useState(word ? word.deckId : defaultDeckId)
  const [useInQuiz, setUseInQuiz] = useState(!word?.skipQuiz)
  const [lastAddedTerm, setLastAddedTerm] = useState('')
  const termInput = useRef<HTMLInputElement>(null)

  const normalizedTerm = normalizeText(term)
  const duplicate = normalizedTerm
    ? words.find((other) => other.id !== word?.id && normalizeText(other.term) === normalizedTerm)
    : undefined
  const canSave = term.trim() !== '' && translation.trim() !== ''

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSave) return
    const fields = {
      term: term.trim(),
      translation: translation.trim(),
      comment: comment.trim(),
      deckId,
      skipQuiz: !useInQuiz,
    }

    if (word) {
      await db.words.update(word.id, fields)
      onClose()
      return
    }
    // Focus before the await: iPhone opens the keyboard only inside the tap itself.
    termInput.current?.focus()
    await addWord(fields)
    setLastAddedTerm(fields.term)
    setTerm('')
    setTranslation('')
    setComment('')
  }

  async function handleDelete() {
    if (!word) return
    if (!confirm(`Delete "${word.term}"?`)) return
    await db.words.delete(word.id)
    onClose()
  }

  return (
    <Modal title={word ? 'Edit word' : 'New word'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Word</span>
          <input
            ref={termInput}
            className="input"
            dir="auto"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            autoCapitalize="off"
            autoComplete="off"
            enterKeyHint="next"
          />
          {duplicate && (
            <span className="field-hint warn" dir="auto">
              Already in your bank: {duplicate.term} = {duplicate.translation}
            </span>
          )}
        </label>

        <label className="field">
          <span className="field-label">Translation</span>
          <textarea
            className="input"
            dir="auto"
            rows={2}
            value={translation}
            onChange={(event) => setTranslation(event.target.value)}
            autoCapitalize="off"
          />
          <span className="field-hint">Several answers? Separate them with a comma or a slash.</span>
        </label>

        <label className="field">
          <span className="field-label">Comment</span>
          <textarea
            className="input"
            dir="auto"
            rows={2}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Optional, for example: for states and location"
          />
          <span className="field-hint">A hint you can open in practice. The quiz does not check it.</span>
        </label>

        <label className="field">
          <span className="field-label">Deck</span>
          <select
            className="input"
            value={deckId ?? ''}
            onChange={(event) => setDeckId(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">No deck</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </label>

        <label className="toggle-row">
          <span className="toggle-text">
            <span>Use in quiz</span>
            <small>When off, the word shows only in flashcards.</small>
          </span>
          <input
            type="checkbox"
            className="switch"
            checked={useInQuiz}
            onChange={(event) => setUseInQuiz(event.target.checked)}
          />
        </label>

        {word && (
          <p className="word-stats">
            <Mastery strength={word.strength} />
            {word.correctCount} right, {word.wrongCount} wrong
          </p>
        )}

        <button className="button primary block" type="submit" disabled={!canSave}>
          {word ? 'Save' : 'Add word'}
        </button>
        {lastAddedTerm && !word && (
          <p className="added-message" dir="auto">
            Added "{lastAddedTerm}". Add the next one, or close.
          </p>
        )}
        {word && (
          <button className="button danger-text block" type="button" onClick={handleDelete}>
            Delete word
          </button>
        )}
      </form>
    </Modal>
  )
}
