"use client";

import { useState } from "react";
import { Plus, Calendar, User, Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TaskFormProps {
  onCreate: (data: {
    title: string;
    description?: string;
    priority: string;
    dueDate?: string;
    assigneeEmail?: string;
  }) => Promise<{ error?: string } | void>;
}

const priorities = [
  { value: "LOW", label: "Low", color: "text-gray-400" },
  { value: "MEDIUM", label: "Medium", color: "text-amber-500" },
  { value: "HIGH", label: "High", color: "text-red-500" },
];

export function TaskForm({ onCreate }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await onCreate({
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate || undefined,
        assigneeEmail: assigneeEmail || undefined,
      });

      if (result && "error" in result) {
        setError(result.error || "Something went wrong");
        return;
      }

      // Reset form on success
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
      setAssigneeEmail("");
      setIsOpen(false);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setDueDate("");
    setAssigneeEmail("");
    setError("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors py-2 px-1 w-full group"
      >
        <Plus className="w-4 h-4 group-hover:text-purple-500 transition-colors" />
        <span>Add task</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white shadow-sm"
    >
      {/* Title input */}
      <Input
        autoFocus
        placeholder="Task name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-0 border-b border-gray-100 rounded-none px-0 text-sm font-medium placeholder:text-gray-300 focus-visible:ring-0 focus-visible:border-gray-300"
      />

      {/* Description input */}
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border-0 px-0 text-sm placeholder:text-gray-300 focus-visible:ring-0 text-gray-500"
      />

      {/* Options row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Due date */}
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-xs text-gray-500 outline-none bg-transparent"
          />
        </div>

        {/* Priority selector */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-1.5">
          <Flag className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="text-xs text-gray-500 outline-none bg-transparent cursor-pointer"
          >
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assign to */}
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 flex-1 min-w-32">
          <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            type="email"
            placeholder="Assign to email..."
            value={assigneeEmail}
            onChange={(e) => setAssigneeEmail(e.target.value)}
            className="text-xs text-gray-500 outline-none bg-transparent w-full"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="w-3 h-3" />
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
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
          {isLoading ? "Adding..." : "Add task"}
        </Button>
      </div>
    </form>
  );
}