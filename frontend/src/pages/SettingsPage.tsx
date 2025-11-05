import { useState } from 'react'
import { User, Bell, Palette, Globe, Shield, Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth'

const SettingsPage = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', name: '个人资料', icon: User },
    { id: 'notifications', name: '通知设置', icon: Bell },
    { id: 'appearance', name: '外观', icon: Palette },
    { id: 'language', name: '语言', icon: Globe },
    { id: 'privacy', name: '隐私', icon: Shield },
    { id: 'data', name: '数据管理', icon: Download },
  ]

  return (
    <div className="h-full flex bg-gray-50">
      {/* 侧边栏 */}
      <div className="w-64 bg-white border-r p-4">
        <h1 className="text-xl font-bold mb-6 px-2">设置</h1>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto p-8">
        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-2xl font-bold">个人资料</h2>
            
            <div className="bg-white rounded-lg p-6 space-y-4 shadow border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                  {user?.username?.[0].toUpperCase()}
                </div>
                <Button size="sm" variant="outline">更换头像</Button>
              </div>

              <Input label="用户名" defaultValue={user?.username} />
              <Input label="邮箱" type="email" defaultValue={user?.email} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={user?.bio}
                  placeholder="介绍一下你自己..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">取消</Button>
                <Button variant="primary">保存修改</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-2xl font-bold">通知设置</h2>
            
            <div className="bg-white rounded-lg p-6 space-y-4 shadow border border-gray-200">
              {[
                { label: '邮件通知', description: '接收任务提醒和更新的邮件通知' },
                { label: '浏览器推送', description: '在浏览器中显示桌面通知' },
                { label: '每日摘要', description: '每天早上接收任务摘要' },
                { label: '任务提醒', description: '在任务截止前提醒你' },
                { label: '声音提示', description: '通知时播放提示音' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-2xl font-bold">外观</h2>
            
            <div className="bg-white rounded-lg p-6 space-y-6 shadow border border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">主题</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <div className="text-center">
                        <div className={`w-16 h-16 mx-auto rounded mb-2 ${
                          theme === 'light' ? 'bg-white border border-gray-300' :
                          theme === 'dark' ? 'bg-gray-900' :
                          'bg-gradient-to-br from-white to-gray-900'
                        }`} />
                        <p className="text-sm font-medium capitalize">
                          {theme === 'light' ? '明亮' : theme === 'dark' ? '暗黑' : '跟随系统'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">主题色</h3>
                <div className="flex gap-3">
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-2xl font-bold">数据管理</h2>
            
            <div className="bg-white rounded-lg p-6 space-y-4 shadow border border-gray-200">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">导出数据</h3>
                <p className="text-sm text-blue-700 mb-3">
                  导出你的所有任务、项目和笔记数据为 JSON 格式
                </p>
                <Button variant="primary" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  导出数据
                </Button>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">清除缓存</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  清除本地缓存数据,可能会提高应用性能
                </p>
                <Button variant="outline">清除缓存</Button>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-900 mb-2">删除账号</h3>
                <p className="text-sm text-red-700 mb-3">
                  永久删除你的账号和所有数据,此操作无法撤销
                </p>
                <Button variant="danger">删除账号</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage
