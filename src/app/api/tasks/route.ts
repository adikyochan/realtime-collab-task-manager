import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { getAuthenticatedUser } from "@/lib/session";

// ─── GET /api/tasks ───────────────────────────────────────────────
// Fetches all tasks where the current user is either the owner
// or the assignee. Returns them newest first.
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

// ─── POST /api/tasks ──────────────────────────────────────────────
// Creates a new task. If assigneeEmail is provided, looks up that
// user and links them. Returns 404 if the email doesn't exist.
export async function POST(req: Request) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const body = await req.json();
  const { title, description, priority, dueDate, assigneeEmail } = body;

  // Validate required fields
  if (!title || title.trim() === "") {
    return errorResponse("Title is required", 400);
  }

  // If an assignee email was provided, look them up
  let assigneeId: string | undefined;

  if (assigneeEmail && assigneeEmail.trim() !== "") {
    const assignee = await prisma.user.findUnique({
      where: { email: assigneeEmail.trim().toLowerCase() },
    });

    // This is the specific error message the brief asks for
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

  return successResponse(task, 201);
}