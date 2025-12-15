---
description: Deploy and configure features for Phases 3, 4, and 5 (Integrations, Analytics, Enterprise, Channels)
---

# Deploy Roadmap Features

This workflow guides you through applying database migrations and deploying Edge Functions to correct and finalize the roadmap implementation.

## 1. Apply Supabase Migrations

You must apply the migration files in the specific order below using the Supabase Dashboard SQL Editor.

1.  **Correct Chatbot Builder:**
    Open `supabase/migrations/20251214000002_chatbot_builder.sql` and run it. This fixes the trigger function issue.

2.  **Phase 3: E-commerce & Automation:**
    Open `supabase/migrations/20251215000001_phase3_ecommerce_automation.sql` and run it. This adds product catalogs and advanced automation schemas.

3.  **Phase 4: Analytics & Integrations:**
    Open `supabase/migrations/20251215000003_phase4_analytics_integrations.sql` and run it. This adds custom dashboards, cohorts, attribution, and integration tables.

4.  **Phase 5: Enterprise Security:**
    Open `supabase/migrations/20251215000004_phase5_enterprise.sql` and run it. This adds SSO, audit logs, and 2FA features.

5.  **Multi-Channel Support (Channels):**
    Open `supabase/migrations/20251215000005_channels_omnichannel.sql` and run it. This adds the `channels` table and updates `conversations` for Instagram/Messenger support.

6.  **Update Feature Flags:**
    Open `supabase/migrations/20251215000002_add_phase2_phase3_features.sql` and run it. This ensures all new features (Integrations, Security, Channels) appear in the Super Admin panel.

## 2. Deploy Edge Functions

Deploy the new Edge Functions for Instagram and Messenger integration.

```bash
npx supabase functions deploy instagram-webhook --no-verify-jwt
npx supabase functions deploy instagram-send-message --no-verify-jwt
npx supabase functions deploy messenger-webhook --no-verify-jwt
npx supabase functions deploy messenger-send-message --no-verify-jwt
```

*Note: The `--no-verify-jwt` flag is important for webhooks to receive public events from Meta.*

## 3. Configure Meta Webhooks

1.  Go to the [Meta for Developers](https://developers.facebook.com/) portal.
2.  Select your App.
3.  Add **Instagram Basic Display** and **Messenger** products.
4.  Configure **Webhooks** for both products.
    *   **Callback URL:** `https://<PROJECT_REF>.supabase.co/functions/v1/instagram-webhook` (replace `<PROJECT_REF>` with your Supabase project ID).
    *   **Verify Token:** Use the value you set in `META_VERIFY_TOKEN` env var.
    *   **Fields:** Select `messages`, `messaging_postbacks`, etc.

## 4. Regenerate Types

After applying all migrations, update your local TypeScript types to resolve any remaining frontend errors.

```bash
npx supabase gen types typescript --project-id "your-project-id" --schema public > src/integrations/supabase/types.ts
```

## 5. Enable Features

1.  Go to your app's **Super Admin** or **Settings** page.
2.  Enable the new features: **Integrações**, **Segurança**, **Canais**.
3.  Refresh the page to see the new sidebar items.
