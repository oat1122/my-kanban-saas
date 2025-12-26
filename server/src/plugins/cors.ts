import fp from "fastify-plugin";
import cors, { FastifyCorsOptions } from "@fastify/cors";
import { env } from "../common/config/env";

/**
 * This plugin enables CORS for cross-origin requests
 *
 * @see https://github.com/fastify/fastify-cors
 */
export default fp<FastifyCorsOptions>(async (fastify) => {
  fastify.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });
});
