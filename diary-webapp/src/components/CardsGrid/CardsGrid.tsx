import React from 'react'

const CardsGrid: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '1rem',
      padding: '1rem'
    }}>
      {children}
    </div>
  )
}

export default CardsGrid
