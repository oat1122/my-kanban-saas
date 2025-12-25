import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { BoardIdParamSchema } from "../../schemas";
import * as boardService from "../../services/board.service";

const boardRoutes: FastifyPluginAsyncZod = async (
  fastify,
  opts
): Promise<void> => {
  /**
   * GET /boards/:boardId
   * ดึงข้อมูล Board พร้อม Columns และ Tasks ทั้งหมด (สำหรับ Kanban Board)
   */
  fastify.get(
    "/:boardId",
    {
      schema: {
        params: BoardIdParamSchema,
      },
    },
    async function (request, reply) {
      const { boardId } = request.params;

      const board = await boardService.getBoardWithColumnsAndTasks(boardId);

      if (!board) {
        return reply.status(404).send({ error: "Board not found" });
      }

      return board;
    }
  );

  /**
   * GET /boards
   * ดึง Boards ทั้งหมด (สำหรับหน้า Dashboard)
   */
  fastify.get("/", async function (request, reply) {
    return boardService.getAllBoards();
  });
};

export default boardRoutes;
