"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Star,
  Users,
  Lock,
  Globe,
  KanbanSquare,
  Loader2,
  CheckCircle2,
  Calendar,
  ClipboardList,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarGroup } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Board = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  owner_id: string;
  is_starred: boolean;
  my_role: string | null;
  created_at: string;
  owner: {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
  };
  members: Array<{
    user: {
      id: string;
      name: string | null;
      profile_picture_url: string | null;
    };
  }>;
  _count: {
    lists: number;
    cards: number;
  };
};

type PlannerTask = {
  id: string;
  title: string;
  status: string;
  due_date: string;
  projectName: string;
  boardName: string;
  cardId: string;
  boardId: string;
};

type DashboardStats = {
  totalOpen: number;
  myTasks: number;
  dueToday: number;
  plannerTasks: PlannerTask[];
};

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOpen: 0,
    myTasks: 0,
    dueToday: 0,
    plannerTasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Planner expansion state
  const [plannerExpanded, setPlannerExpanded] = useState(false);

  // Calendar Navigation States
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    Promise.all([
      fetch("/api/boards").then((r) => r.json()),
      fetch("/api/dashboard/tasks").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()).catch(() => null),
    ])
      .then(([boardsRes, statsRes, profileRes]) => {
        setBoards(boardsRes.data ?? []);
        if (statsRes.data) {
          setStats(statsRes.data);
        }
        if (profileRes && profileRes.data) {
          setCurrentUserId(profileRes.data.id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleToggleStar = async (e: React.MouseEvent, boardId: string, currentStarred: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistically update
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, is_starred: !currentStarred } : b))
    );

    try {
      const res = await fetch(`/api/boards/${boardId}/star`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: !currentStarred }),
      });
      if (!res.ok) {
        // Revert on error
        setBoards((prev) =>
          prev.map((b) => (b.id === boardId ? { ...b, is_starred: currentStarred } : b))
        );
        toast({ title: "Failed to update favorite status", variant: "destructive" });
      }
    } catch {
      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, is_starred: currentStarred } : b))
      );
    }
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate calendar days
  const calendarCells = [];
  // Padding cells for empty days before the first day of the month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Actual month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(new Date(year, month, day));
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-slate-500 font-medium">Loading workspace dashboard...</p>
      </div>
    );
  }

  // Filter boards
  const starredBoards = boards.filter((b) => b.is_starred);
  const myBoards = boards.filter((b) => b.owner_id === currentUserId);
  const sharedBoards = boards.filter((b) => b.owner_id !== currentUserId);

  const renderBoardGrid = (list: Board[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {list.map((board) => (
        <Link
          key={board.id}
          href={`/boards/${board.slug || board.id}`}
          className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-1 hover:border-slate-350 transition-all duration-300 flex flex-col relative"
        >
          {/* Star toggle icon */}
          <button
            onClick={(e) => handleToggleStar(e, board.id, board.is_starred)}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors z-10"
            title={board.is_starred ? "Remove from Starred" : "Star Board"}
          >
            <Star
              className={cn(
                "w-4 h-4 transition-transform group-hover:scale-110 duration-200",
                board.is_starred ? "fill-amber-400 text-amber-400" : "text-slate-400"
              )}
            />
          </button>

          {/* Icon/Initials */}
          <div className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md shadow-blue-500/10">
            {board.name.charAt(0).toUpperCase()}
          </div>

          <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors truncate pr-8">
            {board.name}
          </h3>
          {board.description && (
            <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
              {board.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400 mb-5 mt-auto">
            <span>{board._count?.lists ?? 0} lists</span>
            <span>·</span>
            <span>{board.members?.length ?? 0} members</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <AvatarGroup
              users={board.members.map((m) => m.user)}
              max={3}
              size="xs"
            />
            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              {board.owner_id === currentUserId ? "Owner" : "Shared"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <KanbanSquare className="w-8 h-8 text-blue-600 flex-shrink-0" />
            Boards
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">
            Manage your workspace projects, lists, and leads.
          </p>
        </div>
        <Link href="/boards/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 font-semibold py-2 px-4 rounded-xl shadow-lg shadow-blue-500/15">
            <Plus className="w-4 h-4 mr-2" />
            New Board
          </Button>
        </Link>
      </div>

      {/* User Dashboard Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Open Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Open Tasks</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalOpen}</p>
          </div>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Open Tasks</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.myTasks}</p>
          </div>
        </div>

        {/* Due Today */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Today</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.dueToday}</p>
          </div>
        </div>

        {/* Planner Card (Click to Expand Calendar) */}
        <button
          onClick={() => setPlannerExpanded((v) => !v)}
          className={cn(
            "bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between text-left w-full group",
            plannerExpanded ? "border-blue-500 bg-blue-50/10" : "border-slate-200"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
              plannerExpanded ? "bg-blue-600 text-white" : "bg-indigo-50 text-indigo-600"
            )}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Planner</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.plannerTasks.length} Planned</p>
            </div>
          </div>
          <div className="text-slate-450 pr-1">
            {plannerExpanded ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 group-hover:text-slate-700" />}
          </div>
        </button>
      </div>

      {/* Expanded Planner Calendar View */}
      {plannerExpanded && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">Planner Calendar</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-700 min-w-32 text-center">
                {monthNames[month]} {year}
              </span>
              <div className="flex gap-1.5">
                <Button size="icon-sm" variant="ghost" onClick={handlePrevMonth} className="h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={handleNextMonth} className="h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="space-y-1 min-w-[600px]">
              <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="grid grid-cols-7 border-t border-l border-slate-150 rounded-xl overflow-hidden bg-slate-50/30">
              {calendarCells.map((cellDate, idx) => {
                if (!cellDate) {
                  return <div key={`empty-${idx}`} className="min-h-24 bg-slate-50/20 border-r border-b border-slate-150" />;
                }

                const isToday = new Date().toDateString() === cellDate.toDateString();
                const dayTasks = stats.plannerTasks.filter((t) => {
                  const td = new Date(t.due_date);
                  return td.toDateString() === cellDate.toDateString();
                });

                return (
                  <div
                    key={`day-${cellDate.getDate()}`}
                    className={cn(
                      "min-h-24 p-2 bg-white border-r border-b border-slate-150 flex flex-col gap-1 transition-colors hover:bg-slate-50/50",
                      isToday && "bg-blue-50/20"
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-bold text-slate-400 self-end mr-1",
                        isToday && "w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center"
                      )}
                    >
                      {cellDate.getDate()}
                    </span>

                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-20 pr-0.5">
                      {dayTasks.map((t) => (
                        <Link
                          key={t.id}
                          href={`/boards/${t.boardId}?cardId=${t.cardId}`}
                          className={cn(
                            "text-[10px] font-semibold p-1 rounded border transition-colors truncate flex flex-col",
                            t.status === "completed"
                              ? "bg-slate-50 border-slate-200 text-slate-400 line-through"
                              : "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100"
                          )}
                          title={`Task: ${t.title} | Card: ${t.projectName} (${t.boardName})`}
                        >
                          <span className="truncate">{t.title}</span>
                          <span className="text-[8px] text-slate-400 font-normal truncate">
                            {t.projectName}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      )}

      {boards.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No boards yet</h2>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
            Create your first board to start managing workflows, tasks, and leads.
          </p>
          <Link href="/boards/new">
            <Button className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Create your first board
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section 1: Starred Boards */}
          {starredBoards.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Starred Boards ({starredBoards.length})
              </h2>
              {renderBoardGrid(starredBoards)}
            </div>
          )}

          {/* Section 2: My Boards */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              My Boards ({myBoards.length})
            </h2>
            {myBoards.length === 0 ? (
              <div className="py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                You haven't created any boards yet.
              </div>
            ) : (
              renderBoardGrid(myBoards)
            )}
          </div>

          {/* Section 3: Shared Boards */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Shared Boards ({sharedBoards.length})
            </h2>
            {sharedBoards.length === 0 ? (
              <div className="py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No boards have been shared with you yet.
              </div>
            ) : (
              renderBoardGrid(sharedBoards)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
