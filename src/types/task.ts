export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  assigneeId: string | null;
  pendingAssigneeEmail: string | null;
  owner: TaskUser;
  assignee: TaskUser | null;
}