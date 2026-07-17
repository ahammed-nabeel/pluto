"use client";

import { useEffect, useState } from "react";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Pencil, Check, X, ShieldAlert } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { CardDetail } from "@/types";

interface CardProjectInfoProps {
  card: CardDetail;
  boardId: string;
  onUpdate: (updates: Partial<CardDetail>) => void;
}

type BoardMember = {
  id: string;
  user: {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
  };
};

export function CardProjectInfo({ card, boardId, onUpdate }: CardProjectInfoProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<BoardMember[]>([]);

  const [form, setForm] = useState({
    project_name: card.project_name ?? "",
    product: card.product ?? "",
    source: card.source ?? "",
    description: card.description ?? "",
    card_value: card.card_value ? Number(card.card_value).toString() : "",
    label: card.label ?? "",
    tags: (card.tags ?? []).join(", "),
    card_owner_id: card.card_owner_id ?? "",
  });

  // Fetch board members to populate the Owner dropdown
  useEffect(() => {
    if (editing) {
      fetch(`/api/boards/${boardId}/members`)
        .then((r) => r.json())
        .then((d) => setMembers(d.data ?? []))
        .catch(() => {});
    }
  }, [editing, boardId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: form.project_name,
          product: form.product || null,
          source: form.source || null,
          description: form.description || null,
          card_value: form.card_value ? parseFloat(form.card_value) : null,
          label: form.label || null,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          card_owner_id: form.card_owner_id && form.card_owner_id !== "" ? form.card_owner_id : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data.data);
        setEditing(false);
        toast({ title: "Card updated", variant: "success" });
      } else {
        const errorMsg = typeof data.error === "object"
          ? data.error?.message || Object.values(data.error.fieldErrors || {}).flat().join(", ") || "Validation failed"
          : data.error ?? "Failed to update card";
        toast({ title: errorMsg, variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to update card", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({
      project_name: card.project_name ?? "",
      product: card.product ?? "",
      source: card.source ?? "",
      description: card.description ?? "",
      card_value: card.card_value ? Number(card.card_value).toString() : "",
      label: card.label ?? "",
      tags: (card.tags ?? []).join(", "),
      card_owner_id: card.card_owner_id ?? "",
    });
  };

  if (!editing) {
    return (
      <div className="px-6 py-5 group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Project Info</h3>
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="space-y-3">
          <div onClick={() => setEditing(true)} className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
            <p className="text-xs text-slate-400 mb-0.5">Project Name</p>
            <p className="text-sm font-semibold text-slate-900">{card.project_name}</p>
          </div>
          
          <div onClick={() => setEditing(true)} className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
            <p className="text-xs text-slate-400 mb-0.5">Product</p>
            {card.product ? (
              <p className="text-sm text-slate-700">{card.product}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Click to add product name...</p>
            )}
          </div>

          <div onClick={() => setEditing(true)} className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
            <p className="text-xs text-slate-400 mb-0.5">Source</p>
            {card.source ? (
              <p className="text-sm text-slate-700">{card.source}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Click to add source (Meta, Google...)...</p>
            )}
          </div>

          <div onClick={() => setEditing(true)} className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
            <p className="text-xs text-slate-400 mb-0.5">Description</p>
            {card.description ? (
              <p className="text-sm text-slate-700 whitespace-pre-line">{card.description}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Click to add project notes...</p>
            )}
          </div>

          <div onClick={() => setEditing(true)} className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
            <p className="text-xs text-slate-400 mb-0.5">Card Value (INR)</p>
            {card.card_value ? (
              <p className="text-sm font-bold text-emerald-600">
                ₹{Number(card.card_value).toLocaleString("en-IN")}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">Click to add deal value...</p>
            )}
          </div>

          <div onClick={() => setEditing(true)} className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
            <p className="text-xs text-slate-400 mb-1">Tags</p>
            {card.tags && card.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {card.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Click to add tags...</p>
            )}
          </div>

          {/* Card Owner View at the bottom */}
          <div onClick={() => setEditing(true)} className="cursor-pointer flex items-center gap-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-3 mt-4 transition-all">
            <Avatar
              src={card.cardOwner?.profile_picture_url}
              name={card.cardOwner?.name ?? "Unassigned"}
              size="sm"
            />
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Card Owner</p>
              <p className="text-sm font-medium text-slate-800">{card.cardOwner?.name ?? "Unassigned"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Project Info</h3>
        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" onClick={handleSave} loading={saving}>
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={handleCancel}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {/* Card Owner Selector */}
        <div>
          <Label className="text-xs text-slate-500">Card Owner</Label>
          <select
            value={form.card_owner_id}
            onChange={(e) => setForm((f) => ({ ...f, card_owner_id: e.target.value }))}
            className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name ?? m.user.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs text-slate-500">Project Name *</Label>
          <Input
            value={form.project_name}
            onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Product</Label>
          <Input
            value={form.product}
            onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
            className="mt-1"
            placeholder="e.g. Smart Home Kit Pro"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-500">Source</Label>
            <select
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">None</option>
              {["Meta", "IVR", "Google", "Website", "Referral", "Other", "Outbound"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Label</Label>
            <select
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">None</option>
              {["Hot", "Warm", "Cold"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label className="text-xs text-slate-500">Card Value (₹)</Label>
          <Input
            type="number"
            value={form.card_value}
            onChange={(e) => setForm((f) => ({ ...f, card_value: e.target.value }))}
            className="mt-1"
            placeholder="0"
            min="0"
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1"
            rows={3}
            placeholder="Add a description..."
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Tags (comma-separated)</Label>
          <Input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            className="mt-1"
            placeholder="e.g. villa, bangalore, premium"
          />
        </div>
      </div>
    </div>
  );
}
