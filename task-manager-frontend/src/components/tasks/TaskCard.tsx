import { Link } from 'react-router-dom'
import TaskStatusBadge from './TaskStatusBadge'
import type { Task } from '../../types/task'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onToggleComplete: (task: Task) => void
}

export default function TaskCard({ task, onEdit, onDelete, onToggleComplete }: TaskCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleComplete(task)}
            aria-label={`Mark "${task.title}" as ${task.completed ? 'pending' : 'completed'}`}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
          />
          <Link
            to={`/tasks/${task.id}`}
            className={`font-semibold text-slate-900 hover:text-indigo-600 transition-colors truncate
              ${task.completed ? 'line-through text-slate-400' : ''}`}
          >
            {task.title}
          </Link>
        </div>
        <TaskStatusBadge completed={task.completed} />
      </div>

      {task.description && (
        <p className="text-sm text-slate-500 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400">{formatDate(task.created_at)}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            aria-label="Delete task"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
