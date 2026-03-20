"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Task } from "@/types/task";
import { format } from "date-fns";
import {
  Circle,
  CheckCircle2,
  Trash2,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { EditTaskModal } from "./EditTaskModal";

interface TaskCardProps {
  task: Task;
  currentUserId: string;
  onToggle: (taskId: string, currentStatus: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onEdit: (taskId: string, data: any) => Promise<{ error?: string } | void>;
}

const priorityConfig = {
  LOW: { label: "Low", className: "bg-gray-100 text-gray-600" },
  MEDIUM: { label: "Medium", className: "bg-amber-50 text-amber-700" },
  HIGH: { label: "High", className: "bg-red-50 text-red-600" },
};

const priorityDot = {
  LOW: "bg-gray-300",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-red-400",
};

export function TaskCard({
  task,
  currentUserId,
  onToggle,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const isCompleted = task.status === "COMPLETED";
  const isOwner = task.ownerId === currentUserId;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsToggling(true);
    await onToggle(task.id, task.status);
    setIsToggling(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(task.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
    return hasTime
      ? format(date, "d MMM, h:mm a")
      : format(date, "d MMM");
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isDeleting ? 0 : 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "group border-b border-gray-100 last:border-0",
          isCompleted && "opacity-50"
        )}
      >
        {/* Main row */}
        <div className="task-row" onClick={() => setExpanded(!expanded)}>
          {/* Complete toggle */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-gray-600 transition-colors"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-gray-400" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  priorityDot[task.priority]
                )}
              />
              <p
                className={cn(
                  "text-sm text-gray-900 truncate",
                  isCompleted && "line-through text-gray-400"
                )}
              >
                {task.title}
              </p>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-1">
              {task.dueDate && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {formatDueDate(task.dueDate)}
                </span>
              )}

              {/* Linked assignee — someone else */}
              {task.assignee && task.assignee.id !== currentUserId && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <User className="w-3 h-3" />
                  {task.assignee.name || task.assignee.email}
                </span>
              )}

              {/* Linked assignee — current user */}
              {task.assignee && task.assignee.id === currentUserId && (
                <span className="text-xs text-purple-500 font-medium">
                  Assigned to you
                </span>
              )}

              {/* Pending assignee — hasn't signed up yet */}
              {!task.assignee && task.pendingAssigneeEmail && (
                <span className="flex items-center gap-1 text-xs text-amber-500">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {"Pending: " + task.pendingAssigneeEmail}
                </span>
              )}
            </div>
          </div>

          {/* Right side actions */}
          <div className="relative flex items-center gap-1 flex-shrink-0">
            {/* Priority badge — slides left on hover to make room */}
            <Badge
              className={cn(
                "text-xs font-normal px-2 py-0.5 border-0 transition-all duration-200",
                priorityConfig[task.priority].className,
                isOwner && "group-hover:mr-14"
              )}
            >
              {priorityConfig[task.priority].label}
            </Badge>

            {/* Edit + Delete — slide in from right on hover */}
            {isOwner && (
              <div className="absolute right-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-x-3 group-hover:translate-x-0 transition-all duration-200">
                <button
                  onClick={handleEditClick}
                  className="p-1 text-gray-300 hover:text-blue-400 transition-colors rounded"
                  title="Edit task"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1 text-gray-300 hover:text-red-400 transition-colors rounded"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Expand toggle — always visible */}
            <button
              className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded detail panel */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-12 pb-3 space-y-3"
          >
            {task.description && (
              <p className="text-sm text-gray-500">{task.description}</p>
            )}

            <div className="flex items-center gap-4">
              {/* Owner */}
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={task.owner.image || ""} />
                  <AvatarFallback className="text-[10px]">
                    {task.owner.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-400">
                  {task.owner.id === currentUserId ? "You" : task.owner.name}
                </span>
              </div>

              {/* Linked assignee */}
              {task.assignee && (
                <>
                  <span className="text-xs text-gray-300">→</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={task.assignee.image || ""} />
                      <AvatarFallback className="text-[10px]">
                        {task.assignee.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-400">
                      {task.assignee.id === currentUserId
                        ? "You"
                        : task.assignee.name}
                    </span>
                  </div>
                </>
              )}

              {/* Pending assignee in expanded view */}
              {!task.assignee && task.pendingAssigneeEmail && (
                <>
                  <span className="text-xs text-gray-300">→</span>
                  <span className="flex items-center gap-1 text-xs text-amber-500">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {"Waiting for " + task.pendingAssigneeEmail}
                  </span>
                </>
              )}

              {/* Edit button inside expanded view */}
              {isOwner && (
                <button
                  onClick={handleEditClick}
                  className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditTaskModal
          task={task}
          onClose={() => setShowEditModal(false)}
          onSave={onEdit}
        />
      )}
    </>
  );
}