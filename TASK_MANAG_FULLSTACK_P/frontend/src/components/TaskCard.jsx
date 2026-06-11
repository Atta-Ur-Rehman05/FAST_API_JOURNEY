import dayjs from 'dayjs'
import { FiCalendar, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { PRIORITY_BADGE_CLASSES, STATUS_BADGE_CLASSES } from '../utils/constants'
import { formatDate } from '../utils/helpers'

const badgeClass = (classes) =>
  `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`

const TaskCard = ({ task, onEdit, onDelete }) => {
  const isOverdue =
    task.due_date && task.status !== 'Completed' && dayjs(task.due_date).isBefore(dayjs(), 'day')

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-slate-950">{task.title}</h3>
          <p className="mt-2 line-clamp-3 min-h-12 text-sm leading-6 text-slate-600">
            {task.description || 'No description added.'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Edit task"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Delete task"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className={badgeClass(STATUS_BADGE_CLASSES[task.status] || STATUS_BADGE_CLASSES.Pending)}>
          {task.status}
        </span>
        <span className={badgeClass(PRIORITY_BADGE_CLASSES[task.priority] || PRIORITY_BADGE_CLASSES.Medium)}>
          {task.priority}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className={`inline-flex items-center gap-1.5 ${isOverdue ? 'font-semibold text-red-600' : ''}`}>
          <FiCalendar className="h-4 w-4" />
          {formatDate(task.due_date)}
        </span>
        <span>Updated {formatDate(task.updated_at, 'Today')}</span>
      </div>
    </article>
  )
}

export default TaskCard
