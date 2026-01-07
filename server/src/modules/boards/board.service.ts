import { db } from "../../common/db";
import { boards, columns, tasks } from "../../common/db/schema";
import { eq, asc, inArray, and } from "drizzle-orm";
import type { Board, BoardWithColumns, Task } from "./board.types";

/**
 * ดึง Boards ทั้งหมด (สำหรับหน้า Dashboard)
 * เพิ่ม userId parameter เพื่อกรองเฉพาะ boards ของ user นั้นๆ (IDOR Protection)
 */
export async function getAllBoards(userId?: string): Promise<Board[]> {
  if (userId) {
    return db
      .select()
      .from(boards)
      .where(eq(boards.userId, userId))
      .orderBy(asc(boards.createdAt));
  }
  // Fallback: return all boards (for development/testing only)
  return db.select().from(boards).orderBy(asc(boards.createdAt));
}

/**
 * ดึงข้อมูล Board พร้อม Columns และ Tasks ทั้งหมด (สำหรับ Kanban Board)
 * เพิ่ม userId parameter เพื่อตรวจสอบความเป็นเจ้าของ (IDOR Protection)
 */
export async function getBoardWithColumnsAndTasks(
  boardId: string,
  userId?: string
): Promise<BoardWithColumns | null> {
  // 1. ดึงข้อมูล Board พร้อมตรวจสอบ ownership
  let boardQuery;
  if (userId) {
    // IDOR Protection: ตรวจสอบว่า user เป็นเจ้าของ board
    boardQuery = db
      .select()
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.userId, userId)))
      .limit(1);
  } else {
    // Fallback: ไม่ตรวจสอบ userId (for development/testing only)
    boardQuery = db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);
  }

  const [board] = await boardQuery;

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

/**
 * สร้าง Board ใหม่
 */
export async function createBoard(
  name: string,
  userId: string,
  description?: string
): Promise<Board> {
  const { randomUUID } = await import("crypto");
  const newBoardId = randomUUID();

  await db.insert(boards).values({
    id: newBoardId,
    name,
    description,
    userId,
  });

  const [createdBoard] = await db
    .select()
    .from(boards)
    .where(eq(boards.id, newBoardId))
    .limit(1);

  return createdBoard;
}
