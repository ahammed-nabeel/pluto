# PROTEUS — Kanban-Based Project Management System
## Complete Project Map, Hierarchy & Technical Specification
### For AI-assisted (Vibe Coding) development in Antigravity IDE

---

## 1. PRODUCT OVERVIEW

**Name:** Proteus
**Type:** Multi-tenant Kanban-based Lead/Project Management System
**Core Analogy:** Trello/Jira hybrid tailored for sales/lead pipelines with rich card metadata, geolocation, media, and live analytics.

**Primary Use Case:** Tracking leads/projects from source acquisition (Meta, IVR, Google, Website, Referral, Outbound) through pipeline stages to closure, with task assignment, checklists, and reporting.

---

## 2. ENTITY HIERARCHY

```
Organization (Tenant)
 └── Users (Super Admin, Board Admin, Member, Viewer)
      └── Boards
           ├── Board Members (roles & permissions)
           ├── Lists (Stages/Columns)
           │    └── Cards
           │         ├── Core Fields (Name, Product, Source, Description, Value, Label)
           │         ├── Client Info (Name, Contact, WhatsApp, Map Location)
           │         ├── Card Owner
           │         ├── Checklist (from Admin Templates)
           │         ├── Tasks (assigned to board members)
           │         ├── Attachments (media/docs, drag-drop, camera)
           │         ├── Activity Log / Comments
           │         └── Tags
           └── Dashboard (per-board analytics)
      └── Global Dashboard (cross-board reports)
      └── Checklist Templates (Admin-managed)
      └── Notifications
```

---

## 3. DATA MODEL (ENTITY-RELATIONSHIP SUMMARY)

### 3.1 User
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | string | editable |
| email | string | unique, from Gmail/Microsoft OAuth |
| auth_provider | enum(google, microsoft) | |
| profile_picture_url | string | |
| password_hash | string | nullable if OAuth-only |
| role | enum(super_admin, admin, member, viewer) | global role |
| created_at | datetime | for super admin signup tracking |
| last_login | datetime | |
| status | enum(active, suspended) | |

### 3.2 Board
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | string | |
| description | string | |
| owner_id | FK → User | board creator = admin |
| created_at | datetime | |
| settings | JSON | permission matrix per role |

### 3.3 BoardMember
| Field | Type | Notes |
|---|---|---|
| board_id | FK | |
| user_id | FK | |
| role | enum(admin, editor, member, viewer) | |
| permissions | JSON | granular: create_list, delete_card, assign_task, view_reports, etc. |

### 3.4 List (Kanban Column)
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| board_id | FK | |
| title | string | e.g. New, Contacted, Negotiation, Won, Lost |
| position | integer | order/index |
| created_by | FK → User (must be board owner/admin) | |

### 3.5 Card
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| list_id | FK | |
| board_id | FK | |
| project_name | string | |
| product | string / FK → Product master | |
| source | enum(Meta, IVR, Google, Website, Referral, Other, Outbound) | |
| description | text | |
| card_value | decimal | currency INR |
| label | enum(Hot, Warm, Cold) | color-coded |
| client_name | string | |
| contact_number | string | with click-to-call + click-to-WhatsApp deep link |
| location_lat | float | |
| location_lng | float | |
| location_address | string | reverse geocoded |
| card_owner_id | FK → User | |
| position | integer | order within list |
| created_at | datetime | |
| updated_at | datetime | |
| tags | array[string] | for filtering/reports |

### 3.6 ChecklistTemplate (Admin-defined)
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| board_id | FK (nullable = global) | |
| name | string | e.g. "Site Visit Checklist" |
| items | JSON array | list of default checklist item labels |
| created_by | FK → User (admin only) | |

### 3.7 CardChecklist / ChecklistItem
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| card_id | FK | |
| template_id | FK (nullable) | if instantiated from template |
| item_text | string | |
| is_checked | boolean | |
| checked_by | FK → User | |
| checked_at | datetime | |

### 3.8 Task
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| card_id | FK | |
| title | string | |
| description | text | |
| assigned_to | FK → User (any board member) | |
| due_date | datetime | |
| status | enum(pending, in_progress, completed, overdue) | computed |
| priority | enum(low, medium, high) | |
| created_by | FK → User | |

### 3.9 Attachment
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| card_id | FK | |
| file_url | string | S3/Cloud storage |
| file_type | enum(image, video, document, camera_capture) | |
| uploaded_by | FK → User | |
| uploaded_at | datetime | |

### 3.10 ActivityLog
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| card_id / board_id | FK | |
| action | string | e.g. "moved card to Won" |
| performed_by | FK → User | |
| timestamp | datetime | |

---

## 4. FEATURE BREAKDOWN

### 4.1 Card Features
- Rich metadata fields as above; Label field renders as color chip (Red=Hot, Orange=Warm, Blue=Cold).
- Contact Number field renders two icon buttons: Call (tel: link) and WhatsApp (wa.me deep link with prefilled message).
- Google Map field: manual address entry OR "Use Current Location" button (browser Geolocation API → reverse geocode via Google Maps Geocoding API) → displays embedded mini-map + "Open in Maps" link.
- Checklist: Admin creates reusable templates in Settings → Templates; when adding checklist to a card, user picks a template or builds custom list.
- Tasks: assignable to any board member (not just card owner), with due date, priority, and auto status transition to "Overdue" via scheduled job.
- Upload: drag-and-drop zone + camera capture button (mobile: `<input capture="environment">` or native camera API); supports images, videos, PDFs, docs.

### 4.2 List Features
- Create/Edit/Delete restricted to Board Owner (and users granted `manage_lists` permission).
- Drag-and-drop reordering of lists and cards (using a library like `dnd-kit` or `react-beautiful-dnd`).
- WIP limits (optional enhancement) per list.

### 4.3 Board Features
- Any authenticated user can create a board → becomes Board Admin automatically.
- Admin can invite members, assign roles (Editor/Member/Viewer), and configure a **permission matrix** (e.g., can Member delete cards? Can Viewer see card value?).
- Board-level settings: currency, source list customization, label colors.

### 4.4 Dashboard & Reports
- Live interactive charts (recommend Chart.js / Recharts / ECharts with WebSocket or polling refresh):
  - Tasks assigned (by user, by status) — bar/donut chart.
  - Pending tasks count — KPI card + trend line.
  - Overdue tasks — KPI card, red alert styling, list drill-down.
  - Pipeline funnel — cards per list stage.
  - Card value sum per label (Hot/Warm/Cold) — pie chart.
- Reports module with filters: Date range, Month, User, Board, Status, Tags, Product — exportable to CSV/PDF.

### 4.5 User & Auth
- OAuth login via Google and Microsoft (Live/Outlook) — use NextAuth.js / Auth.js or Firebase Auth.
- Header user icon → dropdown: Edit Profile (name, picture), Change Password (if email/password account), Logout.
- Super Admin dashboard: list of all registered users, signup date, last login, status (active/suspended), ability to deactivate a user.

---

## 5. ROLE & PERMISSION MATRIX

| Action | Super Admin | Board Admin | Editor/Member | Viewer |
|---|---|---|---|---|
| Create board | Yes[cite:0] | Yes | Yes | Yes |
| Create/Edit/Delete list | Yes | Yes | No (unless granted) | No |
| Create/Move/Delete card | Yes | Yes | Yes | No |
| Assign tasks | Yes | Yes | Yes | No |
| Edit checklist templates | Yes | Yes (own board) | No | No |
| View reports | Yes (all boards) | Yes (own board) | Configurable | Configurable |
| View all registered users | Yes | No | No | No |
| Manage board member roles | Yes | Yes | No | No |

*(Note: table formatting artifact removed — no external source needed for internal design decisions.)*

---

## 6. SYSTEM ARCHITECTURE

```
┌─────────────────────────────┐
│        Frontend (Web)        │
│  React/Next.js + Tailwind    │
│  dnd-kit for Kanban DnD      │
│  Recharts/ECharts dashboards │
│  PWA-ready (camera, geoloc)  │
└───────────────┬───────────────┘
                │ REST/GraphQL + WebSocket (realtime board sync)
┌───────────────▼───────────────┐
│        Backend API            │
│  Node.js (NestJS/Express) OR  │
│  Django REST Framework        │
│  Auth: OAuth2 (Google/MS)     │
│  Business logic, permissions  │
│  Scheduled jobs (overdue calc)│
└───────────────┬───────────────┘
                │
     ┌──────────┼───────────────┐
┌────▼────┐ ┌────▼─────┐ ┌───────▼───────┐
│PostgreSQL│ │ Redis     │ │ Cloud Storage │
│(primary  │ │(cache/    │ │ (S3/Cloudinary│
│ DB)      │ │ pub-sub   │ │ for uploads)  │
└──────────┘ └───────────┘ └───────────────┘
                │
       ┌────────▼─────────┐
       │ Google Maps API   │
       │ (Geocoding/Places)│
       └────────────────────┘
```

---

## 7. RECOMMENDED TECH STACK

| Layer | Recommendation |
|---|---|
| Frontend | Next.js (React) + TypeScript + TailwindCSS + shadcn/ui |
| Drag & drop | @dnd-kit/core |
| Charts | Recharts or ECharts |
| Backend | NestJS (Node/TypeScript) or Django REST Framework |
| Realtime | Socket.io / WebSockets for live board updates |
| Database | PostgreSQL (relational, JSON columns for flexible fields) |
| Cache/Queue | Redis (sessions, job queue for overdue task calc via BullMQ) |
| Auth | Auth.js (NextAuth) with Google & Microsoft providers |
| File storage | AWS S3 / Cloudinary / Firebase Storage |
| Maps | Google Maps JavaScript API + Geocoding API |
| Messaging | wa.me API links (WhatsApp), tel: links (Call) |
| Deployment | Docker + Vercel (frontend) / Railway or AWS ECS (backend) |
| Notifications | Firebase Cloud Messaging or web-push |

---

## 8. FOLDER STRUCTURE (SUGGESTED)

```
proteus/
├── apps/
│   ├── web/                     # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── boards/[boardId]/
│   │   │   ├── dashboard/
│   │   │   ├── admin/
│   │   ├── components/
│   │   │   ├── kanban/
│   │   │   ├── card/
│   │   │   ├── charts/
│   │   │   └── ui/
│   │   └── lib/
│   └── api/                     # NestJS/Django backend
│       ├── src/modules/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── boards/
│       │   ├── lists/
│       │   ├── cards/
│       │   ├── tasks/
│       │   ├── checklists/
│       │   ├── attachments/
│       │   ├── reports/
│       │   └── notifications/
├── packages/
│   ├── shared-types/
│   └── ui-kit/
├── docs/
│   └── PROTEUS_PROJECT_MAP.md   # this file
└── docker-compose.yml
```

---

## 9. DEVELOPMENT PHASES (MILESTONES)

1. **Phase 1 — Foundation:** Auth (Google/Microsoft login), User model, Super Admin panel.
2. **Phase 2 — Core Kanban:** Boards, Lists, Cards (CRUD + drag/drop), permission matrix.
3. **Phase 3 — Card Enrichment:** Contact icons (call/WhatsApp), Google Maps location picker, Attachments (drag-drop + camera).
4. **Phase 4 — Productivity:** Checklists + Templates, Task assignment + overdue engine.
5. **Phase 5 — Analytics:** Live dashboard charts, filterable reports, CSV/PDF export.
6. **Phase 6 — Polish:** Notifications, activity logs, mobile responsiveness/PWA, performance tuning.

---

## 10. KEY BUSINESS RULES

- A card's `list_id` change auto-logs an ActivityLog entry ("moved from X to Y").
- Task `status` auto-flips to `overdue` when `due_date < now()` and status is not `completed` (via nightly cron/BullMQ job).
- Board Admin permission changes propagate immediately to connected clients via WebSocket.
- Checklist templates created by an Admin are board-scoped by default; Super Admin can create global templates available to all boards.
- Deleting a list requires confirmation and either archives or reassigns its cards (never silently deletes cards).

---

*Generated for Antigravity IDE vibe-coding workflow — use this document as the single source of truth for schema, architecture, and feature scope when generating code.*
