import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Phone, MessageCircle, CheckSquare, ListChecks, Paperclip, MoreHorizontal, Trash2, Copy as CopyIcon, Move as MoveIcon, Link as LinkIcon, Archive
} from "lucide-react";
import { CardDrawer } from "@/components/card/CardDrawer";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { cn, formatINR, getWhatsAppLink, LABEL_COLORS } from "@/lib/utils";
import type { CardPreview } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface KanbanCardProps {
  card: CardPreview;
  boardId: string;
  listId: string;
  isOverlay?: boolean;
  onDeleted?: () => void;
  onCardUpdated?: (updates: Partial<CardPreview>) => void;
}

type SimpleBoard = { id: string; name: string };
type SimpleList = { id: string; title: string };

export function KanbanCard({ card, boardId, listId, isOverlay, onDeleted, onCardUpdated }: KanbanCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  
  // Action Modal States
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"copy" | "move" | "mirror">("copy");
  const [boards, setBoards] = useState<SimpleBoard[]>([]);
  const [lists, setLists] = useState<SimpleList[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState(boardId);
  const [selectedListId, setSelectedListId] = useState(listId);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);

  // Fetch Boards when Action Modal opens
  useEffect(() => {
    if (showActionModal) {
      setLoadingBoards(true);
      fetch("/api/boards")
        .then((r) => r.json())
        .then((d) => {
          setBoards(d.data ?? []);
          setLoadingBoards(false);
        })
        .catch(() => setLoadingBoards(false));
    }
  }, [showActionModal]);

  // Fetch Lists when Board changes inside Action Modal
  useEffect(() => {
    if (showActionModal && selectedBoardId) {
      setLoadingLists(true);
      fetch(`/api/boards/${selectedBoardId}/lists`)
        .then((r) => r.json())
        .then((d) => {
          const fetchedLists = d.data ?? [];
          setLists(fetchedLists);
          if (fetchedLists.length > 0) {
            // Default to same list if it exists, otherwise first list
            const hasSameList = fetchedLists.some((l: SimpleList) => l.id === listId);
            setSelectedListId(hasSameList && selectedBoardId === boardId ? listId : fetchedLists[0].id);
          } else {
            setSelectedListId("");
          }
          setLoadingLists(false);
        })
        .catch(() => setLoadingLists(false));
    }
  }, [showActionModal, selectedBoardId, boardId, listId]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoardId || !selectedListId) return;
    setExecutingAction(true);

    try {
      const res = await fetch(`/api/cards/${card.id}/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_board_id: selectedBoardId,
          target_list_id: selectedListId,
          action_type: actionType,
        }),
      });

      if (res.ok) {
        toast({ 
          title: `Card ${actionType === "move" ? "moved" : actionType === "mirror" ? "mirrored" : "copied"} successfully`, 
          variant: "success" 
        });
        setShowActionModal(false);
        // Refresh board columns layout
        window.location.reload();
      } else {
        toast({ title: "Operation failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Operation failed", variant: "destructive" });
    } finally {
      setExecutingAction(false);
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", listId, cardId: card.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const labelColors = card.label ? LABEL_COLORS[card.label as keyof typeof LABEL_COLORS] : null;

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to archive this card? You can restore it later if needed.")) return;
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true }),
      });
      if (res.ok) {
        onDeleted?.();
        toast({ title: "Card archived successfully", variant: "success" });
      }
    } catch {
      toast({ title: "Failed to archive card", variant: "destructive" });
    }
    setShowMenu(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this card? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.();
        toast({ title: "Card deleted", variant: "success" });
      }
    } catch {
      toast({ title: "Failed to delete card", variant: "destructive" });
    }
    setShowMenu(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => !isOverlay && setDrawerOpen(true)}
        className={cn(
          "bg-white rounded-xl border border-slate-200 cursor-pointer shadow-sm overflow-hidden",
          "hover:shadow-md hover:border-slate-300 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 ease-out select-none group",
          isDragging && "opacity-40 scale-95",
          isOverlay && "card-drag-overlay shadow-2xl rotate-1 cursor-grabbing"
        )}
      >
        {/* Cover image header if present */}
        {card.cover_image_url && (
          <div className="w-full h-32 overflow-hidden bg-slate-100 border-b border-slate-100">
            <img
              src={card.cover_image_url}
              alt="Card Cover"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-3">
          {/* Label stripe + menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {card.label && (
              <Badge variant={card.label.toLowerCase() as "hot" | "warm" | "cold"} dot className="text-xs">
                {card.label}
              </Badge>
            )}
            {card.source && (
              <span className="text-xs text-slate-400">{card.source}</span>
            )}
          </div>
          {!isOverlay && (
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (showMenu) {
                    setShowMenu(false);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenuCoords({
                      top: rect.bottom + window.scrollY,
                      left: rect.right - 176 + window.scrollX,
                    });
                    setShowMenu(true);
                  }
                }}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {showMenu && menuCoords && typeof document !== "undefined" && createPortal(
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                  <div
                    style={{ top: menuCoords.top, left: menuCoords.left }}
                    className="absolute z-[9999] w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={async () => {
                        setShowMenu(false);
                        try {
                          const res = await fetch(`/api/cards/${card.id}/duplicate`, { method: "POST" });
                          if (res.ok) {
                            toast({ title: "Card duplicated", variant: "success" });
                            window.location.reload();
                          }
                        } catch {
                          toast({ title: "Failed to duplicate card", variant: "destructive" });
                        }
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <CopyIcon className="w-3.5 h-3.5" />
                      Duplicate
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setActionType("move");
                        setShowActionModal(true);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <MoveIcon className="w-3.5 h-3.5" />
                      Move Card...
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setActionType("copy");
                        setShowActionModal(true);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <CopyIcon className="w-3.5 h-3.5" />
                      Copy to Board...
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setActionType("mirror");
                        setShowActionModal(true);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Mirror Card...
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={handleArchive}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Archive className="w-3.5 h-3.5 text-slate-500" />
                      Archive
                    </button>

                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>,
                document.body
              )}
            </div>
          )}
        </div>

        {/* Project name */}
        <p className="text-sm font-semibold text-slate-900 leading-snug mb-1.5 line-clamp-2">
          {card.project_name}
        </p>

        {/* Client name */}
        {card.client_name && (
          <p className="text-xs text-slate-500 mb-2 truncate">{card.client_name}</p>
        )}

        {/* Card value */}
        {card.card_value && (
          <p className="text-sm font-bold text-emerald-600 mb-2">
            {formatINR(Number(card.card_value))}
          </p>
        )}

        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
            {card.tags.length > 3 && (
              <span className="text-xs text-slate-400">+{card.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          {/* Quick action buttons */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {card.contact_number && (
              <>
                <a
                  href={`tel:${card.contact_number}`}
                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Call"
                  aria-label="Call client"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <a
                  href={getWhatsAppLink(card.contact_number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors"
                  title="WhatsApp"
                  aria-label="WhatsApp client"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Counts */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {(card._count?.tasks ?? 0) > 0 && (
                <span className="flex items-center gap-0.5" title="Tasks">
                  <ListChecks className="w-3 h-3" />
                  {card._count.tasks}
                </span>
              )}
              {(card._count?.checklistItems ?? 0) > 0 && (
                <span className="flex items-center gap-0.5" title="Checklist">
                  <CheckSquare className="w-3 h-3" />
                  {card._count.checklistItems}
                </span>
              )}
              {(card._count?.attachments ?? 0) > 0 && (
                <span className="flex items-center gap-0.5" title="Attachments">
                  <Paperclip className="w-3 h-3" />
                  {card._count.attachments}
                </span>
              )}
            </div>

            {/* Owner avatar */}
            {card.cardOwner && (
              <Avatar
                src={card.cardOwner.profile_picture_url}
                name={card.cardOwner.name}
                size="xs"
                title={card.cardOwner.name ?? undefined}
              />
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Card detail drawer */}
      {drawerOpen && (
        <CardDrawer
          cardId={card.id}
          boardId={boardId}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onCardUpdated={(updates) => onCardUpdated?.(updates)}
        />
      )}

      {/* Copy / Move / Mirror Action Selector Modal */}
      {showActionModal && (
        <Modal
          open={showActionModal}
          onClose={() => setShowActionModal(false)}
          title={`${actionType === "move" ? "Move" : actionType === "mirror" ? "Mirror" : "Copy"} Card`}
          width="sm"
        >
          <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Target Board</label>
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                disabled={loadingBoards}
              >
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Target List / Stage</label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                disabled={loadingLists || lists.length === 0}
              >
                {lists.length === 0 ? (
                  <option value="">No lists available</option>
                ) : (
                  lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowActionModal(false)}
                disabled={executingAction}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2"
                disabled={executingAction || lists.length === 0}
                loading={executingAction}
              >
                Execute
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
