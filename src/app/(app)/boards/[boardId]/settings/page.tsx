"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft, Save, Trash2, Users, Loader2, ShieldCheck, Archive } from "lucide-react";
import Link from "next/link";

type Member = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    profile_picture_url: string | null;
  };
};

type BoardDetails = {
  id: string;
  name: string;
  description: string | null;
  settings: Record<string, any>;
  members: Member[];
};

export default function BoardSettingsPage() {
  const router = useRouter();
  const { boardId } = useParams() as { boardId: string };
  const [board, setBoard] = useState<BoardDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchBoard = async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setBoard(data.data);
        setName(data.data.name);
        setDescription(data.data.description ?? "");
      } else {
        toast({ title: "Failed to load board details", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to load board details", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (res.ok) {
        toast({ title: "Board settings saved", variant: "success" });
      } else {
        toast({ title: "Failed to save settings", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: "member" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Member added successfully", variant: "success" });
        setInviteEmail("");
        fetchBoard(); // Reload members list
      } else {
        toast({ title: data.error ?? "Failed to add member", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to add member", variant: "destructive" });
    }
    setInviting(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const res = await fetch(`/api/boards/${boardId}/members?memberId=${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Member removed", variant: "success" });
        fetchBoard();
      } else {
        toast({ title: "Failed to remove member", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to remove member", variant: "destructive" });
    }
  };

  const handleDeleteBoard = async () => {
    if (!confirm("CRITICAL WARNING: This will permanently delete the board, all card columns, attachments, tasks, and data. This action CANNOT be undone. Proceed?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Board deleted successfully", variant: "success" });
        router.push("/boards");
      } else {
        toast({ title: "Failed to delete board", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete board", variant: "destructive" });
    }
    setDeleting(false);
  };

  const handleArchiveBoard = async () => {
    if (!confirm("Are you sure you want to archive this board? You can restore it later if needed. Proceed?")) return;

    setArchiving(true);
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true }),
      });
      if (res.ok) {
        toast({ title: "Board archived successfully", variant: "success" });
        router.push("/boards");
      } else {
        toast({ title: "Failed to archive board", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to archive board", variant: "destructive" });
    }
    setArchiving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="p-8 text-center text-slate-500">
        Board not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in">
      {/* Navigation */}
      <Link
        href={`/boards/${boardId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to board view
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Board Configuration</h2>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="board-name">Board Name</Label>
                <Input
                  id="board-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="board-desc">Description</Label>
                <Textarea
                  id="board-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button type="submit" loading={saving} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Settings
                </Button>
              </div>
            </form>
          </div>

          {/* Danger zone */}
          <div className="bg-red-50/50 rounded-2xl border border-red-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-red-900">Danger Zone</h3>
            <p className="text-sm text-red-700">
              Archive the board to hide it from your dashboard, or permanently delete it.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleArchiveBoard}
                loading={archiving}
                className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <Archive className="w-4 h-4" />
                Archive Board
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteBoard}
                loading={deleting}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Board
              </Button>
            </div>
          </div>
        </div>

        {/* Board Members list */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-fit">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            Members ({board.members.length})
          </h2>

          {/* Invite form */}
          <form onSubmit={handleInvite} className="space-y-2 mb-6">
            <Label htmlFor="invite-email" className="text-xs text-slate-500">Invite new member</Label>
            <div className="flex gap-2">
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="text-sm h-8"
                required
              />
              <Button type="submit" size="sm" loading={inviting}>
                Add
              </Button>
            </div>
          </form>

          {/* List of current members */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {board.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar
                    src={m.user.profile_picture_url}
                    name={m.user.name ?? m.user.email}
                    size="xs"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{m.user.name ?? "User"}</p>
                    <p className="text-xs text-slate-400 capitalize">{m.role}</p>
                  </div>
                </div>

                {m.role !== "admin" && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
