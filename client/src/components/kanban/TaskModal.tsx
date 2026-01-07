"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Task } from "@/types";
import { Modal, Button, Input, Textarea } from "@/components/ui";

const taskFormSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อ Task"),
  description: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSubmit: (data: TaskFormData) => Promise<void>;
}

export function TaskModal({ isOpen, onClose, task, onSubmit }: TaskModalProps) {
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
    },
  });

  // Reset form when modal opens with new task
  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data: TaskFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Edit Task" : "Create New Task"}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          id="title"
          label="Title"
          placeholder="Enter task title..."
          error={errors.title?.message}
          {...register("title")}
        />

        <Textarea
          id="description"
          label="Description (optional)"
          placeholder="Add more details..."
          rows={4}
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
