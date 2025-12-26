import { FastifyPluginAsync } from "fastify";

/**
 * Module Routes Index
 * รวบรวม routes ทั้งหมดจาก modules ไว้ที่เดียว
 * เพิ่ม module ใหม่ได้ที่นี่
 */
const moduleRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Board module
  void fastify.register(import("./boards/board.routes"), { prefix: "/boards" });

  // Task module
  void fastify.register(import("./tasks/task.routes"), { prefix: "/tasks" });

  // เพิ่ม modules ใหม่ได้ที่นี่:
};

export default moduleRoutes;
