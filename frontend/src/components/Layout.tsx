import { useEffect, useState } from 'react'
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { 
  Inbox, CheckCircle2, Trash2, Plus, ChevronLeft, ChevronRight, 
  ChevronDown, ChevronUp, MoreHorizontal, Calendar, Tag, FolderKanban, 
  BarChart3, Settings, LogOut, Edit2, Star, StarOff, Folder, GripVertical,
  MoreVertical, Pencil
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { projectService } from '@/services/project'
import { taskService } from '@/services/task'
import { tagService } from '@/services/tag'
import type { Project, SystemListType, Tag as TagType } from '@/types'
import toast from 'react-hot-toast'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 可排序的项目项组件
function SortableProjectItem({ 
  project, 
  isSelected, 
  onSelect, 
  onTogglePin, 
  isHovered,
  onHover,
  onHoverEnd 
}: { 
  project: Project
  isSelected: boolean
  onSelect: () => void
  onTogglePin: (e: React.MouseEvent) => void
  isHovered: boolean
  onHover: () => void
  onHoverEnd: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isDragging && "opacity-50"
      )}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      <button
        onClick={onSelect}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200',
          isSelected
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium'
            : 'text-gray-700 hover:bg-gray-50'
        )}
      >
        {/* 拖动手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />
        <span className="flex-1 text-left text-sm truncate">{project.name}</span>
        <span className="text-xs text-gray-500">
          {project.uncompleted_count || 0}
        </span>
      </button>
      {isHovered && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-200 px-1">
          <button
            onClick={onTogglePin}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={project.is_pinned ? "取消置顶" : "置顶"}
          >
            {project.is_pinned ? (
              <StarOff className="w-3.5 h-3.5 text-gray-600" />
            ) : (
              <Star className="w-3.5 h-3.5 text-gray-600" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// 可排序的标签项组件
function SortableTagItem({ 
  tag,
  isHovered,
  onHover,
  onHoverEnd,
  onEdit,
  onDelete
}: { 
  tag: TagType
  isHovered: boolean
  onHover: () => void
  onHoverEnd: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id })

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isMenuOpen && !target.closest('.tag-menu-container')) {
        setIsMenuOpen(false)
      }
    }
    
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "opacity-50"
      )}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      <div className="w-full flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all duration-200 hover:bg-gray-50">
        {/* 拖动手柄 - 固定宽度避免抖动 */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-move transition-opacity text-gray-400 hover:text-gray-600"
          style={{ 
            width: '14px',
            opacity: isHovered ? 1 : 0
          }}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        
        {/* 标签名称 - 带背景色块 */}
        <span 
          className="px-2 py-0.5 rounded text-sm font-medium text-white flex-shrink-0"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
        </span>
        
        <div className="flex-1" />
        
        {/* 操作菜单按钮 - 固定宽度避免抖动 */}
        <div 
          className="tag-menu-container relative flex-shrink-0" 
          style={{ 
            width: '20px',
            opacity: isHovered ? 1 : 0
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsMenuOpen(!isMenuOpen)
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="更多操作"
          >
            <MoreVertical className="w-3.5 h-3.5 text-gray-600" />
          </button>
          
          {/* 下拉菜单 */}
          {isMenuOpen && (
            <div className="absolute right-0 top-6 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMenuOpen(false)
                    onEdit()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>编辑</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMenuOpen(false)
                    onDelete()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const { isAuthenticated, logout, checkAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true)
  const [isNormalExpanded, setIsNormalExpanded] = useState(true)
  const [isTagsExpanded, setIsTagsExpanded] = useState(true)
  const [isNewListMenuOpen, setIsNewListMenuOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [tags, setTags] = useState<TagType[]>([])
  const [selectedView, setSelectedView] = useState<'inbox' | 'completed' | 'trash' | number>('inbox')
  const [inboxCount, setInboxCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [trashCount, setTrashCount] = useState(0)
  const [hoveredProject, setHoveredProject] = useState<number | null>(null)
  const [hoveredTag, setHoveredTag] = useState<number | null>(null)
  
  // 拖动传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要拖动8px才开始拖动，避免与点击冲突
      },
    })
  )
  
  useEffect(() => {
    checkAuth()
    loadProjects()
    loadTags()
    loadSystemCounts()
  }, [])

  // 点击外部关闭新建清单菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isNewListMenuOpen && !target.closest('.new-list-menu-container')) {
        setIsNewListMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isNewListMenuOpen])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('加载项目列表失败:', error)
      setProjects([])
    }
  }

  const loadSystemCounts = async () => {
    try {
      const [inbox, completed, trash] = await Promise.all([
        taskService.getSystemList('inbox'),
        taskService.getSystemList('completed'),
        taskService.getSystemList('trash')
      ])
      setInboxCount(inbox?.count || 0)
      setCompletedCount(completed?.count || 0)
      setTrashCount(trash?.count || 0)
    } catch (error) {
      console.error('加载系统清单数量失败:', error)
      setInboxCount(0)
      setCompletedCount(0)
      setTrashCount(0)
    }
  }

  const handleSelectView = (view: 'inbox' | 'completed' | 'trash' | number) => {
    setSelectedView(view)
    // 切换到任务页面，并传递视图参数
    navigate('/tasks', { state: { view } })
  }

  const handleTogglePin = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const updated = await projectService.togglePin(projectId)
      toast.success(updated.is_pinned ? '已置顶' : '取消置顶')
      // 重新加载项目列表以更新排序
      await loadProjects()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleCreateProject = async () => {
    const name = prompt('请输入清单名称')
    if (!name?.trim()) return
    
    try {
      const newProject = await projectService.createProject({ 
        name: name.trim(), 
        color: '#3B82F6' 
      })
      await loadProjects()
      setIsNewListMenuOpen(false)
      toast.success('清单创建成功')
    } catch (error) {
      toast.error('创建失败')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = normalProjects.findIndex(p => p.id === active.id)
    const newIndex = normalProjects.findIndex(p => p.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // 本地更新顺序
    const reorderedProjects = arrayMove(normalProjects, oldIndex, newIndex)
    
    // 更新所有项目的order字段
    const updatedProjects = [...pinnedProjects, ...reorderedProjects]
    setProjects(updatedProjects)

    try {
      // 批量更新后端
      const updates = reorderedProjects.map((project, index) => ({
        id: project.id,
        order: index
      }))
      
      // 逐个更新
      await Promise.all(
        updates.map(update => 
          projectService.updateProject(update.id, { order: update.order })
        )
      )
      
      toast.success('排序已保存')
    } catch (error) {
      console.error('保存排序失败:', error)
      toast.error('保存排序失败')
      // 恢复原始顺序
      await loadProjects()
    }
  }

  const loadTags = async () => {
    try {
      const data = await tagService.getTags()
      setTags(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('加载标签列表失败:', error)
      setTags([])
    }
  }

  const handleTagDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = tags.findIndex(t => t.id === active.id)
    const newIndex = tags.findIndex(t => t.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // 本地更新顺序
    const reorderedTags = arrayMove(tags, oldIndex, newIndex)
    setTags(reorderedTags)

    try {
      // 批量更新后端
      const updates = reorderedTags.map((tag, index) => ({
        id: tag.id,
        order: index
      }))
      
      // 逐个更新
      await Promise.all(
        updates.map(update => 
          tagService.updateTag(update.id, { order: update.order })
        )
      )
      
      toast.success('排序已保存')
    } catch (error) {
      console.error('保存排序失败:', error)
      toast.error('保存排序失败')
      // 恢复原始顺序
      await loadTags()
    }
  }

  const handleEditTag = async (tag: TagType) => {
    const name = prompt('请输入新的标签名称', tag.name)
    if (!name?.trim() || name.trim() === tag.name) return
    
    try {
      await tagService.updateTag(tag.id, { name: name.trim() })
      await loadTags()
      toast.success('标签已更新')
    } catch (error) {
      toast.error('更新失败')
    }
  }

  const handleDeleteTag = async (tag: TagType) => {
    if (!confirm(`确定要删除标签“${tag.name}”吗？`)) return
    
    try {
      await tagService.deleteTag(tag.id)
      await loadTags()
      toast.success('标签已删除')
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const pinnedProjects = Array.isArray(projects) ? projects.filter(p => p.is_pinned) : []
  const normalProjects = Array.isArray(projects) ? projects.filter(p => !p.is_pinned) : []

  type MoreMenuItem = 
    | { to: string; icon: any; label: string; view?: never; count?: never }
    | { view: 'completed' | 'trash'; icon: any; label: string; count?: number; to?: never }

  const moreMenuItems: MoreMenuItem[] = [
    { to: '/calendar', icon: Calendar, label: '日历' },
    { to: '/tags', icon: Tag, label: '标签' },
    { to: '/projects', icon: FolderKanban, label: '项目管理' },
    { to: '/reports', icon: BarChart3, label: '统计' },
    { view: 'completed', icon: CheckCircle2, label: '已完成', count: completedCount },
    { view: 'trash', icon: Trash2, label: '垃圾筒', count: trashCount },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300",
        isSidebarCollapsed ? "w-20" : "w-72"
      )}>
        {/* Header */}
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
        
        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* System Lists */}
          <div className="space-y-1 mb-4">
            {/* 收集箱 */}
            <button
              onClick={() => handleSelectView('inbox')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                selectedView === 'inbox'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50',
                isSidebarCollapsed && 'justify-center'
              )}
              title={isSidebarCollapsed ? '收集箱' : undefined}
            >
              <Inbox className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">收集箱</span>
                  {inboxCount > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                      {inboxCount}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>

          {/* Pinned Projects */}
          {!isSidebarCollapsed && pinnedProjects.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setIsPinnedExpanded(!isPinnedExpanded)}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-600 hover:text-gray-700 transition-colors"
              >
                {isPinnedExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Star className="w-4 h-4" />
                <span>已置顶</span>
              </button>
              {isPinnedExpanded && (
                <div className="space-y-1 mt-1">
                  {pinnedProjects.map(project => (
                    <div
                      key={project.id}
                      className="group relative"
                      onMouseEnter={() => setHoveredProject(project.id)}
                      onMouseLeave={() => setHoveredProject(null)}
                    >
                      <button
                        onClick={() => handleSelectView(project.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200',
                          selectedView === project.id
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="flex-1 text-left text-sm truncate">{project.name}</span>
                        <span className="text-xs text-gray-500">
                          {project.uncompleted_count || 0}
                        </span>
                      </button>
                      {hoveredProject === project.id && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-200 px-1">
                          <button
                            onClick={(e) => handleTogglePin(project.id, e)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="取消置顶"
                          >
                            <StarOff className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Normal Projects */}
          {!isSidebarCollapsed && (
            <div className="mb-4">
              <div className="relative new-list-menu-container">
                <div className="w-full flex items-center justify-between px-2 py-2">
                  <button
                    onClick={() => setIsNormalExpanded(!isNormalExpanded)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700 transition-colors"
                  >
                    {isNormalExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <Folder className="w-4 h-4" />
                    <span>我的清单</span>
                  </button>
                  <button
                    onClick={() => setIsNewListMenuOpen(!isNewListMenuOpen)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="新建清单"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* 新建清单菜单 */}
                {isNewListMenuOpen && (
                  <div className="absolute right-2 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="p-1">
                      <button
                        onClick={handleCreateProject}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <Folder className="w-4 h-4 text-gray-500" />
                        <span>空白清单</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {isNormalExpanded && normalProjects.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={normalProjects.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1 mt-1">
                      {normalProjects.map(project => (
                        <SortableProjectItem
                          key={project.id}
                          project={project}
                          isSelected={selectedView === project.id}
                          onSelect={() => handleSelectView(project.id)}
                          onTogglePin={(e) => handleTogglePin(project.id, e)}
                          isHovered={hoveredProject === project.id}
                          onHover={() => setHoveredProject(project.id)}
                          onHoverEnd={() => setHoveredProject(null)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {/* Tags Section */}
          {!isSidebarCollapsed && (
            <div className="mb-4">
              <button
                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-600 hover:text-gray-700 transition-colors"
              >
                {isTagsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Tag className="w-4 h-4" />
                <span>标签</span>
              </button>
              
              {isTagsExpanded && tags.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleTagDragEnd}
                >
                  <SortableContext
                    items={tags.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1 mt-1">
                      {tags.map(tag => (
                        <SortableTagItem
                          key={tag.id}
                          tag={tag}
                          isHovered={hoveredTag === tag.id}
                          onHover={() => setHoveredTag(tag.id)}
                          onHoverEnd={() => setHoveredTag(null)}
                          onEdit={() => handleEditTag(tag)}
                          onDelete={() => handleDeleteTag(tag)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isMoreMenuOpen
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50',
                isSidebarCollapsed && 'justify-center'
              )}
              title={isSidebarCollapsed ? '更多' : undefined}
            >
              <MoreHorizontal className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">更多</span>
                  {isMoreMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </>
              )}
            </button>

            {/* More Menu Dropdown */}
            {isMoreMenuOpen && !isSidebarCollapsed && (
              <div className="mt-1 space-y-1 pl-4">
                {moreMenuItems.map((item) => (
                  <button
                    key={item.to || item.view}
                    onClick={() => {
                      if (item.view) {
                        handleSelectView(item.view as 'completed' | 'trash')
                      } else if (item.to) {
                        navigate(item.to)
                      }
                      setIsMoreMenuOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200',
                      (item.to && location.pathname === item.to) || (item.view && selectedView === item.view)
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left text-sm">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/settings')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              location.pathname === '/settings'
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm'
                : 'text-gray-700 hover:bg-gray-50',
              isSidebarCollapsed && 'justify-center'
            )}
            title={isSidebarCollapsed ? '设置' : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>设置</span>}
          </button>

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
          
          {/* User Info */}
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
