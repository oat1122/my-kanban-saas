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
  // Test connection on startup
  const isConnected = await testConnection();

  if (!isConnected) {
    fastify.log.warn("Database connection failed, but server will continue");
  }

  // Decorate fastify instance with db
  fastify.decorate("db", db);
};

export default fp(dbPlugin, {
  name: "database",
});
