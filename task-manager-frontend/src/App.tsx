import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/layout/Header'
import TaskListPage from './pages/TaskListPage'
import TaskDetailPage from './pages/TaskDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-slate-50">
                <Header />
                <main className="max-w-4xl mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<TaskListPage />} />
                    <Route path="/tasks/:id" element={<TaskDetailPage />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
