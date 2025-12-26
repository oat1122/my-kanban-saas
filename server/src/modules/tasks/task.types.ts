import { tasks, columns, boards } from "../../common/db/schema";

/**
 * Task Types - ใช้สำหรับ Task module
 */

// Base types inferred from database schema
export type Task = typeof tasks.$inferSelect;
export type Column = typeof columns.$inferSelect;
export type Board = typeof boards.$inferSelect;

// Input types for task operations
export interface CreateTaskInput {
  title: string;
  columnId: string;
  description?: string;
}

export interface MoveTaskInput {
  columnId: string;
  position: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  isCompleted?: boolean;
}

// Response types
export interface MoveTaskResult {
  success: boolean;
  message?: string;
  task?: Task;
}

export interface DeleteTaskResult {
  success: boolean;
  message: string;
}
