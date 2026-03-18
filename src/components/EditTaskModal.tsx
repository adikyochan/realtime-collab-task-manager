"use client";

import { useState } from "react";
import { Task } from "@/types/task";
import { X, Flag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { UserSearchInput } from "./UserSearchInput";

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (taskId: string, data: any) => Promise<{ error?: string } | void>;
}

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : ""
  );
  const [assigneeEmail, setAssigneeEmail] = useState(
    task.assignee?.email || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    setError("");

    const result = await onSave(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      dueDate: dueDate || null,
      assigneeEmail: assigneeEmail.trim() || null,
    });

    if (result && "error" in result) {
      setError(result.error || "Something went wrong");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Edit Task</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">
                Task name
              </label>
              <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task name"
                className="text-sm border-gray-200 focus-visible:ring-gray-300"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-300 resize-none placeholder:text-gray-300 text-gray-700"
              />
            </div>

            {/* Priority + Due date row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Priority */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">
                  Priority
                </label>
                <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-2">
                  <Flag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="text-xs text-gray-600 outline-none bg-transparent cursor-pointer flex-1"
                  >
                    {priorities.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due date */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">
                  Due date
                </label>
                <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="text-xs text-gray-600 outline-none bg-transparent flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Assignee with search */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">
                Assigned to
              </label>
              <UserSearchInput
                value={assigneeEmail}
                onChange={setAssigneeEmail}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" />
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!title.trim() || isLoading}
                className="text-xs bg-gray-900 hover:bg-gray-700 text-white px-4"
              >
                {isLoading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}