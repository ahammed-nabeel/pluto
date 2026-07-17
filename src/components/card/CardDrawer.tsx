"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { CardProjectInfo } from "./CardProjectInfo";
import { CardClientInfo } from "./CardClientInfo";
import { CardChecklist } from "./CardChecklist";
import { CardTasks } from "./CardTasks";
import { CardAttachments } from "./CardAttachments";
import { CardLocation } from "./CardLocation";
import { CardCommentsActivity } from "./CardCommentsActivity";
import { Badge } from "@/components/ui/badge";
import { formatINR, LABEL_COLORS } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { CardDetail } from "@/types";

interface CardDrawerProps {
  cardId: string;
  boardId: string;
  open: boolean;
  onClose: () => void;
  onCardUpdated?: (updates: Partial<CardDetail>) => void;
}

type Tab = "details" | "checklist" | "tasks" | "attachments" | "activity";

const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "checklist", label: "Checklist" },
  { id: "tasks", label: "Tasks" },
  { id: "attachments", label: "Files" },
  { id: "activity", label: "Comments & Logs" },
];

export function CardDrawer({ cardId, boardId, open, onClose, onCardUpdated }: CardDrawerProps) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`/api/cards/${cardId}/attachments`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setCard((prev) => {
            if (!prev) return prev;
            const nextAttachments = [...prev.attachments, data.data];
            const isImg = data.data.file_type === "image" || data.data.mime_type?.startsWith("image/");
            const updates: Partial<CardDetail> = { attachments: nextAttachments };
            if (!prev.cover_image_url && isImg) {
              updates.cover_image_url = data.data.file_url;
            }
            onCardUpdated?.(updates);
            return { ...prev, ...updates };
          });
          toast({ title: `Uploaded '${file.name}'`, variant: "success" });
        } else {
          toast({ title: `Failed to upload '${file.name}'`, variant: "destructive" });
        }
      } catch {
        toast({ title: `Failed to upload '${file.name}'`, variant: "destructive" });
      }
    }
    setUploading(false);
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/cards/${cardId}`)
      .then((r) => r.json())
      .then((d) => setCard(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cardId, open]);

  const handleCardUpdate = (updates: Partial<CardDetail>) => {
    setCard((prev) => prev ? { ...prev, ...updates } : prev);
    onCardUpdated?.(updates);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={card?.project_name ?? "Card Details"}
      width="2xl"
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : !card ? (
        <div className="flex items-center justify-center h-64 text-slate-500">
          Card not found
        </div>
      ) : (
        <div
          className="flex flex-col h-full relative"
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX < rect.left ||
              e.clientX >= rect.right ||
              e.clientY < rect.top ||
              e.clientY >= rect.bottom
            ) {
              setIsDragging(false);
            }
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              await handleFileUpload(e.dataTransfer.files);
            }
          }}
        >
          {/* Cover image in Card Modal if present */}
          {card.cover_image_url && (
            <div className="w-full h-48 bg-slate-100 overflow-hidden relative">
              <img
                src={card.cover_image_url}
                alt="Card Cover"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Card header summary */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            {card.label && (
              <Badge variant={card.label.toLowerCase() as "hot" | "warm" | "cold"} dot>
                {card.label}
              </Badge>
            )}
            {card.source && (
              <Badge variant="secondary">{card.source}</Badge>
            )}
            {card.card_value && (
              <span className="text-sm font-bold text-emerald-600">
                {formatINR(Number(card.card_value))}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-6 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
                {/* Show counts */}
                {tab.id === "tasks" && card.tasks.length > 0 && (
                  <span className="ml-1.5 bg-slate-100 text-slate-600 text-xs rounded-full px-2 py-0.5">
                    {card.tasks.length}
                  </span>
                )}
                {tab.id === "checklist" && card.checklistItems.length > 0 && (
                  <span className="ml-1.5 bg-slate-100 text-slate-600 text-xs rounded-full px-2 py-0.5">
                    {card.checklistItems.filter((i) => i.is_checked).length}/{card.checklistItems.length}
                  </span>
                )}
                {tab.id === "attachments" && card.attachments.length > 0 && (
                  <span className="ml-1.5 bg-slate-100 text-slate-600 text-xs rounded-full px-2 py-0.5">
                    {card.attachments.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "details" && (
              <div className="divide-y divide-slate-100">
                <CardClientInfo card={card} boardId={boardId} onUpdate={handleCardUpdate} />
                <CardProjectInfo card={card} boardId={boardId} onUpdate={handleCardUpdate} />
                <CardLocation card={card} boardId={boardId} onUpdate={handleCardUpdate} />
              </div>
            )}
            {activeTab === "checklist" && (
              <CardChecklist
                card={card}
                boardId={boardId}
                onUpdate={(items) => handleCardUpdate({ checklistItems: items })}
              />
            )}
            {activeTab === "tasks" && (
              <CardTasks
                card={card}
                boardId={boardId}
                onUpdate={(tasks) => handleCardUpdate({ tasks })}
              />
            )}
            {activeTab === "attachments" && (
              <CardAttachments
                card={card}
                onUpdate={(attachments) => handleCardUpdate({ attachments })}
                onCardUpdate={handleCardUpdate}
              />
            )}
            {activeTab === "activity" && (
              <CardCommentsActivity card={card} boardId={boardId} />
            )}
          </div>

          {/* Premium Glassmorphic Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-md z-[100] flex flex-col items-center justify-center border-2 border-dashed border-blue-500 rounded-xl transition-all duration-300 pointer-events-none">
              <Upload className="w-12 h-12 text-blue-500 animate-bounce mb-3" />
              <p className="text-base font-bold text-blue-900 animate-pulse">Drop files here to upload</p>
              <p className="text-xs text-blue-600/80 mt-1">Images, PDFs, documents, or media files</p>
            </div>
          )}

          {/* Upload Progress Loader Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-[101] flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Uploading attachments...</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
