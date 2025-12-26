import { io, Socket } from "socket.io-client";

// Socket.io client instance
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// WebSocket Events Types
export interface TaskCreatedEvent {
  task: {
    id: string;
    title: string;
    description: string | null;
    position: number;
    columnId: string;
    assigneeId: string | null;
    dueDate: string | null;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
  boardId: string;
}

export interface TaskUpdatedEvent {
  task: TaskCreatedEvent["task"];
  boardId: string;
}

export interface TaskMovedEvent {
  task: TaskCreatedEvent["task"];
  boardId: string;
}

export interface TaskDeletedEvent {
  taskId: string;
  boardId: string;
}
