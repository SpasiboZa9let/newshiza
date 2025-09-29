import { openDB, IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION, STORES } from './schema'
import { Entry } from '../../types/models'

let dbPromise: Promise<IDBPDatabase> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.entries)) {
          const store = db.createObjectStore(STORES.entries, { keyPath: 'id' })
          store.createIndex('date', 'date')
          store.createIndex('title', 'title')
        }
        if (!db.objectStoreNames.contains(STORES.blobs)) {
          db.createObjectStore(STORES.blobs, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.thumbs)) {
          db.createObjectStore(STORES.thumbs, { keyPath: 'id' })
        }
      }
    })
  }
  return dbPromise
}

// CRUD для записей
export async function addEntry(entry: Entry) {
  const db = await getDB()
  await db.put(STORES.entries, entry)
}

export async function updateEntry(entry: Entry) {
  const db = await getDB()
  entry.updatedAt = new Date().toISOString()
  await db.put(STORES.entries, entry)
}

export async function deleteEntry(id: string) {
  const db = await getDB()
  await db.delete(STORES.entries, id)
}

export async function listEntries(): Promise<Entry[]> {
  const db = await getDB()
  return await db.getAll(STORES.entries)
}
