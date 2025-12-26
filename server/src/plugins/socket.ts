import fp from "fastify-plugin";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../common/config/env";

/**
 * Socket.io Plugin for Real-time Updates
 *
 * สร้าง WebSocket server สำหรับ real-time broadcasting
 * - Room-based: แต่ละ board มี room ของตัวเอง
 * - Events: task:created, task:updated, task:moved, task:deleted
 */
export default fp(async (fastify) => {
  // Socket.io with CORS configured for cross-origin requests
  // Note: We need CORS here because socket.io handles its own upgrade requests
  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
      methods: ["GET", "POST"],
    },
    // Use unique path to avoid conflict with Fastify routes
    path: "/socket.io/",
  });

  // Handle client connections
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a board room
    socket.on("board:join", (boardId: string) => {
      socket.join(`board:${boardId}`);
      console.log(`📋 Client ${socket.id} joined board: ${boardId}`);
    });

    // Leave a board room
    socket.on("board:leave", (boardId: string) => {
      socket.leave(`board:${boardId}`);
      console.log(`📋 Client ${socket.id} left board: ${boardId}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Decorate fastify with io instance for use in routes
  fastify.decorate("io", io);

  // Cleanup on close
  fastify.addHook("onClose", async () => {
    io.close();
  });
});

// Type declaration for fastify
declare module "fastify" {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}
