import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { FiChevronLeft, FiChevronRight, FiPlus, FiSearch } from 'react-icons/fi'
import LoadingSpinner from '../components/LoadingSpinner'
import TaskCard from '../components/TaskCard'
import TaskForm from '../components/TaskForm'
import { createTask, deleteTask, getTasks, updateTask } from '../services/taskService'
import { PRIORITY_OPTIONS, STATUS_OPTIONS, TASK_PAGE_SIZE } from '../utils/constants'
import { getErrorMessage } from '../utils/helpers'

const Tasks = () => {
  const [tasks, setTasks] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, size: TASK_PAGE_SIZE, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 400)

    return () => clearTimeout(timeout)
  }, [searchInput])

  const params = useMemo(
    () => ({
      page,
      size: TASK_PAGE_SIZE,
      search: search || undefined,
      status: status || undefined,
      priority: priority || undefined,
      sort_by: 'created_at',
      sort_order: 'desc',
    }),
    [page, priority, search, status],
  )

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTasks(params)
      setTasks(data.items || [])
      setMeta({
        total: data.total || 0,
        page: data.page || page,
        size: data.size || TASK_PAGE_SIZE,
        pages: data.pages || 0,
      })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load tasks'))
    } finally {
      setLoading(false)
    }
  }, [page, params])

  useEffect(() => {
    const fetchTasks = async () => {
      await loadTasks()
    }

    fetchTasks()
  }, [loadTasks])

  const openCreateModal = () => {
    setSelectedTask(null)
    setModalOpen(true)
  }

  const openEditModal = (task) => {
    setSelectedTask(task)
    setModalOpen(true)
  }

  const handleSubmitTask = async (payload) => {
    setIsSubmitting(true)
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, payload)
        toast.success('Task updated successfully')
      } else {
        await createTask(payload)
        toast.success('Task created successfully')
      }

      setModalOpen(false)
      setSelectedTask(null)
      await loadTasks()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save task'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (task) => {
    const confirmed = window.confirm(`Delete "${task.title}"?`)
    if (!confirmed) return

    try {
      await deleteTask(task.id)
      toast.success('Task deleted successfully')
      const nextPage = tasks.length === 1 && page > 1 ? page - 1 : page
      setPage(nextPage)
      if (nextPage === page) {
        await loadTasks()
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete task'))
    }
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setPriority('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">Create, search, filter, and update your work.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <FiPlus className="h-4 w-4" />
          New task
        </button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search title or description"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
          >
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </section>

      {loading ? (
        <LoadingSpinner label="Loading tasks" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={openEditModal} onDelete={handleDelete} />
            ))}
          </div>

          {tasks.length === 0 && (
            <section className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h2 className="text-base font-bold text-slate-950">No tasks found</h2>
              <p className="mt-2 text-sm text-slate-500">Try adjusting filters or create a new task.</p>
            </section>
          )}

          <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing page <span className="font-semibold text-slate-900">{meta.page}</span> of{' '}
              <span className="font-semibold text-slate-900">{Math.max(meta.pages, 1)}</span> for{' '}
              <span className="font-semibold text-slate-900">{meta.total}</span> tasks
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Previous page"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, Math.max(meta.pages, 1)))}
                disabled={page >= Math.max(meta.pages, 1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Next page"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </>
      )}

      <TaskForm
        task={selectedTask}
        isOpen={modalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitTask}
      />
    </div>
  )
}

export default Tasks
