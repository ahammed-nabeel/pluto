// ── Shared TypeScript types for pluto. ──────────────────

export interface CardPreview {
  id: string;
  board_id: string;
  list_id: string;
  project_name: string;
  client_name: string | null;
  contact_number: string | null;
  card_value: number | null;
  label: string | null;
  source: string | null;
  tags: string[] | null;
  position: number;
  cover_image_url?: string | null;
  cardOwner: {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
  } | null;
  _count: {
    tasks: number;
    checklistItems: number;
    attachments: number;
  };
}

export interface ChecklistItem {
  id: string;
  card_id: string;
  item_text: string;
  is_checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
  position: number;
  template_id: string | null;
  checker?: { id: string; name: string | null } | null;
}

export interface Task {
  id: string;
  card_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high" | "critical";
  due_date: string | null;
  assigned_to: string | null;
  assignee?: { id: string; name: string | null; profile_picture_url: string | null } | null;
}

export interface Attachment {
  id: string;
  card_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  file_type: "image" | "video" | "document" | "camera_capture";
  mime_type: string | null;
  uploaded_by: string;
  uploader?: { id: string; name: string | null } | null;
}

export interface ActivityLogEntry {
  id: string;
  board_id: string;
  card_id: string | null;
  action: string;
  action_type: string;
  timestamp: string;
  performer?: {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
  } | null;
  card?: {
    id: string;
    project_name: string;
  } | null;
}

export interface CardDetail {
  id: string;
  board_id: string;
  list_id: string;
  project_name: string;
  client_name: string | null;
  contact_number: string | null;
  product: string | null;
  source: string | null;
  description: string | null;
  card_value: number | null;
  label: string | null;
  tags: string[] | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  card_owner_id: string | null;
  position: number;
  cover_image_url?: string | null;
  cardOwner: {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
  } | null;
  checklistItems: ChecklistItem[];
  tasks: Task[];
  attachments: Attachment[];
  activityLogs?: ActivityLogEntry[];
}
