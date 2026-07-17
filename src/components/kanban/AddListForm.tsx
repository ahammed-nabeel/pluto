"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

interface AddListFormProps {
  boardId: string;
  onCreated: (list: { id: string; title: string; position: number; cards: [] }) => void;
  onCancel: () => void;
}

export function AddListForm({ boardId, onCreated, onCancel }: AddListFormProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated({ ...data.data, cards: [] });
        toast({ title: "List created", variant: "success" });
      } else {
        toast({ title: data.error ?? "Failed to create list", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to create list", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-2">
      <Input
        autoFocus
        placeholder="List name..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={loading} className="flex-1">
          Add list
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
