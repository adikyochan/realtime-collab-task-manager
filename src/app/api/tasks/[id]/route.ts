import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { getAuthenticatedUser } from "@/lib/session";

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────
// Updates a task. Only the task owner can update it.
// Accepts: title, description, status, priority, dueDate, assigneeEmail
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  // First check the task exists and belongs to this user
  const existingTask = await prisma.task.findUnique({
    where: { id },
  });

  if (!existingTask) {
    return errorResponse("Task not found", 404);
  }

  // Only the owner can edit a task
  if (existingTask.ownerId !== user!.id) {
    return errorResponse("You can only edit your own tasks", 403);
  }

  // Build the update data object dynamically
  // Only include fields that were actually sent in the request
  const updateData: any = {};

  if (body.title !== undefined) updateData.title = body.title.trim();
  if (body.description !== undefined) updateData.description = body.description?.trim() || null;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  // Handle assignee email update
  if (body.assigneeEmail !== undefined) {
    if (!body.assigneeEmail || body.assigneeEmail.trim() === "") {
      // Empty string = remove assignee
      updateData.assigneeId = null;
    } else {
      const assignee = await prisma.user.findUnique({
        where: { email: body.assigneeEmail.trim().toLowerCase() },
      });
      if (!assignee) {
        return errorResponse("User with this email not found", 404);
      }
      updateData.assigneeId = assignee.id;
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return successResponse(updatedTask);
}

// ─── DELETE /api/tasks/:id ────────────────────────────────────────
// Deletes a task. Only the task owner can delete it.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;

  const existingTask = await prisma.task.findUnique({
    where: { id },
  });

  if (!existingTask) {
    return errorResponse("Task not found", 404);
  }

  if (existingTask.ownerId !== user!.id) {
    return errorResponse("You can only delete your own tasks", 403);
  }

  await prisma.task.delete({
    where: { id },
  });

  return successResponse({ message: "Task deleted successfully" });
}