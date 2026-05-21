import { useState } from 'react'
import Dialog from './Dialog'
import TaskForm from '../tasks/TaskForm'
import type { TaskFormData } from '../../types/task'

interface CreateTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: TaskFormData) => Promise<unknown>
}

export default function CreateTaskDialog({ isOpen, onClose, onCreate }: CreateTaskDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(data: TaskFormData) {
    setSubmitting(true)
    try {
      await onCreate(data)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Nueva Tarea">
      <TaskForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitting={submitting}
        submitLabel="Crear Tarea"
      />
    </Dialog>
  )
}
