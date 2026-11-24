import { MAX_STRENGTH } from '../db'

export function Mastery({ strength }: { strength: number }) {
  return (
    <span className="mastery" aria-label={`Mastery ${strength} of ${MAX_STRENGTH}`}>
      {Array.from({ length: MAX_STRENGTH }, (_, level) => (
        <span key={level} className={level < strength ? 'on' : ''} />
      ))}
    </span>
  )
}
