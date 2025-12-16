-- =====================================================
-- Cadence Automation - Execute Pending Steps
-- =====================================================

-- Enable pg_net extension for HTTP calls (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enable pg_cron extension for scheduled jobs (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- Function: Process pending cadence steps
-- =====================================================

CREATE OR REPLACE FUNCTION process_pending_cadence_steps()
RETURNS jsonb AS $$
DECLARE
  enrollment_record RECORD;
  processed_count INTEGER := 0;
  error_count INTEGER := 0;
  result jsonb := '[]'::jsonb;
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get environment variables from vault or use defaults
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Fallback to SUPABASE_URL if app settings not configured
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://' || current_setting('request.headers', true)::json->>'host';
  END IF;

  -- Process enrollments that are due
  FOR enrollment_record IN
    SELECT ce.id, ce.cadence_id, c.name as cadence_name, ce.current_step
    FROM cadence_enrollments ce
    JOIN cadences c ON c.id = ce.cadence_id
    WHERE ce.status = 'active'
      AND ce.next_step_at <= NOW()
      AND c.status = 'active'
    ORDER BY ce.next_step_at ASC
    LIMIT 100  -- Process max 100 per run to avoid timeouts
  LOOP
    BEGIN
      -- Log that we're processing this enrollment
      RAISE NOTICE 'Processing enrollment: %, cadence: %, step: %',
        enrollment_record.id, enrollment_record.cadence_name, enrollment_record.current_step;

      -- Call the edge function via pg_net
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/execute-cadence-step',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object('enrollmentId', enrollment_record.id)
      );

      processed_count := processed_count + 1;

      -- Add to result
      result := result || jsonb_build_array(jsonb_build_object(
        'enrollment_id', enrollment_record.id,
        'status', 'queued'
      ));

    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'Error processing enrollment %: %', enrollment_record.id, SQLERRM;

      -- Add error to result
      result := result || jsonb_build_array(jsonb_build_object(
        'enrollment_id', enrollment_record.id,
        'status', 'error',
        'error', SQLERRM
      ));
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', processed_count,
    'errors', error_count,
    'timestamp', NOW(),
    'details', result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Alternative: Simpler trigger-based approach
-- This processes one enrollment at a time via webhook
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_cadence_step_execution()
RETURNS trigger AS $$
DECLARE
  supabase_url TEXT;
BEGIN
  -- Only trigger if enrollment is active and due
  IF NEW.status = 'active' AND NEW.next_step_at <= NOW() THEN
    supabase_url := current_setting('app.settings.supabase_url', true);

    IF supabase_url IS NOT NULL THEN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/execute-cadence-step',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('enrollmentId', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Handle cadence reply detection
-- Called when incoming message is received
-- =====================================================

CREATE OR REPLACE FUNCTION handle_cadence_reply(
  p_contact_id UUID,
  p_company_id UUID
)
RETURNS jsonb AS $$
DECLARE
  enrollment RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Find active enrollments for this contact
  FOR enrollment IN
    SELECT ce.id, ce.cadence_id, c.name as cadence_name
    FROM cadence_enrollments ce
    JOIN cadences c ON c.id = ce.cadence_id
    WHERE ce.contact_id = p_contact_id
      AND ce.status = 'active'
      AND c.company_id = p_company_id
  LOOP
    -- Update enrollment status to replied
    UPDATE cadence_enrollments
    SET
      status = 'replied',
      replied_at = NOW(),
      updated_at = NOW()
    WHERE id = enrollment.id;

    -- Update cadence total_replied
    UPDATE cadences
    SET
      total_replied = total_replied + 1,
      updated_at = NOW()
    WHERE id = enrollment.cadence_id;

    updated_count := updated_count + 1;

    RAISE NOTICE 'Cadence reply detected - enrollment: %, cadence: %',
      enrollment.id, enrollment.cadence_name;
  END LOOP;

  RETURN jsonb_build_object(
    'updated', updated_count,
    'contact_id', p_contact_id,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Enroll contact in cadence
-- Helper function for API/frontend use
-- =====================================================

CREATE OR REPLACE FUNCTION enroll_contact_in_cadence(
  p_cadence_id UUID,
  p_contact_id UUID,
  p_deal_id UUID DEFAULT NULL,
  p_enrolled_by UUID DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_cadence RECORD;
  v_first_step RECORD;
  v_enrollment_id UUID;
  v_next_step_at TIMESTAMPTZ;
BEGIN
  -- Get cadence details
  SELECT * INTO v_cadence
  FROM cadences
  WHERE id = p_cadence_id AND status = 'active';

  IF v_cadence IS NULL THEN
    RETURN jsonb_build_object('error', 'Cadence not found or not active');
  END IF;

  -- Check if already enrolled
  IF EXISTS (
    SELECT 1 FROM cadence_enrollments
    WHERE cadence_id = p_cadence_id
      AND contact_id = p_contact_id
      AND status IN ('active', 'paused')
  ) THEN
    RETURN jsonb_build_object('error', 'Contact already enrolled in this cadence');
  END IF;

  -- Get first step delay
  SELECT * INTO v_first_step
  FROM jsonb_array_elements(v_cadence.steps) WITH ORDINALITY AS x(step, idx)
  WHERE x.idx = 1
  LIMIT 1;

  -- Calculate next step time
  IF v_first_step IS NOT NULL THEN
    v_next_step_at := NOW() + ((v_first_step.step->>'day')::INTEGER * INTERVAL '1 day');

    -- Apply time if specified
    IF v_first_step.step->>'time' IS NOT NULL THEN
      v_next_step_at := date_trunc('day', v_next_step_at) +
        (v_first_step.step->>'time')::TIME;
    END IF;
  ELSE
    v_next_step_at := NOW();
  END IF;

  -- Create enrollment
  INSERT INTO cadence_enrollments (
    cadence_id,
    contact_id,
    deal_id,
    current_step,
    status,
    next_step_at,
    enrolled_by,
    step_history
  ) VALUES (
    p_cadence_id,
    p_contact_id,
    p_deal_id,
    0,
    'active',
    v_next_step_at,
    p_enrolled_by,
    '[]'::jsonb
  )
  RETURNING id INTO v_enrollment_id;

  -- Update cadence total enrolled
  UPDATE cadences
  SET
    total_enrolled = total_enrolled + 1,
    updated_at = NOW()
  WHERE id = p_cadence_id;

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', v_enrollment_id,
    'next_step_at', v_next_step_at,
    'cadence_name', v_cadence.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Pause/Resume enrollment
-- =====================================================

CREATE OR REPLACE FUNCTION update_enrollment_status(
  p_enrollment_id UUID,
  p_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_enrollment RECORD;
BEGIN
  -- Validate status
  IF p_status NOT IN ('active', 'paused', 'exited') THEN
    RETURN jsonb_build_object('error', 'Invalid status. Use: active, paused, or exited');
  END IF;

  -- Get enrollment
  SELECT * INTO v_enrollment
  FROM cadence_enrollments
  WHERE id = p_enrollment_id;

  IF v_enrollment IS NULL THEN
    RETURN jsonb_build_object('error', 'Enrollment not found');
  END IF;

  -- Update enrollment
  UPDATE cadence_enrollments
  SET
    status = p_status,
    exit_reason = CASE WHEN p_status = 'exited' THEN p_reason ELSE exit_reason END,
    updated_at = NOW()
  WHERE id = p_enrollment_id;

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', p_enrollment_id,
    'new_status', p_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Cron Job: Process cadences every 5 minutes
-- Note: This requires pg_cron to be enabled in Supabase
-- =====================================================

-- Schedule the job (will fail silently if pg_cron not available)
DO $$
BEGIN
  -- Remove existing job if exists
  PERFORM cron.unschedule('process-pending-cadences');
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if cron not available
END $$;

DO $$
BEGIN
  -- Schedule new job - every 5 minutes
  PERFORM cron.schedule(
    'process-pending-cadences',
    '*/5 * * * *',
    $$SELECT process_pending_cadence_steps()$$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available, skipping cron job creation';
END $$;

-- =====================================================
-- Grants
-- =====================================================

-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION enroll_contact_in_cadence(UUID, UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_enrollment_status(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_cadence_reply(UUID, UUID) TO authenticated;

-- Service role only for process function
GRANT EXECUTE ON FUNCTION process_pending_cadence_steps() TO service_role;
