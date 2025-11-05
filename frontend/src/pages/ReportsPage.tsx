import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const ReportsPage = () => {
  const weeklyData = [
    { name: '周一', completed: 12, total: 15 },
    { name: '周二', completed: 10, total: 14 },
    { name: '周三', completed: 15, total: 18 },
    { name: '周四', completed: 8, total: 12 },
    { name: '周五', completed: 14, total: 16 },
    { name: '周六', completed: 6, total: 8 },
    { name: '周日', completed: 4, total: 6 },
  ]

  const priorityData = [
    { name: '高优先级', value: 25, color: '#EF4444' },
    { name: '中优先级', value: 45, color: '#F59E0B' },
    { name: '低优先级', value: 30, color: '#3B82F6' },
  ]

  const stats = [
    { label: '总任务数', value: '128', icon: TrendingUp, color: 'blue' },
    { label: '已完成', value: '89', icon: CheckCircle, color: 'green' },
    { label: '进行中', value: '24', icon: Clock, color: 'yellow' },
    { label: '已逾期', value: '15', icon: AlertCircle, color: 'red' },
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
          {stats.map((stat) => (
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
            <p>• 本周你完成了 69 个任务,比上周提高了 15%,表现优秀!</p>
            <p>• 你在周三的工作效率最高,建议将重要任务安排在这一天。</p>
            <p>• 有 15 个任务已逾期,建议优先处理高优先级的逾期任务。</p>
            <p>• 你倾向于使用「工作」和「学习」标签,保持了良好的任务分类习惯。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
