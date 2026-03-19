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
  let pendingAssigneeEmail: string | undefined;

  if (assigneeEmail && assigneeEmail.trim() !== "") {
    const normalizedEmail = assigneeEmail.trim().toLowerCase();

    const assignee = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (assignee) {
      // User exists — link directly
      assigneeId = assignee.id;
    } else {
      // User hasn't signed up yet — store email as pending
      pendingAssigneeEmail = normalizedEmail;
    }
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      ownerId: user!.id,
      assigneeId: assigneeId || null,
      pendingAssigneeEmail: pendingAssigneeEmail || null,
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

  // Notify owner
  await triggerPusher(`user-${user!.id}`, "task-created", task);

  // Notify assignee if they exist and are different from owner
  if (assigneeId && assigneeId !== user!.id) {
    await triggerPusher(`user-${assigneeId}`, "task-assigned", task);
  }

  return successResponse(task, 201);
}