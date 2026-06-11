import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiClock, FiList, FiTrendingUp } from 'react-icons/fi'
import LoadingSpinner from '../components/LoadingSpinner'
import { getTasks } from '../services/taskService'
import { getErrorMessage } from '../utils/helpers'
import { toast } from 'react-toastify'

const statConfig = [
  { label: 'Total Tasks', key: 'total', icon: FiList, className: 'bg-slate-900 text-white' },
  { label: 'Pending Tasks', key: 'Pending', icon: FiClock, className: 'bg-yellow-100 text-yellow-700' },
  { label: 'In Progress Tasks', key: 'In Progress', icon: FiTrendingUp, className: 'bg-blue-100 text-blue-700' },
  { label: 'Completed Tasks', key: 'Completed', icon: FiCheckCircle, className: 'bg-green-100 text-green-700' },
]

const Dashboard = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await getTasks({ page: 1, size: 100 })
        setTasks(data.items || [])
      } catch (error) {
        toast.error(getErrorMessage(error, 'Unable to load dashboard'))
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  const stats = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc.total += 1
        acc[task.status] = (acc[task.status] || 0) + 1
        return acc
      },
      { total: 0, Pending: 0, 'In Progress': 0, Completed: 0 },
    )
  }, [tasks])

  if (loading) {
    return <LoadingSpinner label="Loading dashboard" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">A quick snapshot of your current workload.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statConfig.map((stat) => {
          const Icon = stat.icon

          return (
            <article key={stat.key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-3xl font-bold text-slate-950">{stats[stat.key] || 0}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.className}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">Recent tasks</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {tasks.slice(0, 5).map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">{task.priority} priority</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-500">{task.status}</span>
            </div>
          ))}
          {tasks.length === 0 && <p className="py-6 text-sm text-slate-500">No tasks yet.</p>}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
