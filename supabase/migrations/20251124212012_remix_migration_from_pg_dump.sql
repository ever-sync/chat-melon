CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'agent',
    'viewer'
);


--
-- Name: conversation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.conversation_status AS ENUM (
    'waiting',
    're_entry',
    'active',
    'chatbot',
    'closed'
);


--
-- Name: detect_suspicious_activity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.detect_suspicious_activity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _recent_attempts integer;
BEGIN
  SELECT COUNT(*) INTO _recent_attempts
  FROM public.access_audit_log
  WHERE user_id = NEW.user_id
    AND status = 'unauthorized'
    AND created_at > now() - interval '5 minutes';
  
  IF _recent_attempts >= 3 THEN
    INSERT INTO public.security_alerts (
      company_id, alert_type, severity, user_id, description, metadata
    ) VALUES (
      NEW.company_id, 'suspicious_activity', 'high', NEW.user_id,
      format('User %s has %s unauthorized access attempts in the last 5 minutes', 
        NEW.user_id, _recent_attempts),
      jsonb_build_object('attempts_count', _recent_attempts, 'time_window', '5 minutes', 'timestamp', now())
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: get_user_company(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_company(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT company_id
  FROM public.company_users
  WHERE user_id = _user_id
    AND is_default = true
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _company_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = _role
  )
$$;


--
-- Name: log_unauthorized_access(uuid, uuid, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_unauthorized_access(_user_id uuid, _attempted_company_id uuid, _action text, _table_name text, _metadata jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _has_access boolean;
BEGIN
  SELECT user_has_access_to_company(_user_id, _attempted_company_id) INTO _has_access;
  
  IF NOT _has_access THEN
    INSERT INTO public.access_audit_log (
      user_id, company_id, action, table_name, status, error_message, metadata
    ) VALUES (
      _user_id, _attempted_company_id, _action, _table_name, 'unauthorized',
      'User attempted to access data from company they do not belong to', _metadata
    );
    
    INSERT INTO public.security_alerts (
      company_id, alert_type, severity, user_id, description, metadata
    ) VALUES (
      _attempted_company_id, 'unauthorized_access', 'critical', _user_id,
      format('User %s attempted unauthorized access to %s in company %s', 
        _user_id, _table_name, _attempted_company_id),
      jsonb_build_object('action', _action, 'table', _table_name, 'timestamp', now())
    );
  END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: user_has_access_to_company(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_access_to_company(_user_id uuid, _company_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = _user_id
      AND company_id = _company_id
  )
$$;


SET default_table_access_method = heap;

--
-- Name: access_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    ip_address text,
    user_agent text,
    status text NOT NULL,
    error_message text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agent_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_status (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    status text DEFAULT 'online'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blocked_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    blocked_number text NOT NULL,
    blocked_at timestamp with time zone DEFAULT now() NOT NULL,
    reason text
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    cnpj text,
    address text,
    city text,
    state text,
    postal_code text,
    phone text,
    email text,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    subscription_id uuid,
    is_active boolean DEFAULT true,
    created_by uuid,
    logo_url text,
    business_status text DEFAULT 'open'::text,
    business_hours jsonb DEFAULT '{"friday": {"open": "09:00", "close": "18:00", "enabled": true}, "monday": {"open": "09:00", "close": "18:00", "enabled": true}, "sunday": {"open": "09:00", "close": "13:00", "enabled": false}, "tuesday": {"open": "09:00", "close": "18:00", "enabled": true}, "saturday": {"open": "09:00", "close": "13:00", "enabled": false}, "thursday": {"open": "09:00", "close": "18:00", "enabled": true}, "wednesday": {"open": "09:00", "close": "18:00", "enabled": true}}'::jsonb,
    CONSTRAINT companies_business_status_check CHECK ((business_status = ANY (ARRAY['open'::text, 'closed'::text, 'busy'::text]))),
    CONSTRAINT companies_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


--
-- Name: company_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    phone_number text NOT NULL,
    name text,
    push_name text,
    about_status text,
    profile_pic_url text,
    profile_pic_cached_path text,
    profile_pic_updated_at timestamp with time zone,
    is_business boolean DEFAULT false,
    verified_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversation_labels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_labels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    label_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    contact_name text NOT NULL,
    contact_number text NOT NULL,
    profile_pic_url text,
    last_message text,
    last_message_time timestamp with time zone DEFAULT now(),
    unread_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid,
    status public.conversation_status DEFAULT 'waiting'::public.conversation_status,
    sector_id uuid,
    assigned_to uuid,
    tags text[],
    opted_in boolean DEFAULT false,
    is_online boolean DEFAULT false,
    last_seen timestamp with time zone,
    is_typing boolean DEFAULT false,
    is_recording boolean DEFAULT false,
    contact_id uuid
);


--
-- Name: evolution_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evolution_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    api_url text NOT NULL,
    api_key text NOT NULL,
    instance_name text NOT NULL,
    is_connected boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid,
    instance_status text DEFAULT 'not_created'::text,
    qr_code text,
    qr_code_updated_at timestamp with time zone,
    last_connection_check timestamp with time zone,
    auto_created boolean DEFAULT false
);


--
-- Name: group_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    company_id uuid NOT NULL,
    invite_code text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked boolean DEFAULT false,
    revoked_at timestamp with time zone
);


--
-- Name: group_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    company_id uuid NOT NULL,
    phone_number text NOT NULL,
    is_admin boolean DEFAULT false,
    is_super_admin boolean DEFAULT false,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    group_id text NOT NULL,
    name text NOT NULL,
    description text,
    profile_pic_url text,
    owner_number text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_announce_only boolean DEFAULT false,
    who_can_edit_info text DEFAULT 'all'::text,
    who_can_send_messages text DEFAULT 'all'::text
);


--
-- Name: labels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.labels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    color text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    message_type text DEFAULT 'text'::text NOT NULL,
    is_from_me boolean DEFAULT false NOT NULL,
    status text DEFAULT 'sent'::text,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid,
    media_url text,
    media_type text,
    edited_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_for_everyone boolean DEFAULT false,
    poll_data jsonb,
    list_data jsonb,
    location_data jsonb,
    contact_data jsonb,
    reaction text
);


--
-- Name: notification_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    message_type text DEFAULT 'text'::text,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    volume numeric(3,2) DEFAULT 0.5,
    enabled boolean DEFAULT true,
    sound_enabled boolean DEFAULT true,
    badge_enabled boolean DEFAULT true,
    muted_contacts text[] DEFAULT '{}'::text[],
    do_not_disturb_enabled boolean DEFAULT false,
    do_not_disturb_start time without time zone DEFAULT '22:00:00'::time without time zone,
    do_not_disturb_end time without time zone DEFAULT '08:00:00'::time without time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notification_settings_volume_check CHECK (((volume >= (0)::numeric) AND (volume <= (1)::numeric)))
);


--
-- Name: privacy_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.privacy_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    show_profile_picture text DEFAULT 'everyone'::text NOT NULL,
    show_status text DEFAULT 'everyone'::text NOT NULL,
    show_last_seen text DEFAULT 'everyone'::text NOT NULL,
    read_receipts_enabled boolean DEFAULT true NOT NULL,
    who_can_add_to_groups text DEFAULT 'everyone'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT privacy_settings_show_last_seen_check CHECK ((show_last_seen = ANY (ARRAY['everyone'::text, 'contacts'::text, 'nobody'::text]))),
    CONSTRAINT privacy_settings_show_profile_picture_check CHECK ((show_profile_picture = ANY (ARRAY['everyone'::text, 'contacts'::text, 'nobody'::text]))),
    CONSTRAINT privacy_settings_show_status_check CHECK ((show_status = ANY (ARRAY['everyone'::text, 'contacts'::text, 'nobody'::text]))),
    CONSTRAINT privacy_settings_who_can_add_to_groups_check CHECK ((who_can_add_to_groups = ANY (ARRAY['everyone'::text, 'contacts'::text, 'nobody'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sectors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sectors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: security_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    alert_type text NOT NULL,
    severity text NOT NULL,
    user_id uuid,
    description text NOT NULL,
    metadata jsonb,
    acknowledged boolean DEFAULT false,
    acknowledged_by uuid,
    acknowledged_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: status_stories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    phone_number text NOT NULL,
    content_type text NOT NULL,
    content_url text,
    text_content text,
    background_color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL,
    view_count integer DEFAULT 0
);


--
-- Name: status_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status_id uuid NOT NULL,
    viewer_number text NOT NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    price_monthly numeric(10,2) NOT NULL,
    price_yearly numeric(10,2) NOT NULL,
    stripe_price_id_monthly text,
    stripe_price_id_yearly text,
    max_companies integer,
    max_users integer,
    max_conversations integer,
    features jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    status text DEFAULT 'active'::text NOT NULL,
    billing_period text NOT NULL,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: access_audit_log access_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_audit_log
    ADD CONSTRAINT access_audit_log_pkey PRIMARY KEY (id);


--
-- Name: agent_status agent_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_status
    ADD CONSTRAINT agent_status_pkey PRIMARY KEY (id);


--
-- Name: agent_status agent_status_user_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_status
    ADD CONSTRAINT agent_status_user_id_company_id_key UNIQUE (user_id, company_id);


--
-- Name: blocked_contacts blocked_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_contacts
    ADD CONSTRAINT blocked_contacts_pkey PRIMARY KEY (id);


--
-- Name: blocked_contacts blocked_contacts_user_id_company_id_blocked_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_contacts
    ADD CONSTRAINT blocked_contacts_user_id_company_id_blocked_number_key UNIQUE (user_id, company_id, blocked_number);


--
-- Name: companies companies_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_cnpj_key UNIQUE (cnpj);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_users company_users_company_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_company_id_user_id_key UNIQUE (company_id, user_id);


--
-- Name: company_users company_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_company_id_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_company_id_phone_number_key UNIQUE (company_id, phone_number);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: conversation_labels conversation_labels_conversation_id_label_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_labels
    ADD CONSTRAINT conversation_labels_conversation_id_label_id_key UNIQUE (conversation_id, label_id);


--
-- Name: conversation_labels conversation_labels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_labels
    ADD CONSTRAINT conversation_labels_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: evolution_settings evolution_settings_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolution_settings
    ADD CONSTRAINT evolution_settings_company_id_key UNIQUE (company_id);


--
-- Name: evolution_settings evolution_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolution_settings
    ADD CONSTRAINT evolution_settings_pkey PRIMARY KEY (id);


--
-- Name: evolution_settings evolution_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolution_settings
    ADD CONSTRAINT evolution_settings_user_id_key UNIQUE (user_id);


--
-- Name: group_invites group_invites_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites
    ADD CONSTRAINT group_invites_invite_code_key UNIQUE (invite_code);


--
-- Name: group_invites group_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites
    ADD CONSTRAINT group_invites_pkey PRIMARY KEY (id);


--
-- Name: group_participants group_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_participants
    ADD CONSTRAINT group_participants_pkey PRIMARY KEY (id);


--
-- Name: groups groups_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_group_id_key UNIQUE (group_id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: labels labels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notification_history notification_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_history
    ADD CONSTRAINT notification_history_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_user_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_company_id_key UNIQUE (user_id, company_id);


--
-- Name: privacy_settings privacy_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.privacy_settings
    ADD CONSTRAINT privacy_settings_pkey PRIMARY KEY (id);


--
-- Name: privacy_settings privacy_settings_user_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.privacy_settings
    ADD CONSTRAINT privacy_settings_user_id_company_id_key UNIQUE (user_id, company_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: sectors sectors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);


--
-- Name: security_alerts security_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_alerts
    ADD CONSTRAINT security_alerts_pkey PRIMARY KEY (id);


--
-- Name: status_stories status_stories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_stories
    ADD CONSTRAINT status_stories_pkey PRIMARY KEY (id);


--
-- Name: status_views status_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_views
    ADD CONSTRAINT status_views_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_company_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_company_id_role_key UNIQUE (user_id, company_id, role);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_stripe_customer_id_key UNIQUE (stripe_customer_id);


--
-- Name: user_subscriptions user_subscriptions_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: idx_access_audit_log_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_audit_log_company_id ON public.access_audit_log USING btree (company_id, created_at DESC);


--
-- Name: idx_access_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_audit_log_created_at ON public.access_audit_log USING btree (created_at DESC);


--
-- Name: idx_access_audit_log_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_audit_log_status ON public.access_audit_log USING btree (status, created_at DESC) WHERE (status = 'unauthorized'::text);


--
-- Name: idx_access_audit_log_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_audit_log_user_id ON public.access_audit_log USING btree (user_id, created_at DESC);


--
-- Name: idx_companies_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_created_by ON public.companies USING btree (created_by);


--
-- Name: idx_company_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_users_user_id ON public.company_users USING btree (user_id);


--
-- Name: idx_conversation_labels_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_labels_conversation ON public.conversation_labels USING btree (conversation_id);


--
-- Name: idx_conversation_labels_label; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_labels_label ON public.conversation_labels USING btree (label_id);


--
-- Name: idx_conversations_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_company_id ON public.conversations USING btree (company_id, last_message_time DESC);


--
-- Name: idx_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_user_id ON public.conversations USING btree (user_id);


--
-- Name: idx_evolution_settings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evolution_settings_user_id ON public.evolution_settings USING btree (user_id);


--
-- Name: idx_group_invites_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_invites_group_id ON public.group_invites USING btree (group_id);


--
-- Name: idx_group_participants_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_participants_group_id ON public.group_participants USING btree (group_id);


--
-- Name: idx_groups_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_company_id ON public.groups USING btree (company_id);


--
-- Name: idx_labels_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_labels_company ON public.labels USING btree (company_id);


--
-- Name: idx_labels_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_labels_company_id ON public.labels USING btree (company_id, name);


--
-- Name: idx_messages_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_company_id ON public.messages USING btree (company_id, conversation_id, "timestamp" DESC);


--
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: idx_messages_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_deleted ON public.messages USING btree (deleted_at);


--
-- Name: idx_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_user_id ON public.messages USING btree (user_id);


--
-- Name: idx_notification_history_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_history_conversation ON public.notification_history USING btree (conversation_id);


--
-- Name: idx_notification_history_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_history_created ON public.notification_history USING btree (created_at DESC);


--
-- Name: idx_notification_history_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_history_read ON public.notification_history USING btree (read) WHERE (read = false);


--
-- Name: idx_notification_history_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_history_user ON public.notification_history USING btree (user_id, company_id);


--
-- Name: idx_sectors_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sectors_company_id ON public.sectors USING btree (company_id, name);


--
-- Name: idx_security_alerts_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_alerts_company_id ON public.security_alerts USING btree (company_id, created_at DESC);


--
-- Name: idx_security_alerts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_alerts_created_at ON public.security_alerts USING btree (created_at DESC);


--
-- Name: idx_security_alerts_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_alerts_severity ON public.security_alerts USING btree (severity, acknowledged) WHERE (acknowledged = false);


--
-- Name: idx_status_stories_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_status_stories_company_id ON public.status_stories USING btree (company_id);


--
-- Name: idx_status_stories_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_status_stories_expires_at ON public.status_stories USING btree (expires_at);


--
-- Name: idx_status_views_status_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_status_views_status_id ON public.status_views USING btree (status_id);


--
-- Name: idx_user_subscriptions_stripe_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_subscriptions_stripe_customer ON public.user_subscriptions USING btree (stripe_customer_id);


--
-- Name: idx_user_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id);


--
-- Name: access_audit_log trigger_detect_suspicious_activity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_detect_suspicious_activity AFTER INSERT ON public.access_audit_log FOR EACH ROW WHEN ((new.status = 'unauthorized'::text)) EXECUTE FUNCTION public.detect_suspicious_activity();


--
-- Name: agent_status update_agent_status_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_agent_status_updated_at BEFORE UPDATE ON public.agent_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: companies update_companies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contacts update_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: evolution_settings update_evolution_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evolution_settings_updated_at BEFORE UPDATE ON public.evolution_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: groups update_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: labels update_labels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_labels_updated_at BEFORE UPDATE ON public.labels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_settings update_notification_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: privacy_settings update_privacy_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_privacy_settings_updated_at BEFORE UPDATE ON public.privacy_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sectors update_sectors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sectors_updated_at BEFORE UPDATE ON public.sectors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: agent_status agent_status_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_status
    ADD CONSTRAINT agent_status_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: agent_status agent_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_status
    ADD CONSTRAINT agent_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: blocked_contacts blocked_contacts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_contacts
    ADD CONSTRAINT blocked_contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: blocked_contacts blocked_contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_contacts
    ADD CONSTRAINT blocked_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: companies companies_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id);


--
-- Name: company_users company_users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_users company_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: conversation_labels conversation_labels_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_labels
    ADD CONSTRAINT conversation_labels_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_labels conversation_labels_label_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_labels
    ADD CONSTRAINT conversation_labels_label_id_fkey FOREIGN KEY (label_id) REFERENCES public.labels(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);


--
-- Name: conversations conversations_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id) ON DELETE SET NULL;


--
-- Name: evolution_settings evolution_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolution_settings
    ADD CONSTRAINT evolution_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: group_invites group_invites_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites
    ADD CONSTRAINT group_invites_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: group_invites group_invites_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites
    ADD CONSTRAINT group_invites_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_participants group_participants_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_participants
    ADD CONSTRAINT group_participants_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: group_participants group_participants_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_participants
    ADD CONSTRAINT group_participants_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: groups groups_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: messages messages_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: notification_history notification_history_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_history
    ADD CONSTRAINT notification_history_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: privacy_settings privacy_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.privacy_settings
    ADD CONSTRAINT privacy_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: privacy_settings privacy_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.privacy_settings
    ADD CONSTRAINT privacy_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sectors sectors_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: status_stories status_stories_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_stories
    ADD CONSTRAINT status_stories_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: status_views status_views_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_views
    ADD CONSTRAINT status_views_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.status_stories(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: security_alerts Admins can acknowledge alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can acknowledge alerts" ON public.security_alerts FOR UPDATE USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));


--
-- Name: evolution_settings Admins can create evolution settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create evolution settings" ON public.evolution_settings FOR INSERT WITH CHECK ((public.has_role(auth.uid(), public.get_user_company(auth.uid()), 'admin'::public.app_role) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: evolution_settings Admins can delete evolution settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete evolution settings" ON public.evolution_settings FOR DELETE USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));


--
-- Name: sectors Admins can delete sectors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete sectors" ON public.sectors FOR DELETE USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));


--
-- Name: companies Admins can insert companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert companies" ON public.companies FOR INSERT WITH CHECK (public.has_role(auth.uid(), public.get_user_company(auth.uid()), 'admin'::public.app_role));


--
-- Name: sectors Admins can insert sectors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert sectors" ON public.sectors FOR INSERT WITH CHECK (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));


--
-- Name: evolution_settings Admins can update evolution settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update evolution settings" ON public.evolution_settings FOR UPDATE USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));


--
-- Name: sectors Admins can update sectors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update sectors" ON public.sectors FOR UPDATE USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));


--
-- Name: companies Admins can update their companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update their companies" ON public.companies FOR UPDATE USING (public.has_role(auth.uid(), id, 'admin'::public.app_role));


--
-- Name: access_audit_log Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.access_audit_log FOR SELECT USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));


--
-- Name: security_alerts Admins can view security alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view security alerts" ON public.security_alerts FOR SELECT USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));


--
-- Name: subscription_plans Anyone can view subscription plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans FOR SELECT USING (true);


--
-- Name: group_participants Only admins can manage group participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can manage group participants" ON public.group_participants USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));


--
-- Name: companies Only admins can view full company data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view full company data" ON public.companies FOR SELECT USING (public.has_role(auth.uid(), id, 'admin'::public.app_role));


--
-- Name: group_participants Only admins can view group participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view group participants" ON public.group_participants FOR SELECT USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));


--
-- Name: access_audit_log System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.access_audit_log FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: security_alerts System can insert security alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert security alerts" ON public.security_alerts FOR INSERT WITH CHECK (true);


--
-- Name: conversation_labels Users can add labels to conversations in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add labels to conversations in their company" ON public.conversation_labels FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = conversation_labels.conversation_id) AND (conversations.company_id = public.get_user_company(auth.uid()))))));


--
-- Name: blocked_contacts Users can block contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can block contacts" ON public.blocked_contacts FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: conversations Users can create conversations in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create conversations in their company" ON public.conversations FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: groups Users can create groups in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create groups in their company" ON public.groups FOR INSERT WITH CHECK ((company_id = public.get_user_company(auth.uid())));


--
-- Name: labels Users can create labels in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create labels in their company" ON public.labels FOR INSERT WITH CHECK ((company_id = public.get_user_company(auth.uid())));


--
-- Name: messages Users can create messages in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages in their company" ON public.messages FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: status_stories Users can create status in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create status in their company" ON public.status_stories FOR INSERT WITH CHECK (((company_id = public.get_user_company(auth.uid())) AND (auth.uid() = user_id)));


--
-- Name: status_views Users can create status views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create status views" ON public.status_views FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.status_stories
  WHERE ((status_stories.id = status_views.status_id) AND (status_stories.company_id = public.get_user_company(auth.uid()))))));


--
-- Name: conversations Users can delete conversations in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete conversations in their company" ON public.conversations FOR DELETE USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: groups Users can delete groups in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete groups in their company" ON public.groups FOR DELETE USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: labels Users can delete labels in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete labels in their company" ON public.labels FOR DELETE USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: messages Users can delete messages in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete messages in their company" ON public.messages FOR DELETE USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: notification_history Users can delete their own notification history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own notification history" ON public.notification_history FOR DELETE USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: status_stories Users can delete their own status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own status" ON public.status_stories FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: contacts Users can insert contacts in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert contacts in their company" ON public.contacts FOR INSERT WITH CHECK ((company_id = public.get_user_company(auth.uid())));


--
-- Name: notification_history Users can insert their own notification history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own notification history" ON public.notification_history FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: notification_settings Users can insert their own notification settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own notification settings" ON public.notification_settings FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: privacy_settings Users can insert their own privacy settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own privacy settings" ON public.privacy_settings FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: agent_status Users can insert their own status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own status" ON public.agent_status FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: user_subscriptions Users can insert their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own subscriptions" ON public.user_subscriptions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: group_invites Users can manage invites in their company groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage invites in their company groups" ON public.group_invites USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: conversation_labels Users can remove labels from conversations in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove labels from conversations in their company" ON public.conversation_labels FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = conversation_labels.conversation_id) AND (conversations.company_id = public.get_user_company(auth.uid()))))));


--
-- Name: blocked_contacts Users can unblock contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unblock contacts" ON public.blocked_contacts FOR DELETE TO authenticated USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: contacts Users can update contacts in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update contacts in their company" ON public.contacts FOR UPDATE USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: conversations Users can update conversations in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update conversations in their company" ON public.conversations FOR UPDATE USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: groups Users can update groups in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update groups in their company" ON public.groups FOR UPDATE USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: labels Users can update labels in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update labels in their company" ON public.labels FOR UPDATE USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: messages Users can update messages in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update messages in their company" ON public.messages FOR UPDATE USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: notification_history Users can update their own notification history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notification history" ON public.notification_history FOR UPDATE USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: notification_settings Users can update their own notification settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notification settings" ON public.notification_settings FOR UPDATE USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: privacy_settings Users can update their own privacy settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own privacy settings" ON public.privacy_settings FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: agent_status Users can update their own status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own status" ON public.agent_status FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: status_stories Users can update their own status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own status" ON public.status_stories FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_subscriptions Users can update their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: agent_status Users can view agent status in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view agent status in their company" ON public.agent_status FOR SELECT USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: contacts Users can view contacts in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view contacts in their company" ON public.contacts FOR SELECT USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: conversation_labels Users can view conversation labels in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view conversation labels in their company" ON public.conversation_labels FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = conversation_labels.conversation_id) AND (conversations.company_id = public.get_user_company(auth.uid()))))));


--
-- Name: conversations Users can view conversations in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view conversations in their company" ON public.conversations FOR SELECT USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: evolution_settings Users can view evolution settings in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view evolution settings in their company" ON public.evolution_settings FOR SELECT USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: groups Users can view groups in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view groups in their company" ON public.groups FOR SELECT USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: group_invites Users can view invites in their company groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view invites in their company groups" ON public.group_invites FOR SELECT USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: labels Users can view labels in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view labels in their company" ON public.labels FOR SELECT USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: messages Users can view messages in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their company" ON public.messages FOR SELECT USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: sectors Users can view sectors in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view sectors in their company" ON public.sectors FOR SELECT USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: status_stories Users can view status in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view status in their company" ON public.status_stories FOR SELECT USING ((company_id = public.get_user_company(auth.uid())));


--
-- Name: status_views Users can view status views in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view status views in their company" ON public.status_views FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.status_stories
  WHERE ((status_stories.id = status_views.status_id) AND (status_stories.company_id = public.get_user_company(auth.uid()))))));


--
-- Name: blocked_contacts Users can view their blocked contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their blocked contacts" ON public.blocked_contacts FOR SELECT TO authenticated USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: company_users Users can view their company memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their company memberships" ON public.company_users FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notification_history Users can view their own notification history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notification history" ON public.notification_history FOR SELECT USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: notification_settings Users can view their own notification settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notification settings" ON public.notification_settings FOR SELECT USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: privacy_settings Users can view their own privacy settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own privacy settings" ON public.privacy_settings FOR SELECT TO authenticated USING (((auth.uid() = user_id) AND (company_id = public.get_user_company(auth.uid()))));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_subscriptions Users can view their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: access_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.access_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_status; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_status ENABLE ROW LEVEL SECURITY;

--
-- Name: blocked_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blocked_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: company_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_labels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversation_labels ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: evolution_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evolution_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: group_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: group_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

--
-- Name: labels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: privacy_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sectors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

--
-- Name: security_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: status_stories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.status_stories ENABLE ROW LEVEL SECURITY;

--
-- Name: status_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


