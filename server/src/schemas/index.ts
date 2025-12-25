import { z } from "zod/v4";

// Board Schemas - ใช้ string แทน uuid เพื่อให้ service layer จัดการ 404
export const BoardIdParamSchema = z.object({
  boardId: z.string(),
});

// Task Schemas
export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  columnId: z.string().uuid(),
  description: z.string().optional(),
});

export const MoveTaskSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int().min(1),
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

// Infer types from schemas
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type MoveTaskInput = z.infer<typeof MoveTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
