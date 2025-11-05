import { useEffect, useState } from 'react'
import { Outlet, Navigate, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { LayoutDashboard, CheckSquare, FolderKanban, Calendar, FileText, Tag, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function Layout() {
  const { isAuthenticated, logout, checkAuth } = useAuthStore()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  useEffect(() => {
    checkAuth()
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
    { to: '/tasks', icon: CheckSquare, label: '任务' },
    { to: '/projects', icon: FolderKanban, label: '项目' },
    { to: '/calendar', icon: Calendar, label: '日历' },
    { to: '/tags', icon: Tag, label: '标签' },
    { to: '/reports', icon: BarChart3, label: '统计' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ChewyTodo
              </h1>
              <p className="text-xs text-gray-500 mt-1">智能任务管理系统</p>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50',
                  isSidebarCollapsed && 'justify-center'
                )
              }
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50',
                isSidebarCollapsed && 'justify-center'
              )
            }
            title={isSidebarCollapsed ? '设置' : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>设置</span>}
          </NavLink>
          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200",
              isSidebarCollapsed && 'justify-center'
            )}
            title={isSidebarCollapsed ? '退出登录' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>退出登录</span>}
          </button>
          
          {/* 用户信息 */}
          {!isSidebarCollapsed && (
            <div className="mt-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
                  <p className="text-xs text-gray-500 truncate">admin@example.com</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
