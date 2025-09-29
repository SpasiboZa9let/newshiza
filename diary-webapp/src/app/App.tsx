import React from 'react'
import HeaderBar from '../components/HeaderBar/HeaderBar'
import MagicBento from '../components/MagicBento/MagicBento'
import CardsGrid from '../components/CardsGrid/CardsGrid'
import EntryCard from '../components/EntryCard/EntryCard'
import { useEntries } from '../hooks/useEntries'

const App: React.FC = () => {
  const { entries, createEntry } = useEntries()

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <HeaderBar />
      <MagicBento />
      <button onClick={() =>
        createEntry({
          date: new Date().toISOString().slice(0, 10),
          title: 'Новая запись',
          content: 'Текст записи...',
          tags: ['demo'],
          attachments: []
        })
      }>
        ➕ Добавить запись
      </button>
      <CardsGrid>
        {entries.map(e => (
          <EntryCard
            key={e.id}
            title={e.title}
            date={e.date}
            preview={e.content.slice(0, 100)}
          />
        ))}
      </CardsGrid>
    </div>
  )
}

export default App
