import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Plus, Check, Trash2, Calendar, User } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { CardDetail, Task } from "@/types";

interface CardTasksProps {
  card: CardDetail;
  boardId: string;
  onUpdate: (tasks: Task[]) => void;
}

type BoardMember = {
  id: string;
  user: {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
  };
};

export function CardTasks({ card, boardId, onUpdate }: CardTasksProps) {
  const tasks = card.tasks;
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    assigned_to: "",
  });

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  // Fetch board members
  useEffect(() => {
    fetch(`/api/boards/${boardId}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(d.data ?? []))
      .catch(() => {});
  }, [boardId]);

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    onUpdate(tasks.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) onUpdate(tasks.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
    } catch {
      onUpdate(tasks.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const handleAssigneeChange = async (taskId: string, userId: string) => {
    const prev = tasks;
    const mapped = userId === "" ? null : userId;
    
    // Find member details to optimistically render
    const selectedMem = members.find((m) => m.user.id === userId);
    onUpdate(tasks.map((t) => t.id === taskId ? { 
      ...t, 
      assigned_to: mapped,
      assignee: selectedMem ? {
        id: selectedMem.user.id,
        name: selectedMem.user.name,
        profile_picture_url: selectedMem.user.profile_picture_url
      } : null
    } : t));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: mapped }),
      });
      if (!res.ok) onUpdate(prev);
    } catch {
      onUpdate(prev);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description || undefined,
          due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
          priority: form.priority,
          assigned_to: form.assigned_to !== "" ? form.assigned_to : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate([...tasks, data.data]);
        setForm({ title: "", description: "", due_date: "", priority: "medium", assigned_to: "" });
        setShowForm(false);
      }
    } catch {
      toast({ title: "Failed to create task", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (taskId: string) => {
    const prev = tasks;
    onUpdate(tasks.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch {
      onUpdate(prev);
    }
  };

  const statusVariant = (s: string): "pending" | "in_progress" | "completed" | "overdue" | "warning" => {
    if (s === "pending") return "pending";
    if (s === "in_progress") return "in_progress";
    if (s === "completed") return "completed";
    if (s === "overdue") return "overdue";
    return "warning";
  };

  return (
    <div className="px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Tasks{" "}
          {pendingTasks.length > 0 && (
            <span className="text-slate-400 font-normal">({pendingTasks.length} open)</span>
          )}
        </h3>
        <Button variant="ghost" size="icon-sm" onClick={() => setShowForm(true)} title="Add task">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
          <div>
            <Label className="text-xs text-slate-500">Task title *</Label>
            <Input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1"
              placeholder="What needs to be done?"
              required
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Assign to Member</Label>
            <select
              value={form.assigned_to}
              onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
              className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name || "Unknown"}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Due date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Priority</Label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {["low", "medium", "high", "critical"].map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" loading={saving}>Create Task</Button>
          </div>
        </form>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {tasks.length === 0 && !showForm && (
          <p className="text-sm text-slate-400 italic">
            No tasks yet.{" "}
            <button onClick={() => setShowForm(true)} className="text-blue-500 hover:underline">
              Add a task
            </button>
          </p>
        )}

        {[...pendingTasks, ...completedTasks].map((task) => (
          <div key={task.id} className="flex items-start gap-3 group py-2.5 px-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
            {/* Checkbox */}
            <button
              onClick={() => handleToggle(task)}
              className={`mt-1.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                task.status === "completed"
                  ? "bg-emerald-500 border-emerald-500"
                  : task.status === "overdue"
                    ? "border-red-400"
                    : "border-slate-300 hover:border-blue-400"
              }`}
            >
              {task.status === "completed" && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Badge variant={statusVariant(task.status)} dot className="text-xs">
                  {task.status.replace("_", " ")}
                </Badge>
                {task.due_date && (
                  <span className={`flex items-center gap-1 text-xs ${
                    task.status === "overdue" ? "text-red-500" : "text-slate-400"
                  }`}>
                    <Calendar className="w-3 h-3" />
                    {formatDate(task.due_date)}
                  </span>
                )}
                
                {/* Assignee select */}
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <select
                    value={task.assigned_to || ""}
                    onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                    className="bg-transparent border-none text-xs text-slate-500 focus:ring-0 cursor-pointer hover:text-slate-900 focus:outline-none pr-1"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name || "Unknown"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => handleDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 mt-1 p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
