import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  taskDetailOpen: boolean
  notificationsPanelOpen: boolean
  language: 'zh' | 'en'
}

const initialState: UIState = {
  theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system',
  sidebarOpen: true,
  taskDetailOpen: false,
  notificationsPanelOpen: false,
  language: 'zh',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleTaskDetail: (state) => {
      state.taskDetailOpen = !state.taskDetailOpen
    },
    setTaskDetailOpen: (state, action: PayloadAction<boolean>) => {
      state.taskDetailOpen = action.payload
    },
    toggleNotificationsPanel: (state) => {
      state.notificationsPanelOpen = !state.notificationsPanelOpen
    },
    setLanguage: (state, action: PayloadAction<'zh' | 'en'>) => {
      state.language = action.payload
    },
  },
})

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleTaskDetail,
  setTaskDetailOpen,
  toggleNotificationsPanel,
  setLanguage,
} = uiSlice.actions

export default uiSlice.reducer
