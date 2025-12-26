/// <reference types="node" />
import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/common/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME || "kanban_db",
  },
} satisfies Config;
