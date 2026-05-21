import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { taskService } from '../services/taskService'
import TaskStatusBadge from '../components/tasks/TaskStatusBadge'
import EditTaskDialog from '../components/ui/EditTaskDialog'
import DeleteConfirmDialog from '../components/ui/DeleteConfirmDialog'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import type { Task } from '../types/task'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const loadTask = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await taskService.getById(id)
      setTask(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadTask()
  }, [loadTask])

  async function handleUpdate(taskId: string, data: Partial<Task>) {
    const updated = await taskService.update(taskId, data)
    setTask(updated)
  }

  async function handleDelete(taskId: string) {
    await taskService.delete(taskId)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium mb-4">{error ?? 'Task not found'}</p>
        <Link to="/" className="text-indigo-600 hover:underline text-sm">
          Back to tasks
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to tasks
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex items-start gap-3 min-w-0">
            <TaskStatusBadge completed={task.completed} />
            <h1 className={`text-2xl font-bold break-words ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
              {task.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        </div>

        {task.description ? (
          <div className="prose-sm text-slate-600 mb-6 whitespace-pre-wrap leading-relaxed">
            {task.description}
          </div>
        ) : (
          <p className="text-slate-400 italic mb-6 text-sm">No description provided.</p>
        )}

        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Created: {formatDate(task.created_at)}
          </div>
        </div>
      </div>

      <EditTaskDialog
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        task={task}
        onUpdate={handleUpdate}
      />
      <DeleteConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        task={task}
        onConfirm={handleDelete}
      />
    </>
  )
}
