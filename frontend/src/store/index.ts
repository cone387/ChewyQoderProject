import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import tasksReducer from './slices/tasksSlice'
import projectsReducer from './slices/projectsSlice'
import tagsReducer from './slices/tagsSlice'
import notesReducer from './slices/notesSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    projects: projectsReducer,
    tags: tagsReducer,
    notes: notesReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
