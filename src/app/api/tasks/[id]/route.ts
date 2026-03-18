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

  if (existingTask.ownerId !== user!.id) {
    return errorResponse("You can only edit your own tasks", 403);
  }

  const updateData: any = {};

  if (body.title !== undefined) updateData.title = body.title.trim();
  if (body.description !== undefined) updateData.description = body.description?.trim() || null;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  if (body.assigneeEmail !== undefined) {
    if (!body.assigneeEmail || body.assigneeEmail.trim() === "") {
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

  // Notify the owner
  await triggerPusher(`user-${user!.id}`, "task-updated", updatedTask);

  // Notify the assignee if there is one and they're different from owner
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

  // Notify assignee before deleting so their UI can remove it
  if (existingTask.assigneeId && existingTask.assigneeId !== user!.id) {
    await triggerPusher(`user-${existingTask.assigneeId}`, "task-deleted", { id });
  }

  await prisma.task.delete({
    where: { id },
  });

  // Notify owner
  await triggerPusher(`user-${user!.id}`, "task-deleted", { id });

  return successResponse({ message: "Task deleted successfully" });
}