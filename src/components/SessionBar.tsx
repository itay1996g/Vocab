import { Icon } from './Icon'

interface SessionBarProps {
  done: number
  total: number
  onQuit: () => void
}

export function SessionBar({ done, total, onQuit }: SessionBarProps) {
  return (
    <div className="session-bar">
      <button className="icon-button" onClick={onQuit} aria-label="End session">
        <Icon name="close" size={20} />
      </button>
      <div className="progress">
        <div style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <span className="session-count">
        {done + 1}/{total}
      </span>
    </div>
  )
}
