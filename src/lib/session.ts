import { auth } from "@/auth";
import { errorResponse } from "./api-helpers";

export async function getAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return { user: null, error: errorResponse("Unauthorized", 401) };
  }

  return { user: session.user as { id: string; email: string; name: string; image: string }, error: null };
}