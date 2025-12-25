import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { db, testConnection } from "../db";

declare module "fastify" {
  interface FastifyInstance {
    db: typeof db;
  }
}

/**
 * Database plugin - connects Drizzle ORM to Fastify
 */
const dbPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.log.info("🔌 Connecting to database...");

  // Test connection on startup
  const isConnected = await testConnection();

  if (isConnected) {
    fastify.log.info("✅ Database connected successfully!");
  } else {
    fastify.log.error("❌ Database connection failed!");
    fastify.log.warn("⚠️ Server will continue without database connection");
  }

  // Decorate fastify instance with db
  fastify.decorate("db", db);
};

export default fp(dbPlugin, {
  name: "database",
});
