interface TaskStatusBadgeProps {
  completed: boolean
}

export default function TaskStatusBadge({ completed }: TaskStatusBadgeProps) {
  return completed ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
      Completado
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      Pendiente
    </span>
  )
}
