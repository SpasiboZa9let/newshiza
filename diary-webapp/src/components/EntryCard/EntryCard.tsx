import React from 'react'

type Props = {
  title: string
  date: string
  preview: string
}

const EntryCard: React.FC<Props> = ({ title, date, preview }) => {
  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '1rem',
      background: '#fafafa'
    }}>
      <h3>{title}</h3>
      <small>{date}</small>
      <p>{preview}</p>
    </div>
  )
}

export default EntryCard
