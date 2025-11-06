import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  Plus, Search, ChevronDown, ChevronUp, List, Columns3, GanttChart,
  Filter, ArrowUpDown, Group, Settings as SettingsIcon, X, Check, MoreHorizontal,
  LayoutDashboard, Timer, Eye, EyeOff, ChevronRight, GripVertical
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
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
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/utils/cn'

type ViewType = 'list' | 'kanban' | 'gantt'
type GroupByType = 'status' | 'priority' | 'project' | 'tag' | 'date' | 'none'
type SortByType = 'due_date' | 'priority' | 'created_at' | 'updated_at' | 'manual'
type TaskScopeType = 'all' | 'my' | 'uncompleted' | 'completed'

// 分组容器组件 - 用于跨组拖拽
const GroupContainer = ({ groupName, children }: { groupName: string; children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({
    id: `group-${groupName}`,
  })
  
  return (
    <div ref={setNodeRef}>
      {children}
    </div>
  )
}

// 可排序的分组标题组件
const SortableGroupHeader = ({ 
  groupName, 
  count, 
  isExpanded, 
  onToggle,
  onRename,
}: { 
  groupName: string; 
  count: number; 
  isExpanded: boolean; 
  onToggle: () => void;
  onRename?: (oldName: string, newName: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(groupName)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-header-${groupName}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (groupName === '默认分组' || !onRename) return
    setIsEditing(true)
    setEditName(groupName)
  }

  const handleSaveEdit = () => {
    const newName = editName.trim()
    if (newName && newName !== groupName && onRename) {
      onRename(groupName, newName)
    }
    setIsEditing(false)
    setEditName(groupName)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditName(groupName)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {/* 拖动手柄 - hover时显示 */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-semibold text-gray-700 bg-white border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span 
              className={cn(
                "text-sm font-semibold text-gray-700",
                groupName !== '默认分组' && onRename && "cursor-text hover:text-blue-600"
              )}
              onClick={handleStartEdit}
            >
              {groupName}
            </span>
          )}
          
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
            {count}
          </span>
        </div>
        {isExpanded ? 
          <ChevronUp className="w-5 h-5 text-gray-500" /> : 
          <ChevronDown className="w-5 h-5 text-gray-500" />
        }
      </button>
    </div>
  )
}

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
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  
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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isNewTaskDropdownOpen, setIsNewTaskDropdownOpen] = useState(false)
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  
  // 自定义分组
  const [customGroups, setCustomGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('task_custom_groups')
    return saved ? JSON.parse(saved) : []
  })
  
  // 分组顺序（包括默认分组）
  const [groupOrder, setGroupOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('task_group_order')
    return saved ? JSON.parse(saved) : ['默认分组']
  })
  
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
    // 保存自定义分组
    localStorage.setItem('task_custom_groups', JSON.stringify(customGroups))
  }, [customGroups])

  useEffect(() => {
    // 保存分组顺序
    localStorage.setItem('task_group_order', JSON.stringify(groupOrder))
  }, [groupOrder])

  useEffect(() => {
    // 同步customGroups到groupOrder
    const newGroups = customGroups.filter(g => !groupOrder.includes(g))
    if (newGroups.length > 0) {
      setGroupOrder([...groupOrder, ...newGroups])
    }
    // 移除已删除的分组
    const validGroups = groupOrder.filter(g => g === '默认分组' || customGroups.includes(g))
    if (validGroups.length !== groupOrder.length) {
      setGroupOrder(validGroups)
    }
  }, [customGroups])

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

  // ESC键关闭搜索弹窗
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false)
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isSearchModalOpen])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // 关闭所有下拉菜单
      if (!target.closest('.dropdown-container')) {
        setIsScopeDropdownOpen(false)
        setIsSortDropdownOpen(false)
        setIsGroupDropdownOpen(false)
        setIsFieldConfigOpen(false)
        setIsNewTaskDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const handleCreateGroup = () => {
    const groupName = newGroupName.trim()
    if (!groupName) {
      toast.error('请输入分组名称')
      return
    }
    if (customGroups.includes(groupName)) {
      toast.error('分组已存在')
      return
    }
    setCustomGroups([...customGroups, groupName])
    // 添加到分组顺序中
    setGroupOrder([...groupOrder, groupName])
    setIsNewGroupModalOpen(false)
    setNewGroupName('')
    toast.success(`分组"${groupName}"已创建`)
  }

  const handleRenameGroup = (oldName: string, newName: string) => {
    if (oldName === newName) return
    if (customGroups.includes(newName)) {
      toast.error('分组名称已存在')
      return
    }
    // 更新customGroups
    setCustomGroups(customGroups.map(g => g === oldName ? newName : g))
    // 更新groupOrder
    setGroupOrder(groupOrder.map(g => g === oldName ? newName : g))
    // 更新任务的custom_group
    const tasksToUpdate = tasks.filter(t => (t as any).custom_group === oldName)
    tasksToUpdate.forEach(async (task) => {
      try {
        await taskService.updateTask(task.id, { custom_group: newName } as any)
      } catch (error) {
        console.error('更新任务分组失败:', error)
      }
    })
    // 更新本地状态
    setTasks(tasks.map(t => 
      (t as any).custom_group === oldName 
        ? { ...t, custom_group: newName } as any 
        : t
    ))
    toast.success(`分组已重命名为"${newName}"`)
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
      // 自定义分组模式
      // 先按照用户创建的分组名称进行分组
      customGroups.forEach(groupName => {
        groups[groupName] = []
      })
      
      // 添加默认分组（用于未分配的任务）
      groups['默认分组'] = []
      
      // 将任务分配到对应的分组
      sortedTasks.forEach(task => {
        // TODO: 这里需要任务模型有一个 custom_group 字段
        // 暂时都放到默认分组
        const taskGroup = (task as any).custom_group || '默认分组'
        if (groups[taskGroup]) {
          groups[taskGroup].push(task)
        } else {
          groups['默认分组'].push(task)
        }
      })
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

    // 移除空分组（但保留自定义分组，即使为空也显示）
    Object.keys(groups).forEach(key => {
      // 如果是自定义分组模式，保留所有自定义分组
      if (groupBy === 'status' && customGroups.includes(key)) {
        return // 保留自定义分组
      }
      // 其他情况下移除空分组
      if (groups[key].length === 0) {
        delete groups[key]
      }
    })

    return groups
  }, [sortedTasks, groupBy, customGroups])

  // 筛选条件数量
  const filterCount = filterProjects.length + filterTags.length + filterPriorities.length + filterStatuses.length

  // 拖动开始处理
  const handleDragStart = (event: DragStartEvent) => {
    if (typeof event.active.id === 'string' && event.active.id.startsWith('group-header-')) {
      setActiveGroupId(event.active.id)
    } else {
      setActiveTaskId(event.active.id as number)
    }
  }

  // 拖动结束处理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTaskId(null)
    setActiveGroupId(null)

    if (!over) return

    // 分组标题的拖动排序
    if (typeof active.id === 'string' && active.id.startsWith('group-header-')) {
      const activeGroupName = active.id.replace('group-header-', '')
      const overGroupName = typeof over.id === 'string' && over.id.startsWith('group-header-') 
        ? over.id.replace('group-header-', '') 
        : null

      if (overGroupName && activeGroupName !== overGroupName) {
        // 使用groupOrder进行排序
        const oldIndex = groupOrder.indexOf(activeGroupName)
        const newIndex = groupOrder.indexOf(overGroupName)

        if (oldIndex !== -1 && newIndex !== -1) {
          const newGroupOrder = arrayMove(groupOrder, oldIndex, newIndex)
          setGroupOrder(newGroupOrder)
          toast.success('分组顺序已更新')
        }
      }
      return
    }

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

    // 列表视图 - 自定义分组模式的跨组拖拽
    if (viewType === 'list' && groupBy === 'status') {
      const activeTask = tasks.find(t => t.id === active.id)
      if (!activeTask) return

      // 判断是否跨分组拖动
      const activeGroup = (activeTask as any).custom_group || '默认分组'
      
      // 如果over.id是字符串，说明拖到了分组容器
      if (typeof over.id === 'string' && over.id.startsWith('group-')) {
        const targetGroup = over.id.replace('group-', '')
        if (activeGroup !== targetGroup) {
          // 跨组拖动，更新custom_group
          try {
            const updated = await taskService.updateTask(activeTask.id, { 
              custom_group: targetGroup === '默认分组' ? undefined : targetGroup 
            } as any)
            setTasks(tasks.map(t => t.id === activeTask.id ? { ...updated, custom_group: targetGroup === '默认分组' ? undefined : targetGroup } as any : t))
            toast.success(`任务已移动到"${targetGroup}"`)
          } catch (error) {
            console.error('更新任务分组失败:', error)
            toast.error('更新失败')
          }
          return
        }
      }
      
      // 如果over.id是数字，说明拖到了具体任务上
      if (typeof over.id === 'number') {
        const overTask = tasks.find(t => t.id === over.id)
        if (overTask) {
          const targetGroup = (overTask as any).custom_group || '默认分组'
          if (activeGroup !== targetGroup) {
            // 跨组拖动
            try {
              const updated = await taskService.updateTask(activeTask.id, { 
                custom_group: targetGroup === '默认分组' ? undefined : targetGroup 
              } as any)
              setTasks(tasks.map(t => t.id === activeTask.id ? { ...updated, custom_group: targetGroup === '默认分组' ? undefined : targetGroup } as any : t))
              toast.success(`任务已移动到"${targetGroup}"`)
            } catch (error) {
              console.error('更新任务分组失败:', error)
              toast.error('更新失败')
            }
            return
          }
        }
      }
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
          {/* 标题和更多菜单 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{getViewTitle()}</h1>
              <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="搜索"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 视图切换 */}
          <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
            <button
              onClick={() => setViewType('list')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative',
                viewType === 'list'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <List className="w-4 h-4" />
              列表
              {viewType === 'list' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setViewType('kanban')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative',
                viewType === 'kanban'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Columns3 className="w-4 h-4" />
              看板
              {viewType === 'kanban' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setViewType('gantt')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative',
                viewType === 'gantt'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <GanttChart className="w-4 h-4" />
              甘特图
              {viewType === 'gantt' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              仪表盘
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Timer className="w-4 h-4" />
              动态
            </button>
          </div>

          {/* 工具栏 */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* 新建任务 */}
            <div className="relative dropdown-container flex items-stretch">
              {/* 主按钮 - 新建任务 */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 transition-colors border-r-0"
              >
                <Plus className="w-4 h-4" />
                新建任务
              </button>
              
              {/* 下拉按钮 */}
              <button
                onClick={() => setIsNewTaskDropdownOpen(!isNewTaskDropdownOpen)}
                className="flex items-center justify-center px-2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 transition-colors border-l border-l-gray-200"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {/* 下拉菜单 */}
              {isNewTaskDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setIsNewGroupModalOpen(true)
                        setIsNewTaskDropdownOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      新建分组
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 全部任务 */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setIsScopeDropdownOpen(!isScopeDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <List className="w-4 h-4" />
                {taskScope === 'all' && '全部任务'}
                {taskScope === 'my' && '我的任务'}
                {taskScope === 'uncompleted' && '未完成'}
                {taskScope === 'completed' && '已完成'}
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

            {/* 排序：拖拽自定义 */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                排序: {sortBy === 'manual' ? '拖拽自定义' : sortBy === 'due_date' ? '截止日期' : sortBy === 'priority' ? '优先级' : sortBy === 'created_at' ? '创建时间' : '更新时间'}
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

            {/* 分组：自定义分组 */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Group className="w-4 h-4" />
                分组: {groupBy === 'status' ? '自定义分组' : groupBy === 'priority' ? '优先级' : groupBy === 'project' ? '项目' : groupBy === 'tag' ? '标签' : groupBy === 'date' ? '截止日期' : '不分组'}
              </button>
              {isGroupDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="p-1">
                    {[
                      { value: 'status', label: '自定义分组' },
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
            <div className="relative dropdown-container">
              <button
                onClick={() => setIsFieldConfigOpen(!isFieldConfigOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
                字段配置
              </button>
              
              {/* 下拉菜单 */}
              {isFieldConfigOpen && (
                <div className="absolute top-full left-0 mt-2 w-[360px] bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="p-4">
                    {/* 标题 */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">字段配置</h3>

                    {/* 添加自定义字段 */}
                    <button 
                      onClick={() => {
                        const fieldName = prompt('请输入自定义字段名称')
                        if (fieldName) {
                          // TODO: 实现添加自定义字段逻辑
                          toast.success(`自定义字段"${fieldName}"已添加`)
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 mb-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>添加自定义字段</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    {/* 分割线 */}
                    <div className="border-t border-gray-200 mb-3" />

                    {/* 字段列表 - 基于Task模型的实际字段 */}
                    <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
                      {[
                        { value: 'status', label: '状态' },
                        { value: 'priority', label: '优先级' },
                        { value: 'project', label: '所属项目' },
                        { value: 'tags', label: '标签' },
                        { value: 'start_date', label: '开始时间' },
                        { value: 'due_date', label: '截止时间' },
                        { value: 'completed_at', label: '完成时间' },
                        { value: 'reminder', label: '提醒时间' },
                        { value: 'repeat', label: '重复' },
                        { value: 'is_starred', label: '星标' },
                        { value: 'subtasks_count', label: '子任务数' },
                        { value: 'attachments', label: '附件' },
                        { value: 'comments', label: '评论' },
                        { value: 'created_at', label: '创建时间' },
                        { value: 'updated_at', label: '更新时间' },
                      ].map(field => {
                        const isVisible = visibleFields.includes(field.value)
                        return (
                          <button
                            key={field.value}
                            onClick={() => {
                              if (isVisible) {
                                setVisibleFields(visibleFields.filter(f => f !== field.value))
                              } else {
                                setVisibleFields([...visibleFields, field.value])
                              }
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                              <span>{field.label}</span>
                            </div>
                            {isVisible ? (
                              <Eye className="w-4 h-4 text-gray-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 任务分组列表 - 列表视图 */}
        {viewType === 'list' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* 自定义分组模式：按groupOrder顺序显示 */}
            {groupBy === 'status' ? (
              <SortableContext
                items={groupOrder.map(g => `group-header-${g}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-6">
                  {/* 按groupOrder顺序显示 */}
                  {groupOrder.map(groupName => {
                    const groupTasks = groupedTasks[groupName] || []
                    return (
                      <GroupContainer key={groupName} groupName={groupName}>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                          <SortableGroupHeader
                            groupName={groupName}
                            count={groupTasks.length}
                            isExpanded={expandedGroups[groupName] !== false}
                            onToggle={() => toggleGroupExpanded(groupName)}
                            onRename={handleRenameGroup}
                          />
                          
                          {expandedGroups[groupName] !== false && (
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
                                    visibleFields={visibleFields}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          )}
                        </div>
                      </GroupContainer>
                    )
                  })}

                  {/* 空状态 */}
                  {Object.keys(groupedTasks).length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                      <p className="text-lg">暂无任务</p>
                      <p className="text-sm mt-2">点击上方按钮创建新任务</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            ) : (
              /* 其他分组模式：按groupedTasks顺序显示 */
              <div className="space-y-6">
                {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                  <GroupContainer key={groupName} groupName={groupName}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
                                visibleFields={visibleFields}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      )}
                    </div>
                  </GroupContainer>
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

            {/* 拖动预览 */}
            <DragOverlay>
              {activeTaskId ? (
                <div className="bg-white rounded-lg border-2 border-blue-500 p-4 shadow-lg opacity-80">
                  <div className="font-medium text-gray-900">
                    {tasks.find(t => t.id === activeTaskId)?.title}
                  </div>
                </div>
              ) : activeGroupId ? (
                <div className="bg-gray-50 rounded-lg border-2 border-blue-500 px-6 py-4 shadow-lg opacity-90">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      {activeGroupId.replace('group-header-', '')}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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
        customGroups={customGroups}
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
        customGroups={customGroups}
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

      {/* 搜索弹窗 */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索任务..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-12 pr-10 py-3 text-lg border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <button
                  onClick={() => {
                    setIsSearchModalOpen(false)
                    setSearchQuery('')
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {searchQuery && (
                <div className="mt-4 max-h-96 overflow-y-auto">
                  {filteredTasks.length > 0 ? (
                    <div className="space-y-2">
                      {filteredTasks.slice(0, 10).map(task => (
                        <button
                          key={task.id}
                          onClick={() => {
                            setSelectedTask(task)
                            setIsSearchModalOpen(false)
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{task.title}</div>
                          {task.project && typeof task.project === 'object' && (
                            <div className="text-sm text-gray-500 mt-1">
                              {task.project.name}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      未找到匹配的任务
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Tip:</span> 按 ESC 键关闭
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新建分组弹窗 */}
      <Modal 
        isOpen={isNewGroupModalOpen} 
        onClose={() => {
          setIsNewGroupModalOpen(false)
          setNewGroupName('')
        }} 
        title="新建分组"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分组名称
            </label>
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="请输入分组名称..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreateGroup()
                }
              }}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsNewGroupModalOpen(false)
                setNewGroupName('')
              }}
              variant="outline"
            >
              取消
            </Button>
            <Button onClick={handleCreateGroup}>
              创建
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
