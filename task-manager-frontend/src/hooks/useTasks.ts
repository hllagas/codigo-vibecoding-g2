import { useState, useCallback } from 'react'
import { taskService } from '../services/taskService'
import type { Task, TaskFormData } from '../types/task'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await taskService.getAll()
      setTasks(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createTask = useCallback(async (data: TaskFormData) => {
    const newTask = await taskService.create(data)
    setTasks((prev) => [newTask, ...prev])
    return newTask
  }, [])

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    const updated = await taskService.update(id, data)
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    await taskService.delete(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toggleComplete = useCallback(
    (task: Task) => updateTask(task.id, { ...task, completed: !task.completed }),
    [updateTask],
  )

  return { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask, toggleComplete }
}
