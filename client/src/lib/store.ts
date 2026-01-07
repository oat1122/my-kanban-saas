import { configureStore } from "@reduxjs/toolkit";
import { boardsApi } from "@/features/boards/boardsApi";

export const store = configureStore({
  reducer: {
    [boardsApi.reducerPath]: boardsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(boardsApi.middleware),
});

// Infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
