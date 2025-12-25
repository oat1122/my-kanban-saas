// server/src/db/seed.ts
import "dotenv/config";
import { db, poolConnection } from "./index";
import { users, boards, columns, tasks } from "./schema";
import { randomUUID } from "crypto";

async function main() {
  console.log("🌱 Seeding database...");

  // 1. สร้าง User จำลอง
  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    email: "test@demo.com",
    password: "hashed_password_123", // ของจริงต้อง Hash นะ
    name: "Demo User",
  });
  console.log("✅ Created User");

  // 2. สร้าง Board
  const boardId = randomUUID();
  await db.insert(boards).values({
    id: boardId,
    name: "My First Kanban",
    description: "โปรเจกต์ทดสอบระบบ",
    userId: userId,
  });
  console.log("✅ Created Board");

  // 3. สร้าง Columns (Todo, In Progress, Done)
  const colTodoId = randomUUID();
  const colProgressId = randomUUID();
  const colDoneId = randomUUID();

  await db.insert(columns).values([
    { id: colTodoId, name: "To Do", position: 1, boardId },
    { id: colProgressId, name: "In Progress", position: 2, boardId },
    { id: colDoneId, name: "Done", position: 3, boardId },
  ]);
  console.log("✅ Created Columns");

  // 4. สร้าง Tasks ใส่ใน Columns
  await db.insert(tasks).values([
    {
      id: randomUUID(),
      title: "วิเคราะห์ Requirements",
      position: 1,
      columnId: colTodoId,
    },
    {
      id: randomUUID(),
      title: "ออกแบบ Database",
      position: 2,
      columnId: colTodoId,
    },
    {
      id: randomUUID(),
      title: "Setup Next.js",
      position: 1,
      columnId: colProgressId,
    },
    {
      id: randomUUID(),
      title: "Install Drizzle",
      position: 1,
      columnId: colDoneId,
    },
  ]);
  console.log("✅ Created Tasks");

  console.log("🎉 Seeding completed!");

  // Close pool connection
  await poolConnection.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("❌ Seeding failed:", err);
  await poolConnection.end();
  process.exit(1);
});
