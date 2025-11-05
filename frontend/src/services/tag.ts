import apiClient from './api'
import type { Tag } from '@/types'

export const tagService = {
  getTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>('/tags/')
    return response.data
  },

  getTag: async (id: number): Promise<Tag> => {
    const response = await apiClient.get<Tag>(`/tags/${id}/`)
    return response.data
  },

  createTag: async (data: Partial<Tag>): Promise<Tag> => {
    const response = await apiClient.post<Tag>('/tags/', data)
    return response.data
  },

  updateTag: async (id: number, data: Partial<Tag>): Promise<Tag> => {
    const response = await apiClient.patch<Tag>(`/tags/${id}/`, data)
    return response.data
  },

  deleteTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/tags/${id}/`)
  },
}
