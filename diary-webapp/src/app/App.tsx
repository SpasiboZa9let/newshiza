import React from 'react'
import HeaderBar from '../components/HeaderBar/HeaderBar'
import MagicBento from '../components/MagicBento/MagicBento'
import CardsGrid from '../components/CardsGrid/CardsGrid'
import EntryCard from '../components/EntryCard/EntryCard'

const App: React.FC = () => {
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <HeaderBar />
      <MagicBento />
      <CardsGrid>
        <EntryCard title="Первая запись" date="2025-09-29" preview="Это заглушка карточки..." />
        <EntryCard title="Вторая запись" date="2025-09-28" preview="Ещё одна заглушка..." />
      </CardsGrid>
    </div>
  )
}

export default App
