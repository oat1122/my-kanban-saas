import { db } from "../../common/db";
import { tasks, columns, boards } from "../../common/db/schema";
import { eq, and, gt, gte, lt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type {
  Task,
  CreateTaskInput,
  MoveTaskInput,
  UpdateTaskInput,
  MoveTaskResult,
  DeleteTaskResult,
} from "./task.types";

/**
 * สร้าง Task ใหม่
 * ใช้ Transaction เพื่อรับประกันความถูกต้องของข้อมูล
 */
export async function createTask(
  input: CreateTaskInput,
  userId?: string
): Promise<Task> {
  const { title, columnId, description } = input;

  return db.transaction(async (tx) => {
    // Validate column exists (and optionally verify ownership)
    const [column] = await tx
      .select()
      .from(columns)
      .where(eq(columns.id, columnId))
      .limit(1);

    if (!column) {
      throw new Error("Column not found");
    }

    // IDOR Protection: Verify user owns the board this column belongs to
    if (userId) {
      const [board] = await tx
        .select()
        .from(boards)
        .where(and(eq(boards.id, column.boardId), eq(boards.userId, userId)))
        .limit(1);

      if (!board) {
        throw new Error("Access denied: You don't own this board");
      }
    }

    // Get max position in this column
    const [maxPositionResult] = await tx
      .select({ maxPos: sql<number>`COALESCE(MAX(${tasks.position}), 0)` })
      .from(tasks)
      .where(eq(tasks.columnId, columnId));

    const newPosition = (maxPositionResult?.maxPos ?? 0) + 1;

    // Create task
    const newTaskId = randomUUID();
    await tx.insert(tasks).values({
      id: newTaskId,
      title,
      description,
      columnId,
      position: newPosition,
    });

    // Return created task
    const [createdTask] = await tx
      .select()
      .from(tasks)
      .where(eq(tasks.id, newTaskId))
      .limit(1);

    return createdTask;
  });
}

/**
 * ย้าย Task ไปยัง Column และ Position ใหม่ (Drag & Drop)
 * ใช้ Transaction เพื่อรับประกันว่าการย้ายจะสำเร็จหรือล้มเหลวพร้อมกัน
 */
export async function moveTask(
  taskId: string,
  input: MoveTaskInput,
  userId?: string
): Promise<MoveTaskResult> {
  const { columnId: newColumnId, position: newPosition } = input;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. ดึง Task ปัจจุบัน
      const [task] = await tx
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (!task) {
        return { success: false, message: "Task not found" };
      }

      // IDOR Protection: Verify user owns the board
      if (userId) {
        const [column] = await tx
          .select()
          .from(columns)
          .where(eq(columns.id, task.columnId))
          .limit(1);

        if (column) {
          const [board] = await tx
            .select()
            .from(boards)
            .where(
              and(eq(boards.id, column.boardId), eq(boards.userId, userId))
            )
            .limit(1);

          if (!board) {
            return { success: false, message: "Access denied" };
          }
        }
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
          await tx
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
          await tx
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
        await tx
          .update(tasks)
          .set({ position: sql`${tasks.position} - 1` })
          .where(
            and(
              eq(tasks.columnId, oldColumnId),
              gt(tasks.position, oldPosition)
            )
          );

        // 3b. เพิ่ม position ของ tasks ที่อยู่ที่ตำแหน่งใหม่และหลังจากนั้น
        await tx
          .update(tasks)
          .set({ position: sql`${tasks.position} + 1` })
          .where(
            and(
              eq(tasks.columnId, newColumnId),
              gte(tasks.position, newPosition)
            )
          );
      }

      // 4. อัปเดต Task ไปยังตำแหน่งใหม่
      await tx
        .update(tasks)
        .set({
          columnId: newColumnId,
          position: newPosition,
        })
        .where(eq(tasks.id, taskId));

      // Return updated task
      const [updatedTask] = await tx
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      return { success: true, task: updatedTask };
    });

    return result;
  } catch (error) {
    // Transaction failed - all changes are rolled back
    console.error("moveTask transaction failed:", error);
    return { success: false, message: "Failed to move task" };
  }
}

/**
 * ลบ Task
 * ใช้ Transaction เพื่อรับประกันว่าการลบและ reorder จะสำเร็จพร้อมกัน
 */
export async function deleteTask(
  taskId: string,
  userId?: string
): Promise<DeleteTaskResult> {
  try {
    const result = await db.transaction(async (tx) => {
      // Get task first
      const [task] = await tx
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (!task) {
        return { success: false, message: "Task not found" };
      }

      // IDOR Protection: Verify user owns the board
      if (userId) {
        const [column] = await tx
          .select()
          .from(columns)
          .where(eq(columns.id, task.columnId))
          .limit(1);

        if (column) {
          const [board] = await tx
            .select()
            .from(boards)
            .where(
              and(eq(boards.id, column.boardId), eq(boards.userId, userId))
            )
            .limit(1);

          if (!board) {
            return { success: false, message: "Access denied" };
          }
        }
      }

      // Delete task
      await tx.delete(tasks).where(eq(tasks.id, taskId));

      // Reorder remaining tasks
      await tx
        .update(tasks)
        .set({ position: sql`${tasks.position} - 1` })
        .where(
          and(
            eq(tasks.columnId, task.columnId),
            gt(tasks.position, task.position)
          )
        );

      return { success: true, message: "Task deleted" };
    });

    return result;
  } catch (error) {
    console.error("deleteTask transaction failed:", error);
    return { success: false, message: "Failed to delete task" };
  }
}

/**
 * อัปเดต Task (title, description, etc.)
 */
export async function updateTask(
  taskId: string,
  updates: UpdateTaskInput,
  userId?: string
): Promise<Task | null> {
  return db.transaction(async (tx) => {
    // Check task exists
    const [task] = await tx
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return null;
    }

    // IDOR Protection: Verify user owns the board
    if (userId) {
      const [column] = await tx
        .select()
        .from(columns)
        .where(eq(columns.id, task.columnId))
        .limit(1);

      if (column) {
        const [board] = await tx
          .select()
          .from(boards)
          .where(and(eq(boards.id, column.boardId), eq(boards.userId, userId)))
          .limit(1);

        if (!board) {
          return null;
        }
      }
    }

    // Update task
    await tx.update(tasks).set(updates).where(eq(tasks.id, taskId));

    // Return updated task
    const [updatedTask] = await tx
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    return updatedTask;
  });
}
