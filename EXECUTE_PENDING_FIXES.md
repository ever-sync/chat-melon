# 🚀 EXECUTE PENDING FIXES

Please follow these steps to complete the system repair and integration.

## 1. Apply Database Migrations (Critical)

Go to **Supabase Dashboard > SQL Editor** and run the following scripts in order:

### A. Fix Channel Type Error (#3)
Open `supabase/migrations/20251217000009_fix_channel_type_enum.sql`
- Copy content
- Run in SQL Editor
- **Result**: `channel_type` column will be converted to ENUM safely.

### B. Install Chat-CRM Triggers (Phase 1)
Open `supabase/migrations/20251217000010_chat_crm_triggers.sql`
- Copy content
- Run in SQL Editor
- **Result**: New conversations will create contacts automatically, and Deal creation/Metrics functions will be available.

## 2. Security Action (Recommended)

Since we are stabilizing the backend, it is highly recommended to rotate your API keys if you haven't yet:

1. Go to **Settings > API**.
2. Click **Reset** next to `anon` key.
3. Click **Reset** next to `service_role` key.
4. Update your local `.env` file with the new keys.

## 3. Validation

After running the SQL scripts:
1. Reload your application (F5).
2. Check if the "400/403/406" errors persist (they should be gone).
3. Try creating a new conversation (simulation) -> check if contact appears in CRM.
4. Check the "Nucleus" branding on Sidebar and Landing page.
