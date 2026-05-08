/*
  # Complete Admin Approval Workflow

  1. Changes to catalog_entries
    - Extend approval_status to include 'pending_admin_approval', 'pending_artist_approval', 'pending_association_approval', 'fully_locked'
    - Add rejection_date column

  2. Changes to contracts
    - Extend approval_status to include 'pending_admin_approval', 'pending_artist_approval', 'pending_association_approval', 'fully_locked'
    - Add rejection_date column

  3. Changes to lock_approvals
    - Add lock_initiated_at column
    - Add lock_completed_at column

  4. New table: ipi_requests
    - id (uuid, primary key)
    - producer_id (uuid, FK to producer_profiles)
    - requested_by (uuid, FK to auth.users)
    - requested_ipi (text)
    - status (text): 'pending' | 'approved' | 'rejected'
    - assigned_ipi (text, nullable)
    - admin_approved_at (timestamptz, nullable)
    - admin_approved_by (uuid, nullable, FK to auth.users)
    - rejection_reason (text, nullable)
    - created_at (timestamptz)

  5. Changes to disputes
    - Extend status to include 'pending_admin_review'

  6. Security
    - Enable RLS on ipi_requests
    - Add restrictive policies for ipi_requests
*/

-- Extend catalog_entries approval_status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'catalog_entries' AND column_name = 'approval_status'
  ) THEN
    -- Drop old constraint
    ALTER TABLE catalog_entries DROP CONSTRAINT IF EXISTS catalog_entries_approval_status_check;
    ALTER TABLE catalog_entries ADD CONSTRAINT catalog_entries_approval_status_check
      CHECK (approval_status IN ('pending', 'pending_admin_approval', 'approved', 'rejected', 'locked', 'pending_artist_approval', 'pending_association_approval', 'fully_locked'));
  END IF;
END $$;

-- Add rejection_date to catalog_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'catalog_entries' AND column_name = 'rejection_date'
  ) THEN
    ALTER TABLE catalog_entries ADD COLUMN rejection_date timestamptz;
  END IF;
END $$;

-- Extend contracts approval_status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_approval_status_check;
    ALTER TABLE contracts ADD CONSTRAINT contracts_approval_status_check
      CHECK (approval_status IN ('pending', 'pending_admin_approval', 'approved', 'rejected', 'locked', 'pending_artist_approval', 'pending_association_approval', 'fully_locked'));
  END IF;
END $$;

-- Add rejection_date to contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'rejection_date'
  ) THEN
    ALTER TABLE contracts ADD COLUMN rejection_date timestamptz;
  END IF;
END $$;

-- Add lock_initiated_at and lock_completed_at to lock_approvals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lock_approvals' AND column_name = 'lock_initiated_at'
  ) THEN
    ALTER TABLE lock_approvals ADD COLUMN lock_initiated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lock_approvals' AND column_name = 'lock_completed_at'
  ) THEN
    ALTER TABLE lock_approvals ADD COLUMN lock_completed_at timestamptz;
  END IF;
END $$;

-- Extend disputes status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'disputes' AND column_name = 'status'
  ) THEN
    ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_status_check;
    ALTER TABLE disputes ADD CONSTRAINT disputes_status_check
      CHECK (status IN ('filed', 'pending_admin_review', 'under_review', 'mediation', 'arbitration', 'resolved', 'dismissed'));
  END IF;
END $$;

-- Create ipi_requests table
CREATE TABLE IF NOT EXISTS ipi_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid REFERENCES producer_profiles(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_ipi text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  assigned_ipi text,
  admin_approved_at timestamptz,
  admin_approved_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on ipi_requests
ALTER TABLE ipi_requests ENABLE ROW LEVEL SECURITY;

-- Policies for ipi_requests
CREATE POLICY "Users can read own IPI requests"
  ON ipi_requests FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Users can insert own IPI requests"
  ON ipi_requests FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins can read all IPI requests"
  ON ipi_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'paeam_admin')
    )
  );

CREATE POLICY "Admins can update IPI requests"
  ON ipi_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'paeam_admin')
    )
  );

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_ipi_requests_status ON ipi_requests(status);
CREATE INDEX IF NOT EXISTS idx_catalog_entries_approval_status ON catalog_entries(approval_status);
CREATE INDEX IF NOT EXISTS idx_contracts_approval_status ON contracts(approval_status);
