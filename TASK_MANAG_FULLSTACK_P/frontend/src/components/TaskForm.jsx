import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FiX } from 'react-icons/fi'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../utils/constants'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../utils/helpers'

const TaskForm = ({ task, isOpen, isSubmitting, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      status: 'Pending',
      priority: 'Medium',
      due_date: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || 'Pending',
        priority: task?.priority || 'Medium',
        due_date: toDatetimeLocalValue(task?.due_date),
      })
    }
  }, [isOpen, reset, task])

  if (!isOpen) return null

  const submitHandler = (values) => {
    onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() || null,
      status: values.status,
      priority: values.priority,
      due_date: fromDatetimeLocalValue(values.due_date),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40"
        onClick={onClose}
        aria-label="Close task form"
      />

      <div className="relative w-full max-w-xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{task ? 'Edit task' : 'Create task'}</h2>
            <p className="text-sm text-slate-500">Keep task details clear and actionable.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-5 px-6 py-5">
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              type="text"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              {...register('title', { required: 'Title is required', minLength: 3 })}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              rows="4"
              className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              {...register('description')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                {...register('status')}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                {...register('priority')}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="due_date">
                Due date
              </label>
              <input
                id="due_date"
                type="datetime-local"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                {...register('due_date')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : task ? 'Update task' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm
