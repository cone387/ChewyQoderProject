import { Task } from '@/types'
import { CheckCircle2, Circle, Calendar, Edit, Trash2, GripVertical, Star, Repeat, Paperclip, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale/zh-CN'
import { cn } from '@/utils/cn'
import { useState } from 'react'
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'

interface TaskItemProps {
  task: Task
  onToggleComplete?: (task: Task) => void
  onClick?: (task: Task) => void
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
  dragHandleProps?: SyntheticListenerMap
  visibleFields?: string[]
}

const TaskItem = ({ 
  task, 
  onToggleComplete, 
  onClick,
  onEdit,
  onDelete,
  dragHandleProps,
  visibleFields = ['status', 'priority', 'project', 'tags', 'due_date']
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
        'group relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-150',
        'hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 cursor-pointer',
        task.status === 'completed' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200',
        showActions && 'shadow-md border-blue-200'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 拖动手柄 - 只在hover时显示 */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

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
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4
            className={cn(
              'font-medium transition-colors',
              task.status === 'completed'
                ? 'line-through text-gray-400'
                : 'text-gray-900'
            )}
          >
            {task.title}
          </h4>
          
          {/* 状态标签 */}
          {visibleFields.includes('status') && task.status !== 'completed' && (
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full border flex-shrink-0',
              task.status === 'todo' && 'bg-indigo-100 text-indigo-700 border-indigo-200',
              task.status === 'in_progress' && 'bg-blue-100 text-blue-700 border-blue-200'
            )}>
              {statusLabels[task.status]}
            </span>
          )}

          {/* 项目 */}
          {visibleFields.includes('project') && task.project && typeof task.project === 'object' && (
            <div className="flex items-center gap-1 text-indigo-600 flex-shrink-0">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-xs truncate max-w-[120px]">{task.project.name}</span>
            </div>
          )}
          
          {/* 标签 */}
          {visibleFields.includes('tags') && task.tags && Array.isArray(task.tags) && task.tags.length > 0 && (
            <>
              {task.tags.slice(0, 3).map((tag) => {
                // 只显示有效的标签对象
                if (typeof tag === 'object' && tag.name) {
                  return (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md font-medium text-xs flex-shrink-0"
                    >
                      {tag.name}
                    </span>
                  )
                }
                return null
              })}
              {task.tags.filter(tag => typeof tag === 'object' && tag.name).length > 3 && (
                <span className="text-xs text-gray-400 flex-shrink-0">
                  +{task.tags.filter(tag => typeof tag === 'object' && tag.name).length - 3}
                </span>
              )}
            </>
          )}
        </div>

        {/* 元数据 */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {visibleFields.includes('due_date') && task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.due_date), 'MM-dd HH:mm', { locale: zhCN })}</span>
            </div>
          )}
          
          {/* 只在优先级不是'none'时显示 */}
          {visibleFields.includes('priority') && task.priority && task.priority !== 'none' && (
            <div className="flex items-center gap-1">
              <span className={cn(
                'w-2.5 h-2.5 rounded-full border',
                task.priority === 'urgent' && 'bg-red-500 border-red-600',
                task.priority === 'high' && 'bg-orange-500 border-orange-600',
                task.priority === 'medium' && 'bg-yellow-500 border-yellow-600',
                task.priority === 'low' && 'bg-blue-500 border-blue-600'
              )} />
              <span className={cn(
                'font-medium',
                task.priority === 'urgent' && 'text-red-600',
                task.priority === 'high' && 'text-orange-600',
                task.priority === 'medium' && 'text-yellow-600',
                task.priority === 'low' && 'text-blue-600'
              )}>{priorityLabels[task.priority]}</span>
            </div>
          )}

          {visibleFields.includes('progress') && task.subtasks_count > 0 && (
            <span className="text-xs">
              {task.subtasks_count} 个子任务
            </span>
          )}

          {/* 星标 */}
          {visibleFields.includes('is_starred') && task.is_starred && (
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          )}

          {/* 重复 */}
          {visibleFields.includes('repeat') && task.repeat && (
            <div className="flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              <span>{task.repeat}</span>
            </div>
          )}

          {/* 附件 */}
          {visibleFields.includes('attachments') && task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}

          {/* 评论 */}
          {visibleFields.includes('comments') && task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>{task.comments.length}</span>
            </div>
          )}

          {/* 创建时间 */}
          {visibleFields.includes('created_at') && (
            <div className="flex items-center gap-1">
              <span>创建: {format(new Date(task.created_at), 'MM-dd', { locale: zhCN })}</span>
            </div>
          )}

          {/* 更新时间 */}
          {visibleFields.includes('updated_at') && (
            <div className="flex items-center gap-1">
              <span>更新: {format(new Date(task.updated_at), 'MM-dd', { locale: zhCN })}</span>
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 - 悬停显示 */}
      <div className={cn(
        'flex items-center gap-1 transition-all duration-200',
        showActions ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
      )}>
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
