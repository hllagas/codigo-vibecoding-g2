import Button from './Button'

interface EmptyStateProps {
  onCreateTask: () => void
}

export default function EmptyState({ onCreateTask }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <svg
        className="mx-auto w-16 h-16 text-slate-300 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">No tasks yet</h3>
      <p className="text-slate-400 text-sm mb-6">Create your first task to get started</p>
      <Button onClick={onCreateTask}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Task
      </Button>
    </div>
  )
}
