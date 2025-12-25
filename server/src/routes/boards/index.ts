import { FastifyPluginAsync } from "fastify";
import { db } from "../../db";
import { boards, columns, tasks } from "../../db/schema";
import { eq, asc } from "drizzle-orm";

const boardRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  /**
   * GET /boards/:boardId
   * ดึงข้อมูล Board พร้อม Columns และ Tasks ทั้งหมด (สำหรับ Kanban Board)
   */
  fastify.get<{
    Params: { boardId: string };
  }>("/:boardId", async function (request, reply) {
    const { boardId } = request.params;

    // 1. ดึงข้อมูล Board
    const [board] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);

    if (!board) {
      return reply.status(404).send({ error: "Board not found" });
    }

    // 2. ดึง Columns ของ Board นี้ (เรียงตาม position)
    const boardColumns = await db
      .select()
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .orderBy(asc(columns.position));

    // 3. ดึง Tasks สำหรับแต่ละ Column
    const columnIds = boardColumns.map((col) => col.id);

    let allTasks: (typeof tasks.$inferSelect)[] = [];
    if (columnIds.length > 0) {
      // ดึง tasks ทั้งหมดที่อยู่ใน columns เหล่านี้
      allTasks = await db.select().from(tasks).orderBy(asc(tasks.position));
    }

    // 4. จัดกลุ่ม Tasks ตาม Column
    const columnsWithTasks = boardColumns.map((col) => ({
      ...col,
      tasks: allTasks
        .filter((task) => task.columnId === col.id)
        .sort((a, b) => a.position - b.position),
    }));

    return {
      ...board,
      columns: columnsWithTasks,
    };
  });

  /**
   * GET /boards
   * ดึง Boards ทั้งหมด (สำหรับหน้า Dashboard)
   */
  fastify.get("/", async function (request, reply) {
    const allBoards = await db
      .select()
      .from(boards)
      .orderBy(asc(boards.createdAt));

    return allBoards;
  });
};

export default boardRoutes;
