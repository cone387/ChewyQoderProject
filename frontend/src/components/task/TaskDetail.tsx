import { useState, useEffect } from 'react'
import { Calendar, Tag, Trash2 } from 'lucide-react'
import { Task } from '@/types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'

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

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setDueDate(task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : '')
      setStatus(task.status)
    }
  }, [task])

  if (!task) return null

  const handleSave = () => {
    onUpdate({
      title,
      description,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      status,
    })
    onClose()
  }

  const priorityOptions = [
    { value: 'none', label: '无', color: 'bg-gray-100 text-gray-600' },
    { value: 'low', label: '低', color: 'bg-blue-100 text-blue-600' },
    { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-600' },
    { value: 'high', label: '高', color: 'bg-orange-100 text-orange-600' },
    { value: 'urgent', label: '紧急', color: 'bg-red-100 text-red-600' },
  ]

  const statusOptions = [
    { value: 'todo', label: '待办', color: 'bg-gray-100 text-gray-600' },
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
            <Tag className="w-4 h-4 inline mr-1" />
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
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none"
            placeholder="添加任务描述..."
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
