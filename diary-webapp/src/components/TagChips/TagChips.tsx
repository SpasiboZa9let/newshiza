import React from 'react'

const TagChips: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <span style={{ background: '#eee', padding: '0.25rem 0.5rem', borderRadius: '12px' }}>#tag</span>
      <span style={{ background: '#eee', padding: '0.25rem 0.5rem', borderRadius: '12px' }}>#work</span>
    </div>
  )
}

export default TagChips
