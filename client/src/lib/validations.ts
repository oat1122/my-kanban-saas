import { z } from "zod";

// Schema สำหรับสร้าง Task ใหม่
export const createTaskSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อ Task"),
  columnId: z.string().uuid("Invalid column ID"),
  description: z.string().optional(),
});

// Schema สำหรับอัปเดต Task
export const updateTaskSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อ Task").optional(),
  description: z.string().optional(),
  isCompleted: z.boolean().optional(),
});

// Schema สำหรับย้าย Task
export const moveTaskSchema = z.object({
  columnId: z.string().uuid("Invalid column ID"),
  position: z.number().int().min(1, "Position must be at least 1"),
});

// Export types
export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;
export type MoveTaskFormData = z.infer<typeof moveTaskSchema>;
