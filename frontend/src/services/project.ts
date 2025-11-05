import apiClient from './api'
import type { Project } from '@/types'

// 定义分页响应类型
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const projectService = {
  getProjects: async (params?: Record<string, any>): Promise<Project[]> => {
    const response = await apiClient.get<PaginatedResponse<Project>>('/projects/', { params })
    // 如果是分页响应,返回 results 数组;否则假定它已经是数组
    return response.data.results || (response.data as any)
  },

  getProject: async (id: number): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${id}/`)
    return response.data
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects/', data)
    return response.data
  },

  updateProject: async (id: number, data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.patch<Project>(`/projects/${id}/`, data)
    return response.data
  },

  deleteProject: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}/`)
  },

  toggleFavorite: async (id: number): Promise<Project> => {
    const response = await apiClient.post<Project>(`/projects/${id}/toggle_favorite/`)
    return response.data
  },

  togglePin: async (id: number): Promise<Project> => {
    const response = await apiClient.post<Project>(`/projects/${id}/toggle_pin/`)
    return response.data
  },
}
