import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { getAuthenticatedUser } from "@/lib/session";
import { triggerPusher } from "@/lib/pusher-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { ownerId: user!.id },
        { assigneeId: user!.id },
      ],
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(tasks);
}

export async function POST(req: Request) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const body = await req.json();
  const { title, description, priority, dueDate, assigneeEmail } = body;

  if (!title || title.trim() === "") {
    return errorResponse("Title is required", 400);
  }

  let assigneeId: string | undefined;

  if (assigneeEmail && assigneeEmail.trim() !== "") {
    const assignee = await prisma.user.findUnique({
      where: { email: assigneeEmail.trim().toLowerCase() },
    });

    if (!assignee) {
      return errorResponse("User with this email not found", 404);
    }

    assigneeId = assignee.id;
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      ownerId: user!.id,
      assigneeId: assigneeId || null,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  // Notify the owner's channel that a new task was created
  await triggerPusher(`user-${user!.id}`, "task-created", task);

  // If assigned to someone else, notify their channel too
  if (assigneeId && assigneeId !== user!.id) {
    await triggerPusher(`user-${assigneeId}`, "task-assigned", task);
  }

  return successResponse(task, 201);
}