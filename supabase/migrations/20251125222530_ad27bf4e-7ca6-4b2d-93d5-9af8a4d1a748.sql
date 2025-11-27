-- Add flow_data column to playbooks table for storing visual flow editor data
ALTER TABLE playbooks ADD COLUMN IF NOT EXISTS flow_data JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN playbooks.flow_data IS 'Stores visual flow editor data including nodes and edges for the playbook builder';