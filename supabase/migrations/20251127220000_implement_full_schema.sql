-- Migration to implement full schema from docs/DATABASE.md

-- 1. Empresas e Usuários

-- company_members
CREATE TABLE IF NOT EXISTS public.company_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    role text, -- user_role enum might need update or use text check
    display_name text,
    email text,
    phone text,
    avatar_url text,
    is_active boolean DEFAULT true,
    is_online boolean DEFAULT false,
    last_seen_at timestamp with time zone,
    current_status text,
    can_receive_chats boolean DEFAULT true,
    max_concurrent_chats integer DEFAULT 3,
    team_id uuid,
    reports_to uuid,
    working_hours jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- company_invites
CREATE TABLE IF NOT EXISTS public.company_invites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    team_id uuid,
    invited_by uuid,
    status text DEFAULT 'pending',
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- teams
CREATE TABLE IF NOT EXISTS public.teams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    manager_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- platform_admins
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Chat e Mensagens

-- message_templates
CREATE TABLE IF NOT EXISTS public.message_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    created_by uuid,
    name text NOT NULL,
    content text NOT NULL,
    category text,
    usage_count integer DEFAULT 0,
    is_favorite boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- conversation_notes
CREATE TABLE IF NOT EXISTS public.conversation_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    note_type text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- queues
CREATE TABLE IF NOT EXISTS public.queues (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    color text,
    is_active boolean DEFAULT true,
    distribution_mode text DEFAULT 'round_robin',
    max_concurrent_chats integer,
    priority integer DEFAULT 0,
    business_hours_only boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- queue_members
CREATE TABLE IF NOT EXISTS public.queue_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_id uuid NOT NULL,
    member_id uuid NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Contatos

-- contact_notes
CREATE TABLE IF NOT EXISTS public.contact_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id uuid NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    note text NOT NULL,
    is_pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- contact_duplicates
CREATE TABLE IF NOT EXISTS public.contact_duplicates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    contact_id_1 uuid NOT NULL,
    contact_id_2 uuid NOT NULL,
    similarity_score float,
    match_reason text,
    status text DEFAULT 'pending',
    merged_into uuid,
    merged_by uuid,
    merged_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- segments
CREATE TABLE IF NOT EXISTS public.segments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    filter_rules jsonb,
    is_dynamic boolean DEFAULT true,
    contact_count integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. CRM - Negócios e Pipeline

-- pipelines
CREATE TABLE IF NOT EXISTS public.pipelines (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- pipeline_stages
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id uuid NOT NULL,
    name text NOT NULL,
    color text,
    order_index integer DEFAULT 0,
    probability_default integer,
    is_closed_won boolean DEFAULT false,
    is_closed_lost boolean DEFAULT false,
    automation_rules jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- deals
CREATE TABLE IF NOT EXISTS public.deals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    pipeline_id uuid NOT NULL,
    stage_id uuid NOT NULL,
    contact_id uuid,
    assigned_to uuid,
    title text NOT NULL,
    value numeric,
    probability integer,
    expected_close_date date,
    priority text,
    status text,
    temperature text,
    temperature_score integer,
    products jsonb,
    custom_fields jsonb,
    budget_confirmed boolean,
    timeline_confirmed boolean,
    decision_maker text,
    need_identified text,
    competitor text,
    competitor_strengths text,
    our_differentials text,
    next_step text,
    next_step_date date,
    win_reason text,
    loss_reason text,
    loss_reason_detail text,
    churn_risk_score integer,
    last_activity timestamp with time zone,
    won_at timestamp with time zone,
    lost_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- deal_activities
CREATE TABLE IF NOT EXISTS public.deal_activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL,
    user_id uuid NOT NULL,
    activity_type text NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Tarefas

-- tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    assigned_to uuid,
    created_by uuid,
    contact_id uuid,
    deal_id uuid,
    title text NOT NULL,
    description text,
    task_type text,
    priority text,
    status text DEFAULT 'pending',
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    reminder_sent boolean DEFAULT false,
    add_to_google_calendar boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- calendar_sync
CREATE TABLE IF NOT EXISTS public.calendar_sync (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    google_event_id text,
    sync_direction text,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. Propostas Comerciais

-- proposals
CREATE TABLE IF NOT EXISTS public.proposals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid,
    created_by uuid,
    title text NOT NULL,
    items jsonb,
    subtotal numeric,
    discount numeric,
    discount_type text,
    tax numeric,
    total numeric,
    payment_terms text,
    validity_days integer,
    status text DEFAULT 'draft',
    public_link text,
    pdf_url text,
    viewed_at timestamp with time zone,
    accepted_at timestamp with time zone,
    rejected_at timestamp with time zone,
    rejection_reason text,
    signature_data text,
    client_name text,
    client_document text,
    version integer DEFAULT 1,
    parent_proposal_id uuid,
    change_notes text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- proposal_templates
CREATE TABLE IF NOT EXISTS public.proposal_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    content jsonb,
    thumbnail text,
    category text,
    usage_count integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- proposal_views
CREATE TABLE IF NOT EXISTS public.proposal_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id uuid NOT NULL,
    viewer_ip text,
    viewer_user_agent text,
    duration_seconds integer,
    viewed_at timestamp with time zone DEFAULT now()
);

-- 7. Produtos

-- products
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    sku text,
    price numeric,
    cost numeric,
    category text,
    images text[],
    is_active boolean DEFAULT true,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 8. Campanhas em Massa

-- campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    created_by uuid,
    instance_id uuid,
    name text NOT NULL,
    description text,
    message_content text,
    message_media_url text,
    message_type text,
    segment_id uuid,
    contact_filter jsonb,
    status text DEFAULT 'draft',
    schedule_at timestamp with time zone,
    business_hours_only boolean DEFAULT false,
    business_hours_start time,
    business_hours_end time,
    sending_rate integer,
    total_contacts integer DEFAULT 0,
    sent_count integer DEFAULT 0,
    delivered_count integer DEFAULT 0,
    read_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    reply_count integer DEFAULT 0,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- campaign_contacts
CREATE TABLE IF NOT EXISTS public.campaign_contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    status text DEFAULT 'pending',
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    read_at timestamp with time zone,
    replied_at timestamp with time zone,
    reply_message text,
    error_message text
);

-- 9. Automações e Playbooks

-- playbooks
CREATE TABLE IF NOT EXISTS public.playbooks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    trigger_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
    -- Add other columns as needed from docs if any
);

-- Add missing columns to existing tables

-- contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS lead_score integer;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS score_breakdown jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS score_updated_at timestamp with time zone;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company_cnpj text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company_data jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS enrichment_data jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS enrichment_status text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS enriched_at timestamp with time zone;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS ai_tags text[];
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS ai_qualification_level text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS ai_next_best_action text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS ai_last_analyzed_at timestamp with time zone;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS merged_into uuid;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- conversations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS queue_id uuid;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_enabled boolean DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_mode text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_messages_count integer DEFAULT 0;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_handoff_at timestamp with time zone;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_handoff_reason text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_paused_at timestamp with time zone;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_paused_by uuid;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_paused_reason text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_summary_updated_at timestamp with time zone;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_next_step_suggestion text;

-- messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_from_ai boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_mime_type text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS quoted_message_id uuid;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS played_at timestamp with time zone;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS ai_metadata jsonb;

-- profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_calendar_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_calendar_refresh_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_calendar_email text;

