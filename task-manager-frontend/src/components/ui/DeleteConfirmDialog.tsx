import { useState } from 'react'
import Dialog from './Dialog'
import Button from './Button'
import type { Task } from '../../types/task'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  onConfirm: (id: string) => Promise<void>
}

export default function DeleteConfirmDialog({ isOpen, onClose, task, onConfirm }: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    if (!task) return
    setDeleting(true)
    try {
      await onConfirm(task.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Delete Task" maxWidth="sm">
      <p className="text-slate-600 mb-6">
        Are you sure you want to delete{' '}
        <span className="font-semibold text-slate-900">"{task?.title}"</span>?
        This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="danger" type="button" onClick={handleConfirm} loading={deleting}>
          Delete
        </Button>
      </div>
    </Dialog>
  )
}
