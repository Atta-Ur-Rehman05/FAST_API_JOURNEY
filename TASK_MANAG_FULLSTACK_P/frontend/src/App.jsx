import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AppRoutes from './routes/AppRoutes'

const App = () => {
  return (
    <>
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />
    </>
  )
}

export default App
