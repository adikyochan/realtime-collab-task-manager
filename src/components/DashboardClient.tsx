"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { pusherClient } from "@/lib/pusher-client";
import { Task } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import { TaskSkeleton } from "./TaskSkeleton";
import { Sidebar } from "./Sidebar";
import { Search, Menu, X } from "lucide-react";

// No more props — session comes from useSession()
export default function DashboardClient() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const userId = (session?.user as any)?.id as string;

  // Don't do anything until session is loaded
  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;

    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load tasks");
        setLoading(false);
      });
  }, [session, status]);

  useEffect(() => {
    if (!userId) return;

    const channel = pusherClient.subscribe(`user-${userId}`);

    channel.bind("task-created", (newTask: Task) => {
      setTasks((prev) => {
        if (prev.find((t) => t.id === newTask.id)) return prev;
        return [newTask, ...prev];
      });
    });

    channel.bind("task-assigned", (newTask: Task) => {
      setTasks((prev) => {
        if (prev.find((t) => t.id === newTask.id)) return prev;
        return [newTask, ...prev];
      });
      toast.success(`New task assigned: "${newTask.title}"`, { icon: "📋" });
    });

    channel.bind("task-updated", (updatedTask: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    });

    channel.bind("task-deleted", ({ id }: { id: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });

    return () => {
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [userId]);

  const handleCreate = useCallback(async (data: any) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) return { error: result.error };
    toast.success("Task created!", { icon: "✓" });
  }, []);

  const handleToggle = useCallback(
    async (taskId: string, currentStatus: string) => {
      const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus as any } : t
        )
      );
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: currentStatus as any } : t
          )
        );
        toast.error("Failed to update task");
      }
    },
    []
  );

  const handleDelete = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete task");
      fetch("/api/tasks").then((r) => r.json()).then(setTasks);
    } else {
      toast.success("Task deleted");
    }
  }, []);

  // Show loading state while session loads
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  const myTasks = tasks.filter((t) => t.ownerId === userId);
  const assignedTasks = tasks.filter(
    (t) => t.assigneeId === userId && t.ownerId !== userId
  );

  const getViewTasks = () => {
    let viewTasks: Task[] =
      activeView === "inbox"
        ? tasks
        : activeView === "my"
        ? myTasks
        : assignedTasks;

    if (searchQuery.trim()) {
      viewTasks = viewTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return viewTasks;
  };

  const viewTasks = getViewTasks();
  const pendingTasks = viewTasks.filter((t) => t.status !== "COMPLETED");
  const completedTasks = viewTasks.filter((t) => t.status === "COMPLETED");

  const viewLabels: Record<string, string> = {
    inbox: "Inbox",
    my: "My Tasks",
    assigned: "Assigned to Me",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontSize: "13px",
            borderRadius: "10px",
            border: "1px solid #f0f0f0",
          },
        }}
      />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-30 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-40 md:hidden"
            >
              <Sidebar
                session={session}
                activeView={activeView}
                onViewChange={(view) => {
                  setActiveView(view);
                  setMobileSidebarOpen(false);
                }}
                taskCounts={{
                  my: myTasks.length,
                  assigned: assignedTasks.length,
                }}
                isMobile
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar
          session={session}
          activeView={activeView}
          onViewChange={setActiveView}
          taskCounts={{ my: myTasks.length, assigned: assignedTasks.length }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="sticky top-0 bg-[#FAFAFA]/80 backdrop-blur-sm border-b border-gray-100 px-4 md:px-8 py-3 md:py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base md:text-lg font-semibold text-gray-900">
              {viewLabels[activeView]}
            </h1>
            <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 font-medium">
              {pendingTasks.length}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm outline-none bg-transparent flex-1 placeholder:text-gray-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500" />
              </button>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6">
          <div className="mb-6">
            <TaskForm onCreate={handleCreate} />
          </div>

          {loading && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <TaskSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && pendingTasks.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm font-medium text-gray-700">All done!</p>
              <p className="text-xs text-gray-400 mt-1">
                No tasks here. Add one above.
              </p>
            </div>
          )}

          {!loading && pendingTasks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
              <AnimatePresence>
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={userId}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && completedTasks.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-medium px-1 mb-2">
                Completed ({completedTasks.length})
              </p>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden opacity-70">
                <AnimatePresence>
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUserId={userId}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}