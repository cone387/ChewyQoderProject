import apiClient from './api'
import type { Tag } from '@/types'

// 定义分页响应类型
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const tagService = {
  getTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get<PaginatedResponse<Tag> | Tag[]>('/tags/')
    // 如果是分页响应,返回 results 数组;否则假定它已经是数组
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results
    }
    return response.data as Tag[]
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
