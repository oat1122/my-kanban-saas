import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  CreateTaskSchema,
  MoveTaskSchema,
  UpdateTaskSchema,
  TaskIdParamSchema,
} from "../../schemas";
import * as taskService from "../../services/task.service";
import { z } from "zod/v4";

// Schema for delete with boardId in query
const DeleteTaskQuerySchema = z.object({
  boardId: z.string().uuid(),
});

// Schema for update with boardId in body
const UpdateTaskWithBoardSchema = UpdateTaskSchema.extend({
  boardId: z.string().uuid().optional(),
});

const taskRoutes: FastifyPluginAsyncZod = async (
  fastify,
  opts
): Promise<void> => {
  /**
   * POST /tasks
   * สร้าง Task ใหม่
   */
  fastify.post(
    "/",
    {
      schema: {
        body: CreateTaskSchema,
      },
    },
    async function (request, reply) {
      try {
        const { boardId, ...taskData } = request.body;
        const task = await taskService.createTask(taskData);

        // Emit WebSocket event to board room
        fastify.io.to(`board:${boardId}`).emit("task:created", {
          task,
          boardId,
        });

        return reply.status(201).send(task);
      } catch (error) {
        if (error instanceof Error && error.message === "Column not found") {
          return reply.status(400).send({ error: "Column not found" });
        }
        throw error;
      }
    }
  );

  /**
   * PUT /tasks/:taskId/move
   * ย้าย Task ไปยัง Column และ Position ใหม่ (Drag & Drop)
   */
  fastify.put(
    "/:taskId/move",
    {
      schema: {
        params: TaskIdParamSchema,
        body: MoveTaskSchema,
      },
    },
    async function (request, reply) {
      const { taskId } = request.params;
      const { boardId, ...moveData } = request.body;
      const result = await taskService.moveTask(taskId, moveData);

      if (!result.success && result.message === "Task not found") {
        return reply.status(404).send({ error: "Task not found" });
      }

      // Emit WebSocket event to board room
      fastify.io.to(`board:${boardId}`).emit("task:moved", {
        task: result.task,
        boardId,
      });

      return result;
    }
  );

  /**
   * DELETE /tasks/:taskId
   * ลบ Task
   */
  fastify.delete(
    "/:taskId",
    {
      schema: {
        params: TaskIdParamSchema,
        querystring: DeleteTaskQuerySchema,
      },
    },
    async function (request, reply) {
      const { taskId } = request.params;
      const { boardId } = request.query;
      const result = await taskService.deleteTask(taskId);

      if (!result.success) {
        return reply.status(404).send({ error: "Task not found" });
      }

      // Emit WebSocket event to board room
      fastify.io.to(`board:${boardId}`).emit("task:deleted", {
        taskId,
        boardId,
      });

      return result;
    }
  );

  /**
   * PATCH /tasks/:taskId
   * อัปเดต Task (title, description, etc.)
   */
  fastify.patch(
    "/:taskId",
    {
      schema: {
        params: TaskIdParamSchema,
        body: UpdateTaskWithBoardSchema,
      },
    },
    async function (request, reply) {
      const { taskId } = request.params;
      const { boardId, ...updateData } = request.body;
      const task = await taskService.updateTask(taskId, updateData);

      if (!task) {
        return reply.status(404).send({ error: "Task not found" });
      }

      // Emit WebSocket event to board room
      if (boardId) {
        fastify.io.to(`board:${boardId}`).emit("task:updated", {
          task,
          boardId,
        });
      }

      return task;
    }
  );
};

export default taskRoutes;
