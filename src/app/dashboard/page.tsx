import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome, {session.user?.name}!</h1>
        <p className="text-slate-400 mt-2">You are signed in as {session.user?.email}</p>
      </div>
    </div>
  );
}