# 左侧菜单重构功能测试清单

## 后端功能测试

### 1. 数据库迁移
```bash
cd backend
python manage.py migrate
```
**预期结果**: 
- projects表新增is_pinned字段
- tasks表新增is_deleted字段

### 2. 测试系统清单API
```bash
# 收集箱
curl -X GET "http://localhost:8000/api/tasks/system/?type=inbox" -H "Authorization: Bearer <token>"

# 已完成
curl -X GET "http://localhost:8000/api/tasks/system/?type=completed" -H "Authorization: Bearer <token>"

# 垃圾桶
curl -X GET "http://localhost:8000/api/tasks/system/?type=trash" -H "Authorization: Bearer <token>"
```
**预期结果**: 返回对应类型的任务列表

### 3. 测试项目置顶API
```bash
curl -X POST "http://localhost:8000/api/projects/1/toggle_pin/" -H "Authorization: Bearer <token>"
```
**预期结果**: 返回更新后的项目,is_pinned值切换

### 4. 测试批量更新API
```bash
curl -X POST "http://localhost:8000/api/tasks/batch_update/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "task_ids": [1, 2, 3],
    "updates": {"status": "completed"}
  }'
```
**预期结果**: 返回更新的任务数量和任务列表

## 前端功能测试

### 1. 左侧菜单显示
- [ ] 应用启动后显示系统清单(收集箱、已完成、垃圾桶)
- [ ] 显示项目列表,分为"已置顶"和"我的清单"两组
- [ ] 每个项目显示未完成任务数量
- [ ] "更多"菜单默认折叠

### 2. 项目操作
- [ ] 悬停项目时显示操作按钮
- [ ] 点击星标图标可置顶/取消置顶项目
- [ ] 置顶项目自动移到"已置顶"分组
- [ ] 点击项目切换到对应任务列表

### 3. 系统清单功能
- [ ] 点击"收集箱"显示未分配项目的任务
- [ ] 点击"已完成"显示所有已完成任务
- [ ] 点击"垃圾桶"显示已删除任务
- [ ] 数量徽章正确显示

### 4. 任务分组显示
- [ ] 任务按"已置顶/未分类/已完成"分组
- [ ] 分组可折叠/展开
- [ ] 折叠状态保存到localStorage
- [ ] 空分组不显示

### 5. 任务操作
- [ ] 创建任务自动关联当前选中的项目
- [ ] 完成任务后自动移到"已完成"分组
- [ ] 删除任务移到垃圾桶而非永久删除
- [ ] 拖拽排序正常工作

### 6. 更多菜单
- [ ] 点击"更多"展开/收起二级菜单
- [ ] 显示日历、标签、项目管理、统计入口
- [ ] 点击菜单项正确跳转

## 已知问题修复

✅ 修复: Pin/PinOff图标不存在,改用Star/StarOff
✅ 修复: 项目列表可能为undefined,增加数组检查
✅ 修复: location.state可能为null,增加类型断言
✅ 修复: 系统清单计数可能为undefined,增加默认值
✅ 修复: tags字段可能不是数组,增加类型检查

## 边界情况测试

- [ ] 无项目时的显示
- [ ] 无任务时的显示
- [ ] 网络请求失败时的错误处理
- [ ] 刷新页面后状态保持
- [ ] 侧边栏折叠状态下的显示
