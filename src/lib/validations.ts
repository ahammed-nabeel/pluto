import { z } from "zod";

// ── Board schemas ─────────────────────────────────────

export const CreateBoardSchema = z.object({
  name: z.string().min(1, "Board name is required").max(100),
  description: z.string().max(500).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const UpdateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  settings: z.record(z.unknown()).optional(),
  is_archived: z.boolean().optional(),
});

// ── Board member schemas ──────────────────────────────

export const InviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "editor", "member", "viewer"]).default("member"),
  permissions: z
    .object({
      create_list: z.boolean().optional(),
      delete_card: z.boolean().optional(),
      assign_task: z.boolean().optional(),
      view_reports: z.boolean().optional(),
      manage_members: z.boolean().optional(),
    })
    .optional(),
});

export const UpdateMemberSchema = z.object({
  role: z.enum(["admin", "editor", "member", "viewer"]).optional(),
  permissions: z
    .object({
      create_list: z.boolean(),
      delete_card: z.boolean(),
      assign_task: z.boolean(),
      view_reports: z.boolean(),
      manage_members: z.boolean(),
    })
    .optional(),
});

// ── List schemas ──────────────────────────────────────

export const CreateListSchema = z.object({
  title: z.string().min(1, "List title is required").max(100),
  position: z.number().optional(),
  mandatory_fields: z.array(z.string()).optional(),
});

export const UpdateListSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  position: z.number().optional(),
  mandatory_fields: z.array(z.string()).optional(),
});

export const ReorderListsSchema = z.object({
  lists: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
    })
  ),
});

// ── Card schemas ──────────────────────────────────────

export const CreateCardSchema = z.object({
  list_id: z.string().uuid("Invalid list ID"),
  project_name: z.string().min(1, "Project name is required").max(200),
  product: z.string().max(100).optional(),
  source: z.enum(["Meta", "IVR", "Google", "Website", "Referral", "Other", "Outbound"]).optional(),
  description: z.string().max(5000).optional(),
  card_value: z.number().min(0).optional(),
  label: z.enum(["Hot", "Warm", "Cold"]).optional(),
  client_name: z.string().max(200).optional(),
  contact_number: z.string().max(20).optional(),
  location_lat: z.number().min(-90).max(90).optional(),
  location_lng: z.number().min(-180).max(180).optional(),
  location_address: z.string().max(500).optional(),
  card_owner_id: z.string().uuid().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  position: z.number().optional(),
  cover_image_url: z.string().max(2000).nullable().optional(),
  is_archived: z.boolean().optional(),
});

export const UpdateCardSchema = CreateCardSchema.partial().omit({ list_id: true });

export const MoveCardSchema = z.object({
  list_id: z.string().uuid(),
  position: z.number(),
});

// ── Task schemas ──────────────────────────────────────

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(2000).optional(),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["pending", "in_progress", "completed", "overdue"]).default("pending"),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

// ── Checklist schemas ─────────────────────────────────

export const CreateChecklistItemSchema = z.object({
  item_text: z.string().min(1, "Item text is required").max(500),
  template_id: z.string().uuid().optional(),
  position: z.number().optional(),
});

export const UpdateChecklistItemSchema = z.object({
  item_text: z.string().min(1).max(500).optional(),
  is_checked: z.boolean().optional(),
  position: z.number().optional(),
});

export const ApplyTemplateSchema = z.object({
  template_id: z.string().uuid("Invalid template ID"),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  board_id: z.string().uuid().nullable().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      text: z.string().min(1).max(500),
      order: z.number(),
    })
  ),
});

// ── User / Profile schemas ────────────────────────────

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  profile_picture_url: z.string().url().optional().or(z.literal("")),
  oldPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

export const UpdateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

// ── Report filter schema ──────────────────────────────

export const ReportFilterSchema = z.object({
  board_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  label: z.enum(["Hot", "Warm", "Cold"]).optional(),
  source: z.enum(["Meta", "IVR", "Google", "Website", "Referral", "Other", "Outbound"]).optional(),
  status: z.enum(["pending", "in_progress", "completed", "overdue"]).optional(),
  tags: z.array(z.string()).optional(),
  product: z.string().optional(),
  search: z.string().optional(),
});
