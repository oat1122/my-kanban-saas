import { boards, columns, tasks } from "../../common/db/schema";

/**
 * Board Types - ใช้สำหรับ Board module
 */

// Base types inferred from database schema
export type Board = typeof boards.$inferSelect;
export type Column = typeof columns.$inferSelect;
export type Task = typeof tasks.$inferSelect;

// Extended types
export interface BoardWithColumns extends Board {
  columns: ColumnWithTasks[];
}

export interface ColumnWithTasks extends Column {
  tasks: Task[];
}

// Input types for creating/updating boards
export interface CreateBoardInput {
  name: string;
  userId: string;
  description?: string;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string;
}
