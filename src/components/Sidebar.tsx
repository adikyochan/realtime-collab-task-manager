"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import {
  CheckSquare,
  Calendar,
  Inbox,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { Task } from "@/types/task";

interface SidebarProps {
  session: Session;
  activeView: string;
  onViewChange: (view: string) => void;
  taskCounts: { my: number; assigned: number };
  isMobile?: boolean;
  tasks: Task[];
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
}

export function Sidebar({
  session,
  activeView,
  onViewChange,
  taskCounts,
  isMobile = false,
  tasks,
  selectedDate,
  onDateSelect,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const isCollapsed = isMobile ? false : collapsed;

  const days = eachDayOfInterval({
    start: startOfMonth(calendarDate),
    end: endOfMonth(calendarDate),
  });

  const startDay = getDay(startOfMonth(calendarDate));

  // Get dates that have pending tasks
  const datesWithTasks = new Set(
    tasks
      .filter((t) => t.status !== "COMPLETED" && t.dueDate)
      .map((t) => format(new Date(t.dueDate!), "yyyy-MM-dd"))
  );

  const navItems = [
    {
      id: "inbox",
      label: "Inbox",
      icon: Inbox,
      count: taskCounts.my + taskCounts.assigned,
    },
    { id: "my", label: "My Tasks", icon: CheckSquare, count: taskCounts.my },
    {
      id: "assigned",
      label: "Assigned to Me",
      icon: Calendar,
      count: taskCounts.assigned,
    },
  ];

  const handleDateClick = (day: Date) => {
    // If same date clicked again — deselect
    if (selectedDate && isSameDay(day, selectedDate)) {
      onDateSelect(null);
    } else {
      onDateSelect(day);
    }
  };

  return (
    <aside
      className={cn(
        "h-screen bg-white border-r border-gray-100 flex flex-col transition-all duration-200 flex-shrink-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        {!isCollapsed && (
          <span className="text-sm font-semibold text-gray-900">RealTasks</span>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
        {/* Navigation */}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onViewChange(item.id);
              onDateSelect(null); // clear date filter when switching views
            }}
            className={cn(
              "sidebar-item w-full",
              activeView === item.id &&
                !selectedDate &&
                "sidebar-item-active"
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.count > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
                    {item.count}
                  </span>
                )}
              </>
            )}
          </button>
        ))}

        {/* Calendar */}
        {!isCollapsed && (
          <div className="mt-4 px-1">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-700">
                {format(calendarDate, "MMMM yyyy")}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                  className="p-0.5 hover:bg-gray-100 rounded text-gray-400"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                  className="p-0.5 hover:bg-gray-100 rounded text-gray-400"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span
                  key={i}
                  className="text-center text-[10px] text-gray-400 py-1"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {/* Empty offset cells */}
              {Array.from({ length: (startDay + 6) % 7 }).map((_, i) => (
                <span key={`empty-${i}`} />
              ))}

              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const hasTasks = datesWithTasks.has(dateKey);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toString()}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "relative flex flex-col items-center justify-center w-7 h-7 mx-auto rounded-full transition-colors text-[11px]",
                      isSelected
                        ? "bg-gray-900 text-white"
                        : isToday(day)
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-500 hover:bg-gray-100",
                      !isSameMonth(day, calendarDate) && "opacity-30"
                    )}
                  >
                    {format(day, "d")}
                    {/* Dot indicator for pending tasks */}
                    {hasTasks && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400" />
                    )}
                    {hasTasks && isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected date label */}
            {selectedDate && (
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-xs text-purple-600 font-medium">
                  {format(selectedDate, "d MMM yyyy")}
                </span>
                <button
                  onClick={() => onDateSelect(null)}
                  className="text-[10px] text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User profile */}
      <div className="border-t border-gray-100 p-3">
        <div
          className={cn(
            "flex items-center gap-2",
            isCollapsed && "justify-center"
          )}
        >
          <Avatar className="w-7 h-7 flex-shrink-0">
            <AvatarImage src={session.user?.image || ""} />
            <AvatarFallback className="text-xs">
              {session.user?.name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {session.user?.name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {session.user?.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1 text-gray-300 hover:text-gray-600 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}