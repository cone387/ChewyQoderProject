import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { taskService } from '@/services/task'
import toast from 'react-hot-toast'

interface Statistics {
  summary: {
    total: number
    completed: number
    in_progress: number
    overdue: number
    completion_rate: number
  }
  status_distribution: Array<{ status: string; count: number }>
  priority_distribution: Array<{ priority: string; count: number }>
  weekly_data: Array<{ date: string; completed: number; total: number }>
  project_distribution: Array<{ project__id: number; project__name: string; count: number }>
  tag_stats: Array<{ tag__id: number; tag__name: string; count: number }>
}

const ReportsPage = () => {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setIsLoading(true)
      const data = await taskService.getStatistics()
      setStats(data)
    } catch (error) {
      console.error('加载统计数据失败:', error)
      toast.error('加载统计数据失败')
    } finally {
      setIsLoading(false)
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

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-600">暂无统计数据</p>
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    todo: '待办',
    in_progress: '进行中',
    completed: '已完成',
  }

  const priorityLabels: Record<string, string> = {
    none: '无',
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }

  const priorityColors: Record<string, string> = {
    none: '#94A3B8',
    low: '#3B82F6',
    medium: '#F59E0B',
    high: '#F97316',
    urgent: '#EF4444',
  }

  // 转换每周数据格式
  const weeklyData = stats.weekly_data.map(item => ({
    name: new Date(item.date).toLocaleDateString('zh-CN', { weekday: 'short' }),
    completed: item.completed,
    total: item.total,
  }))

  // 转换优先级数据
  const priorityData = stats.priority_distribution
    .filter(item => item.priority !== 'none')
    .map(item => ({
      name: priorityLabels[item.priority],
      value: item.count,
      color: priorityColors[item.priority],
    }))

  const summaryStats = [
    { label: '总任务数', value: stats.summary.total.toString(), icon: TrendingUp, color: 'blue' },
    { label: '已完成', value: stats.summary.completed.toString(), icon: CheckCircle, color: 'green' },
    { label: '进行中', value: stats.summary.in_progress.toString(), icon: Clock, color: 'yellow' },
    { label: '已逾期', value: stats.summary.overdue.toString(), icon: AlertCircle, color: 'red' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-6 space-y-6">
        {/* 头部 */}
        <div>
          <h1 className="text-2xl font-bold mb-2">数据统计</h1>
          <p className="text-gray-600">查看你的任务完成情况和效率分析</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg p-6 shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorMap[stat.color]}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 每周完成情况 */}
          <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">每周完成情况</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="已完成" fill="#10B981" />
                <Bar dataKey="total" name="总任务" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 优先级分布 */}
          <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">优先级分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI 分析总结 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI 智能分析
          </h3>
          <div className="space-y-2 text-gray-700">
            <p>• 你当前有 {stats.summary.total} 个任务，已完成 {stats.summary.completed} 个，完成率 {stats.summary.completion_rate}%。</p>
            {stats.summary.overdue > 0 && (
              <p>• 有 {stats.summary.overdue} 个任务已逾期，建议优先处理高优先级的逾期任务。</p>
            )}
            {stats.tag_stats.length > 0 && (
              <p>• 你最常使用的标签是「{stats.tag_stats[0].tag__name}」，保持了良好的任务分类习惯。</p>
            )}
            {stats.summary.in_progress > 0 && (
              <p>• 当前有 {stats.summary.in_progress} 个任务进行中，建议保持专注，逐个完成。</p>
            )}
            {stats.summary.completion_rate >= 70 && (
              <p>• 你的完成率很高，表现优秀！继续保持。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
