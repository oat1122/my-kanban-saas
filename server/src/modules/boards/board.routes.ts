import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { BoardIdParamSchema } from "./board.schema";
import * as boardService from "./board.service";
import { NotFoundError } from "../../common/errors/errors";

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
      // TODO: Get userId from auth when implemented
      // const userId = request.user?.id;
      const userId = undefined;

      const board = await boardService.getBoardWithColumnsAndTasks(
        boardId,
        userId
      );

      if (!board) {
        throw new NotFoundError("Board not found");
      }

      return board;
    }
  );

  /**
   * GET /boards
   * ดึง Boards ทั้งหมด (สำหรับหน้า Dashboard)
   */
  fastify.get("/", async function (request, reply) {
    // TODO: Get userId from auth when implemented
    // const userId = request.user?.id;
    const userId = undefined;

    return boardService.getAllBoards(userId);
  });
};

export default boardRoutes;
