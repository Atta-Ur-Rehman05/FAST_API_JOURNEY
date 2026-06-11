import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import MainLayout from '../layouts/MainLayout'
import Dashboard from '../pages/Dashboard'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Tasks from '../pages/Tasks'

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
