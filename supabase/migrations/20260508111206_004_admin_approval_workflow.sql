/*
  # Admin Approval Workflow Schema

  1. Modified Tables
    - `catalog_entries` — Added: admin_approved_at, admin_approved_by; Extended approval_status to include 'locked'
    - `contracts` — Added: admin_approved_at, admin_approved_by; Extended approval_status to include 'locked'
    - `lock_approvals` — Added: artist_id, association_id fields for tracking who approved

  2. Security
    - RLS policies remain restrictive
    - Admin actions logged to audit trail

  3. Important Notes
    1. approval_status 'locked' means the record is immutable after Three-Way Lock completion
    2. Admin approval does NOT override producer/artist approvals - it adds to them
    3. Lock finalization requires both producer_approved and artist_approved to be true
*/

-- Extend catalog_entries approval_status to include 'locked'
ALTER TABLE catalog_entries DROP CONSTRAINT IF EXISTS catalog_entries_approval_status_check;
ALTER TABLE catalog_entries ADD CONSTRAINT catalog_entries_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'locked'));

-- Add admin approval tracking to catalog_entries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catalog_entries' AND column_name = 'admin_approved_at') THEN
    ALTER TABLE catalog_entries ADD COLUMN admin_approved_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catalog_entries' AND column_name = 'admin_approved_by') THEN
    ALTER TABLE catalog_entries ADD COLUMN admin_approved_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Extend contracts approval_status to include 'locked'
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_approval_status_check;
ALTER TABLE contracts ADD CONSTRAINT contracts_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'locked'));

-- Add admin approval tracking to contracts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'admin_approved_at') THEN
    ALTER TABLE contracts ADD COLUMN admin_approved_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'admin_approved_by') THEN
    ALTER TABLE contracts ADD COLUMN admin_approved_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add artist_id and association_id to lock_approvals for tracking
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lock_approvals' AND column_name = 'artist_id') THEN
    ALTER TABLE lock_approvals ADD COLUMN artist_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lock_approvals' AND column_name = 'association_id') THEN
    ALTER TABLE lock_approvals ADD COLUMN association_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add indexes for admin approval queries
CREATE INDEX IF NOT EXISTS idx_catalog_entries_admin_approval ON catalog_entries(approval_status) WHERE approval_status IN ('pending', 'approved');
CREATE INDEX IF NOT EXISTS idx_contracts_admin_approval ON contracts(approval_status) WHERE approval_status IN ('pending', 'approved');
CREATE INDEX IF NOT EXISTS idx_lock_approvals_finalization ON lock_approvals(producer_approved, artist_approved, association_approved) WHERE producer_approved = true AND artist_approved = true AND association_approved = false;
