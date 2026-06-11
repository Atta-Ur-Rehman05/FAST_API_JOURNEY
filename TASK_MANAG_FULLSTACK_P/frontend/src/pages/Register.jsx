import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiUserPlus } from 'react-icons/fi'
import { registerUser } from '../services/authService'
import useAuth from '../hooks/useAuth'
import { getErrorMessage } from '../utils/helpers'

const Register = () => {
  const [loading, setLoading] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

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
      await registerUser(values)
      toast.success('Registration successful. Please login.')
      navigate('/login')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to register'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
            <FiUserPlus className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Create account</h1>
          <p className="mt-2 text-sm text-slate-500">Start organizing tasks in one workspace.</p>
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
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
              })}
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Enter a valid email',
                },
              })}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              {...register('confirmPassword', {
                required: 'Confirm your password',
                validate: (value, formValues) => value === formValues.password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link className="font-semibold text-slate-950 hover:underline" to="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Register
