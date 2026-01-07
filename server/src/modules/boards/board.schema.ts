import { z } from "zod/v4";

// Board Schemas - ใช้ string แทน uuid เพื่อให้ service layer จัดการ 404
export const BoardIdParamSchema = z.object({
  boardId: z.string(),
});

// Infer types from schemas
export type BoardIdParam = z.infer<typeof BoardIdParamSchema>;
