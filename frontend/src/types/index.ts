export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  title: string
  description?: string
  user: number
  project?: number
  parent?: number
  priority: 'none' | 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'completed'
  due_date?: string
  completed_at?: string
  order: number
  is_starred: boolean
  created_at: string
  updated_at: string
  subtasks_count: number
}

export interface Project {
  id: number
  name: string
  description?: string
  color: string
  user: number
  is_favorite: boolean
  order: number
  created_at: string
  updated_at: string
  tasks_count: number
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
