import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export default function Layout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-blue-600">Todo App</h1>
          </div>
          <nav className="px-2 space-y-1">
            <a
              href="/dashboard"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              仪表盘
            </a>
            <a
              href="/tasks"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              任务
            </a>
            <a
              href="/projects"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              项目
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
