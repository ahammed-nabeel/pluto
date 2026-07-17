"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Plus, Check, Trash2, LayoutTemplate } from "lucide-react";
import type { CardDetail, ChecklistItem } from "@/types";

interface CardChecklistProps {
  card: CardDetail;
  boardId: string;
  onUpdate: (items: CardDetail["checklistItems"]) => void;
}

export function CardChecklist({ card, boardId, onUpdate }: CardChecklistProps) {
  const items = card.checklistItems;
  const [newItemText, setNewItemText] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const checkedCount = items.filter((i) => i.is_checked).length;
  const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  const handleToggle = async (item: CardDetail["checklistItems"][0]) => {
    const newValue = !item.is_checked;
    // Optimistic update
    onUpdate(items.map((i) => i.id === item.id ? { ...i, is_checked: newValue } : i));

    try {
      const res = await fetch(`/api/checklists/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_checked: newValue }),
      });
      if (!res.ok) {
        // Revert
        onUpdate(items.map((i) => i.id === item.id ? { ...i, is_checked: !newValue } : i));
      }
    } catch {
      onUpdate(items.map((i) => i.id === item.id ? { ...i, is_checked: !newValue } : i));
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_text: newItemText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate([...items, data.data]);
        setNewItemText("");
        setShowAddInput(false);
      }
    } catch {
      toast({ title: "Failed to add item", variant: "destructive" });
    }
    setAdding(false);
  };

  const handleDelete = async (itemId: string) => {
    const prev = items;
    onUpdate(items.filter((i) => i.id !== itemId));
    try {
      await fetch(`/api/checklists/${itemId}`, { method: "DELETE" });
    } catch {
      onUpdate(prev);
    }
  };

  const handleLoadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch(`/api/checklists/templates?boardId=${card.board_id}`);
      const data = await res.json();
      setTemplates(data.data ?? []);
      setShowTemplates(true);
    } catch {}
    setLoadingTemplates(false);
  };

  const handleApplyTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/cards/${card.id}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate([...items, ...data.data]);
        setShowTemplates(false);
        toast({ title: "Template applied", variant: "success" });
      }
    } catch {
      toast({ title: "Failed to apply template", variant: "destructive" });
    }
  };

  return (
    <div className="px-6 py-5">
      {/* Header + progress */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Checklist {items.length > 0 && <span className="text-slate-400 font-normal">({checkedCount}/{items.length})</span>}
        </h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon-sm" onClick={handleLoadTemplates} loading={loadingTemplates} title="Apply template">
            <LayoutTemplate className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setShowAddInput(true)} title="Add item">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{progress}%</span>
          </div>
        </div>
      )}

      {/* Template picker */}
      {showTemplates && (
        <div className="mb-4 bg-slate-50 rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">Select a template:</p>
          {templates.length === 0 ? (
            <p className="text-sm text-slate-400">No templates available</p>
          ) : (
            <div className="space-y-1">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleApplyTemplate(t.id)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-white rounded-lg transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)} className="mt-2 w-full">
            Cancel
          </Button>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 group py-1 rounded-lg hover:bg-slate-50 px-2 -mx-2">
            <button
              onClick={() => handleToggle(item)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                item.is_checked
                  ? "bg-blue-500 border-blue-500"
                  : "border-slate-300 hover:border-blue-400"
              }`}
              aria-label={item.is_checked ? "Uncheck" : "Check"}
            >
              {item.is_checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </button>
            <span className={`text-sm flex-1 ${item.is_checked ? "line-through text-slate-400" : "text-slate-700"}`}>
              {item.item_text}
            </span>
            <button
              onClick={() => handleDelete(item.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add item input */}
      {showAddInput && (
        <form onSubmit={handleAddItem} className="mt-3 flex gap-2">
          <Input
            autoFocus
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add checklist item..."
            onKeyDown={(e) => e.key === "Escape" && setShowAddInput(false)}
            className="flex-1"
          />
          <Button type="submit" size="sm" loading={adding}>Add</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddInput(false)}>Cancel</Button>
        </form>
      )}

      {items.length === 0 && !showAddInput && (
        <p className="text-sm text-slate-400 italic mt-2">
          No checklist yet.{" "}
          <button onClick={() => setShowAddInput(true)} className="text-blue-500 hover:underline">
            Add an item
          </button>{" "}
          or{" "}
          <button onClick={handleLoadTemplates} className="text-blue-500 hover:underline">
            use a template
          </button>.
        </p>
      )}
    </div>
  );
}
