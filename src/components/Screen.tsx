import type { ReactNode } from 'react'

interface ScreenProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

// A screen without a title is a practice session: it gets the full height for the card.
export function Screen({ title, subtitle, action, children }: ScreenProps) {
  if (!title) return <main className="screen-body no-header">{children}</main>

  return (
    <>
      <header className="top-bar">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      <main className="screen-body">{children}</main>
    </>
  )
}
