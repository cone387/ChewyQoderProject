import { useState, useEffect } from 'react'
import { Plus, Search, Filter, FolderKanban, Tag as TagIcon, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import TaskItem from '@/components/task/TaskItem'
import TaskDetail from '@/components/task/TaskDetail'
import { Task, Project, Tag } from '@/types'
import { taskService } from '@/services/task'
import { projectService } from '@/services/project'
import { tagService } from '@/services/tag'
import toast from 'react-hot-toast'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all')
  const [filterProject, setFilterProject] = useState<number | null>(null)
  const [filterTags, setFilterTags] = useState<number[]>([])
  const [showTagDropdown, setShowTagDropdown] = useState(false)

  useEffect(() => {
    loadTasks()
    loadProjects()
    loadTags()
  }, [])

  const loadTasks = async () => {
    try {
      setIsLoading(true)
      const data = await taskService.getTasks()
      // 确保 data 是数组
      if (Array.isArray(data)) {
        setTasks(data)
      } else {
        setTasks([])
      }
    } catch (error) {
      console.error('加载任务失败:', error)
      toast.error('加载任务失败')
      setTasks([]) // 出错时设置为空数组
    } finally {
      setIsLoading(false)
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
      toast.error('更新任务失败')
    }
  }

  const handleToggleStar = async (task: Task) => {
    try {
      const updated = await taskService.updateTask(task.id, { is_starred: !task.is_starred })
      setTasks(tasks.map(t => t.id === task.id ? updated : t))
      toast.success(updated.is_starred ? '已加星标' : '已取消星标')
    } catch (error) {
      toast.error('更新任务失败')
    }
  }

  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      const updated = await taskService.updateTask(taskId, updates)
      setTasks(tasks.map(t => t.id === taskId ? updated : t))
      toast.success('任务更新成功')
    } catch (error) {
      toast.error('更新任务失败')
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('确定要删除这个任务吗?')) return

    try {
      await taskService.deleteTask(taskId)
      setTasks(tasks.filter(t => t.id !== taskId))
      setSelectedTask(null)
      toast.success('任务已删除')
    } catch (error) {
      toast.error('删除任务失败')
    }
  }

  const toggleTagFilter = (tagId: number) => {
    if (filterTags.includes(tagId)) {
      setFilterTags(filterTags.filter(id => id !== tagId))
    } else {
      setFilterTags([...filterTags, tagId])
    }
  }

  const clearTagFilters = () => {
    setFilterTags([])
    setShowTagDropdown(false)
  }

  // 筛选和搜索
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesProject = !filterProject || (
      task.project && typeof task.project === 'object' ? task.project.id === filterProject : task.project === filterProject
    )
    const matchesTags = filterTags.length === 0 || (
      task.tags && Array.isArray(task.tags) && filterTags.some(tagId => 
        task.tags?.some(t => typeof t === 'object' ? t.id === tagId : t === tagId)
      )
    )
    return matchesSearch && matchesStatus && matchesProject && matchesTags
  })

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
    <div className="h-full flex bg-gray-50">
      {/* 主区域 */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* 头部 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">任务列表</h1>
              <Button 
                variant="primary"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新建任务
              </Button>
            </div>

            {/* 搜索和筛选 */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索任务..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* 项目筛选 */}
              <select
                value={filterProject || ''}
                onChange={(e) => setFilterProject(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">📁 所有项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              {/* 标签筛选 */}
              <div className="relative">
                <button
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                >
                  <TagIcon className="w-4 h-4" />
                  {filterTags.length > 0 ? `已选 ${filterTags.length} 个标签` : '🏷️ 所有标签'}
                </button>

                {/* 标签下拉框 */}
                {showTagDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-80 overflow-y-auto">
                    <div className="p-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">选择标签</span>
                      {filterTags.length > 0 && (
                        <button
                          onClick={clearTagFilters}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          清空
                        </button>
                      )}
                    </div>
                    <div className="p-2 space-y-1">
                      {tags.length === 0 ? (
                        <div className="p-3 text-center text-sm text-gray-500">
                          暂无标签
                        </div>
                      ) : (
                        tags.map((tag) => (
                          <label
                            key={tag.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={filterTags.includes(tag.id)}
                              onChange={() => toggleTagFilter(tag.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{tag.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {(['all', 'todo', 'in_progress', 'completed'] as const).map((status) => {
                  const counts = {
                    all: tasks.length,
                    todo: tasks.filter(t => t.status === 'todo').length,
                    in_progress: tasks.filter(t => t.status === 'in_progress').length,
                    completed: tasks.filter(t => t.status === 'completed').length,
                  }
                  
                  return (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        filterStatus === status
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {status === 'all' ? '全部' : status === 'todo' ? '待办' : status === 'in_progress' ? '进行中' : '已完成'}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        filterStatus === status
                          ? 'bg-white/20'
                          : 'bg-gray-100'
                      }`}>
                        {counts[status]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 已选标签展示 */}
            {filterTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <span className="text-sm text-gray-600">已选标签:</span>
                {filterTags.map(tagId => {
                  const tag = tags.find(t => t.id === tagId)
                  if (!tag) return null
                  return (
                    <span
                      key={tagId}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {tag.name}
                      <button
                        onClick={() => toggleTagFilter(tagId)}
                        className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
                <button
                  onClick={clearTagFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  清空所有
                </button>
              </div>
            )}
          </div>

          {/* 任务列表 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-lg">暂无任务</p>
                <p className="text-sm mt-2">点击上方按钮创建新任务</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onToggleStar={handleToggleStar}
                    onClick={setSelectedTask}
                    onEdit={(task) => setSelectedTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
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
