"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Upload, Camera, Paperclip, FileText, Image as ImgIcon, Video, Trash2, Download, Pencil } from "lucide-react";
import { cn, formatFileSize, formatDateTime } from "@/lib/utils";
import type { CardDetail, Attachment } from "@/types";
import { Modal } from "@/components/ui/modal";

interface CardAttachmentsProps {
  card: CardDetail;
  onUpdate: (attachments: CardDetail["attachments"]) => void;
  onCardUpdate?: (updates: Partial<CardDetail>) => void;
}

export function CardAttachments({ card, onUpdate, onCardUpdate }: CardAttachmentsProps) {
  const attachments = card.attachments;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activePreview, setActivePreview] = useState<Attachment | null>(null);
  
  // Renaming attachment states
  const [editingAttachmentId, setEditingAttachmentId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only turn off if leaving the parent boundary
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleRenameSubmit = async (attId: string) => {
    if (!editingName.trim()) return;

    try {
      const res = await fetch(`/api/attachments/${attId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: editingName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(
          attachments.map((att) => (att.id === attId ? { ...att, file_name: data.data.file_name } : att))
        );
        setEditingAttachmentId(null);
        setEditingName("");
        toast({ title: "File renamed successfully", variant: "success" });
      } else {
        toast({ title: "Failed to rename file", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to rename file", variant: "destructive" });
    }
  };

  const handleFileUpload = async (files: FileList | null, isCamera = false) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      if (isCamera) formData.append("camera_capture", "true");

      try {
        const res = await fetch(`/api/cards/${card.id}/attachments`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          onUpdate([...card.attachments, data.data]);
          // If first image uploaded became the default cover on the API side, sync it on the client
          if (!card.cover_image_url && (data.data.file_type === "image" || data.data.mime_type?.startsWith("image/"))) {
            onCardUpdate?.({ cover_image_url: data.data.file_url });
          }
          toast({ title: `${file.name} uploaded`, variant: "success" });
        } else {
          const err = await res.json();
          toast({ title: err.error || "Upload failed", variant: "destructive" });
        }
      } catch {
        toast({ title: "Upload failed", variant: "destructive" });
      }
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;
    try {
      const res = await fetch(`/api/cards/${card.id}/attachments?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onUpdate(attachments.filter((a) => a.id !== id));
        // If we deleted the active cover image, clear cover on the client
        const deleted = attachments.find((a) => a.id === id);
        if (deleted && card.cover_image_url === deleted.file_url) {
          onCardUpdate?.({ cover_image_url: null });
        }
        toast({ title: "Attachment deleted" });
      }
    } catch {
      toast({ title: "Failed to delete attachment", variant: "destructive" });
    }
  };

  function FileIcon({ type }: { type: string }) {
    if (type === "image" || type === "camera_capture") return <ImgIcon className="w-4 h-4 text-blue-500" />;
    if (type === "video") return <Video className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-slate-500" />;
  }

  return (
    <div 
      className="px-6 py-5 space-y-6 relative min-h-[300px]"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop File Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-sm border-2 border-dashed border-blue-500 rounded-2xl z-30 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-200">
          <div className="bg-white p-4 rounded-full shadow-lg border border-slate-100 flex items-center justify-center mb-3">
            <Upload className="w-8 h-8 text-blue-600 animate-bounce" />
          </div>
          <p className="text-sm font-semibold text-slate-800">Drop files here to upload</p>
          <p className="text-xs text-slate-500 mt-1">Images, PDFs, documents</p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileUpload(e.target.files, true)}
        className="hidden"
      />

      {!uploading && (
        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-medium py-2 rounded-xl"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          <Button
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium py-2 rounded-xl"
          >
            <Camera className="w-4 h-4 mr-2" />
            Use Camera
          </Button>
        </div>
      )}

      {uploading && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
          <p className="text-sm font-medium text-slate-600">Uploading files...</p>
        </div>
      )}

      {attachments.length === 0 && !uploading && (
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files);
          }}
        >
          <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Drop files here or click to upload</p>
          <p className="text-xs text-slate-400 mt-1">Images, videos, PDFs, documents</p>
        </div>
      )}

      {/* Attachment list */}
      <div className="space-y-2">
        {attachments.map((att) => (
          <div key={att.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 group bg-white transition-all">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <FileIcon type={att.file_type} />
            </div>

            {/* Thumbnail for images */}
            {(att.file_type === "image" || att.file_type === "camera_capture") && (
              <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 absolute hidden" />
            )}

            <div className="flex-1 min-w-0">
              {editingAttachmentId === att.id ? (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 h-8 rounded-lg border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white"
                    placeholder="Enter file name..."
                  />
                  <button
                    onClick={() => handleRenameSubmit(att.id)}
                    className="px-2.5 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold rounded-lg h-8 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingAttachmentId(null);
                      setEditingName("");
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 text-slate-500 hover:bg-slate-200 font-semibold rounded-lg h-8 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Check if image or PDF to trigger preview modal
                      if (att.file_type === "image" || att.file_type === "camera_capture" || att.file_name.toLowerCase().endsWith(".pdf") || att.mime_type?.includes("pdf")) {
                        setActivePreview(att);
                      } else {
                        // Fallback to direct download
                        window.open(att.file_url, "_blank");
                      }
                    }}
                    className="text-sm font-medium text-slate-800 hover:text-blue-600 truncate block text-left w-full transition-colors"
                    title={`View ${att.file_name}`}
                  >
                    {att.file_name}
                  </button>
                  <p className="text-xs text-slate-400">
                    {att.file_size && `${formatFileSize(att.file_size)} · `}
                    {att.uploader?.name}
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditingAttachmentId(att.id);
                  setEditingName(att.file_name);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                title="Rename"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {(att.file_type === "image" || att.mime_type?.startsWith("image/")) && (
                <button
                  onClick={async () => {
                    const isCurrentCover = card.cover_image_url === att.file_url;
                    const newCover = isCurrentCover ? null : att.file_url;
                    try {
                      const res = await fetch(`/api/cards/${card.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ cover_image_url: newCover || "" }),
                      });
                      if (res.ok) {
                        onCardUpdate?.({ cover_image_url: newCover });
                        toast({ title: isCurrentCover ? "Cover image removed" : "Cover image updated", variant: "success" });
                      }
                    } catch {
                      toast({ title: "Failed to update cover image", variant: "destructive" });
                    }
                  }}
                  className={`p-1.5 rounded-lg text-xs font-semibold border ${
                    card.cover_image_url === att.file_url
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : "bg-white text-slate-500 hover:text-slate-900 border-slate-200"
                  }`}
                  title={card.cover_image_url === att.file_url ? "Remove cover" : "Make card cover"}
                >
                  {card.cover_image_url === att.file_url ? "Cover Image" : "Set Cover"}
                </button>
              )}
              <a
                href={att.file_url}
                download
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => handleDelete(att.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload more button when has files */}
      {attachments.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 w-full text-slate-500 border-2 border-dashed border-slate-200 hover:border-slate-300"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload more files
        </Button>
      )}

      {/* Inline File Preview Modal */}
      {activePreview && (
        <Modal
          open={!!activePreview}
          onClose={() => setActivePreview(null)}
          title={activePreview.file_name}
          width="4xl"
        >
          <div className="flex flex-col h-[70vh] bg-slate-50 relative p-4">
            {/* Action Header Overlay */}
            <div className="absolute top-6 right-6 z-10 flex gap-2">
              <a
                href={activePreview.file_url}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Original
              </a>
            </div>

            {/* Media viewer */}
            <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              {activePreview.file_name.toLowerCase().endsWith(".pdf") || activePreview.mime_type?.includes("pdf") ? (
                <iframe
                  src={`${activePreview.file_url}#toolbar=0`}
                  title={activePreview.file_name}
                  className="w-full h-full border-none"
                />
              ) : (
                <img
                  src={activePreview.file_url}
                  alt={activePreview.file_name}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
