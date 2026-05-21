import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import type { TaskFormData } from '../../types/task'

interface TaskFormProps {
  initialValues?: TaskFormData
  onSubmit: (data: TaskFormData) => void | Promise<void>
  onCancel: () => void
  submitting?: boolean
  submitLabel?: string
}

export default function TaskForm({
  initialValues = { title: '', description: '' },
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Save',
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues.title)
  const [description, setDescription] = useState(initialValues.description)
  const [titleError, setTitleError] = useState('')

  useEffect(() => {
    setTitle(initialValues.title)
    setDescription(initialValues.description)
    setTitleError('')
  }, [initialValues.title, initialValues.description])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('Title is required')
      return
    }
    onSubmit({ title: title.trim(), description: description.trim() })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <div>
          <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTitleError('') }}
            placeholder="Task title"
            className={`w-full px-3 py-2 rounded-lg border text-slate-900 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition
              ${titleError ? 'border-red-400' : 'border-slate-300'}`}
          />
          {titleError && <p className="mt-1 text-xs text-red-500">{titleError}</p>}
        </div>

        <div>
          <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
              focus:border-transparent transition resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
