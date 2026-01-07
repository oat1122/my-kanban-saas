import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  CreateTaskSchema,
  MoveTaskSchema,
  UpdateTaskWithBoardSchema,
  TaskIdParamSchema,
  DeleteTaskQuerySchema,
} from "./task.schema";
import * as taskService from "./task.service";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../../common/errors/errors";

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
      const { boardId, ...taskData } = request.body;
      // TODO: Get userId from auth when implemented
      const userId = undefined;

      try {
        const task = await taskService.createTask(taskData, userId);

        // Emit WebSocket event to board room
        fastify.io.to(`board:${boardId}`).emit("task:created", {
          task,
          boardId,
        });

        return reply.status(201).send(task);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Column not found") {
            throw new BadRequestError("Column not found");
          }
          if (error.message.includes("Access denied")) {
            throw new ForbiddenError(error.message);
          }
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
      // TODO: Get userId from auth when implemented
      const userId = undefined;

      const result = await taskService.moveTask(taskId, moveData, userId);

      if (!result.success) {
        if (result.message === "Task not found") {
          throw new NotFoundError("Task not found");
        }
        if (result.message === "Access denied") {
          throw new ForbiddenError("Access denied");
        }
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
      // TODO: Get userId from auth when implemented
      const userId = undefined;

      const result = await taskService.deleteTask(taskId, userId);

      if (!result.success) {
        if (result.message === "Task not found") {
          throw new NotFoundError("Task not found");
        }
        if (result.message === "Access denied") {
          throw new ForbiddenError("Access denied");
        }
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
      // TODO: Get userId from auth when implemented
      const userId = undefined;

      const task = await taskService.updateTask(taskId, updateData, userId);

      if (!task) {
        throw new NotFoundError("Task not found");
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
