import fp from "fastify-plugin";
import {
  FastifyInstance,
  FastifyError,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { AppError } from "../common/errors/errors";
import { ZodError } from "zod/v4";
import { env } from "../common/config/env";

/**
 * Global Error Handler Plugin
 * ดักจับ Error ทั้งหมดและแปลงเป็น HTTP Response อัตโนมัติ
 */
async function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler(
    (
      error: FastifyError | AppError | ZodError | Error,
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      // Log error for debugging
      if (env.NODE_ENV !== "test") {
        fastify.log.error(error);
      }

      // Handle AppError (custom errors)
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          error: error.message,
          statusCode: error.statusCode,
        });
      }

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: "Validation failed",
          statusCode: 400,
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      // Handle Fastify validation errors (from schema)
      if ("validation" in error && (error as FastifyError).validation) {
        return reply.status(400).send({
          error: "Validation failed",
          statusCode: 400,
          details: (error as FastifyError).validation,
        });
      }

      // Handle unknown errors
      const statusCode =
        "statusCode" in error && typeof error.statusCode === "number"
          ? error.statusCode
          : 500;
      const message =
        env.NODE_ENV === "production" && statusCode === 500
          ? "Internal server error"
          : error.message;

      return reply.status(statusCode).send({
        error: message,
        statusCode,
      });
    }
  );
}

export default fp(errorHandler, {
  name: "error-handler",
});
