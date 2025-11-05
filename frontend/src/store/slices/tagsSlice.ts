import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Tag } from '@/types'

interface TagsState {
  tags: Tag[]
  selectedTags: number[]
  isLoading: boolean
  error: string | null
}

const initialState: TagsState = {
  tags: [],
  selectedTags: [],
  isLoading: false,
  error: null,
}

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    setTags: (state, action: PayloadAction<Tag[]>) => {
      state.tags = action.payload
    },
    addTag: (state, action: PayloadAction<Tag>) => {
      state.tags.push(action.payload)
    },
    updateTag: (state, action: PayloadAction<Tag>) => {
      const index = state.tags.findIndex(t => t.id === action.payload.id)
      if (index !== -1) {
        state.tags[index] = action.payload
      }
    },
    deleteTag: (state, action: PayloadAction<number>) => {
      state.tags = state.tags.filter(t => t.id !== action.payload)
    },
    toggleSelectedTag: (state, action: PayloadAction<number>) => {
      const index = state.selectedTags.indexOf(action.payload)
      if (index > -1) {
        state.selectedTags.splice(index, 1)
      } else {
        state.selectedTags.push(action.payload)
      }
    },
    clearSelectedTags: (state) => {
      state.selectedTags = []
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const {
  setTags,
  addTag,
  updateTag,
  deleteTag,
  toggleSelectedTag,
  clearSelectedTags,
  setLoading,
  setError,
} = tagsSlice.actions

export default tagsSlice.reducer
