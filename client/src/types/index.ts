// ==========================================
// Type Definitions matching Backend Schema
// ==========================================

// Task entity
export interface Task {
  id: string;
  title: string;
  description: string | null;
  position: number;
  columnId: string;
  assigneeId: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Column with tasks
export interface Column {
  id: string;
  name: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

// Board (list view)
export interface BoardSummary {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Board with columns and tasks (detail view)
export interface BoardWithColumns extends BoardSummary {
  columns: Column[];
}

// ==========================================
// API Request/Response Types
// ==========================================

// Create Task
export interface CreateTaskInput {
  title: string;
  columnId: string;
  description?: string;
}

// Move Task (Drag & Drop)
export interface MoveTaskInput {
  columnId: string;
  position: number;
}

// Update Task
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  isCompleted?: boolean;
}

// API Response for move task
export interface MoveTaskResponse {
  success: boolean;
  message?: string;
  task?: Task;
}

// API Response for delete task
export interface DeleteTaskResponse {
  success: boolean;
  message: string;
}
