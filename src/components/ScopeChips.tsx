import { isHard, type Deck, type Word } from '../db'
import type { Scope } from '../practice'

interface ScopeChipsProps {
  words: Word[]
  decks: Deck[]
  value: Scope
  onChange: (scope: Scope) => void
}

export function ScopeChips({ words, decks, value, onChange }: ScopeChipsProps) {
  const chips = [
    { scope: 'all', label: 'All', count: words.length },
    { scope: 'hard', label: 'Hard', count: words.filter(isHard).length },
    ...decks.map((deck) => ({
      scope: `deck:${deck.id}`,
      label: deck.name,
      count: words.filter((word) => word.deckId === deck.id).length,
    })),
  ]

  return (
    <div className="chips">
      {chips.map((chip) => (
        <button
          key={chip.scope}
          className={chip.scope === value ? 'chip active' : 'chip'}
          disabled={chip.count === 0 && chip.scope !== value}
          onClick={() => onChange(chip.scope)}
        >
          {chip.label}
          <span className="chip-count">{chip.count}</span>
        </button>
      ))}
    </div>
  )
}
