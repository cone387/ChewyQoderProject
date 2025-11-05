import { useState, useEffect } from 'react'
import { Calendar, Tag as TagIcon, Trash2, FolderKanban, X } from 'lucide-react'
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
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<Task['status']>('todo')
  const [projectId, setProjectId] = useState<number | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [extractedTags, setExtractedTags] = useState<string[]>([])

  useEffect(() => {
    loadProjects()
    loadTags()
  }, [])

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
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
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      status,
      project: projectId || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    })
    onClose()
  }

  // 处理描述文本变化，自动提取#标签
  const handleDescriptionChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setDescription(text)

    // 提取 #标签
    const tagMatches = text.match(/#(\S+)/g)
    if (tagMatches) {
      const tagNames = tagMatches.map(tag => tag.slice(1)) // 移除 #
      setExtractedTags(tagNames)

      // 自动创建或匹配标签
      for (const tagName of tagNames) {
        const existingTag = tags.find(t => t.name === tagName)
        if (existingTag) {
          // 已存在，添加到选中列表
          if (!selectedTags.includes(existingTag.id)) {
            setSelectedTags([...selectedTags, existingTag.id])
          }
        } else {
          // 不存在，创建新标签
          try {
            const newTag = await tagService.createTag({ name: tagName, color: '#3B82F6' })
            setTags([...tags, newTag])
            setSelectedTags([...selectedTags, newTag.id])
          } catch (error) {
            console.error('创建标签失败:', error)
          }
        }
      }

      // 从描述中移除#标签
      const cleanedText = text.replace(/#\S+\s*/g, '').trim()
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

  const priorityOptions = [
    { value: 'none', label: '无', color: 'bg-sky-100 text-sky-700' },
    { value: 'low', label: '低', color: 'bg-blue-100 text-blue-600' },
    { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-600' },
    { value: 'high', label: '高', color: 'bg-orange-100 text-orange-600' },
    { value: 'urgent', label: '紧急', color: 'bg-red-100 text-red-600' },
  ]

  const statusOptions = [
    { value: 'todo', label: '待办', color: 'bg-purple-100 text-purple-700' },
    { value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-600' },
    { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-600' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        {/* 任务标题 */}
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold border-0 px-0 focus:ring-0"
            placeholder="任务标题..."
          />
        </div>

        {/* 状态 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            状态
          </label>
          <div className="flex gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatus(option.value as Task['status'])}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  status === option.value
                    ? option.color
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 优先级 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <TagIcon className="w-4 h-4 inline mr-1" />
            优先级
          </label>
          <div className="flex gap-2">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setPriority(option.value as Task['priority'])}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  priority === option.value
                    ? option.color
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 所属项目 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FolderKanban className="w-4 h-4 inline mr-1" />
            所属项目
          </label>
          <select
            value={projectId || ''}
            onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">无项目</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* 标签选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <TagIcon className="w-4 h-4 inline mr-1" />
            标签
          </label>
          {/* 显示已选标签 */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTags.map(tagId => {
                const tag = tags.find(t => t.id === tagId)
                if (!tag) return null
                return (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {tag.name}
                    <button
                      onClick={() => toggleTag(tag.id)}
                      className="hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
          {/* 标签选择区 */}
          <div className="border border-gray-300 rounded-xl p-3 max-h-32 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-sm text-gray-500">暂无标签，请在标签管理页面创建</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm transition-all duration-200',
                      selectedTags.includes(tag.id)
                        ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            提示：在描述中输入 "#标签名" 可自动提取并创建标签
          </p>
        </div>

        {/* 截止日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            截止日期
          </label>
          <Input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full"
          />
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            描述
          </label>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none"
            placeholder="添加任务描述... (输入 #标签名 自动提取标签)"
          />
        </div>

        {/* 评论区（预留） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            评论
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] resize-none"
            placeholder="添加评论..."
          />
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onDelete}
            className="text-red-600 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除任务
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-200"
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
