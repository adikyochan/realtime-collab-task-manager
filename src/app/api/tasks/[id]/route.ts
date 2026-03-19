import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { getAuthenticatedUser } from "@/lib/session";
import { triggerPusher } from "@/lib/pusher-server";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const existingTask = await prisma.task.findUnique({
    where: { id },
  });

  if (!existingTask) {
    return errorResponse("Task not found", 404);
  }

  const isOwner = existingTask.ownerId === user!.id;
  const isAssignee = existingTask.assigneeId === user!.id;

  if (!isOwner && !isAssignee) {
    return errorResponse("You don't have access to this task", 403);
  }

  // Assignee can ONLY update status
  if (!isOwner && isAssignee) {
    if (Object.keys(body).some((key) => key !== "status")) {
      return errorResponse("Assignees can only update task status", 403);
    }
  }

  const updateData: any = {};

  // Status — both owner and assignee can change
  if (body.status !== undefined) updateData.status = body.status;

  // Everything below — owner only
  if (isOwner) {
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined)
      updateData.description = body.description?.trim() || null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined)
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    if (body.assigneeEmail !== undefined) {
      if (!body.assigneeEmail || body.assigneeEmail.trim() === "") {
        // Clear assignee
        updateData.assigneeId = null;
        updateData.pendingAssigneeEmail = null;
      } else {
        const normalizedEmail = body.assigneeEmail.trim().toLowerCase();
        const assignee = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (assignee) {
          // User exists — link directly
          updateData.assigneeId = assignee.id;
          updateData.pendingAssigneeEmail = null;
        } else {
          // User hasn't signed up — store as pending
          updateData.assigneeId = null;
          updateData.pendingAssigneeEmail = normalizedEmail;
        }
      }
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

  // Notify whoever made the change
  await triggerPusher(`user-${user!.id}`, "task-updated", updatedTask);

  // Notify owner if they didn't make the change
  if (updatedTask.ownerId !== user!.id) {
    await triggerPusher(`user-${updatedTask.ownerId}`, "task-updated", updatedTask);
  }

  // Notify assignee if they didn't make the change
  if (updatedTask.assigneeId && updatedTask.assigneeId !== user!.id) {
    await triggerPusher(`user-${updatedTask.assigneeId}`, "task-updated", updatedTask);
  }

  return successResponse(updatedTask);
}

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

  // Notify assignee before deleting
  if (existingTask.assigneeId && existingTask.assigneeId !== user!.id) {
    await triggerPusher(
      `user-${existingTask.assigneeId}`,
      "task-deleted",
      { id }
    );
  }

  await prisma.task.delete({ where: { id } });

  await triggerPusher(`user-${user!.id}`, "task-deleted", { id });

  return successResponse({ message: "Task deleted successfully" });
}