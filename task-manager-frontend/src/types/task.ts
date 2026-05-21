export interface Task {
  id: string
  title: string
  description: string | undefined
  completed: boolean
  userId: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskFormData {
  title: string
  description: string
}
