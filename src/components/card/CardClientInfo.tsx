"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Pencil, Check, X, Phone, MessageCircle } from "lucide-react";
import { getWhatsAppLink } from "@/lib/utils";
import type { CardDetail } from "@/types";

interface CardClientInfoProps {
  card: CardDetail;
  boardId: string;
  onUpdate: (updates: Partial<CardDetail>) => void;
}

export function CardClientInfo({ card, boardId, onUpdate }: CardClientInfoProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_name: card.client_name ?? "",
    contact_number: card.contact_number ?? "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.data);
        setEditing(false);
        toast({ title: "Contact info updated", variant: "success" });
      }
    } catch {
      toast({ title: "Failed to update contact info", variant: "destructive" });
    }
    setSaving(false);
  };

  const phone = card.contact_number;
  const whatsappUrl = phone ? getWhatsAppLink(phone, `Hi ${card.client_name ?? "there"}, regarding ${card.project_name}`) : null;

  return (
    <div className="px-6 py-5 group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Client Info</h3>
        {!editing && (
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
        {editing && (
          <div className="flex gap-1">
            <Button size="icon-sm" variant="ghost" onClick={handleSave} loading={saving}>
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="space-y-4">
          <div onClick={() => setEditing(true)} className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
            <p className="text-xs text-slate-400 mb-0.5">Client Name</p>
            {card.client_name ? (
              <p className="text-sm font-semibold text-slate-900">{card.client_name}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Click to add client name...</p>
            )}
          </div>

          <div onClick={() => setEditing(true)} className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
            <p className="text-xs text-slate-400 mb-0.5">Contact Number</p>
            {phone ? (
              <p className="text-sm text-slate-700">{phone}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Click to add phone number...</p>
            )}
          </div>

          {phone && (
            <div className="flex gap-2 pt-1 pl-1.5">
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
                aria-label={`Call ${card.client_name}`}
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
                  aria-label={`WhatsApp ${card.client_name}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-slate-500">Client Name</Label>
            <Input
              value={form.client_name}
              onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
              className="mt-1"
              placeholder="Full name"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Contact Number</Label>
            <Input
              type="tel"
              value={form.contact_number}
              onChange={(e) => setForm((f) => ({ ...f, contact_number: e.target.value }))}
              className="mt-1"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
      )}
    </div>
  );
}
