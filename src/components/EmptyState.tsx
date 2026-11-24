import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

interface EmptyStateProps {
  icon: IconName
  title: string
  text: string
  children?: ReactNode
}

export function EmptyState({ icon, title, text, children }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={34} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  )
}
