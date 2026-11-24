import { useRef, useState, type FormEvent } from 'react'
import { isCorrectAnswer } from '../answer'
import { recordReview, type Deck, type Word } from '../db'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { PracticeSetup } from '../components/PracticeSetup'
import { Screen } from '../components/Screen'
import { SessionBar } from '../components/SessionBar'
import { SessionSummary } from '../components/SessionSummary'
import { answerOf, missedItems, promptOf, shuffle, type PracticeItem, type Session } from '../practice'

interface QuizScreenProps {
  words: Word[]
  decks: Deck[]
  onGoToWords: () => void
}

export function QuizScreen({ words, decks, onGoToWords }: QuizScreenProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [checkedCorrect, setCheckedCorrect] = useState<boolean | null>(null)
  const answerInput = useRef<HTMLInputElement>(null)

  function startSession(items: PracticeItem[]) {
    setTypedAnswer('')
    setCheckedCorrect(null)
    setSession({ items, results: [] })
  }

  const quizWords = words.filter((word) => !word.skipQuiz)

  if (!session && words.length > 0 && quizWords.length === 0) {
    return (
      <Screen title="Quiz" subtitle="Type the translation of each word">
        <EmptyState icon="quiz" title="No words in the quiz" text='Open a word in your bank and turn on "Use in quiz".'>
          <button className="button primary" onClick={onGoToWords}>
            Go to words
          </button>
        </EmptyState>
      </Screen>
    )
  }

  if (!session) {
    return (
      <Screen title="Quiz" subtitle="Type the translation of each word">
        <PracticeSetup mode="quiz" words={quizWords} decks={decks} onStart={startSession} onGoToWords={onGoToWords} />
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
  const expectedAnswer = answerOf(item)
  const checked = checkedCorrect !== null

  const goToNext = async (correct: boolean) => {
    // Keeps the keyboard open on iPhone: focus works only inside the tap itself.
    answerInput.current?.focus()
    setTypedAnswer('')
    setCheckedCorrect(null)
    setSession({ ...session, results: [...session.results, correct] })
    await recordReview(item.word.id, correct)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (checkedCorrect !== null) {
      goToNext(checkedCorrect)
      return
    }
    if (!typedAnswer.trim()) return
    setCheckedCorrect(isCorrectAnswer(typedAnswer, expectedAnswer))
  }

  const showAnswer = () => {
    setTypedAnswer('')
    setCheckedCorrect(false)
  }

  const inputState = checked ? (checkedCorrect ? ' good' : ' bad') : ''

  return (
    <Screen>
      <SessionBar done={session.results.length} total={session.items.length} onQuit={() => setSession(null)} />

      <div className="prompt-card">
        <span className="face-label">{item.reversed ? 'Write the word for' : 'Translate'}</span>
        <span className="prompt-text" dir="auto">
          {promptOf(item)}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          ref={answerInput}
          className={`answer-input${inputState}`}
          dir="auto"
          placeholder="Your answer"
          value={typedAnswer}
          onChange={(event) => !checked && setTypedAnswer(event.target.value)}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={checked ? 'next' : 'go'}
        />

        {checkedCorrect === true && (
          <div className="feedback good">
            <strong>
              <Icon name="check" size={20} /> Correct!
            </strong>
            <span dir="auto">{expectedAnswer}</span>
          </div>
        )}
        {checkedCorrect === false && (
          <div className="feedback bad">
            <strong>{typedAnswer ? 'Not quite' : 'The answer is'}</strong>
            <span className="expected" dir="auto">
              {expectedAnswer}
            </span>
          </div>
        )}

        <div className="quiz-actions">
          {!checked && (
            <>
              <button className="button secondary" type="button" onClick={showAnswer}>
                Don't know
              </button>
              <button className="button primary" type="submit" disabled={!typedAnswer.trim()}>
                Check
              </button>
            </>
          )}
          {checkedCorrect === false && typedAnswer && (
            <button className="button secondary" type="button" onClick={() => goToNext(true)}>
              I was right
            </button>
          )}
          {checked && (
            <button className="button primary" type="submit">
              Next
            </button>
          )}
        </div>
      </form>
    </Screen>
  )
}
