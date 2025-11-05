import { useState, useEffect } from 'react'
import { Plus, Calendar, Star, TrendingUp, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import TaskItem from '@/components/task/TaskItem'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { Task } from '@/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale/zh-CN'
import { taskService } from '@/services/task'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // 加载今日任务
  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setIsLoading(true)
      const data = await taskService.getTasks()
      if (Array.isArray(data)) {
        setTasks(data)
      } else {
        setTasks([])
      }
    } catch (error) {
      console.error('加载任务失败:', error)
      toast.error('加载任务失败')
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('请输入任务标题')
      return
    }

    try {
      const newTask = await taskService.createTask({
        title: newTaskTitle,
        status: 'todo',
        priority: 'none',
      })
      setTasks([newTask, ...tasks])
      setNewTaskTitle('')
      setIsModalOpen(false)
      toast.success('任务创建成功')
    } catch (error) {
      console.error('创建任务失败:', error)
      toast.error('创建任务失败')
    }
  }

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed'
      const updated = await taskService.updateTask(task.id, { status: newStatus })
      setTasks(tasks.map(t => t.id === task.id ? updated : t))
      toast.success(newStatus === 'completed' ? '任务已完成' : '任务标记为未完成')
    } catch (error) {
      console.error('更新任务失败:', error)
      toast.error('更新任务失败')
    }
  }

  const handleToggleStar = async (task: Task) => {
    try {
      const updated = await taskService.updateTask(task.id, { is_starred: !task.is_starred })
      setTasks(tasks.map(t => t.id === task.id ? updated : t))
      toast.success(updated.is_starred ? '已加星标' : '已取消星标')
    } catch (error) {
      console.error('更新任务失败:', error)
      toast.error('更新任务失败')
    }
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const starredCount = tasks.filter(t => t.is_starred).length
  const dueSoonCount = tasks.filter(t => 
    t.due_date && new Date(t.due_date) < new Date(Date.now() + 86400000 * 3)
  ).length

  const stats = [
    { label: '今日任务', value: tasks.length.toString(), icon: CheckCircle2, color: 'blue' },
    { label: '已完成', value: completedCount.toString(), icon: TrendingUp, color: 'green' },
    { label: '标星任务', value: starredCount.toString(), icon: Star, color: 'yellow' },
    { label: '即将到期', value: dueSoonCount.toString(), icon: Calendar, color: 'red' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  }

  const todayTasks = tasks.filter(t => t.status !== 'completed')
  const dueSoonTasks = tasks.filter(t => 
    t.due_date && 
    new Date(t.due_date) < new Date(Date.now() + 86400000 * 3) &&
    t.status !== 'completed'
  )

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-8 space-y-6">
        {/* 欢迎区域 */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-200">
          <h1 className="text-3xl font-bold mb-2">
            早上好! 👋
          </h1>
          <p className="text-blue-100">
            {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </p>
          <p className="mt-4 text-lg">
            你今天有 <span className="font-bold">{todayTasks.length}</span> 个任务,已完成 <span className="font-bold">{completedCount}</span> 个,加油!
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${colorMap[stat.color]}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 今日任务 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">今日任务</h2>
            <Button 
              variant="primary" 
              size="sm" 
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-200 transition-all duration-200"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              新建任务
            </Button>
          </div>
          {todayTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>暂无任务,点击上方按钮创建新任务</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onToggleStar={handleToggleStar}
                  onClick={setSelectedTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* 即将到期 */}
        {dueSoonTasks.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              即将到期
            </h2>
            <div className="space-y-2">
              {dueSoonTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onToggleStar={handleToggleStar}
                  onClick={setSelectedTask}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 新建任务弹窗 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setNewTaskTitle('')
        }}
        title="新建任务"
      >
        <div className="space-y-4">
          <Input
            label="任务标题"
            placeholder="输入任务标题..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsModalOpen(false)
                setNewTaskTitle('')
              }}
            >
              取消
            </Button>
            <Button variant="primary" onClick={handleCreateTask}>
              创建
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
