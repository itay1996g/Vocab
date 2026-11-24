import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from './db'
import { Icon, type IconName } from './components/Icon'
import { CardsScreen } from './screens/CardsScreen'
import { QuizScreen } from './screens/QuizScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { WordsScreen } from './screens/WordsScreen'

type Tab = 'words' | 'cards' | 'quiz' | 'settings'

const TABS: { tab: Tab; label: string; icon: IconName }[] = [
  { tab: 'words', label: 'Words', icon: 'words' },
  { tab: 'cards', label: 'Cards', icon: 'cards' },
  { tab: 'quiz', label: 'Quiz', icon: 'quiz' },
  { tab: 'settings', label: 'Settings', icon: 'settings' },
]

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('words')
  const words = useLiveQuery(() => db.words.toArray(), [])
  const decks = useLiveQuery(() => db.decks.toArray(), [])

  if (!words || !decks) return null

  const sortedDecks = [...decks].sort((first, second) => first.name.localeCompare(second.name))

  function openTab(tab: Tab) {
    setActiveTab(tab)
    window.scrollTo(0, 0)
  }

  // All screens stay mounted, so a practice session continues after you visit another tab.
  return (
    <>
      <div className="status-bar-backdrop" />
      <div hidden={activeTab !== 'words'}>
        <WordsScreen words={words} decks={sortedDecks} />
      </div>
      <div hidden={activeTab !== 'cards'}>
        <CardsScreen words={words} decks={sortedDecks} onGoToWords={() => openTab('words')} />
      </div>
      <div hidden={activeTab !== 'quiz'}>
        <QuizScreen words={words} decks={sortedDecks} onGoToWords={() => openTab('words')} />
      </div>
      <div hidden={activeTab !== 'settings'}>
        <SettingsScreen words={words} decks={sortedDecks} />
      </div>

      <nav className="tab-bar">
        {TABS.map(({ tab, label, icon }) => (
          <button key={tab} className={tab === activeTab ? 'active' : ''} onClick={() => openTab(tab)}>
            <Icon name={icon} />
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}
