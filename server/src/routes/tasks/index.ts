import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  CreateTaskSchema,
  MoveTaskSchema,
  UpdateTaskSchema,
  TaskIdParamSchema,
} from "../../schemas";
import * as taskService from "../../services/task.service";

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
        const task = await taskService.createTask(request.body);
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
      const result = await taskService.moveTask(taskId, request.body);

      if (!result.success && result.message === "Task not found") {
        return reply.status(404).send({ error: "Task not found" });
      }

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
      },
    },
    async function (request, reply) {
      const { taskId } = request.params;
      const result = await taskService.deleteTask(taskId);

      if (!result.success) {
        return reply.status(404).send({ error: "Task not found" });
      }

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
        body: UpdateTaskSchema,
      },
    },
    async function (request, reply) {
      const { taskId } = request.params;
      const task = await taskService.updateTask(taskId, request.body);

      if (!task) {
        return reply.status(404).send({ error: "Task not found" });
      }

      return task;
    }
  );
};

export default taskRoutes;
