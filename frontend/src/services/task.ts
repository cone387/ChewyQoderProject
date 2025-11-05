import apiClient from './api'
import type { Task, SystemListType, SystemListResponse, BatchUpdateRequest, BatchUpdateResponse } from '@/types'

// 定义分页响应类型
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const taskService = {
  getTasks: async (params?: Record<string, any>): Promise<Task[]> => {
    const response = await apiClient.get<PaginatedResponse<Task>>('/tasks/', { params })
    // 如果是分页响应,返回 results 数组;否则假定它已经是数组
    return response.data.results || (response.data as any)
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

  getStatistics: async (): Promise<any> => {
    const response = await apiClient.get('/tasks/statistics/')
    return response.data
  },

  getSystemList: async (type: SystemListType): Promise<SystemListResponse> => {
    const response = await apiClient.get<SystemListResponse>('/tasks/system/', {
      params: { type }
    })
    return response.data
  },

  batchUpdate: async (data: BatchUpdateRequest): Promise<BatchUpdateResponse> => {
    const response = await apiClient.post<BatchUpdateResponse>('/tasks/batch_update/', data)
    return response.data
  },

  restoreTask: async (id: number): Promise<Task> => {
    const response = await apiClient.post<Task>(`/tasks/${id}/restore/`)
    return response.data
  },

  permanentDelete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}/permanent_delete/`)
  },
}
