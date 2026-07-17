"use client";

import { useState } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { MoreHorizontal, Plus, Pencil, Trash2, GripVertical, Settings } from "lucide-react";
import { KanbanCard } from "./KanbanCard";
import { AddCardForm } from "./AddCardForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { CardPreview } from "@/types";
import { Modal } from "@/components/ui/modal";

interface List {
  id: string;
  title: string;
  position: number;
  cards: CardPreview[];
  mandatory_fields?: string[];
}

interface KanbanListProps {
  list: List;
  boardId: string;
  canManage: boolean;
  canCreateCard: boolean;
  onListDeleted: (listId: string) => void;
  onListUpdated: (listId: string, title: string) => void;
  onCardCreated: (listId: string, card: CardPreview) => void;
  onCardDeleted: (listId: string, cardId: string) => void;
  onCardUpdated: (listId: string, cardId: string, updates: Partial<CardPreview>) => void;
}

export function KanbanList({
  list,
  boardId,
  canManage,
  canCreateCard,
  onListDeleted,
  onListUpdated,
  onCardCreated,
  onCardDeleted,
  onCardUpdated,
}: KanbanListProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Settings Modal States
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedMandatoryFields, setSelectedMandatoryFields] = useState<string[]>(list.mandatory_fields ?? []);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/lists/${list.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandatory_fields: selectedMandatoryFields }),
      });
      if (res.ok) {
        toast({ title: "Mandatory fields updated successfully", variant: "success" });
        setShowSettingsModal(false);
        // Refresh page to sync list configurations
        window.location.reload();
      } else {
        toast({ title: "Failed to update settings", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to update settings", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

  // Sortable for list reordering
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: { type: "list" },
  });

  // Droppable for card drops on empty lists
  const { setNodeRef: setDropRef } = useDroppable({
    id: list.id,
    data: { type: "list" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRenameSubmit = async () => {
    if (!title.trim() || title === list.title) {
      setEditing(false);
      setTitle(list.title);
      return;
    }
    try {
      const res = await fetch(`/api/boards/${boardId}/lists/${list.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (res.ok) {
        onListUpdated(list.id, title.trim());
        toast({ title: "List renamed", variant: "success" });
      }
    } catch {
      toast({ title: "Failed to rename list", variant: "destructive" });
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/boards/${boardId}/lists/${list.id}?archiveCards=true`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onListDeleted(list.id);
        toast({ title: "List deleted", variant: "success" });
      } else {
        const data = await res.json();
        toast({ title: data.error ?? "Failed to delete list", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete list", variant: "destructive" });
    }
    setDeleting(false);
  };

  return (
    <>
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        "kanban-column flex-shrink-0",
        isDragging && "opacity-50"
      )}
    >
      {/* List Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag handle */}
          {canManage && (
            <button
              {...attributes}
              {...listeners}
              className="p-0.5 rounded hover:bg-slate-200 text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0"
              aria-label="Drag list"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          )}

          {editing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") { setEditing(false); setTitle(list.title); }
              }}
              className="text-sm font-semibold text-slate-800 bg-white rounded px-2 py-0.5 border border-blue-400 outline-none w-full"
            />
          ) : (
            <h3 className="text-sm font-semibold text-slate-800 truncate">{list.title}</h3>
          )}

          {/* Card count */}
          <span className="text-xs text-slate-400 bg-slate-200 rounded-full px-2 py-0.5 flex-shrink-0">
            {list.cards.length}
          </span>
        </div>

        {/* Menu */}
        {canManage && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"
              aria-label="List options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                  <button
                    onClick={() => { setEditing(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Rename
                  </button>
                  <button
                    onClick={() => { setShowSettingsModal(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="w-3.5 h-3.5" /> Settings
                  </button>
                  <button
                    onClick={() => { handleDelete(); setShowMenu(false); }}
                    disabled={deleting}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete list
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <SortableContext
        items={list.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setDropRef} className="kanban-column-cards">
          {list.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              boardId={boardId}
              listId={list.id}
              onDeleted={() => onCardDeleted(list.id, card.id)}
              onCardUpdated={(updates) => onCardUpdated(list.id, card.id, updates)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add card */}
      <div className="px-2 pb-2">
        {showAddCard ? (
          <AddCardForm
            boardId={boardId}
            listId={list.id}
            onCreated={(card) => {
              onCardCreated(list.id, card);
              setShowAddCard(false);
            }}
            onCancel={() => setShowAddCard(false)}
          />
        ) : canCreateCard ? (
          <button
            onClick={() => setShowAddCard(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add card
          </button>
        ) : null}
      </div>
    </div>

      {/* List Settings Modal (Mandatory Fields) */}
      {showSettingsModal && (
        <Modal
          open={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title={`List Settings: ${list.title}`}
          width="sm"
        >
          <form onSubmit={handleSettingsSubmit} className="p-6 space-y-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Mandatory Fields for this Stage
            </h4>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {[
                { key: "project_name", label: "Project Name" },
                { key: "product", label: "Product" },
                { key: "source", label: "Source" },
                { key: "description", label: "Description" },
                { key: "card_value", label: "Value" },
                { key: "label", label: "Label" },
                { key: "client_name", label: "Client Name" },
                { key: "contact_number", label: "Contact Number" },
                { key: "location_address", label: "Address" },
                { key: "card_owner_id", label: "Owner" },
              ].map((field) => {
                const isChecked = selectedMandatoryFields.includes(field.key);
                return (
                  <label
                    key={field.key}
                    className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer py-1 hover:text-slate-900 select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMandatoryFields([...selectedMandatoryFields, field.key]);
                        } else {
                          setSelectedMandatoryFields(selectedMandatoryFields.filter((f) => f !== field.key));
                        }
                      }}
                      className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/50"
                    />
                    <span>{field.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowSettingsModal(false)}
                disabled={savingSettings}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2"
                disabled={savingSettings}
                loading={savingSettings}
              >
                Save Settings
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
