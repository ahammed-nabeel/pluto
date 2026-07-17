"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import type { CardPreview } from "@/types";

interface AddCardFormProps {
  boardId: string;
  listId: string;
  onCreated: (card: CardPreview) => void;
  onCancel: () => void;
}

export function AddCardForm({ boardId, listId, onCreated, onCancel }: AddCardFormProps) {
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list_id: listId, project_name: projectName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated(data.data);
        toast({ title: "Card created", variant: "success" });
      } else {
        const errorMsg = typeof data.error === "object" ? data.error?.message : data.error;
        toast({ title: errorMsg || "Failed to create card", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to create card", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-2">
      <Input
        autoFocus
        placeholder="Project name..."
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={loading} className="flex-1">
          Add card
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
