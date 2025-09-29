import React, { useEffect, useState } from 'react'

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(t)
  }, [])

  return <span>{time}</span>
}

export default Clock
