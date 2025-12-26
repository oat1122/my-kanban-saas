"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "react-hot-toast";

import type { BoardWithColumns, Task, Column } from "@/types";
import {
  useMoveTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCreateTaskMutation,
} from "@/features/boards/boardsApi";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";

interface KanbanBoardProps {
  board: BoardWithColumns;
}

export function KanbanBoard({ board }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(board.columns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  // RTK Query mutations - ส่ง boardId เพื่อ invalidate cache
  const [moveTask] = useMoveTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [createTask] = useCreateTaskMutation();

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync columns when board data changes (from polling or refetch)
  useEffect(() => {
    setColumns(board.columns);
  }, [board.columns]);

  // Find task in columns
  const findTaskInColumns = useCallback(
    (taskId: string) => {
      for (const column of columns) {
        const task = column.tasks.find((t) => t.id === taskId);
        if (task) return { task, column };
      }
      return null;
    },
    [columns]
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const result = findTaskInColumns(active.id as string);
    if (result) {
      setActiveTask(result.task);
    }
  };

  // Handle drag over (for moving between columns)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeResult = findTaskInColumns(activeId);
    if (!activeResult) return;

    // Check if dropping on a column or another task
    const overColumn = columns.find((col) => col.id === overId);
    const overTaskResult = findTaskInColumns(overId);

    const targetColumn =
      overColumn || (overTaskResult ? overTaskResult.column : null);
    if (!targetColumn || targetColumn.id === activeResult.column.id) return;

    // Optimistic update: Move task to new column
    setColumns((prev) => {
      const newColumns = prev.map((col) => ({
        ...col,
        tasks: [...col.tasks],
      }));

      // Remove from old column
      const oldCol = newColumns.find((c) => c.id === activeResult.column.id);
      if (oldCol) {
        oldCol.tasks = oldCol.tasks.filter((t) => t.id !== activeId);
      }

      // Add to new column
      const newCol = newColumns.find((c) => c.id === targetColumn.id);
      if (newCol) {
        const taskToMove = { ...activeResult.task, columnId: targetColumn.id };
        if (overTaskResult) {
          // Insert at specific position
          const overIndex = newCol.tasks.findIndex((t) => t.id === overId);
          newCol.tasks.splice(overIndex, 0, taskToMove);
        } else {
          // Add to end
          newCol.tasks.push(taskToMove);
        }
      }

      return newColumns;
    });
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;

    // Find the task and determine final position
    const result = findTaskInColumns(activeId);
    if (!result) return;

    const { column: currentColumn } = result;

    // Calculate new position (1-indexed for backend)
    const taskIndex = currentColumn.tasks.findIndex((t) => t.id === activeId);
    const newPosition = taskIndex + 1;

    try {
      await moveTask({
        taskId: activeId,
        data: {
          columnId: currentColumn.id,
          position: newPosition,
          boardId: board.id, // ส่ง boardId ใน data เพื่อ WebSocket
        },
      }).unwrap();
    } catch {
      // Rollback on error
      setColumns(board.columns);
      toast.error("Failed to move task");
    }
  };

  // Handle add task
  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedColumnId(task.columnId);
    setIsTaskModalOpen(true);
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    // Optimistic update
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    );

    try {
      await deleteTask({ taskId, boardId: board.id }).unwrap();
      toast.success("Task deleted");
    } catch {
      // Rollback
      setColumns(board.columns);
      toast.error("Failed to delete task");
    }
  };

  // Handle toggle complete
  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    // Optimistic update
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === taskId ? { ...t, isCompleted } : t
        ),
      }))
    );

    try {
      await updateTask({
        taskId,
        data: { isCompleted, boardId: board.id },
      }).unwrap();
    } catch {
      // Rollback
      setColumns(board.columns);
      toast.error("Failed to update task");
    }
  };

  // Handle submit task (create or update)
  const handleSubmitTask = async (data: {
    title: string;
    description?: string;
  }) => {
    try {
      if (editingTask) {
        await updateTask({
          taskId: editingTask.id,
          data: {
            title: data.title,
            description: data.description,
            boardId: board.id,
          },
        }).unwrap();
        toast.success("Task updated");
      } else if (selectedColumnId) {
        await createTask({
          title: data.title,
          columnId: selectedColumnId,
          description: data.description,
          boardId: board.id,
        }).unwrap();
        toast.success("Task created");
      }

      setIsTaskModalOpen(false);
      setEditingTask(null);
      setSelectedColumnId(null);
    } catch {
      toast.error(
        editingTask ? "Failed to update task" : "Failed to create task"
      );
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4 px-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-3">
              <TaskCard task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setSelectedColumnId(null);
        }}
        task={editingTask}
        onSubmit={handleSubmitTask}
      />
    </>
  );
}
