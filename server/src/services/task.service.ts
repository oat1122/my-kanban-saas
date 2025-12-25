import { db } from "../db";
import { tasks, columns } from "../db/schema";
import { eq, and, gt, gte, lt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// Types
type Task = typeof tasks.$inferSelect;

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

/**
 * สร้าง Task ใหม่
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { title, columnId, description } = input;

  // Validate column exists
  const [column] = await db
    .select()
    .from(columns)
    .where(eq(columns.id, columnId))
    .limit(1);

  if (!column) {
    throw new Error("Column not found");
  }

  // Get max position in this column
  const [maxPositionResult] = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(${tasks.position}), 0)` })
    .from(tasks)
    .where(eq(tasks.columnId, columnId));

  const newPosition = (maxPositionResult?.maxPos ?? 0) + 1;

  // Create task
  const newTaskId = randomUUID();
  await db.insert(tasks).values({
    id: newTaskId,
    title,
    description,
    columnId,
    position: newPosition,
  });

  // Return created task
  const [createdTask] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, newTaskId))
    .limit(1);

  return createdTask;
}

/**
 * ย้าย Task ไปยัง Column และ Position ใหม่ (Drag & Drop)
 */
export async function moveTask(
  taskId: string,
  input: MoveTaskInput
): Promise<{ success: boolean; message?: string; task?: Task }> {
  const { columnId: newColumnId, position: newPosition } = input;

  // 1. ดึง Task ปัจจุบัน
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) {
    return { success: false, message: "Task not found" };
  }

  const oldColumnId = task.columnId;
  const oldPosition = task.position;

  // 2. ถ้าย้ายไป Column เดิม
  if (oldColumnId === newColumnId) {
    if (oldPosition === newPosition) {
      return { success: true, message: "No change needed" };
    }

    // Reorder within same column
    if (newPosition > oldPosition) {
      // Moving down: shift items between old+1 and new UP
      await db
        .update(tasks)
        .set({ position: sql`${tasks.position} - 1` })
        .where(
          and(
            eq(tasks.columnId, newColumnId),
            gt(tasks.position, oldPosition),
            sql`${tasks.position} <= ${newPosition}`
          )
        );
    } else {
      // Moving up: shift items between new and old-1 DOWN
      await db
        .update(tasks)
        .set({ position: sql`${tasks.position} + 1` })
        .where(
          and(
            eq(tasks.columnId, newColumnId),
            gte(tasks.position, newPosition),
            lt(tasks.position, oldPosition)
          )
        );
    }
  } else {
    // 3. ย้ายไป Column ใหม่
    // 3a. ลด position ของ tasks ที่อยู่หลัง task เดิม
    await db
      .update(tasks)
      .set({ position: sql`${tasks.position} - 1` })
      .where(
        and(eq(tasks.columnId, oldColumnId), gt(tasks.position, oldPosition))
      );

    // 3b. เพิ่ม position ของ tasks ที่อยู่ที่ตำแหน่งใหม่และหลังจากนั้น
    await db
      .update(tasks)
      .set({ position: sql`${tasks.position} + 1` })
      .where(
        and(eq(tasks.columnId, newColumnId), gte(tasks.position, newPosition))
      );
  }

  // 4. อัปเดต Task ไปยังตำแหน่งใหม่
  await db
    .update(tasks)
    .set({
      columnId: newColumnId,
      position: newPosition,
    })
    .where(eq(tasks.id, taskId));

  // Return updated task
  const [updatedTask] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  return { success: true, task: updatedTask };
}

/**
 * ลบ Task
 */
export async function deleteTask(
  taskId: string
): Promise<{ success: boolean; message: string }> {
  // Get task first
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) {
    return { success: false, message: "Task not found" };
  }

  // Delete task
  await db.delete(tasks).where(eq(tasks.id, taskId));

  // Reorder remaining tasks
  await db
    .update(tasks)
    .set({ position: sql`${tasks.position} - 1` })
    .where(
      and(eq(tasks.columnId, task.columnId), gt(tasks.position, task.position))
    );

  return { success: true, message: "Task deleted" };
}

/**
 * อัปเดต Task (title, description, etc.)
 */
export async function updateTask(
  taskId: string,
  updates: UpdateTaskInput
): Promise<Task | null> {
  // Check task exists
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) {
    return null;
  }

  // Update task
  await db.update(tasks).set(updates).where(eq(tasks.id, taskId));

  // Return updated task
  const [updatedTask] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  return updatedTask;
}
