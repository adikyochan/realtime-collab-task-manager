import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  return NextResponse.json({
    session,
    cookies: allCookies.map(c => c.name),
    sessionToken: cookieStore.get("authjs.session-token")?.value?.slice(0, 20) + "..."
  });
}