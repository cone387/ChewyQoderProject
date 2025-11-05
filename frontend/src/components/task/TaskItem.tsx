import { Task } from '@/types'
import { CheckCircle2, Circle, Star, Calendar, Tag, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale/zh-CN'
import { cn } from '@/utils/cn'
import { useState } from 'react'

interface TaskItemProps {
  task: Task
  onToggleComplete?: (task: Task) => void
  onToggleStar?: (task: Task) => void
  onClick?: (task: Task) => void
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
}

const TaskItem = ({ 
  task, 
  onToggleComplete, 
  onToggleStar, 
  onClick,
  onEdit,
  onDelete 
}: TaskItemProps) => {
  const [showActions, setShowActions] = useState(false)

  const priorityColors = {
    urgent: 'text-red-600 bg-red-50 border-red-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    medium: 'text-blue-600 bg-blue-50 border-blue-200',
    low: 'text-gray-600 bg-gray-50 border-gray-200',
    none: 'text-gray-400 bg-gray-50 border-gray-100',
  }

  const statusLabels = {
    todo: '待办',
    in_progress: '进行中',
    completed: '已完成',
  }

  const priorityLabels = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低',
    none: '无',
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-200',
        'hover:shadow-md hover:border-blue-200 cursor-pointer',
        task.status === 'completed' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200',
        showActions && 'shadow-md border-blue-200'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 完成状态按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleComplete?.(task)
        }}
        className="flex-shrink-0 transition-transform hover:scale-110"
      >
        {task.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-gray-400 hover:text-blue-500" />
        )}
      </button>

      {/* 任务内容 */}
      <div className="flex-1 min-w-0" onClick={() => onClick?.(task)}>
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={cn(
              'font-medium truncate transition-colors',
              task.status === 'completed'
                ? 'line-through text-gray-400'
                : 'text-gray-900'
            )}
          >
            {task.title}
          </h4>
          
          {/* 状态标签 */}
          {task.status !== 'completed' && (
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            )}>
              {statusLabels[task.status]}
            </span>
          )}
        </div>

        {/* 元数据 */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.due_date), 'MM-dd HH:mm', { locale: zhCN })}</span>
            </div>
          )}
          
          {task.priority && task.priority !== 'none' && (
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-md border',
              priorityColors[task.priority]
            )}>
              {priorityLabels[task.priority]}
            </span>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>{task.tags.length}</span>
            </div>
          )}

          {task.subtasks_count > 0 && (
            <span className="text-xs">
              {task.subtasks_count} 个子任务
            </span>
          )}
        </div>
      </div>

      {/* 操作按钮 - 悬停显示 */}
      <div className={cn(
        'flex items-center gap-1 transition-all duration-200',
        showActions ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
      )}>
        {/* 星标 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleStar?.(task)
          }}
          className="p-2 hover:bg-yellow-50 rounded-lg transition-colors"
        >
          <Star
            className={cn(
              'w-4 h-4 transition-colors',
              task.is_starred
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-400 hover:text-yellow-400'
            )}
          />
        </button>

        {/* 编辑 */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task)
            }}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
          </button>
        )}

        {/* 删除 */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task)
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
          </button>
        )}
      </div>
    </div>
  )
}

export default TaskItem
