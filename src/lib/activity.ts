import { prisma } from "@/lib/prisma";

type ActivityParams = {
  boardId?: string;
  cardId?: string;
  action: string;
  actionType: string;
  performedBy: string;
  metadata?: Record<string, unknown>;
};

/**
 * Create an activity log entry.
 * Call this after every significant state change.
 */
export async function logActivity({
  boardId,
  cardId,
  action,
  actionType,
  performedBy,
  metadata,
}: ActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        board_id: boardId,
        card_id: cardId,
        action,
        action_type: actionType,
        performed_by: performedBy,
        metadata: metadata ? (metadata as any) : undefined,
      },
    });
  } catch (error) {
    // Never let activity logging break the main flow
    console.error("[ActivityLog] Failed to log:", error);
  }
}

// ── Pre-built log helpers ─────────────────────────────

export const ActivityTypes = {
  BOARD_CREATED: "board_created",
  BOARD_UPDATED: "board_updated",
  BOARD_DELETED: "board_deleted",
  MEMBER_ADDED: "member_added",
  MEMBER_REMOVED: "member_removed",
  MEMBER_ROLE_CHANGED: "member_role_changed",
  LIST_CREATED: "list_created",
  LIST_UPDATED: "list_updated",
  LIST_DELETED: "list_deleted",
  CARD_CREATED: "card_created",
  CARD_UPDATED: "card_updated",
  CARD_MOVED: "card_moved",
  CARD_DELETED: "card_deleted",
  TASK_CREATED: "task_created",
  TASK_UPDATED: "task_updated",
  TASK_COMPLETED: "task_completed",
  TASK_ASSIGNED: "task_assigned",
  CHECKLIST_ITEM_CHECKED: "checklist_item_checked",
  CHECKLIST_ITEM_UNCHECKED: "checklist_item_unchecked",
  ATTACHMENT_UPLOADED: "attachment_uploaded",
  ATTACHMENT_DELETED: "attachment_deleted",
} as const;

export type ActivityType = (typeof ActivityTypes)[keyof typeof ActivityTypes];
