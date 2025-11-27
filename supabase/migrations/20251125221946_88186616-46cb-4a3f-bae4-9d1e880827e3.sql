-- Add versioning columns to proposals table
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS parent_proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS change_notes TEXT;

-- Create index for parent_proposal_id to improve query performance
CREATE INDEX IF NOT EXISTS idx_proposals_parent_id ON proposals(parent_proposal_id);

-- Create index for version queries
CREATE INDEX IF NOT EXISTS idx_proposals_version ON proposals(deal_id, version DESC);