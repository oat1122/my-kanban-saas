import { env } from "../config/env";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// Database connection configuration using validated env
const poolConnection = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create Drizzle ORM instance
export const db = drizzle(poolConnection);

// Export pool for direct access if needed
export { poolConnection };

// Test database connection
export async function testConnection() {
  try {
    const connection = await poolConnection.getConnection();
    console.log("✅ Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}
