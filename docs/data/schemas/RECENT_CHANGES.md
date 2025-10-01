# Recent Schema Changes - Image Upload Feature

## Date: October 2, 2025

## Summary
Added image upload functionality for service tickets, allowing staff to attach images (before/after repair, issue documentation, etc.).

## Files Added/Updated

### ✅ New Schema File
**`core_09_service_ticket_attachments.sql`**
- New table: `service_ticket_attachments`
- Stores metadata for images uploaded to service tickets
- Links to files in `service_media` storage bucket
- RLS: Public select/insert/update, admin/manager only delete

### ✅ Updated Schema Files

**`storage_policies.sql`**
- Changed `service_media` bucket policies from restrictive (user-folder only) to simple public access
- Old: `service_media_*_own` policies (required files in user_id/filename format)
- New: `service_media_*_public` policies (simple bucket check, allows any folder structure)

### ✅ Updated Seed Files

**`docs/data/seeds/storage_buckets.sql`**
- Changed `service_media` bucket from `public = false` to `public = true`
- Added file size limits and allowed MIME types for all buckets:
  - `avatars`: 5MB, images only
  - `product_images`: 5MB, images only
  - `service_media`: 10MB, images only

### ✅ Updated Setup Script

**`docs/data/schemas/setup_schema.sh`**
- Added `core_09_service_ticket_attachments.sql` to the `SCHEMA_FILES` array (line 50)
- Maintains proper dependency order

## Database Changes Applied

### Table Structure
```sql
service_ticket_attachments
├── id (uuid, PK)
├── ticket_id (uuid, FK → service_tickets)
├── file_name (text)
├── file_path (text) -- Path in storage bucket
├── file_type (text) -- MIME type
├── file_size (bigint)
├── description (text, optional)
├── created_at (timestamptz)
└── created_by (uuid, FK → profiles)
```

### Storage Bucket
- **Bucket:** `service_media`
- **Public:** Yes
- **File Size Limit:** 10MB
- **Allowed Types:** image/jpeg, image/png, image/gif, image/webp
- **Folder Structure:** Files stored as `{ticket_id}/{timestamp}_{random}_{filename}`

### RLS Policies
```sql
-- Database table (service_ticket_attachments)
SELECT: Anyone can view (true)
INSERT: Anyone can add (true)
UPDATE: Anyone can update (true)
DELETE: Admin/Manager only

-- Storage bucket (service_media)
SELECT: Anyone (bucket_id = 'service_media')
INSERT: Anyone (bucket_id = 'service_media')
UPDATE: Anyone (bucket_id = 'service_media')
DELETE: Anyone (bucket_id = 'service_media')
```

## Application Changes

### Backend (tRPC)
**`src/server/routers/tickets.ts`**
- `addAttachment` - Save attachment metadata
- `getAttachments` - Fetch attachments for a ticket
- `deleteAttachment` - Remove attachment

### Frontend Components
1. **`src/components/quick-upload-images-modal.tsx`** (NEW)
   - Modal for quick image upload from ticket table
   - Multi-file selection
   - Upload to storage + save metadata

2. **`src/components/ticket-table.tsx`** (UPDATED)
   - Added "Tải ảnh lên" action to dropdown menu
   - Opens quick upload modal

3. **`src/components/edit-ticket-form.tsx`** (UPDATED)
   - New "Hình ảnh đính kèm" section
   - Grid display of existing images
   - Upload new images
   - Delete images (storage + database)

## Migration Status

### Migration File
**`supabase/migrations/20251001221104_create_service_ticket_attachments.sql`**
- ✅ Contains complete database schema (44KB)
- ✅ Includes `service_ticket_attachments` table with correct RLS
- ❌ Does NOT include storage bucket creation
- ❌ Does NOT include updated storage policies

### What's NOT in Migrations
The following were applied directly via psql:
1. Storage bucket creation (`service_media`)
2. Updated storage policies (public access)

These are covered by:
- `docs/data/seeds/storage_buckets.sql` (for bucket creation)
- `docs/data/schemas/storage_policies.sql` (for policies)

## Testing Checklist

- [x] Database table created with correct structure
- [x] Storage bucket created and configured as public
- [x] RLS policies allow public access
- [x] tRPC mutations work (add, get, delete attachments)
- [x] Quick upload modal functional from ticket table
- [x] Edit form shows existing images
- [x] Upload images from edit form works
- [x] Delete images works (removes from both storage and database)
- [x] Build successful
- [x] Schema files updated
- [x] Setup script updated

## For Fresh Deployments

To set up the schema from scratch, run:
```bash
./docs/data/schemas/setup_schema.sh
```

This will:
1. Copy all schema files to `supabase/schemas/`
2. Create storage buckets (including `service_media` as public)
3. Apply storage policies (simple public access)
4. Generate and apply migrations
5. Clean up temporary files

## Notes

- Images are publicly accessible via URL (no authentication required)
- File uploads are limited to 10MB per file
- Only image types are allowed (jpeg, png, gif, webp)
- Deleting attachments requires admin/manager role
- Files are stored in folder structure: `{ticket_id}/{timestamp}_{random}_{filename}`
