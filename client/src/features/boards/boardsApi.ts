import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BoardSummary,
  BoardWithColumns,
  Task,
  CreateTaskInput,
  MoveTaskInput,
  UpdateTaskInput,
  MoveTaskResponse,
  DeleteTaskResponse,
} from "@/types";

export const boardsApi = createApi({
  reducerPath: "boardsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    credentials: "include",
  }),
  tagTypes: ["Board", "Boards"],
  endpoints: (builder) => ({
    // GET /boards - ดึง Boards ทั้งหมด
    getBoards: builder.query<BoardSummary[], void>({
      query: () => "/boards",
      providesTags: ["Boards"],
    }),

    // GET /boards/:boardId - ดึง Board พร้อม Columns และ Tasks
    getBoardById: builder.query<BoardWithColumns, string>({
      query: (boardId) => `/boards/${boardId}`,
      providesTags: (result, error, boardId) => [
        { type: "Board", id: boardId },
      ],
    }),

    // POST /tasks - สร้าง Task ใหม่
    createTask: builder.mutation<Task, CreateTaskInput & { boardId: string }>({
      query: (body) => ({
        url: "/tasks",
        method: "POST",
        body, // body includes boardId for WebSocket
      }),
      // Invalidate specific board to trigger refetch for current user
      invalidatesTags: (result, error, arg) => [
        { type: "Board", id: arg.boardId },
        "Boards",
      ],
    }),

    // PUT /tasks/:taskId/move - ย้าย Task (Drag & Drop)
    moveTask: builder.mutation<
      MoveTaskResponse,
      { taskId: string; data: MoveTaskInput & { boardId: string } }
    >({
      query: ({ taskId, data }) => ({
        url: `/tasks/${taskId}/move`,
        method: "PUT",
        body: data, // body includes boardId for WebSocket
      }),
      // Invalidate board after move
      invalidatesTags: (result, error, arg) => [
        { type: "Board", id: arg.data.boardId },
      ],
    }),

    // PATCH /tasks/:taskId - อัปเดต Task
    updateTask: builder.mutation<
      Task,
      { taskId: string; data: UpdateTaskInput & { boardId?: string } }
    >({
      query: ({ taskId, data }) => ({
        url: `/tasks/${taskId}`,
        method: "PATCH",
        body: data, // body includes boardId for WebSocket
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Board", id: arg.data.boardId },
        "Boards",
      ],
    }),

    // DELETE /tasks/:taskId - ลบ Task
    deleteTask: builder.mutation<
      DeleteTaskResponse,
      { taskId: string; boardId: string }
    >({
      query: ({ taskId, boardId }) => ({
        url: `/tasks/${taskId}?boardId=${boardId}`, // boardId as query param
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Board", id: arg.boardId },
        "Boards",
      ],
    }),
  }),
});

export const {
  useGetBoardsQuery,
  useGetBoardByIdQuery,
  useCreateTaskMutation,
  useMoveTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = boardsApi;
