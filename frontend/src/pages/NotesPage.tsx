import { useState } from 'react'
import { Plus, Search, Grid, List as ListIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Note } from '@/types'

const NotesPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [notes] = useState<Note[]>([
    {
      id: 1,
      title: '项目规划',
      content: '# 项目目标\n\n完成前端重构...',
      user: 1,
      is_pinned: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: '学习笔记',
      content: '## React Hooks\n\n- useState\n- useEffect',
      user: 1,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ])

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">笔记</h1>
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建笔记
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 笔记列表 */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              >
                <h3 className="font-medium text-gray-900 mb-2 truncate">{note.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-4">{note.content}</p>
                <div className="mt-4 text-xs text-gray-400">
                  {new Date(note.updated_at).toLocaleDateString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{note.title}</h3>
                  <span className="text-xs text-gray-400">
                    {new Date(note.updated_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotesPage
