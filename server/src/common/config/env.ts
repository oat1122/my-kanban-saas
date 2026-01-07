import "dotenv/config";
import { z } from "zod/v4";

/**
 * Environment Variables Schema
 * ตรวจสอบ environment variables ตั้งแต่เริ่มรันเซิร์ฟเวอร์
 * ถ้าลืมใส่ค่าไหน เซิร์ฟเวอร์จะแจ้งเตือนและปิดตัวทันที (Fail Fast)
 */
const envSchema = z.object({
  // Database Configuration
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default("root"),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().default("kanban_db"),

  // Server Configuration
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(8000),

  // CORS Configuration (comma-separated origins)
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://127.0.0.1:3000")
    .transform((val) => val.split(",").map((s) => s.trim())),

  // Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Validate and parse environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

// Type export for TypeScript consumers
export type Env = z.infer<typeof envSchema>;
