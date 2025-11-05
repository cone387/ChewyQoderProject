import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events] = useState([
    {
      id: '1',
      title: '完成项目文档',
      start: new Date(),
      backgroundColor: '#3B82F6',
    },
    {
      id: '2',
      title: '团队会议',
      start: new Date(Date.now() + 86400000),
      backgroundColor: '#EF4444',
    },
  ])

  const handleDateClick = (arg: any) => {
    console.log('Date clicked:', arg.dateStr)
  }

  const handleEventClick = (arg: any) => {
    console.log('Event clicked:', arg.event.title)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">日历</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
            </span>
            <button className="p-2 hover:bg-gray-100 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>
            今天
          </Button>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建任务
        </Button>
      </div>

      {/* 日历主体 */}
      <div className="flex-1 p-6 overflow-auto">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          locale="zh-cn"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="100%"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
        />
      </div>
    </div>
  )
}

export default CalendarPage
