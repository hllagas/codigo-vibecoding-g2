import type { Task, TaskFormData } from '../types/task'

const BASE_URL = '/api/tasks'

const getAuthHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
})

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || `HTTP ${res.status}`)
  }
  if (res.status === 204) return null as T
  return res.json() as Promise<T>
}

export const taskService = {
  getAll(): Promise<Task[]> {
    return fetch(BASE_URL, { headers: getAuthHeaders() }).then(handleResponse<Task[]>)
  },

  getById(id: string): Promise<Task> {
    return fetch(`${BASE_URL}/${id}`, { headers: getAuthHeaders() }).then(handleResponse<Task>)
  },

  create(data: TaskFormData): Promise<Task> {
    return fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then(handleResponse<Task>)
  },

  update(id: string, data: Partial<Task>): Promise<Task> {
    return fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then(handleResponse<Task>)
  },

  delete(id: string): Promise<null> {
    return fetch(`${BASE_URL}/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(
      handleResponse<null>,
    )
  },
}
