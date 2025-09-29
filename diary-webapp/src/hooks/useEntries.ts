import { useEffect, useState } from 'react'
import { Entry } from '../types/models'
import { listEntries, addEntry, updateEntry, deleteEntry } from '../services/db/indexeddb'
import { v4 as uuid } from 'uuid'

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    const all = await listEntries()
    setEntries(all.sort((a, b) => b.date.localeCompare(a.date)))
  }

  async function createEntry(data: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) {
    const entry: Entry = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await addEntry(entry)
    await refresh()
  }

  async function updateEntryById(entry: Entry) {
    await updateEntry(entry)
    await refresh()
  }

  async function deleteEntryById(id: string) {
    await deleteEntry(id)
    await refresh()
  }

  return { entries, refresh, createEntry, updateEntryById, deleteEntryById }
}
