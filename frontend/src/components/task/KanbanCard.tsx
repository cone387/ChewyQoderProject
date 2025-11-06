import { Task } from '@/types'
import { cn } from '@/utils/cn'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface KanbanCardProps {
  task: Task
  onClick: (task: Task) => void
  visibleFields?: string[]
}

export default function KanbanCard({ task, onClick, visibleFields = ['priority', 'project', 'tags', 'due_date'] }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={() => onClick(task)}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'opacity-50'
      )}
    >
      {/* 拖动手柄 */}
      <div
        {...listeners}
        className="flex items-center gap-2 mb-2 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
        <h4 className="flex-1 font-medium text-gray-900">{task.title}</h4>
      </div>
      
      {visibleFields.includes('project') && task.project && typeof task.project === 'object' && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: task.project.color }}
          />
          <span>{task.project.name}</span>
        </div>
      )}

      {visibleFields.includes('tags') && task.tags && Array.isArray(task.tags) && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={typeof tag === 'object' ? tag.id : tag}
              className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs"
            >
              {typeof tag === 'object' ? tag.name : tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {visibleFields.includes('priority') && task.priority && task.priority !== 'none' && (
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                task.priority === 'urgent' && 'bg-red-500',
                task.priority === 'high' && 'bg-orange-500',
                task.priority === 'medium' && 'bg-yellow-500',
                task.priority === 'low' && 'bg-blue-500'
              )}
            />
          )}
          {visibleFields.includes('due_date') && task.due_date && (
            <span>{new Date(task.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
          )}
        </div>
      </div>
    </div>
  )
}
