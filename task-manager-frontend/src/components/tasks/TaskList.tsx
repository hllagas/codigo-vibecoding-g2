import TaskCard from './TaskCard'
import EmptyState from '../ui/EmptyState'
import type { Task } from '../../types/task'

interface TaskListProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onToggleComplete: (task: Task) => void
  onCreateTask: () => void
}

export default function TaskList({ tasks, onEdit, onDelete, onToggleComplete, onCreateTask }: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyState onCreateTask={onCreateTask} />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </div>
  )
}
