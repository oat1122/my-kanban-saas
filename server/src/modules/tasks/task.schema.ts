import { z } from "zod/v4";

// Task Schemas
export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  columnId: z.string().uuid(),
  description: z.string().optional(),
  boardId: z.string().uuid(), // Required for WebSocket room broadcasting
});

export const MoveTaskSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int().min(1),
  boardId: z.string().uuid(), // Required for WebSocket room broadcasting
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isCompleted: z.boolean().optional(),
});

// ใช้ string แทน uuid เพื่อให้ service layer จัดการ 404
export const TaskIdParamSchema = z.object({
  taskId: z.string(),
});

// Schema for delete with boardId in query
export const DeleteTaskQuerySchema = z.object({
  boardId: z.string().uuid(),
});

// Schema for update with boardId in body
export const UpdateTaskWithBoardSchema = UpdateTaskSchema.extend({
  boardId: z.string().uuid().optional(),
});

// Infer types from schemas
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type MoveTaskInput = z.infer<typeof MoveTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
