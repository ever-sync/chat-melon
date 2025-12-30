-- Migration: Create function to auto-archive old deals based on pipeline settings
-- This function can be called periodically via cron or edge function

-- Function to auto-archive deals based on pipeline settings
CREATE OR REPLACE FUNCTION auto_archive_old_deals()
RETURNS void AS $$
DECLARE
  pipeline_record RECORD;
  archive_won_days INT;
  archive_lost_days INT;
BEGIN
  -- Loop through all pipelines with settings
  FOR pipeline_record IN
    SELECT id, settings FROM pipelines WHERE settings IS NOT NULL
  LOOP
    -- Get archive settings
    archive_won_days := (pipeline_record.settings->>'auto_archive_won_days')::INT;
    archive_lost_days := (pipeline_record.settings->>'auto_archive_lost_days')::INT;

    -- Archive won deals older than X days
    IF archive_won_days IS NOT NULL AND archive_won_days > 0 THEN
      UPDATE deals
      SET
        archived_at = NOW(),
        status = 'archived_won'
      WHERE
        pipeline_id = pipeline_record.id
        AND status = 'won'
        AND won_at IS NOT NULL
        AND won_at < NOW() - (archive_won_days || ' days')::INTERVAL
        AND archived_at IS NULL;
    END IF;

    -- Archive lost deals older than X days
    IF archive_lost_days IS NOT NULL AND archive_lost_days > 0 THEN
      UPDATE deals
      SET
        archived_at = NOW(),
        status = 'archived_lost'
      WHERE
        pipeline_id = pipeline_record.id
        AND status = 'lost'
        AND lost_at IS NOT NULL
        AND lost_at < NOW() - (archive_lost_days || ' days')::INTERVAL
        AND archived_at IS NULL;
    END IF;
  END LOOP;

  RAISE NOTICE 'Auto-archive deals completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add archived_at column to deals table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE deals ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- Create index for archived deals
CREATE INDEX IF NOT EXISTS idx_deals_archived_at ON deals(archived_at) WHERE archived_at IS NOT NULL;

-- Function to notify stale deals (can be called daily)
CREATE OR REPLACE FUNCTION check_stale_deals()
RETURNS TABLE(
  deal_id UUID,
  deal_title TEXT,
  days_stale INT,
  pipeline_name TEXT,
  assigned_to_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    EXTRACT(DAY FROM NOW() - COALESCE(d.last_activity, d.created_at))::INT AS days_stale,
    p.name AS pipeline_name,
    pr.email AS assigned_to_email
  FROM deals d
  JOIN pipelines p ON d.pipeline_id = p.id
  LEFT JOIN profiles pr ON d.assigned_to = pr.id
  WHERE
    d.status = 'open'
    AND p.settings IS NOT NULL
    AND (p.settings->>'notify_deal_stale')::BOOLEAN = true
    AND EXTRACT(DAY FROM NOW() - COALESCE(d.last_activity, d.created_at)) >=
        COALESCE((p.settings->>'stale_days_threshold')::INT, 7);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get high value deals for notification
CREATE OR REPLACE FUNCTION check_high_value_deals()
RETURNS TABLE(
  deal_id UUID,
  deal_title TEXT,
  deal_value NUMERIC,
  pipeline_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.value,
    p.name AS pipeline_name,
    d.created_at
  FROM deals d
  JOIN pipelines p ON d.pipeline_id = p.id
  WHERE
    d.status = 'open'
    AND d.created_at > NOW() - INTERVAL '24 hours'
    AND p.settings IS NOT NULL
    AND (p.settings->>'notify_high_value_deal')::BOOLEAN = true
    AND d.value >= COALESCE((p.settings->>'high_value_threshold')::NUMERIC, 10000);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auto_archive_old_deals() TO authenticated;
GRANT EXECUTE ON FUNCTION check_stale_deals() TO authenticated;
GRANT EXECUTE ON FUNCTION check_high_value_deals() TO authenticated;

COMMENT ON FUNCTION auto_archive_old_deals() IS 'Auto-archives won/lost deals based on pipeline settings. Should be called daily via cron.';
COMMENT ON FUNCTION check_stale_deals() IS 'Returns deals that are stale based on pipeline settings.';
COMMENT ON FUNCTION check_high_value_deals() IS 'Returns high-value deals created in the last 24h that should trigger notifications.';
