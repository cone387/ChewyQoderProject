import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

interface DroppableColumnProps {
  id: string
  children: ReactNode
}

export default function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div 
      ref={setNodeRef}
      style={{
        opacity: isOver ? 0.5 : 1,
      }}
    >
      {children}
    </div>
  )
}
