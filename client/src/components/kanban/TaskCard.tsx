"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import {
  GripVertical,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onToggleComplete?: (taskId: string, isCompleted: boolean) => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Due date status
  const getDueDateStatus = () => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    if (task.isCompleted) return "completed";
    if (isPast(dueDate) && !isToday(dueDate)) return "overdue";
    if (isToday(dueDate)) return "today";
    return "upcoming";
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm",
        "border border-slate-200 dark:border-slate-700",
        "hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600",
        "transition-all duration-200 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg scale-105 rotate-2",
        task.isCompleted && "opacity-60"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab touch-none"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      <div className="pl-4">
        {/* Header */}
        <div className="flex items-start gap-2">
          {/* Checkbox */}
          <button
            onClick={() => onToggleComplete?.(task.id, !task.isCompleted)}
            className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-blue-500 transition-colors"
          >
            {task.isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* Title */}
          <h3
            className={cn(
              "flex-1 text-sm font-medium text-slate-800 dark:text-slate-200",
              task.isCompleted && "line-through text-slate-500"
            )}
          >
            {task.title}
          </h3>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit?.(task)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete?.(task.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
              dueDateStatus === "overdue" &&
                "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
              dueDateStatus === "today" &&
                "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
              dueDateStatus === "upcoming" &&
                "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
              dueDateStatus === "completed" &&
                "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            )}
          >
            {format(new Date(task.dueDate), "MMM d")}
          </div>
        )}
      </div>
    </div>
  );
}
