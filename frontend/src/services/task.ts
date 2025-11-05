import apiClient from './api'
import type { Task } from '@/types'

export const taskService = {
  getTasks: async (params?: Record<string, any>): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>('/tasks/', { params })
    return response.data
  },

  getTask: async (id: number): Promise<Task> => {
    const response = await apiClient.get<Task>(`/tasks/${id}/`)
    return response.data
  },

  createTask: async (data: Partial<Task>): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks/', data)
    return response.data
  },

  updateTask: async (id: number, data: Partial<Task>): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}/`, data)
    return response.data
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}/`)
  },

  completeTask: async (id: number): Promise<Task> => {
    const response = await apiClient.post<Task>(`/tasks/${id}/complete/`)
    return response.data
  },

  toggleStar: async (id: number): Promise<Task> => {
    const response = await apiClient.post<Task>(`/tasks/${id}/toggle_star/`)
    return response.data
  },

  getTodayTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>('/tasks/today/')
    return response.data
  },
}
