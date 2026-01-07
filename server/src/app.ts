import { join } from "node:path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // ========================================
  // Root Route (Health Check)
  // ========================================
  fastify.get("/", async (request, reply) => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // ========================================
  // Plugins
  // ========================================
  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  // ========================================
  // Feature-Based Module Routes
  // ========================================
  // All module routes are registered from modules/index.ts
  void fastify.register(import("./modules"));
};

export default app;
export { app, options };
