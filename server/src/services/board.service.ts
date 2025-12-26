import { db } from "../db";
import { boards, columns, tasks } from "../db/schema";
import { eq, asc, inArray } from "drizzle-orm";

// Types
type Board = typeof boards.$inferSelect;
type Column = typeof columns.$inferSelect;
type Task = typeof tasks.$inferSelect;

export interface BoardWithColumns extends Board {
  columns: (Column & { tasks: Task[] })[];
}

/**
 * ดึง Boards ทั้งหมด (สำหรับหน้า Dashboard)
 */
export async function getAllBoards(): Promise<Board[]> {
  return db.select().from(boards).orderBy(asc(boards.createdAt));
}

/**
 * ดึงข้อมูล Board พร้อม Columns และ Tasks ทั้งหมด (สำหรับ Kanban Board)
 */
export async function getBoardWithColumnsAndTasks(
  boardId: string
): Promise<BoardWithColumns | null> {
  // 1. ดึงข้อมูล Board
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1);

  if (!board) {
    return null;
  }

  // 2. ดึง Columns ของ Board นี้ (เรียงตาม position)
  const boardColumns = await db
    .select()
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(asc(columns.position));

  // 3. ดึง Tasks สำหรับแต่ละ Column
  const columnIds = boardColumns.map((col) => col.id);

  let allTasks: Task[] = [];
  if (columnIds.length > 0) {
    // Fixed: ดึงเฉพาะ tasks ที่อยู่ใน columns ของ board นี้
    allTasks = await db
      .select()
      .from(tasks)
      .where(inArray(tasks.columnId, columnIds))
      .orderBy(asc(tasks.position));
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
}
