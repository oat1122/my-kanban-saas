"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type { Column, Task } from "@/types";
import { TaskCard } from "./TaskCard";
import { Plus } from "lucide-react";

interface KanbanColumnProps {
  column: Column;
  onAddTask?: (columnId: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string, isCompleted: boolean) => void;
}

// Column color based on name
const getColumnColor = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("to do") || lowerName.includes("todo")) {
    return {
      bg: "bg-slate-100 dark:bg-slate-800/50",
      accent: "bg-slate-400",
      text: "text-slate-600 dark:text-slate-400",
    };
  }
  if (lowerName.includes("progress") || lowerName.includes("doing")) {
    return {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      accent: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
    };
  }
  if (lowerName.includes("done") || lowerName.includes("complete")) {
    return {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      accent: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  }
  return {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    accent: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-400",
  };
};

export function KanbanColumn({
  column,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const colors = getColumnColor(column.name);
  const taskIds = column.tasks.map((task) => task.id);

  return (
    <div
      className={cn(
        "flex flex-col w-80 min-w-[320px] rounded-2xl",
        colors.bg,
        "transition-all duration-200"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn("w-2 h-2 rounded-full", colors.accent)} />
        <h2 className={cn("font-semibold text-sm", colors.text)}>
          {column.name}
        </h2>
        <span
          className={cn(
            "ml-auto px-2 py-0.5 rounded-full text-xs font-medium",
            "bg-white/50 dark:bg-slate-700/50",
            colors.text
          )}
        >
          {column.tasks.length}
        </span>
      </div>

      {/* Task List */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 flex flex-col gap-3 px-3 pb-3 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600",
          isOver && "bg-blue-100/50 dark:bg-blue-900/30 rounded-xl"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </SortableContext>

        {/* Empty State */}
        {column.tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No tasks yet
            </p>
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <button
        onClick={() => onAddTask?.(column.id)}
        className={cn(
          "flex items-center gap-2 mx-3 mb-3 px-3 py-2 rounded-xl",
          "text-sm font-medium text-slate-500 dark:text-slate-400",
          "hover:bg-white/80 dark:hover:bg-slate-700/50",
          "hover:text-slate-700 dark:hover:text-slate-200",
          "transition-all duration-200"
        )}
      >
        <Plus className="w-4 h-4" />
        Add Task
      </button>
    </div>
  );
}
