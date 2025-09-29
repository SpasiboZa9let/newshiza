import React, { useState } from 'react'

const ThemeToggle: React.FC = () => {
  const [dark, setDark] = useState(false)
  return (
    <button onClick={() => setDark(!dark)}>
      {dark ? '☀️ Светлая' : '🌙 Тёмная'}
    </button>
  )
}

export default ThemeToggle
