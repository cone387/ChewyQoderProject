import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import TaskDetail from '@/components/task/TaskDetail'
import { taskService } from '@/services/task'
import { Task } from '@/types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const CalendarPage = () => {
  const calendarRef = useRef<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const [newTaskDate, setNewTaskDate] = useState<Date | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setIsLoading(true)
      const data = await taskService.getTasks()
      setTasks(data)
    } catch (error) {
      console.error('加载任务失败:', error)
      toast.error('加载任务失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 转换任务为日历事件
  const events = tasks
    .filter(task => task.due_date)
    .map(task => {
      const priorityColors: Record<string, string> = {
        urgent: '#EF4444',
        high: '#F97316',
        medium: '#F59E0B',
        low: '#3B82F6',
        none: '#94A3B8',
      }

      const statusColors: Record<string, string> = {
        completed: '#10B981',
        in_progress: '#6366F1',
        todo: '#3B82F6',
      }

      return {
        id: task.id.toString(),
        title: task.title,
        start: task.due_date,
        backgroundColor: task.status === 'completed' 
          ? statusColors.completed 
          : priorityColors[task.priority || 'none'],
        borderColor: task.status === 'completed' 
          ? statusColors.completed 
          : priorityColors[task.priority || 'none'],
        extendedProps: {
          task,
        },
      }
    })

  const handleDateClick = (arg: any) => {
    setNewTaskDate(arg.date)
    setIsNewTaskModalOpen(true)
  }

  const handleEventClick = (arg: any) => {
    const task = arg.event.extendedProps.task
    setSelectedTask(task)
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDate) {
      toast.error('请输入任务标题')
      return
    }

    try {
      await taskService.createTask({
        title: newTaskTitle,
        due_date: format(newTaskDate, "yyyy-MM-dd'T'HH:mm:ss"),
        status: 'todo',
        priority: 'none',
      })
      toast.success('任务创建成功')
      setIsNewTaskModalOpen(false)
      setNewTaskTitle('')
      setNewTaskDate(null)
      loadTasks()
    } catch (error) {
      console.error('创建任务失败:', error)
      toast.error('创建任务失败')
    }
  }

  const handleUpdateTask = async (id: number, updates: Partial<Task>) => {
    try {
      await taskService.updateTask(id, updates)
      toast.success('任务更新成功')
      setSelectedTask(null)
      loadTasks()
    } catch (error) {
      console.error('更新任务失败:', error)
      toast.error('更新任务失败')
    }
  }

  const handleDeleteTask = async (id: number) => {
    try {
      await taskService.deleteTask(id)
      toast.success('任务已删除')
      setSelectedTask(null)
      loadTasks()
    } catch (error) {
      console.error('删除任务失败:', error)
      toast.error('删除任务失败')
    }
  }

  const handlePrevMonth = () => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.prev()
      setCurrentDate(calendarApi.getDate())
    }
  }

  const handleNextMonth = () => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.next()
      setCurrentDate(calendarApi.getDate())
    }
  }

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.today()
      setCurrentDate(new Date())
    }
  }

  const getCurrentDate = () => {
    return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">日历</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded" onClick={handlePrevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {getCurrentDate()}
            </span>
            <button className="p-2 hover:bg-gray-100 rounded" onClick={handleNextMonth}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={handleToday}>
            今天
          </Button>
        </div>
        <Button variant="primary" className="flex items-center gap-2" onClick={() => setIsNewTaskModalOpen(true)}>
          <Plus className="w-4 h-4" />
          新建任务
        </Button>
      </div>

      {/* 日历主体 */}
      <div className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            locale="zh-cn"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={(dateInfo) => setCurrentDate(dateInfo.start)}
            height="100%"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
          />
        )}
      </div>

      {/* 任务详情弹窗 */}
      <TaskDetail
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={(updates) => {
          if (selectedTask) {
            handleUpdateTask(selectedTask.id, updates)
          }
        }}
        onDelete={() => {
          if (selectedTask) {
            handleDeleteTask(selectedTask.id)
          }
        }}
      />

      {/* 新建任务弹窗 */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => {
          setIsNewTaskModalOpen(false)
          setNewTaskTitle('')
          setNewTaskDate(null)
        }}
        title="新建任务"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任务标题
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入任务标题..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
              autoFocus
            />
          </div>
          {newTaskDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                截止日期
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={format(newTaskDate, 'yyyy-MM-dd')}
                onChange={(e) => setNewTaskDate(new Date(e.target.value))}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsNewTaskModalOpen(false)
                setNewTaskTitle('')
                setNewTaskDate(null)
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

export default CalendarPage
