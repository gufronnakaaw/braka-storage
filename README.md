# Braka Storage

Internal file storage platform with upload/download, folder management, API keys, activity logs, and storage tracking.

## Tech Stack

| Layer                | Tech                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| **Framework**        | Next.js 16 (App Router) + React 19                                   |
| **Runtime**          | Bun 1.x                                                              |
| **Database**         | PostgreSQL (Neon) + Prisma 7                                         |
| **Storage**          | S3-compatible (NevaObjects) — presigned upload URLs                  |
| **Auth**             | NextAuth v5 — Credentials provider (username/password), JWT strategy |
| **UI**               | Tailwind CSS v4 + Base UI + Lucide icons                             |
| **Validation**       | Zod 4                                                                |
| **State/Fetching**   | SWR (stale-while-revalidate)                                         |
| **Image Processing** | Sharp (thumbnail generation)                                         |

## Prerequisites

- [Bun](https://bun.sh) >= 1.x
- PostgreSQL database (Neon recommended)
- S3-compatible storage provider

## Getting Started

```bash
# Clone the repository
git clone https://github.com/braka-nusa-core/braka-storage.git
cd braka-storage

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
```

Fill in the environment variables (see [Environment Variables](#environment-variables) below).

```bash
# Run database migrations
bunx prisma migrate dev

# Seed default users (optional)
bun run db:seed

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Environment Variables

| Variable                  | Description                              |
| ------------------------- | ---------------------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string (Neon)      |
| `S3_ACCESS_KEY_ID`        | S3 access key                            |
| `S3_SECRET_ACCESS_KEY`    | S3 secret key                            |
| `S3_BUCKET`               | S3 bucket name                           |
| `S3_REGION`               | S3 region (e.g. `us-east-1`)             |
| `S3_ENDPOINT`             | S3 endpoint URL (NevaObjects)            |
| `NEXT_PUBLIC_PREVIEW_URL` | Public base URL for file previews        |
| `AUTH_SECRET`             | NextAuth secret (run `bunx auth secret`) |

## Pages

| Route        | Page                              | Auth     |
| ------------ | --------------------------------- | -------- |
| `/`          | Root drive (folder-only view)     | Required |
| `/login`     | Login page                        | Public   |
| `/[...slug]` | Nested folder browser (full CRUD) | Required |
| `/api-keys`  | API key management                | Required |
| `/logs`      | Paginated activity logs           | Required |

All unauthenticated requests (except `/login` and `/api`) are redirected to `/login?callbackUrl=...`.

## API Routes

### Auth

| Method     | Path                      | Description                                   |
| ---------- | ------------------------- | --------------------------------------------- |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth handler — sign in, session, sign out |

### Drive

| Method   | Path                               | Description                                |
| -------- | ---------------------------------- | ------------------------------------------ |
| `GET`    | `/api/drive/items?parentId=`       | List files and folders in a directory      |
| `GET`    | `/api/drive/folders/[id]`          | Get folder or file metadata by ID          |
| `POST`   | `/api/drive/folders`               | Create a new folder                        |
| `PATCH`  | `/api/drive/folders/[id]`          | Rename a folder                            |
| `DELETE` | `/api/drive/folders/[id]`          | Delete a folder (recursive)                |
| `PATCH`  | `/api/drive/files/[id]`            | Rename a file                              |
| `DELETE` | `/api/drive/files/[id]`            | Delete a file (+ thumbnail from S3)        |
| `GET`    | `/api/drive/search?q=`             | Search files and folders                   |
| `GET`    | `/api/drive/storage`               | Get storage usage (max 10 GB)              |
| `GET`    | `/api/drive/breadcrumbs?folderId=` | Get breadcrumb trail                       |
| `GET`    | `/api/drive/resolve?slug[]=`       | Resolve URL slug array to folder ID        |
| `GET`    | `/api/drive/folder-path?folderId=` | Get ancestor path to root                  |
| `POST`   | `/api/drive/upload/presign`        | Generate presigned S3 upload URLs          |
| `POST`   | `/api/drive/upload/confirm`        | Confirm upload and create database records |
| `GET`    | `/api/drive/download/[fileId]`     | Stream file download from S3               |

### API Keys

| Method   | Path                 | Description                          |
| -------- | -------------------- | ------------------------------------ |
| `GET`    | `/api/api-keys`      | List all API keys (safe fields only) |
| `POST`   | `/api/api-keys`      | Create a new API key (shown once)    |
| `DELETE` | `/api/api-keys/[id]` | Revoke an API key                    |

### Logs

| Method | Path                                    | Description                 |
| ------ | --------------------------------------- | --------------------------- |
| `GET`  | `/api/logs?page=&pageSize=&timeFilter=` | Get paginated activity logs |

All endpoints (except NextAuth) return a unified JSON envelope:

```ts
// Success
{ success: true, status_code: 200, data: T }

// Error
{ success: false, status_code: 404, error: { name: string, message: string, errors: object|null } }
```

## Upload Flow

```
1. Client → POST /api/drive/upload/presign → receives S3 presigned PUT URLs
2. Client → PUT directly to S3 (XHR with progress tracking)
3. Client → POST /api/drive/upload/confirm → DB record created + thumbnail generated (Sharp)
```

- Max 20 files per upload batch
- Max 500 MB per file
- Thumbnails are 200px WebP images stored under `thumbnail/{fileId}.webp`
- Image thumbnails are generated asynchronously after confirmation
- Non-image files or failed thumbnails fall back to FileIcon

## Database Models (Prisma)

- **User** — `id`, `fullname`, `username` (unique), `password` (bcrypt)
- **Folder** — `id`, `name`, `parent_id` (self-referencing tree), `created_by`, `updated_by`
- **File** — `id`, `filename`, `size`, `mime_type`, `key` (S3 path), `status` (UNREADY/PROCESSING/READY), `thumbnail_key`, `folder_id`
- **ApiKey** — `id`, `name`, `prefix`, `last4`, `secret` (hashed), `status` (ACTIVE/REVOKED), `expires_at`
- **ActivityLog** — `id`, `action`, `entity_type`, `entity_id`, `entity_name`, `description`, `ip_address`, `old_value`, `new_value`, `performed_by`

## Key Components

- **DashboardLayout** + **Sidebar** — Main layout with navigation (Drive, API Keys, Logs) and storage usage indicator
- **FileBrowser** — Grid/list view with sorting, context menu, rename, delete, thumbnail support
- **UploadZone** — Drag-and-drop upload with progress bars, cancel, and abort support
- **PreviewModal** — Full-screen file preview with download, copy URL, and open in new tab
- **CreateFolderModal** / **RenameModal** — Simple dialog modals for CRUD operations
- **Topbar** — Search input, view mode toggle (grid/list), theme toggle
- **Breadcrumb** — Clickable navigation trail with root → folder path

## Custom Hooks (SWR)

| Hook                            | Description                               |
| ------------------------------- | ----------------------------------------- |
| `useDriveItems(parentId)`       | Fetch items in a folder                   |
| `useDriveBreadcrumbs(folderId)` | Fetch breadcrumb trail                    |
| `useDriveSearch(query)`         | Search files and folders                  |
| `useCreateFolder()`             | Mutation — create folder                  |
| `useDeleteItem()`               | Mutation — delete file/folder             |
| `useRenameItem()`               | Mutation — rename file/folder             |
| `useApiKeys()`                  | Fetch API keys                            |
| `useCreateApiKey()`             | Mutation — create API key                 |
| `useRevokeApiKey()`             | Mutation — revoke API key                 |
| `useLogs(page, timeFilter)`     | Fetch paginated logs                      |
| `useStorageUsage()`             | Fetch storage stats (polls every 30s)     |
| `useDriveViewMode()`            | Persisted grid/list toggle (localStorage) |
| `useNavigation()`               | Route map for sidebar navigation          |

## Project Structure

```
app/
├── layout.tsx              # Root layout (fonts, providers, theme)
├── page.tsx                # Root drive page
├── globals.css             # Tailwind CSS
├── login/                  # Login page
├── [...slug]/              # Catch-all folder browser
├── api-keys/               # API keys page
├── logs/                   # Activity logs page
└── api/                    # API routes
    ├── auth/[...nextauth]/
    ├── drive/
    │   ├── items/
    │   ├── files/[id]/
    │   ├── folders/[id]/
    │   ├── breadcrumbs/
    │   ├── search/
    │   ├── storage/
    │   ├── resolve/
    │   ├── folder-path/
    │   ├── upload/presign/
    │   ├── upload/confirm/
    │   └── download/[fileId]/
    ├── api-keys/
    └── logs/

components/
├── drive/
│   ├── file-browser.tsx
│   ├── file-icon.tsx
│   ├── preview-modal.tsx
│   ├── upload-zone.tsx
│   ├── upload-modal.tsx
│   ├── create-folder-modal.tsx
│   └── rename-modal.tsx
├── layout/
│   ├── dashboard-layout.tsx
│   ├── sidebar.tsx
│   ├── topbar.tsx
│   ├── breadcrumb.tsx
│   └── page-header.tsx
├── ui/                     # Base UI primitives
└── providers/              # Auth session provider

lib/
├── api/                    # API client functions
├── hooks/                  # SWR hooks
├── server/                 # Server-only logic (DB, S3, auth, schemas)
├── types/                  # TypeScript type definitions
├── constants/              # File type icons/colors
├── utils/                  # Utility functions
├── auth.ts                 # NextAuth config
└── fetcher.ts              # SWR fetcher

prisma/
├── schema.prisma           # Database schema
├── migrations/             # Migration history
└── seed.ts                 # Default user seeder
```

## Deployment (Vercel)

```json
{
  "bunVersion": "1.x"
}
```

Set all environment variables in the Vercel dashboard. The `NEXT_PUBLIC_*` variables must be set at build time.

```bash
bun run build
bun run start
```
