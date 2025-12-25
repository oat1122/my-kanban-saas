import { FastifyPluginAsync } from "fastify";
import { db } from "../../db";
import { tasks, columns } from "../../db/schema";
import { eq, and, gt, gte, lt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const taskRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  /**
   * POST /tasks
   * สร้าง Task ใหม่
   */
  fastify.post<{
    Body: {
      title: string;
      columnId: string;
      description?: string;
    };
  }>("/", async function (request, reply) {
    const { title, columnId, description } = request.body;

    // Validate column exists
    const [column] = await db
      .select()
      .from(columns)
      .where(eq(columns.id, columnId))
      .limit(1);

    if (!column) {
      return reply.status(400).send({ error: "Column not found" });
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

    return reply.status(201).send(createdTask);
  });

  /**
   * PUT /tasks/:taskId/move
   * ย้าย Task ไปยัง Column และ Position ใหม่ (Drag & Drop)
   */
  fastify.put<{
    Params: { taskId: string };
    Body: {
      columnId: string;
      position: number;
    };
  }>("/:taskId/move", async function (request, reply) {
    const { taskId } = request.params;
    const { columnId: newColumnId, position: newPosition } = request.body;

    // 1. ดึง Task ปัจจุบัน
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return reply.status(404).send({ error: "Task not found" });
    }

    const oldColumnId = task.columnId;
    const oldPosition = task.position;

    // 2. ถ้าย้ายไป Column เดิม
    if (oldColumnId === newColumnId) {
      if (oldPosition === newPosition) {
        // ไม่มีการเปลี่ยนแปลง
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
  });

  /**
   * DELETE /tasks/:taskId
   * ลบ Task
   */
  fastify.delete<{
    Params: { taskId: string };
  }>("/:taskId", async function (request, reply) {
    const { taskId } = request.params;

    // Get task first
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return reply.status(404).send({ error: "Task not found" });
    }

    // Delete task
    await db.delete(tasks).where(eq(tasks.id, taskId));

    // Reorder remaining tasks
    await db
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

  /**
   * PATCH /tasks/:taskId
   * อัปเดต Task (title, description, etc.)
   */
  fastify.patch<{
    Params: { taskId: string };
    Body: {
      title?: string;
      description?: string;
      isCompleted?: boolean;
    };
  }>("/:taskId", async function (request, reply) {
    const { taskId } = request.params;
    const updates = request.body;

    // Check task exists
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return reply.status(404).send({ error: "Task not found" });
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
  });
};

export default taskRoutes;
