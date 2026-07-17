"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  closestCenter,
  pointerWithin,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanList } from "./KanbanList";
import { KanbanCard } from "./KanbanCard";
import { AddListForm } from "./AddListForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { CardPreview } from "@/types";
import { Modal } from "@/components/ui/modal";

interface BoardList {
  id: string;
  title: string;
  position: number;
  cards: CardPreview[];
}

interface BoardViewProps {
  boardId: string;
  initialLists: BoardList[];
  canManageLists: boolean;
  canCreateCard: boolean;
  currentUserId: string;
}

export function BoardView({
  boardId,
  initialLists,
  canManageLists,
  canCreateCard,
  currentUserId,
}: BoardViewProps) {
  const [lists, setLists] = useState<BoardList[]>(initialLists);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{ title: string; message: string } | null>(null);
  const [showAddList, setShowAddList] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // Find card by id across all lists
  const findCard = useCallback(
    (cardId: string) => {
      for (const list of lists) {
        const card = list.cards.find((c) => c.id === cardId);
        if (card) return { card, listId: list.id };
      }
      return null;
    },
    [lists]
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "card") {
      setActiveCardId(event.active.id as string);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== "card") return;

    const activeListId = activeData.listId as string;
    let overListId: string;

    if (overData?.type === "card") {
      overListId = overData.listId as string;
    } else if (overData?.type === "list") {
      overListId = over.id as string;
    } else {
      return;
    }

    if (activeListId === overListId) return;

    // Move card between lists optimistically
    setLists((prev) => {
      const activeList = prev.find((l) => l.id === activeListId);
      const overList = prev.find((l) => l.id === overListId);
      if (!activeList || !overList) return prev;

      const card = activeList.cards.find((c) => c.id === active.id);
      if (!card) return prev;

      return prev.map((list) => {
        if (list.id === activeListId) {
          return { ...list, cards: list.cards.filter((c) => c.id !== active.id) };
        }
        if (list.id === overListId) {
          return { ...list, cards: [...list.cards, { ...card, list_id: overListId }] };
        }
        return list;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === "card") {
      // Persist card move to API
      const found = findCard(active.id as string);
      if (!found) return;

      const targetListId = overData?.listId ?? overData?.id ?? found.listId;
      const targetList = lists.find((l) => l.id === targetListId);
      if (!targetList) return;

      const cardIndex = targetList.cards.findIndex((c) => c.id === active.id);
      const prevCard = targetList.cards[cardIndex - 1];
      const nextCard = targetList.cards[cardIndex + 1];

      const position =
        prevCard && nextCard
          ? (prevCard.position + nextCard.position) / 2
          : prevCard
            ? prevCard.position + 1000
            : nextCard
              ? nextCard.position / 2
              : 1000;

      try {
        const res = await fetch(`/api/cards/${active.id}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ list_id: targetListId, position }),
        });
        if (!res.ok) {
          const err = await res.json();
          setValidationError({
            title: "Move Blocked: Mandatory Fields Required",
            message: err.error || "A mandatory field is missing for this column stage."
          });
        }
      } catch {
        toast({ title: "Failed to save card position", variant: "destructive" });
        window.location.reload();
      }
    }

    if (activeData?.type === "list") {
      // Reorder lists
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);
      if (oldIndex === newIndex) return;

      const reordered = arrayMove(lists, oldIndex, newIndex).map((l, i) => ({
        ...l,
        position: (i + 1) * 1000,
      }));
      setLists(reordered);

      try {
        await fetch(`/api/boards/${boardId}/lists/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lists: reordered.map((l) => ({ id: l.id, position: l.position })),
          }),
        });
      } catch {
        toast({ title: "Failed to save list order", variant: "destructive" });
      }
    }
  };

  const handleListCreated = (list: BoardList) => {
    setLists((prev) => [...prev, { ...list, cards: [] }]);
    setShowAddList(false);
  };

  const handleListDeleted = (listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  };

  const handleListUpdated = (listId: string, title: string) => {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title } : l)));
  };

  const handleCardCreated = (listId: string, card: CardPreview) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, cards: [...l.cards, card] } : l
      )
    );
  };

  const handleCardDeleted = (listId: string, cardId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) } : l
      )
    );
  };

  const handleCardUpdated = (listId: string, cardId: string, updates: Partial<CardPreview>) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              cards: l.cards.map((c) =>
                c.id === cardId
                  ? { ...c, ...updates, card_value: updates.card_value !== undefined ? (updates.card_value ? Number(updates.card_value) : null) : c.card_value }
                  : c
              ),
            }
          : l
      )
    );
  };

  const activeCard = activeCardId ? findCard(activeCardId)?.card : null;

  return (
    <>
    <DndContext
      id="board-dnd-context"
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Horizontal scrollable board */}
      <div className="flex gap-4 p-4 md:p-6 overflow-x-auto items-start h-full pb-8">
        {lists.map((list) => (
          <KanbanList
            key={list.id}
            list={list}
            boardId={boardId}
            canManage={canManageLists}
            canCreateCard={canCreateCard}
            onListDeleted={handleListDeleted}
            onListUpdated={handleListUpdated}
            onCardCreated={handleCardCreated}
            onCardDeleted={handleCardDeleted}
            onCardUpdated={handleCardUpdated}
          />
        ))}

        {/* Add list */}
        {canManageLists && (
          <div className="flex-shrink-0 w-72">
            {showAddList ? (
              <AddListForm
                boardId={boardId}
                onCreated={handleListCreated}
                onCancel={() => setShowAddList(false)}
              />
            ) : (
              <Button
                variant="ghost"
                onClick={() => setShowAddList(true)}
                className="w-full justify-start gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 border-2 border-dashed border-slate-300 hover:border-slate-400 h-12 rounded-xl"
              >
                <Plus className="w-4 h-4" />
                Add list
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeCard && (
          <KanbanCard
            card={activeCard}
            boardId={boardId}
            listId={activeCard.list_id}
            isOverlay
          />
        )}
      </DragOverlay>
    </DndContext>

      {/* Validation Error Dialog Modal */}
      {validationError && (
        <Modal
          open={!!validationError}
          onClose={() => {
            setValidationError(null);
            window.location.reload();
          }}
          title={validationError.title}
          width="sm"
        >
          <div className="p-6 space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-55/80 border border-amber-200 flex items-center justify-center text-amber-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {validationError.message}
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => {
                  setValidationError(null);
                  window.location.reload();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl"
              >
                Okay
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
