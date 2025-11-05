import { useState } from 'react'
import { Plus, Edit, Trash2, Hash } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { Tag } from '@/types'

const TagsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [tags] = useState<Tag[]>([
    {
      id: 1,
      name: '工作',
      color: '#3B82F6',
      user: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: '个人',
      color: '#10B981',
      user: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: '学习',
      color: '#F59E0B',
      user: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ])

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1',
  ]

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setEditingTag(null)
    setIsModalOpen(true)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">标签管理</h1>
          <Button variant="primary" onClick={handleNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建标签
          </Button>
        </div>
      </div>

      {/* 标签列表 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-white rounded-lg p-4 shadow border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5" style={{ color: tag.color }} />
                  <h3 className="font-medium text-gray-900">{tag.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div
                className="h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <p className="text-xs text-gray-400 mt-3">
                创建于 {new Date(tag.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 新建/编辑标签弹窗 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTag ? '编辑标签' : '新建标签'}
      >
        <div className="space-y-4">
          <Input label="标签名称" placeholder="输入标签名称" />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择颜色
            </label>
            <div className="grid grid-cols-8 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary">
              {editingTag ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TagsPage
