import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Hash } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { Tag } from '@/types'
import { tagService } from '@/services/tag'
import toast from 'react-hot-toast'

const TagsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tagName, setTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState('#3B82F6')

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setIsLoading(true)
      const data = await tagService.getTags()
      if (Array.isArray(data)) {
        setTags(data)
      }
    } catch (error) {
      console.error('加载标签失败:', error)
      toast.error('加载标签失败')
    } finally {
      setIsLoading(false)
    }
  }

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1',
  ]

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setTagName(tag.name)
    setSelectedColor(tag.color || '#3B82F6')
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setEditingTag(null)
    setTagName('')
    setSelectedColor('#3B82F6')
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!tagName.trim()) {
      toast.error('请输入标签名称')
      return
    }

    try {
      if (editingTag) {
        // 编辑
        const updated = await tagService.updateTag(editingTag.id, {
          name: tagName,
          color: selectedColor,
        })
        setTags(tags.map(t => t.id === editingTag.id ? updated : t))
        toast.success('标签更新成功')
      } else {
        // 新建
        const newTag = await tagService.createTag({
          name: tagName,
          color: selectedColor,
        })
        setTags([...tags, newTag])
        toast.success('标签创建成功')
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error('保存标签失败:', error)
      toast.error('保存标签失败')
    }
  }

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`确定要删除标签“${tag.name}”吗？`)) return

    try {
      await tagService.deleteTag(tag.id)
      setTags(tags.filter(t => t.id !== tag.id))
      toast.success('标签已删除')
    } catch (error) {
      console.error('删除标签失败:', error)
      toast.error('删除标签失败')
    }
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
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Hash className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg">暂无标签</p>
            <p className="text-sm mt-2">点击上方按钮创建第一个标签</p>
          </div>
        ) : (
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
                    <button 
                      onClick={() => handleDelete(tag)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
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
        )}
      </div>

      {/* 新建/编辑标签弹窗 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTag ? '编辑标签' : '新建标签'}
      >
        <div className="space-y-4">
          <Input 
            label="标签名称" 
            placeholder="输入标签名称"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择颜色
            </label>
            <div className="grid grid-cols-8 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                    selectedColor === color ? 'border-gray-900' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingTag ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TagsPage
