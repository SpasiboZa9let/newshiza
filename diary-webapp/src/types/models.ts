export type Attachment = {
  id: string
  name: string
  mime: string
  size: number
  blobId: string
  thumbId?: string
  createdAt: string
}

export type Entry = {
  id: string
  date: string   // YYYY-MM-DD
  title: string
  content: string
  tags: string[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}
