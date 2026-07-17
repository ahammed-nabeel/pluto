"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { MessageSquare, Table, Paperclip, CheckSquare, Clock, Pencil, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { CardDetail } from "@/types";

interface CardCommentsActivityProps {
  card: CardDetail;
  boardId: string;
}

type CommentItem = {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  creator: {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
  };
};

type BoardMember = {
  id: string;
  user: {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
  };
};

export function CardCommentsActivity({ card, boardId }: CardCommentsActivityProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivity, setShowActivity] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Edit Comment States
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch comments + members + profile
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/cards/${card.id}/comments`).then((r) => r.json()),
      fetch(`/api/boards/${boardId}/members`).then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()).catch(() => null)
    ])
      .then(([commentsRes, membersRes, profileRes]) => {
        setComments(commentsRes.data ?? []);
        setMembers(membersRes.data ?? []);
        if (profileRes && profileRes.data) {
          setCurrentUserId(profileRes.data.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [card.id, boardId]);

  // Edit Comment handlers
  const handleCommentEdit = async (commentId: string) => {
    if (!editingContent.trim()) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingContent.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, content: data.data.content } : c))
        );
        setEditingCommentId(null);
        setEditingContent("");
        toast({ title: "Comment updated", variant: "success" });
      }
    } catch {
      toast({ title: "Failed to update comment", variant: "destructive" });
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast({ title: "Comment deleted", variant: "success" });
      }
    } catch {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/cards/${card.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((c) => [data.data, ...c]);
        setNewComment("");
      }
    } catch {
      toast({ title: "Failed to post comment", variant: "destructive" });
    }
  };

  // Helper to insert markdown text at cursor
  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const val = textarea.value;

    const updated = val.substring(0, startPos) + text + val.substring(endPos, val.length);
    setNewComment(updated);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = startPos + text.length;
    }, 10);
  };

  // Trigger file attachment inside comment
  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/cards/${card.id}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.data.file_url;
        const name = data.data.file_name;
        // Insert markdown file link
        insertTextAtCursor(` [${name}](${url}) `);
        toast({ title: `${name} attached to comment`, variant: "success" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Trigger Markdown table template insertion
  const handleInsertTable = () => {
    const tableTemplate = `\n| Column 1 | Column 2 |\n|---|---|\n| Row 1 Cell 1 | Row 1 Cell 2 |\n| Row 2 Cell 1 | Row 2 Cell 2 |\n`;
    insertTextAtCursor(tableTemplate);
  };

  // Detect "@" for mentions
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewComment(val);

    const cursor = e.target.selectionStart;
    const beforeCursor = val.slice(0, cursor);
    const words = beforeCursor.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      setMentionSearch(lastWord.slice(1));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleSelectMention = (memberName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const val = textarea.value;
    const beforeCursor = val.slice(0, cursor);
    const afterCursor = val.slice(cursor);

    // Find the last "@" index to replace it
    const lastIndex = beforeCursor.lastIndexOf("@");
    if (lastIndex !== -1) {
      const updated = beforeCursor.slice(0, lastIndex) + `@${memberName} ` + afterCursor;
      setNewComment(updated);
    }
    setShowMentions(false);
    textarea.focus();
  };

  // Filtered members for mentions dropdown list
  const filteredMembers = members.filter((m) =>
    (m.user.name ?? "").toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Chronologically merge comments and activities (optional checkbox view)
  const timelineItems = (() => {
    const list: Array<{ type: "comment" | "activity"; time: Date; data: any }> = [];

    comments.forEach((c) => {
      list.push({ type: "comment", time: new Date(c.created_at), data: c });
    });

    if (showActivity && card.activityLogs) {
      card.activityLogs.forEach((a) => {
        list.push({ type: "activity", time: new Date(a.timestamp), data: a });
      });
    }

    return list.sort((a, b) => b.time.getTime() - a.time.getTime());
  })();

  return (
    <div className="px-6 py-5">
      {/* Editor & Actions */}
      <form onSubmit={handleCommentSubmit} className="mb-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
          <MessageSquare className="w-4 h-4" />
          Add Comment
        </h3>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleTextareaChange}
            placeholder="Type your comment... Use @ to mention board members."
            className="w-full min-h-[100px] text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white"
          />

          {/* Mentions Dropdown */}
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute left-2 bottom-full mb-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto py-1">
              <p className="text-[10px] text-slate-400 font-semibold px-3 py-1 uppercase tracking-wider">Mention Member</p>
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMention(m.user.name ?? "")}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                >
                  <Avatar src={m.user.profile_picture_url} name={m.user.name} size="xs" />
                  <span className="font-medium text-slate-800">{m.user.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar & Send */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              title="Attach File to Comment"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileAttach}
              className="hidden"
            />
          </div>

          <Button type="submit" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 font-medium px-4 py-1.5" disabled={!newComment.trim() || uploading}>
            Comment
          </Button>
        </div>
      </form>

      {/* Timeline Controls */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Conversation
        </h3>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showActivity}
            onChange={(e) => setShowActivity(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Show Activity Logs
        </label>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-400 italic">Loading conversation...</p>
        ) : timelineItems.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No comments or activity yet.</p>
        ) : (
          timelineItems.map((item, idx) => {
            if (item.type === "comment") {
              const c = item.data;
              return (
                <div key={`c-${c.id}`} className="flex gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <Avatar
                    src={c.creator?.profile_picture_url}
                    name={c.creator?.name}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900">{c.creator?.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(c.created_at)}
                        </span>
                        {/* Owner edit & delete provision */}
                        {currentUserId === c.created_by && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCommentId(c.id);
                                setEditingContent(c.content);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              title="Edit Comment"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCommentDelete(c.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                              title="Delete Comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingCommentId === c.id ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingContent("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            onClick={() => handleCommentEdit(c.id)}
                            disabled={!editingContent.trim()}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Render Comment content (preserve newlines & links) */
                      <div className="text-sm text-slate-700 mt-1 whitespace-pre-line break-words">
                        {c.content}
                      </div>
                    )}
                  </div>
                </div>
              );
            } else {
              const a = item.data;
              return (
                <div key={`a-${a.id}`} className="flex gap-3 items-center text-slate-500 bg-slate-50/50 p-2 px-3 rounded-xl border border-dashed border-slate-200 text-xs">
                  <Avatar
                    src={a.performer?.profile_picture_url}
                    name={a.performer?.name}
                    size="xs"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex justify-between gap-2">
                    <span className="truncate">
                      <strong className="text-slate-700">{a.performer?.name}</strong> {a.action}
                    </span>
                    <span className="text-slate-400 flex-shrink-0">{formatDateTime(a.timestamp)}</span>
                  </div>
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
}
