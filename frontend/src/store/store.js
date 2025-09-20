// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import uiSlice from './slices/uiSlice';
import studySlice from './slices/studySlice';

export const store = configureStore({
  reducer: {
    ui: uiSlice,
    study: studySlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;