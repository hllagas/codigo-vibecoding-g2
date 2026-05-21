import { useState } from 'react'
import Dialog from './Dialog'
import TaskForm from '../tasks/TaskForm'
import type { Task, TaskFormData } from '../../types/task'

interface EditTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  onUpdate: (id: string, data: Partial<Task>) => Promise<unknown>
}

export default function EditTaskDialog({ isOpen, onClose, task, onUpdate }: EditTaskDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(data: TaskFormData) {
    if (!task) return
    setSubmitting(true)
    try {
      await onUpdate(task.id, { ...task, ...data })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Edit Task">
      <TaskForm
        key={task?.id}
        initialValues={{ title: task?.title ?? '', description: task?.description ?? '' }}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitting={submitting}
        submitLabel="Guardar Cambios"
      />
    </Dialog>
  )
}
