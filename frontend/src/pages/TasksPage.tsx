import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  Plus, Search, ChevronDown, ChevronUp, List, Columns3, GanttChart,
  Filter, ArrowUpDown, Group, Settings as SettingsIcon, X, Check
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SortableTaskItem from '@/components/task/SortableTaskItem'
import KanbanCard from '@/components/task/KanbanCard'
import DroppableColumn from '@/components/task/DroppableColumn'
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
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  pointerWithin,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { cn } from '@/utils/cn'

type ViewType = 'list' | 'kanban' | 'gantt'
type GroupByType = 'status' | 'priority' | 'project' | 'tag' | 'date' | 'none'
type SortByType = 'due_date' | 'priority' | 'created_at' | 'updated_at' | 'manual'
type TaskScopeType = 'all' | 'my' | 'uncompleted' | 'completed'

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
  
  // 新增UI状态
  const [viewType, setViewType] = useState<ViewType>(() => {
    return (localStorage.getItem('task_view_type') as ViewType) || 'list'
  })
  const [groupBy, setGroupBy] = useState<GroupByType>(() => {
    return (localStorage.getItem('task_group_by') as GroupByType) || 'status'
  })
  const [sortBy, setSortBy] = useState<SortByType>('manual')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [taskScope, setTaskScope] = useState<TaskScopeType>('all')
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([])
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null)
  
  // 筛选状态
  const [filterProjects, setFilterProjects] = useState<number[]>([])
  const [filterTags, setFilterTags] = useState<number[]>([])
  const [filterPriorities, setFilterPriorities] = useState<Task['priority'][]>([])
  const [filterStatuses, setFilterStatuses] = useState<Task['status'][]>([])
  
  // UI控制状态
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false)
  const [isScopeDropdownOpen, setIsScopeDropdownOpen] = useState(false)
  const [isFieldConfigOpen, setIsFieldConfigOpen] = useState(false)
  
  // 字段配置
  const [visibleFields, setVisibleFields] = useState<string[]>(() => {
    const saved = localStorage.getItem('task_visible_fields')
    return saved ? JSON.parse(saved) : ['title', 'status', 'priority', 'project', 'tags', 'due_date']
  })
  
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
    // 保存视图偏好
    localStorage.setItem('task_view_type', viewType)
  }, [viewType])

  useEffect(() => {
    // 保存分组方式
    localStorage.setItem('task_group_by', groupBy)
  }, [groupBy])

  useEffect(() => {
    // 保存字段配置
    localStorage.setItem('task_visible_fields', JSON.stringify(visibleFields))
  }, [visibleFields])

  useEffect(() => {
    // 从 location.state 获取视图参数
    const state = location.state as { view?: 'inbox' | 'completed' | 'trash' | number } | null
    if (state?.view !== undefined) {
      setCurrentView(state.view)
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

      setTasks(Array.isArray(data) ? data : [])
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

  // 应用筛选条件
  const filteredTasks = useMemo(() => {
    let result = searchedTasks

    // 任务范围筛选
    if (taskScope === 'uncompleted') {
      result = result.filter(t => t.status !== 'completed')
    } else if (taskScope === 'completed') {
      result = result.filter(t => t.status === 'completed')
    }

    // 项目筛选
    if (filterProjects.length > 0) {
      result = result.filter(t => {
        const projectId = typeof t.project === 'number' ? t.project : t.project?.id
        return projectId && filterProjects.includes(projectId)
      })
    }

    // 标签筛选
    if (filterTags.length > 0) {
      result = result.filter(t => {
        if (!t.tags || !Array.isArray(t.tags)) return false
        const taskTagIds = t.tags.map(tag => typeof tag === 'number' ? tag : tag.id)
        return filterTags.some(tagId => taskTagIds.includes(tagId))
      })
    }

    // 优先级筛选
    if (filterPriorities.length > 0) {
      result = result.filter(t => filterPriorities.includes(t.priority))
    }

    // 状态筛选
    if (filterStatuses.length > 0) {
      result = result.filter(t => filterStatuses.includes(t.status))
    }

    return result
  }, [searchedTasks, taskScope, filterProjects, filterTags, filterPriorities, filterStatuses])

  // 排序
  const sortedTasks = useMemo(() => {
    const result = [...filteredTasks]

    if (sortBy === 'manual') {
      return result.sort((a, b) => a.order - b.order)
    }

    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'due_date':
          const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity
          const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity
          comparison = dateA - dateB
          break
        case 'priority': {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        }
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [filteredTasks, sortBy, sortOrder])

  // 任务分组
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { '所有任务': sortedTasks }
    }

    const groups: Record<string, Task[]> = {}

    if (groupBy === 'status') {
      groups['待办'] = sortedTasks.filter(t => t.status === 'todo')
      groups['进行中'] = sortedTasks.filter(t => t.status === 'in_progress')
      groups['已完成'] = sortedTasks.filter(t => t.status === 'completed')
    } else if (groupBy === 'priority') {
      groups['紧急'] = sortedTasks.filter(t => t.priority === 'urgent')
      groups['高'] = sortedTasks.filter(t => t.priority === 'high')
      groups['中'] = sortedTasks.filter(t => t.priority === 'medium')
      groups['低'] = sortedTasks.filter(t => t.priority === 'low')
      groups['无优先级'] = sortedTasks.filter(t => t.priority === 'none')
    } else if (groupBy === 'project') {
      // 按项目分组
      const projectMap = new Map<string, Task[]>()
      sortedTasks.forEach(task => {
        const projectName = typeof task.project === 'object' && task.project ? task.project.name : '无项目'
        if (!projectMap.has(projectName)) {
          projectMap.set(projectName, [])
        }
        projectMap.get(projectName)!.push(task)
      })
      projectMap.forEach((tasks, name) => {
        groups[name] = tasks
      })
    } else if (groupBy === 'tag') {
      // 按标签分组
      const tagged: Task[] = []
      const untagged: Task[] = []
      sortedTasks.forEach(task => {
        if (task.tags && Array.isArray(task.tags) && task.tags.length > 0) {
          tagged.push(task)
        } else {
          untagged.push(task)
        }
      })
      if (tagged.length > 0) groups['已标记'] = tagged
      if (untagged.length > 0) groups['未标记'] = untagged
    } else if (groupBy === 'date') {
      // 按截止日期分组
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + 7)

      groups['逾期'] = sortedTasks.filter(t => t.due_date && new Date(t.due_date) < today)
      groups['今天'] = sortedTasks.filter(t => {
        if (!t.due_date) return false
        const due = new Date(t.due_date)
        return due >= today && due < tomorrow
      })
      groups['本周'] = sortedTasks.filter(t => {
        if (!t.due_date) return false
        const due = new Date(t.due_date)
        return due >= tomorrow && due < weekEnd
      })
      groups['未来'] = sortedTasks.filter(t => t.due_date && new Date(t.due_date) >= weekEnd)
      groups['无截止日期'] = sortedTasks.filter(t => !t.due_date)
    }

    // 移除空分组
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key]
      }
    })

    return groups
  }, [sortedTasks, groupBy])

  // 筛选条件数量
  const filterCount = filterProjects.length + filterTags.length + filterPriorities.length + filterStatuses.length

  // 拖动开始处理
  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as number)
  }

  // 拖动结束处理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTaskId(null)

    if (!over) return

    // 看板视图的跨列拖拽
    if (viewType === 'kanban') {
      const activeTask = tasks.find(t => t.id === active.id)
      if (!activeTask) return

      // 获取目标列的状态
      let targetStatus = over.id as string
      
      // 如果拖放到了任务卡片上，需要找到该任务所在的列
      if (typeof over.id === 'number') {
        const overTask = tasks.find(t => t.id === over.id)
        if (overTask) {
          targetStatus = overTask.status
        }
      }

      // 检查是否需要更新状态
      if (['todo', 'in_progress', 'completed'].includes(targetStatus) && targetStatus !== activeTask.status) {
        try {
          const updated = await taskService.updateTask(activeTask.id, { status: targetStatus as Task['status'] })
          setTasks(tasks.map(t => t.id === activeTask.id ? updated : t))
          const statusLabel = targetStatus === 'todo' ? '待办' : targetStatus === 'in_progress' ? '进行中' : '已完成'
          toast.success(`任务已移动到“${statusLabel}”`)
        } catch (error) {
          console.error('更新任务状态失败:', error)
          toast.error('更新失败')
        }
      }
      return
    }

    // 列表视图的拖拽排序
    if (active.id !== over.id) {
      const allTasks = sortedTasks
      const oldIndex = allTasks.findIndex(task => task.id === active.id)
      const newIndex = allTasks.findIndex(task => task.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return

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
          </div>

          {/* 工具栏 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 视图切换 */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewType('list')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    viewType === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <List className="w-4 h-4" />
                  列表
                </button>
                <button
                  onClick={() => setViewType('kanban')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    viewType === 'kanban'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Columns3 className="w-4 h-4" />
                  看板
                </button>
                <button
                  onClick={() => setViewType('gantt')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    viewType === 'gantt'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <GanttChart className="w-4 h-4" />
                  甘特图
                </button>
              </div>

              <div className="h-6 w-px bg-gray-300" />

              {/* 新建任务 */}
              <Button 
                variant="primary"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新建任务
              </Button>

              <div className="h-6 w-px bg-gray-300" />

              {/* 任务范围 */}
              <div className="relative">
                <button
                  onClick={() => setIsScopeDropdownOpen(!isScopeDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {taskScope === 'all' && '全部任务'}
                  {taskScope === 'my' && '我的任务'}
                  {taskScope === 'uncompleted' && '未完成'}
                  {taskScope === 'completed' && '已完成'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {isScopeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="p-1">
                      {[
                        { value: 'all', label: '全部任务' },
                        { value: 'my', label: '我的任务' },
                        { value: 'uncompleted', label: '未完成' },
                        { value: 'completed', label: '已完成' },
                      ].map(scope => (
                        <button
                          key={scope.value}
                          onClick={() => {
                            setTaskScope(scope.value as TaskScopeType)
                            setIsScopeDropdownOpen(false)
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                            taskScope === scope.value
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          {scope.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 筛选 */}
              <button
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  filterCount > 0
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                )}
              >
                <Filter className="w-4 h-4" />
                筛选
                {filterCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                    {filterCount}
                  </span>
                )}
              </button>

              {/* 排序 */}
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  排序
                  <ChevronDown className="w-4 h-4" />
                </button>
                {isSortDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="p-1">
                      {[
                        { value: 'manual', label: '拖拽自定义' },
                        { value: 'due_date', label: '截止日期' },
                        { value: 'priority', label: '优先级' },
                        { value: 'created_at', label: '创建时间' },
                        { value: 'updated_at', label: '更新时间' },
                      ].map(sort => (
                        <button
                          key={sort.value}
                          onClick={() => {
                            setSortBy(sort.value as SortByType)
                            setIsSortDropdownOpen(false)
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                            sortBy === sort.value
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          {sort.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 分组 */}
              <div className="relative">
                <button
                  onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Group className="w-4 h-4" />
                  分组
                  <ChevronDown className="w-4 h-4" />
                </button>
                {isGroupDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="p-1">
                      {[
                        { value: 'status', label: '按状态分组' },
                        { value: 'priority', label: '按优先级分组' },
                        { value: 'project', label: '按项目分组' },
                        { value: 'tag', label: '按标签分组' },
                        { value: 'date', label: '按截止日期分组' },
                        { value: 'none', label: '不分组' },
                      ].map(group => (
                        <button
                          key={group.value}
                          onClick={() => {
                            setGroupBy(group.value as GroupByType)
                            setIsGroupDropdownOpen(false)
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                            groupBy === group.value
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          {group.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 字段配置 */}
              <button
                onClick={() => setIsFieldConfigOpen(!isFieldConfigOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
                字段配置
              </button>
            </div>
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

        {/* 任务分组列表 - 列表视图 */}
        {viewType === 'list' && (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <div key={groupName} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleGroupExpanded(groupName)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">{groupName}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
                      {groupTasks.length}
                    </span>
                  </div>
                  {expandedGroups[groupName] !== false ? 
                    <ChevronUp className="w-5 h-5 text-gray-500" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  }
                </button>
                
                {expandedGroups[groupName] !== false && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={groupTasks.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="p-4 space-y-2">
                        {groupTasks.map((task) => (
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
            ))}

            {/* 空状态 */}
            {Object.keys(groupedTasks).length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                <p className="text-lg">暂无任务</p>
                <p className="text-sm mt-2">点击上方按钮创建新任务</p>
              </div>
            )}
          </div>
        )}

        {/* 看板视图 */}
        {viewType === 'kanban' && (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[
                { status: 'todo' as const, label: '待办', color: 'bg-gray-50 border-gray-200' },
                { status: 'in_progress' as const, label: '进行中', color: 'bg-blue-50 border-blue-200' },
                { status: 'completed' as const, label: '已完成', color: 'bg-green-50 border-green-200' },
              ].map(column => {
                const columnTasks = sortedTasks.filter(t => t.status === column.status)
                return (
                  <div key={column.status} className="flex-shrink-0 w-80">
                    <DroppableColumn id={column.status}>
                      <div className={cn('rounded-xl border-2 p-4 min-h-[500px]', column.color)}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{column.label}</h3>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-white text-gray-600 border border-gray-300">
                              {columnTasks.length}
                            </span>
                          </div>
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-1 hover:bg-white rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        <SortableContext
                          items={columnTasks.map(t => t.id)}
                          strategy={verticalListSortingStrategy}
                          id={column.status}
                        >
                          <div className="space-y-3">
                            {columnTasks.map(task => (
                              <KanbanCard
                                key={task.id}
                                task={task}
                                onClick={setSelectedTask}
                              />
                            ))}
                          </div>
                        </SortableContext>

                        {columnTasks.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            暂无任务
                          </div>
                        )}
                      </div>
                    </DroppableColumn>
                  </div>
                )
              })}
            </div>
            <DragOverlay>
              {activeTaskId ? (
                <div className="bg-white rounded-lg border-2 border-blue-500 p-4 shadow-lg opacity-80">
                  <div className="font-medium text-gray-900">
                    {tasks.find(t => t.id === activeTaskId)?.title}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* 甘特图视图 */}
        {viewType === 'gantt' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center py-16">
              <GanttChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">甘特图视图</h3>
              <p className="text-sm text-gray-500 mb-4">甘特图功能正在开发中，敬请期待</p>
              <p className="text-xs text-gray-400">您可以切换到列表视图或看板视图继续管理任务</p>
            </div>
          </div>
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

      {/* 筛选面板 */}
      {isFilterPanelOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">筛选条件</h3>
              <button
                onClick={() => setIsFilterPanelOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 项目筛选 */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">项目</h4>
              <div className="space-y-2">
                {projects.map(project => (
                  <label key={project.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterProjects.includes(project.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterProjects([...filterProjects, project.id])
                        } else {
                          setFilterProjects(filterProjects.filter(id => id !== project.id))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-sm text-gray-700">{project.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 标签筛选 */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">标签</h4>
              <div className="space-y-2">
                {tags.map(tag => (
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterTags.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterTags([...filterTags, tag.id])
                        } else {
                          setFilterTags(filterTags.filter(id => id !== tag.id))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 优先级筛选 */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">优先级</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'urgent', label: '紧急', color: 'bg-red-100 text-red-700 border-red-200' },
                  { value: 'high', label: '高', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                  { value: 'medium', label: '中', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                  { value: 'low', label: '低', color: 'bg-gray-100 text-gray-700 border-gray-200' },
                ].map(priority => (
                  <button
                    key={priority.value}
                    onClick={() => {
                      const value = priority.value as Task['priority']
                      if (filterPriorities.includes(value)) {
                        setFilterPriorities(filterPriorities.filter(p => p !== value))
                      } else {
                        setFilterPriorities([...filterPriorities, value])
                      }
                    }}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
                      filterPriorities.includes(priority.value as Task['priority'])
                        ? priority.color
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {filterPriorities.includes(priority.value as Task['priority']) && (
                      <Check className="w-3 h-3 inline mr-1" />
                    )}
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 状态筛选 */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">状态</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'todo', label: '待办', color: 'bg-gray-100 text-gray-700 border-gray-200' },
                  { value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                  { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-700 border-green-200' },
                ].map(status => (
                  <button
                    key={status.value}
                    onClick={() => {
                      const value = status.value as Task['status']
                      if (filterStatuses.includes(value)) {
                        setFilterStatuses(filterStatuses.filter(s => s !== value))
                      } else {
                        setFilterStatuses([...filterStatuses, value])
                      }
                    }}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
                      filterStatuses.includes(status.value as Task['status'])
                        ? status.color
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {filterStatuses.includes(status.value as Task['status']) && (
                      <Check className="w-3 h-3 inline mr-1" />
                    )}
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 清空筛选 */}
            <button
              onClick={() => {
                setFilterProjects([])
                setFilterTags([])
                setFilterPriorities([])
                setFilterStatuses([])
              }}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              清空筛选
            </button>
          </div>
        </div>
      )}

      {/* 字段配置面板 */}
      {isFieldConfigOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">字段配置</h3>
              <button
                onClick={() => setIsFieldConfigOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">选择要在列表视图中显示的字段</p>

            <div className="space-y-2">
              {[
                { value: 'title', label: '任务标题', disabled: true },
                { value: 'status', label: '状态', disabled: false },
                { value: 'priority', label: '优先级', disabled: false },
                { value: 'project', label: '项目', disabled: false },
                { value: 'tags', label: '标签', disabled: false },
                { value: 'start_date', label: '开始时间', disabled: false },
                { value: 'due_date', label: '截止时间', disabled: false },
                { value: 'created_at', label: '创建时间', disabled: false },
                { value: 'updated_at', label: '更新时间', disabled: false },
              ].map(field => (
                <label
                  key={field.value}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border transition-colors',
                    field.disabled
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      : 'bg-white border-gray-200 hover:border-blue-300 cursor-pointer'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={visibleFields.includes(field.value)}
                    disabled={field.disabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setVisibleFields([...visibleFields, field.value])
                      } else {
                        setVisibleFields(visibleFields.filter(f => f !== field.value))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className={cn(
                    'text-sm font-medium',
                    field.disabled ? 'text-gray-500' : 'text-gray-700'
                  )}>
                    {field.label}
                    {field.disabled && <span className="text-xs text-gray-400 ml-1">(必选)</span>}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setVisibleFields(['title', 'status', 'priority', 'project', 'tags', 'due_date'])
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                重置为默认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
