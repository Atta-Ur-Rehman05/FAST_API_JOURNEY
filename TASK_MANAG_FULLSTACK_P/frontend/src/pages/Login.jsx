import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiLogIn } from 'react-icons/fi'
import { getCurrentUser, loginUser } from '../services/authService'
import useAuth from '../hooks/useAuth'
import { getErrorMessage } from '../utils/helpers'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      const tokenData = await loginUser(values)
      localStorage.setItem('access_token', tokenData.access_token)
      const user = await getCurrentUser()
      login({ user, token: tokenData.access_token })
      toast.success('Login successful')
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to login'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
            <FiLogIn className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to manage your tasks.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              {...register('username', { required: 'Username is required' })}
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          No account?{' '}
          <Link className="font-semibold text-slate-950 hover:underline" to="/register">
            Create one
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Login
