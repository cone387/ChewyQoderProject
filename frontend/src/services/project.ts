import apiClient from './api'
import type { Project } from '@/types'

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/projects/')
    return response.data
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
}
