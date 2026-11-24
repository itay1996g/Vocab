import { useState } from 'react'
import { recordReview, type Deck, type Word } from '../db'
import { PracticeSetup } from '../components/PracticeSetup'
import { Screen } from '../components/Screen'
import { SessionBar } from '../components/SessionBar'
import { SessionSummary } from '../components/SessionSummary'
import { answerOf, missedItems, promptOf, shuffle, type PracticeItem, type Session } from '../practice'

const LONG_TEXT_LENGTH = 40

interface CardsScreenProps {
  words: Word[]
  decks: Deck[]
  onGoToWords: () => void
}

export function CardsScreen({ words, decks, onGoToWords }: CardsScreenProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [flipped, setFlipped] = useState(false)

  function startSession(items: PracticeItem[]) {
    setFlipped(false)
    setSession({ items, results: [] })
  }

  if (!session) {
    return (
      <Screen title="Flashcards" subtitle="Tap a card to see the answer">
        <PracticeSetup mode="cards" words={words} decks={decks} onStart={startSession} onGoToWords={onGoToWords} />
      </Screen>
    )
  }

  if (session.results.length === session.items.length) {
    return (
      <Screen>
        <SessionSummary
          session={session}
          onPracticeMissed={() => startSession(shuffle(missedItems(session)))}
          onDone={() => setSession(null)}
        />
      </Screen>
    )
  }

  const item = session.items[session.results.length]
  const prompt = promptOf(item)
  const answer = answerOf(item)

  const handleAnswer = async (knewIt: boolean) => {
    setFlipped(false)
    setSession({ ...session, results: [...session.results, knewIt] })
    await recordReview(item.word.id, knewIt)
  }

  return (
    <Screen>
      <SessionBar done={session.results.length} total={session.items.length} onQuit={() => setSession(null)} />

      {/* The key gives each word a new card, so the next answer does not show while the card turns back. */}
      <div
        key={session.results.length}
        className={flipped ? 'flashcard flipped' : 'flashcard'}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="flashcard-inner">
          <div className="face">
            <span className="face-label">{item.reversed ? 'Translation' : 'Word'}</span>
            <span className={prompt.length > LONG_TEXT_LENGTH ? 'face-text long' : 'face-text'} dir="auto">
              {prompt}
            </span>
            <span className="face-hint">Tap to flip</span>
          </div>
          <div className="face back">
            <span className="face-label">{item.reversed ? 'Word' : 'Translation'}</span>
            <span className={answer.length > LONG_TEXT_LENGTH ? 'face-text long' : 'face-text'} dir="auto">
              {answer}
            </span>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="answer-buttons">
          <button className="button bad-soft" onClick={() => handleAnswer(false)}>
            Again
          </button>
          <button className="button good-soft" onClick={() => handleAnswer(true)}>
            Knew it
          </button>
        </div>
      ) : (
        <button className="button secondary block" onClick={() => setFlipped(true)}>
          Show answer
        </button>
      )}
    </Screen>
  )
}
