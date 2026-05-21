import { useEffect, useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import TaskList from '../components/tasks/TaskList'
import CreateTaskDialog from '../components/ui/CreateTaskDialog'
import EditTaskDialog from '../components/ui/EditTaskDialog'
import DeleteConfirmDialog from '../components/ui/DeleteConfirmDialog'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import type { Task } from '../types/task'

type DialogState =
  | { type: 'create'; task: null }
  | { type: 'edit'; task: Task }
  | { type: 'delete'; task: Task }
  | { type: null; task: null }

export default function TaskListPage() {
  const { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask, toggleComplete } =
    useTasks()
  const [dialogState, setDialogState] = useState<DialogState>({ type: null, task: null })

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  function openCreate() {
    setDialogState({ type: 'create', task: null })
  }
  function openEdit(task: Task) {
    setDialogState({ type: 'edit', task })
  }
  function openDelete(task: Task) {
    setDialogState({ type: 'delete', task })
  }
  function handleClose() {
    setDialogState({ type: null, task: null })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
          {!loading && (
            <p className="text-sm text-slate-500 mt-0.5">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          )}
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">Error loading tasks: {error}</p>
          <button onClick={fetchTasks} className="text-red-600 text-sm underline mt-1">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <TaskList
          tasks={tasks}
          onEdit={openEdit}
          onDelete={openDelete}
          onToggleComplete={toggleComplete}
          onCreateTask={openCreate}
        />
      )}

      <CreateTaskDialog
        isOpen={dialogState.type === 'create'}
        onClose={handleClose}
        onCreate={createTask}
      />
      <EditTaskDialog
        isOpen={dialogState.type === 'edit'}
        onClose={handleClose}
        task={dialogState.type === 'edit' ? dialogState.task : null}
        onUpdate={updateTask}
      />
      <DeleteConfirmDialog
        isOpen={dialogState.type === 'delete'}
        onClose={handleClose}
        task={dialogState.type === 'delete' ? dialogState.task : null}
        onConfirm={deleteTask}
      />
    </>
  )
}
