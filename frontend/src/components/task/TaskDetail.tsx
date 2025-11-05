import { useState, useEffect } from 'react'
import { Calendar, Tag as TagIcon, Trash2, FolderKanban, X, Plus, Clock } from 'lucide-react'
import { Task, Project, Tag } from '@/types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'
import { projectService } from '@/services/project'
import { tagService } from '@/services/tag'
import toast from 'react-hot-toast'

interface TaskDetailProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updates: Partial<Task>) => void
  onDelete: () => void
}

const TaskDetail = ({ task, isOpen, onClose, onUpdate, onDelete }: TaskDetailProps) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('none')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<Task['status']>('todo')
  const [projectId, setProjectId] = useState<number | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [extractedTags, setExtractedTags] = useState<string[]>([])
  const [showNewTagInput, setShowNewTagInput] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  useEffect(() => {
    loadProjects()
    loadTags()
  }, [])

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setStartDate(task.start_date ? format(new Date(task.start_date), "yyyy-MM-dd'T'HH:mm") : '')
      setDueDate(task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : '')
      setStatus(task.status)
      setProjectId(
        task.project && typeof task.project === 'object' ? task.project.id : task.project || null
      )
      // 设置已选标签
      if (task.tags && Array.isArray(task.tags)) {
        const tagIds = task.tags.map(t => typeof t === 'object' ? t.id : t).filter(Boolean) as number[]
        setSelectedTags(tagIds)
      }
    }
  }, [task])

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

  if (!task) return null

  const handleSave = () => {
    onUpdate({
      title,
      description,
      priority,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      status,
      project: projectId || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    })
    onClose()
  }

  // 处理描述文本变化，自动提取#标签（只在空格后触发）
  const handleDescriptionChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setDescription(text)

    // 提取 #标签 - 只匹配 "#标签名 " 格式（后面必须有空格）
    const tagMatches = text.match(/#(\S+)\s/g)
    if (tagMatches) {
      const tagNames = tagMatches.map(tag => tag.slice(1, -1)) // 移除 # 和空格
      const newTags: string[] = []
      
      // 自动创建或匹配标签
      for (const tagName of tagNames) {
        if (!tagName.trim()) continue
        
        const existingTag = tags.find(t => t.name === tagName)
        if (existingTag) {
          // 已存在，添加到选中列表
          if (!selectedTags.includes(existingTag.id)) {
            setSelectedTags(prev => [...prev, existingTag.id])
          }
        } else {
          // 检查是否已经在处理队列中
          if (!newTags.includes(tagName)) {
            newTags.push(tagName)
            // 不存在，创建新标签
            try {
              const newTag = await tagService.createTag({ name: tagName, color: '#3B82F6' })
              setTags(prev => [...prev, newTag])
              setSelectedTags(prev => [...prev, newTag.id])
            } catch (error) {
              console.error('创建标签失败:', error)
            }
          }
        }
      }

      // 从描述中移除#标签（包括后面的空格）
      const cleanedText = text.replace(/#\S+\s/g, '').trim()
      setDescription(cleanedText)
    }
  }

  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) {
      toast.error('请输入标签名称')
      return
    }
    try {
      const newTag = await tagService.createTag({ name: newTagName.trim(), color: '#3B82F6' })
      setTags([...tags, newTag])
      setSelectedTags([...selectedTags, newTag.id])
      setNewTagName('')
      setShowNewTagInput(false)
      toast.success('标签创建成功')
    } catch (error) {
      console.error('创建标签失败:', error)
      toast.error('创建标签失败')
    }
  }

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('确定要从任务中移除此标签吗？')) return
    setSelectedTags(selectedTags.filter(id => id !== tagId))
  }

  const handleDeleteTask = () => {
    if (confirm('确定要删除该任务吗？删除后不可恢复！')) {
      onDelete()
    }
  }

  const priorityOptions = [
    { value: 'none', label: '无', color: 'bg-sky-100 text-sky-700 border-sky-300', icon: '⚪' },
    { value: 'low', label: '低', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: '🔵' },
    { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: '🟡' },
    { value: 'high', label: '高', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: '🟠' },
    { value: 'urgent', label: '紧急', color: 'bg-red-100 text-red-700 border-red-300', icon: '🔴' },
  ]

  const statusOptions = [
    { value: 'todo', label: '待办', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: '○' },
    { value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: '●' },
    { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-700 border-green-300', icon: '✓' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="space-y-6 max-h-[85vh] overflow-y-auto px-1">
        {/* 任务标题 */}
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold border-0 px-0 focus:ring-0"
            placeholder="任务标题..."
          />
        </div>

        {/* 任务属性区 - 浅灰背景区分 */}
        <div className="bg-gray-50 rounded-2xl p-6 space-y-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded"></span>
            任务属性
          </h3>

          {/* 状态 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-3">
              状态
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatus(option.value as Task['status'])}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2',
                    'hover:scale-105 active:scale-95',
                    status === option.value
                      ? `${option.color} shadow-md`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  )}
                >
                  <span className="mr-1.5">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 优先级 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-3">
              优先级
            </label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPriority(option.value as Task['priority'])}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2',
                    'hover:scale-105 active:scale-95',
                    priority === option.value
                      ? `${option.color} shadow-md`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  )}
                >
                  <span className="mr-1.5">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 所属项目 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-3">
              <FolderKanban className="w-4 h-4 inline mr-1.5" />
              所属项目
            </label>
            <select
              value={projectId || ''}
              onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-gray-300"
            >
              <option value="">无项目</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* 时间设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 开始时间 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-3">
                <Clock className="w-4 h-4 inline mr-1.5" />
                开始时间
              </label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border-2 hover:border-gray-300 transition-all duration-200"
              />
            </div>

            {/* 截止时间 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-1.5" />
                截止时间
              </label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border-2 hover:border-gray-300 transition-all duration-200"
              />
            </div>
          </div>

          {/* 标签选择 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-medium text-gray-700">
                <TagIcon className="w-4 h-4 inline mr-1.5" />
                标签
              </label>
              <button
                onClick={() => setShowNewTagInput(!showNewTagInput)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新建标签
              </button>
            </div>

            {/* 新建标签输入框 */}
            {showNewTagInput && (
              <div className="flex gap-2 mb-3">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="输入标签名称..."
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateNewTag()}
                  className="flex-1"
                />
                <Button
                  onClick={handleCreateNewTag}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  创建
                </Button>
                <Button
                  onClick={() => {
                    setShowNewTagInput(false)
                    setNewTagName('')
                  }}
                  variant="outline"
                  size="sm"
                >
                  取消
                </Button>
              </div>
            )}

            {/* 显示已选标签 */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                {selectedTags.map(tagId => {
                  const tag = tags.find(t => t.id === tagId)
                  if (!tag) return null
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium shadow-sm border border-purple-200 transition-all duration-200 hover:shadow-md"
                    >
                      {tag.name}
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              💡 提示：在描述中输入 "#标签名 " 后加空格自动提取标签
            </p>
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            描述
          </label>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[150px] resize-none transition-all duration-200 hover:border-gray-300"
            placeholder="添加任务描述... (输入 '#标签名 ' 后加空格自动提取标签)"
          />
        </div>

        {/* 任务元信息（创建时间等） */}
        {task && (
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>创建时间：{format(new Date(task.created_at), 'yyyy-MM-dd HH:mm')}</p>
            {task.updated_at !== task.created_at && (
              <p>修改时间：{format(new Date(task.updated_at), 'yyyy-MM-dd HH:mm')}</p>
            )}
          </div>
        )}

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200 sticky bottom-0 bg-white -mx-1 px-1">
          <Button
            variant="outline"
            onClick={handleDeleteTask}
            className="text-red-600 hover:bg-red-50 border-2 border-red-200 hover:border-red-300 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除任务
          </Button>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-2 hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-200 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              保存
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default TaskDetail
