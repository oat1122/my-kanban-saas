"use client";

import { useEffect, useCallback } from "react";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskMovedEvent,
  TaskDeletedEvent,
} from "@/lib/socket";
import { boardsApi } from "@/features/boards/boardsApi";
import { useAppDispatch } from "@/lib/hooks";

/**
 * Hook สำหรับจัดการ WebSocket connection และ events
 * - Connect เมื่อ mount
 * - Join room ของ board
 * - Listen to events และ invalidate cache
 * - Disconnect เมื่อ unmount
 */
export function useSocket(boardId: string | null) {
  const dispatch = useAppDispatch();

  // Invalidate board cache to trigger refetch
  const invalidateBoard = useCallback(() => {
    if (boardId) {
      dispatch(boardsApi.util.invalidateTags([{ type: "Board", id: boardId }]));
    }
  }, [dispatch, boardId]);

  useEffect(() => {
    if (!boardId) return;

    const socket = connectSocket();

    // Join board room
    socket.emit("board:join", boardId);
    console.log(`🔌 Joined board room: ${boardId}`);

    // Listen for task events
    const handleTaskCreated = (data: TaskCreatedEvent) => {
      console.log("📥 Task created:", data);
      invalidateBoard();
    };

    const handleTaskUpdated = (data: TaskUpdatedEvent) => {
      console.log("📥 Task updated:", data);
      invalidateBoard();
    };

    const handleTaskMoved = (data: TaskMovedEvent) => {
      console.log("📥 Task moved:", data);
      invalidateBoard();
    };

    const handleTaskDeleted = (data: TaskDeletedEvent) => {
      console.log("📥 Task deleted:", data);
      invalidateBoard();
    };

    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:moved", handleTaskMoved);
    socket.on("task:deleted", handleTaskDeleted);

    // Cleanup
    return () => {
      socket.emit("board:leave", boardId);
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:moved", handleTaskMoved);
      socket.off("task:deleted", handleTaskDeleted);
      console.log(`🔌 Left board room: ${boardId}`);
    };
  }, [boardId, invalidateBoard]);

  // Disconnect socket when component tree unmounts
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);
}
