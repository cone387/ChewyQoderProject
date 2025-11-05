import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Search, ChevronDown, ChevronUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SortableTaskItem from '@/components/task/SortableTaskItem'
import TaskDetail from '@/components/task/TaskDetail'
import { Task, Project, Tag, SystemListType } from '@/types'
import { taskService } from '@/services/task'
import { projectService } from '@/services/project'
import { tagService } from '@/services/tag'
import toast from 'react-hot-toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

export default function TasksPage() {
  const location = useLocation()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentView, setCurrentView] = useState<'inbox' | 'completed' | 'trash' | number>('inbox')
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  
  // 分组展开状态，从 localStorage 读取
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('expandedGroups')
    return saved ? JSON.parse(saved) : { starred: true, untagged: true, completed: false }
  })

  // 拖动传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadProjects()
    loadTags()
  }, [])

  useEffect(() => {
    // 从 location.state 获取视图参数
    if (location.state?.view) {
      setCurrentView(location.state.view)
    }
  }, [location])

  useEffect(() => {
    if (currentView) {
      loadTasksForView()
      if (typeof currentView === 'number') {
        loadProjectInfo(currentView)
      } else {
        setCurrentProject(null)
      }
    }
  }, [currentView])

  useEffect(() => {
    // 保存分组展开状态到 localStorage
    localStorage.setItem('expandedGroups', JSON.stringify(expandedGroups))
  }, [expandedGroups])

  const loadTasksForView = async () => {
    try {
      setIsLoading(true)
      let data: Task[] = []

      if (typeof currentView === 'number') {
        // 加载指定项目的任务
        data = await taskService.getTasks({ project: currentView })
      } else if (['inbox', 'completed', 'trash'].includes(currentView)) {
        // 加载系统清单
        const response = await taskService.getSystemList(currentView as SystemListType)
        data = response.results
      }

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

  const loadProjectInfo = async (projectId: number) => {
    try {
      const project = await projectService.getProject(projectId)
      setCurrentProject(project)
    } catch (error) {
      console.error('加载项目信息失败:', error)
    }
  }

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects()
      if (Array.isArray(data)) {
        setProjects(data)
      }
    } catch (error) {
      console.error('加载项目失败:', error)
    }
  }

  const loadTags = async () => {
    try {
      const data = await tagService.getTags()
      if (Array.isArray(data)) {
        setTags(data)
      }
    } catch (error) {
      console.error('加载标签失败:', error)
    }
  }

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      const newTask = await taskService.createTask({
        ...taskData,
        project: typeof currentView === 'number' ? currentView : undefined,
      })
      setTasks([newTask, ...tasks])
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
      
      if (newStatus === 'completed' && currentView !== 'completed') {
        // 如果不在已完成视图，从列表中移除
        setTasks(tasks.filter(t => t.id !== task.id))
      } else {
        setTasks(tasks.map(t => t.id === task.id ? updated : t))
      }
      
      toast.success(newStatus === 'completed' ? '任务已完成' : '任务标记为未完成')
    } catch (error) {
      toast.error('更新任务失败')
    }
  }

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed'
      const updated = await taskService.updateTask(task.id, { status: newStatus })
      setTasks(tasks.map(t => t.id === task.id ? updated : t))
      toast.success(newStatus === 'completed' ? '任务已完成' : '任务标记为未完成')
    } catch (error) {
      toast.error('更新任务失败')
    }
  }

  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      const updated = await taskService.updateTask(taskId, updates)
      setTasks(tasks.map(t => t.id === taskId ? updated : t))
      toast.success('任务更新成功')
      
      // 如果状态变为已完成，且当前不在“已完成”视图，则从列表中移除
      if (updates.status === 'completed' && currentView !== 'completed') {
        setTasks(tasks.filter(t => t.id !== taskId))
      }
    } catch (error) {
      toast.error('更新任务失败')
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      await taskService.deleteTask(taskId)
      setTasks(tasks.filter(t => t.id !== taskId))
      setSelectedTask(null)
      toast.success('任务已移入垃圾筒')
    } catch (error) {
      toast.error('删除任务失败')
    }
  }

  const toggleGroupExpanded = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }))
  }

  // 搜索筛选
  const searchedTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 任务分组
  const groupedTasks = {
    starred: searchedTasks.filter(t => t.is_starred && t.status !== 'completed'),
    untagged: searchedTasks.filter(t => 
      (!t.tags || t.tags.length === 0) && 
      !t.is_starred && 
      t.status !== 'completed'
    ),
    completed: searchedTasks.filter(t => t.status === 'completed')
  }

  // 拖动结束处理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const allTasks = searchedTasks
      const oldIndex = allTasks.findIndex(task => task.id === active.id)
      const newIndex = allTasks.findIndex(task => task.id === over.id)

      const newTasks = arrayMove(allTasks, oldIndex, newIndex)
      
      // 更新本地状态
      setTasks(newTasks)

      // 更新后端 order 字段
      try {
        await Promise.all(
          newTasks.map((task, index) =>
            taskService.updateTask(task.id, { order: index })
          )
        )
        toast.success('排序已保存')
      } catch (error) {
        console.error('保存排序失败:', error)
        toast.error('保存排序失败')
        // 恢复原来的顺序
        loadTasksForView()
      }
    }
  }

  const getViewTitle = () => {
    if (currentView === 'inbox') return '收集箱'
    if (currentView === 'completed') return '已完成'
    if (currentView === 'trash') return '垃圾筒'
    return currentProject?.name || '任务列表'
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-8">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{getViewTitle()}</h1>
              {currentProject && (
                <p className="text-sm text-gray-500 mt-1">
                  {currentProject.uncompleted_count} 个未完成任务 · {currentProject.completed_count} 个已完成
                </p>
              )}
            </div>
            <Button 
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建任务
            </Button>
          </div>

          {/* 搜索 */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 任务分组列表 */}
        <div className="space-y-6">
          {/* 已置顶分组 */}
          {groupedTasks.starred.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleGroupExpanded('starred')}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">⭐ 已置顶</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
                    {groupedTasks.starred.length}
                  </span>
                </div>
                {expandedGroups.starred ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>
              
              {expandedGroups.starred && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={groupedTasks.starred.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="p-4 space-y-2">
                      {groupedTasks.starred.map((task) => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onClick={setSelectedTask}
                          onEdit={(task: Task) => setSelectedTask(task)}
                          onDelete={() => handleDeleteTask(task.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {/* 未分类分组 */}
          {groupedTasks.untagged.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleGroupExpanded('untagged')}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">📄 未分类</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
                    {groupedTasks.untagged.length}
                  </span>
                </div>
                {expandedGroups.untagged ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>
              
              {expandedGroups.untagged && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={groupedTasks.untagged.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="p-4 space-y-2">
                      {groupedTasks.untagged.map((task) => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onClick={setSelectedTask}
                          onEdit={(task: Task) => setSelectedTask(task)}
                          onDelete={() => handleDeleteTask(task.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {/* 已完成分组 */}
          {groupedTasks.completed.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleGroupExpanded('completed')}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">✅ 已完成</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
                    {groupedTasks.completed.length}
                  </span>
                </div>
                {expandedGroups.completed ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>
              
              {expandedGroups.completed && (
                <div className="p-4 space-y-2">
                  {groupedTasks.completed.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onClick={setSelectedTask}
                      onEdit={(task: Task) => setSelectedTask(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 空状态 */}
          {searchedTasks.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
              <p className="text-lg">暂无任务</p>
              <p className="text-sm mt-2">点击上方按钮创建新任务</p>
            </div>
          )}
        </div>
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

      {/* 新建任务弹窗 - 使用统一的TaskDetail组件 */}
      <TaskDetail
        task={null}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
        onUpdate={() => {}}
        onDelete={() => {}}
        onCreate={handleCreateTask}
      />
    </div>
  )
}
