export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  bio?: string
  timezone?: string
  theme?: 'light' | 'dark' | 'system'
  language?: 'zh' | 'en'
  notification_settings?: NotificationSettings
  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  email_enabled: boolean
  push_enabled: boolean
  daily_summary: boolean
  task_reminders: boolean
  sound_enabled: boolean
}

export interface Task {
  id: number
  title: string
  description?: string
  user: number
  project?: number | Project
  parent?: number
  priority: 'none' | 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'completed'
  due_date?: string
  completed_at?: string
  reminder?: string
  repeat?: RepeatType
  order: number
  is_starred: boolean
  tags?: number[] | Tag[]
  attachments?: Attachment[]
  comments?: Comment[]
  subtasks?: Task[]
  created_at: string
  updated_at: string
  subtasks_count: number
}

export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | null

export interface Attachment {
  id: number
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_at: string
}

export interface Comment {
  id: number
  content: string
  user: User
  task: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  name: string
  description?: string
  color: string
  icon?: string
  user: number
  workspace?: number
  is_favorite: boolean
  is_archived: boolean
  view_mode?: 'list' | 'board' | 'calendar'
  order: number
  created_at: string
  updated_at: string
  tasks_count: number
  completed_tasks_count: number
}

export interface Workspace {
  id: number
  name: string
  description?: string
  user: number
  projects: Project[]
  order: number
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  color: string
  user: number
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  password_confirm: string
}

export interface TokenResponse {
  access: string
  refresh: string
}

export interface Note {
  id: number
  title: string
  content: string
  user: number
  tags?: number[]
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface Reminder {
  id: number
  task: number
  remind_at: string
  is_sent: boolean
  created_at: string
}

export interface Habit {
  id: number
  name: string
  description?: string
  user: number
  frequency: 'daily' | 'weekly' | 'monthly'
  target_count: number
  color: string
  icon?: string
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: number
  habit: number
  date: string
  completed: boolean
  note?: string
  created_at: string
}

export interface Statistics {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  overdue_tasks: number
  completion_rate: number
  tasks_by_priority: Record<string, number>
  tasks_by_project: Record<string, number>
  weekly_completion: Array<{ date: string; count: number }>
}

export interface FilterOptions {
  projects?: number[]
  tags?: number[]
  priority?: Task['priority'][]
  status?: Task['status'][]
  date_range?: { start: string; end: string }
  search?: string
}
