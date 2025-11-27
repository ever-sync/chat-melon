-- Add advanced fields to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS competitor TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS loss_reason TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS loss_reason_detail TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS win_reason TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS temperature TEXT DEFAULT 'warm';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_step TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_step_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS decision_maker TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS budget_confirmed BOOLEAN DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS timeline_confirmed BOOLEAN DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS need_identified TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS competitor_strengths TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS our_differentials TEXT;

-- Add check constraint for temperature
ALTER TABLE deals ADD CONSTRAINT deals_temperature_check 
  CHECK (temperature IN ('hot', 'warm', 'cold'));

-- Add check constraint for loss_reason
ALTER TABLE deals ADD CONSTRAINT deals_loss_reason_check 
  CHECK (loss_reason IN ('price', 'competitor', 'timing', 'budget_cancelled', 'no_response', 'other'));

-- Add check constraint for win_reason
ALTER TABLE deals ADD CONSTRAINT deals_win_reason_check 
  CHECK (win_reason IN ('price', 'relationship', 'product', 'service', 'other'));

-- Create index for next_step_date
CREATE INDEX IF NOT EXISTS idx_deals_next_step_date ON deals(next_step_date) WHERE next_step_date IS NOT NULL;