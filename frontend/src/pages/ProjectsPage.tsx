import { useState, useEffect } from 'react'
import { Plus, Star, Trash2, Edit } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Project } from '@/types'
import { projectService } from '@/services/project'
import toast from 'react-hot-toast'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3B82F6' })

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1',
  ]

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const data = await projectService.getProjects()
      // 确保 data 是数组
      if (Array.isArray(data)) {
        setProjects(data)
      } else {
        setProjects([])
      }
    } catch (error) {
      console.error('加载项目失败:', error)
      toast.error('加载项目失败')
      setProjects([]) // 出错时设置为空数组
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project)
      setFormData({
        name: project.name,
        description: project.description || '',
        color: project.color,
      })
    } else {
      setEditingProject(null)
      setFormData({ name: '', description: '', color: '#3B82F6' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入项目名称')
      return
    }

    try {
      if (editingProject) {
        const updated = await projectService.updateProject(editingProject.id, formData)
        setProjects(projects.map(p => p.id === editingProject.id ? updated : p))
        toast.success('项目更新成功')
      } else {
        const newProject = await projectService.createProject(formData)
        setProjects([newProject, ...projects])
        toast.success('项目创建成功')
      }
      setIsModalOpen(false)
      setFormData({ name: '', description: '', color: '#3B82F6' })
    } catch (error) {
      toast.error(editingProject ? '更新项目失败' : '创建项目失败')
    }
  }

  const handleToggleFavorite = async (project: Project) => {
    try {
      const updated = await projectService.updateProject(project.id, {
        is_favorite: !project.is_favorite,
      })
      setProjects(projects.map(p => p.id === project.id ? updated : p))
      toast.success(updated.is_favorite ? '已加入收藏' : '已取消收藏')
    } catch (error) {
      toast.error('更新失败')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个项目吗?（项目中的任务也将被删除）')) return

    try {
      await projectService.deleteProject(id)
      setProjects(projects.filter(p => p.id !== id))
      toast.success('项目已删除')
    } catch (error) {
      toast.error('删除项目失败')
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">项目列表</h1>
          <Button 
            variant="primary"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建项目
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            <p className="text-lg">暂无项目</p>
            <p className="text-sm mt-2">点击上方按钮创建新项目</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="font-semibold text-lg text-gray-900">{project.name}</h3>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(project)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        project.is_favorite
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    {project.tasks_count || 0} 个任务
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(project)}
                      className="p-2 hover:bg-gray-100 rounded text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新建/编辑项目弹窗 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setFormData({ name: '', description: '', color: '#3B82F6' })
        }}
        title={editingProject ? '编辑项目' : '新建项目'}
      >
        <div className="space-y-4">
          <Input
            label="项目名称"
            placeholder="输入项目名称..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              项目描述
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入项目描述..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择颜色
            </label>
            <div className="grid grid-cols-8 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsModalOpen(false)
                setFormData({ name: '', description: '', color: '#3B82F6' })
              }}
            >
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingProject ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
