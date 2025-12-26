import fp from "fastify-plugin";
import { Server as SocketIOServer } from "socket.io";

/**
 * Socket.io Plugin for Real-time Updates
 *
 * สร้าง WebSocket server สำหรับ real-time broadcasting
 * - Room-based: แต่ละ board มี room ของตัวเอง
 * - Events: task:created, task:updated, task:moved, task:deleted
 */
export default fp(async (fastify) => {
  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true,
      methods: ["GET", "POST"],
    },
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
