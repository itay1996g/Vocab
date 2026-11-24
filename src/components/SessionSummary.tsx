import { answerOf, missedItems, plural, promptOf, type Session } from '../practice'

const RING_RADIUS = 52
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function scoreMessage(percent: number): string {
  if (percent === 100) return 'Perfect score!'
  if (percent >= 80) return 'Great job!'
  if (percent >= 50) return 'Good progress!'
  return 'Keep practicing!'
}

interface SessionSummaryProps {
  session: Session
  onPracticeMissed: () => void
  onDone: () => void
}

export function SessionSummary({ session, onPracticeMissed, onDone }: SessionSummaryProps) {
  const correctCount = session.results.filter(Boolean).length
  const percent = Math.round((correctCount / session.items.length) * 100)
  const missed = missedItems(session)

  return (
    <div className="summary">
      <div className="score-ring">
        <svg viewBox="0 0 120 120">
          <circle className="ring-track" cx="60" cy="60" r={RING_RADIUS} />
          <circle
            className="ring-value"
            cx="60"
            cy="60"
            r={RING_RADIUS}
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - percent / 100)}
          />
        </svg>
        <span>{percent}%</span>
      </div>
      <h2>{scoreMessage(percent)}</h2>
      <p className="hint">
        {correctCount} of {plural(session.items.length, 'word')} right
      </p>

      {missed.length > 0 && (
        <section className="card missed">
          <h2>To practice</h2>
          <ul>
            {missed.map((item) => (
              <li key={item.word.id}>
                <span dir="auto">{promptOf(item)}</span>
                <span dir="auto">{answerOf(item)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="summary-actions">
        {missed.length > 0 && (
          <button className="button primary block" onClick={onPracticeMissed}>
            Practice the {plural(missed.length, 'missed word')}
          </button>
        )}
        <button className={missed.length > 0 ? 'button secondary block' : 'button primary block'} onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  )
}
