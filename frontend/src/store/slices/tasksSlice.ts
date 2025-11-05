import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Task, FilterOptions } from '@/types'

interface TasksState {
  tasks: Task[]
  selectedTask: Task | null
  filter: FilterOptions
  viewMode: 'list' | 'calendar' | 'timeline'
  isLoading: boolean
  error: string | null
}

const initialState: TasksState = {
  tasks: [],
  selectedTask: null,
  filter: {},
  viewMode: 'list',
  isLoading: false,
  error: null,
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload)
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id)
      if (index !== -1) {
        state.tasks[index] = action.payload
      }
    },
    deleteTask: (state, action: PayloadAction<number>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload)
    },
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload
    },
    setFilter: (state, action: PayloadAction<FilterOptions>) => {
      state.filter = action.payload
    },
    setViewMode: (state, action: PayloadAction<'list' | 'calendar' | 'timeline'>) => {
      state.viewMode = action.payload
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
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setSelectedTask,
  setFilter,
  setViewMode,
  setLoading,
  setError,
} = tasksSlice.actions

export default tasksSlice.reducer
