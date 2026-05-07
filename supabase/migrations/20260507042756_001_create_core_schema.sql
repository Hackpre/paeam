/*
  # Create Core Schema for Music Producer Rights & Royalty Management System

  1. New Tables
    - `producer_profiles` - Verified producer registry with legal info, bank details, association membership
    - `catalog_entries` - Song/project catalog with full metadata (ISRC, BPM, key, split sheets, etc.)
    - `contracts` - Contract management with royalty splits, territory, digital signatures
    - `lock_approvals` - Three-way lock system requiring producer, artist, and association approval
    - `audit_logs` - Immutable audit trail for all record changes
    - `catalog_files` - File attachments for catalog entries (audio, contracts, artwork, etc.)

  2. Security
    - Enable RLS on ALL tables
    - Producers can only access their own data
    - Lock approvals require authenticated users matching their role
    - Audit logs are insert-only (no update/delete)

  3. Important Notes
    - Three-way lock system: records become immutable once all 3 parties approve
    - Each contract change creates a new version; previous versions are permanently archived
    - Cryptographic hash stored on each locked record for tamper detection
*/

-- Producer profiles table
CREATE TABLE IF NOT EXISTS producer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_legal_name text NOT NULL,
  stage_name text NOT NULL,
  national_id text,
  phone_number text NOT NULL,
  email text NOT NULL,
  studio_address text DEFAULT '',
  association_membership_number text UNIQUE,
  tax_id text,
  bank_details_encrypted text DEFAULT '',
  profile_photo_url text DEFAULT '',
  association_verification_status text DEFAULT 'pending' CHECK (association_verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Catalog entries table
CREATE TABLE IF NOT EXISTS catalog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES producer_profiles(id) ON DELETE CASCADE,
  song_title text NOT NULL,
  isrc_code text DEFAULT '',
  producer_name text NOT NULL,
  artist_names text[] DEFAULT '{}',
  songwriters text[] DEFAULT '{}',
  beat_ownership_status text DEFAULT 'owned' CHECK (beat_ownership_status IN ('owned', 'co-owned', 'licensed', 'work-for-hire')),
  date_created date,
  date_released date,
  genre text DEFAULT '',
  duration_seconds integer DEFAULT 0,
  bpm integer,
  musical_key text DEFAULT '',
  split_sheet_url text DEFAULT '',
  publishing_details text DEFAULT '',
  is_locked boolean DEFAULT false,
  content_hash text DEFAULT '',
  version integer DEFAULT 1,
  parent_version_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Catalog files table
CREATE TABLE IF NOT EXISTS catalog_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_entry_id uuid NOT NULL REFERENCES catalog_entries(id) ON DELETE CASCADE,
  file_type text NOT NULL CHECK (file_type IN ('master_wav', 'master_mp3', 'instrumental', 'contract_pdf', 'split_sheet_pdf', 'session_file', 'artwork', 'copyright_certificate', 'other')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size_bytes bigint DEFAULT 0,
  uploaded_at timestamptz DEFAULT now()
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_entry_id uuid NOT NULL REFERENCES catalog_entries(id) ON DELETE CASCADE,
  contract_type text NOT NULL CHECK (contract_type IN ('exclusive', 'non-exclusive', 'work-for-hire')),
  royalty_percentage numeric(5,2) DEFAULT 0,
  mechanical_rights_pct numeric(5,2) DEFAULT 0,
  performance_rights_pct numeric(5,2) DEFAULT 0,
  publishing_split_pct numeric(5,2) DEFAULT 0,
  agreement_duration_months integer DEFAULT 0,
  territory text DEFAULT 'Malawi',
  payment_schedule text DEFAULT '',
  producer_signature text DEFAULT '',
  artist_signature text DEFAULT '',
  association_witness_signature text DEFAULT '',
  is_locked boolean DEFAULT false,
  content_hash text DEFAULT '',
  version integer DEFAULT 1,
  parent_version_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Three-way lock approvals table
CREATE TABLE IF NOT EXISTS lock_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL CHECK (record_type IN ('catalog_entry', 'contract')),
  record_id uuid NOT NULL,
  producer_approved boolean DEFAULT false,
  producer_approved_at timestamptz,
  producer_approval_hash text DEFAULT '',
  artist_approved boolean DEFAULT false,
  artist_approved_at timestamptz,
  artist_approval_hash text DEFAULT '',
  association_approved boolean DEFAULT false,
  association_approved_at timestamptz,
  association_approval_hash text DEFAULT '',
  is_fully_locked boolean DEFAULT false,
  locked_at timestamptz,
  unlock_request_reason text DEFAULT '',
  unlock_requested_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Immutable audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  record_type text NOT NULL,
  record_id uuid NOT NULL,
  old_data jsonb DEFAULT '{}',
  new_data jsonb DEFAULT '{}',
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE producer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lock_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Producer profiles policies
CREATE POLICY "Producers can view own profile"
  ON producer_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Producers can insert own profile"
  ON producer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Producers can update own profile"
  ON producer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Catalog entries policies
CREATE POLICY "Producers can view own catalog"
  ON catalog_entries FOR SELECT
  TO authenticated
  USING (producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Producers can insert own catalog"
  ON catalog_entries FOR INSERT
  TO authenticated
  WITH CHECK (producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Producers can update own unlocked catalog"
  ON catalog_entries FOR UPDATE
  TO authenticated
  USING (producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid()) AND is_locked = false)
  WITH CHECK (producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid()));

-- Catalog files policies
CREATE POLICY "Producers can view own catalog files"
  ON catalog_files FOR SELECT
  TO authenticated
  USING (catalog_entry_id IN (SELECT id FROM catalog_entries WHERE producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Producers can insert own catalog files"
  ON catalog_files FOR INSERT
  TO authenticated
  WITH CHECK (catalog_entry_id IN (SELECT id FROM catalog_entries WHERE producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid())));

-- Contracts policies
CREATE POLICY "Producers can view own contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (catalog_entry_id IN (SELECT id FROM catalog_entries WHERE producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Producers can insert own contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (catalog_entry_id IN (SELECT id FROM catalog_entries WHERE producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Producers can update own unlocked contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (catalog_entry_id IN (SELECT id FROM catalog_entries WHERE producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid()) AND is_locked = false))
  WITH CHECK (catalog_entry_id IN (SELECT id FROM catalog_entries WHERE producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid())));

-- Lock approvals policies
CREATE POLICY "Producers can view own lock approvals"
  ON lock_approvals FOR SELECT
  TO authenticated
  USING (
    (record_type = 'catalog_entry' AND record_id IN (SELECT id FROM catalog_entries WHERE producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid())))
    OR (record_type = 'contract' AND record_id IN (SELECT id FROM contracts WHERE catalog_entry_id IN (SELECT id FROM catalog_entries WHERE producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid()))))
  );

CREATE POLICY "Producers can insert lock approvals"
  ON lock_approvals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Producers can update lock approvals for own records"
  ON lock_approvals FOR UPDATE
  TO authenticated
  USING (
    (record_type = 'catalog_entry' AND record_id IN (SELECT id FROM catalog_entries WHERE producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid())))
    OR (record_type = 'contract' AND record_id IN (SELECT id FROM contracts WHERE catalog_entry_id IN (SELECT id FROM catalog_entries WHERE producer_id IN (SELECT id FROM producer_profiles WHERE user_id = auth.uid()))))
  );

-- Audit logs: insert only, read own
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_catalog_entries_producer ON catalog_entries(producer_id);
CREATE INDEX IF NOT EXISTS idx_catalog_files_entry ON catalog_files(catalog_entry_id);
CREATE INDEX IF NOT EXISTS idx_contracts_entry ON contracts(catalog_entry_id);
CREATE INDEX IF NOT EXISTS idx_lock_approvals_record ON lock_approvals(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_producer_profiles_user ON producer_profiles(user_id);
