/*
  # Complete PAEAM Schema Extension

  1. New Tables
    - `user_roles` — RBAC role assignments
    - `user_sessions` — Active session tracking
    - `payments` — PayChangu payment records
    - `payment_reminders` — Payment reminder history
    - `contract_templates` — Reusable contract templates
    - `royalty_splits` — Detailed royalty breakdowns
    - `disputes` — Dispute filing and resolution
    - `dispute_evidence` — Evidence attachments
    - `notifications` — Email/SMS notification queue
    - `ipi_applications` — IPI number requests
    - `system_settings` — Key-value config store

  2. Modified Tables
    - `producer_profiles` — Added: ipi_number, membership_status, membership_expires_at, trial_started_at, bank_name, account_number_encrypted, digital_signature, document_urls
    - `catalog_entries` — Added: approval_status, approved_by, approved_at, rejection_reason, sync_rights_pct
    - `contracts` — Added: approval_status, approved_by, approved_at, rejection_reason, sync_rights_pct, template_id, renewal_option, expanded contract_type

  3. Security
    - RLS enabled on all new tables with restrictive policies
    - Audit logs remain append-only
    - Admin roles get broader access via role checks
*/

-- ============================================
-- USER ROLES (RBAC)
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'paeam_admin', 'moderator', 'producer', 'artist', 'viewer', 'auditor')),
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin'))
  );

CREATE POLICY "Admins update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin'))
  );

CREATE POLICY "Admins delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin'))
  );

-- ============================================
-- USER SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  device_info text DEFAULT '',
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own sessions"
  ON user_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- EXTEND PRODUCER PROFILES
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'producer_profiles' AND column_name = 'ipi_number') THEN
    ALTER TABLE producer_profiles ADD COLUMN ipi_number text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'producer_profiles' AND column_name = 'membership_status') THEN
    ALTER TABLE producer_profiles ADD COLUMN membership_status text DEFAULT 'trial' CHECK (membership_status IN ('trial', 'active', 'grace', 'suspended'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'producer_profiles' AND column_name = 'membership_expires_at') THEN
    ALTER TABLE producer_profiles ADD COLUMN membership_expires_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'producer_profiles' AND column_name = 'trial_started_at') THEN
    ALTER TABLE producer_profiles ADD COLUMN trial_started_at timestamptz DEFAULT now();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'producer_profiles' AND column_name = 'bank_name') THEN
    ALTER TABLE producer_profiles ADD COLUMN bank_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'producer_profiles' AND column_name = 'account_number_encrypted') THEN
    ALTER TABLE producer_profiles ADD COLUMN account_number_encrypted text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'producer_profiles' AND column_name = 'digital_signature') THEN
    ALTER TABLE producer_profiles ADD COLUMN digital_signature text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'producer_profiles' AND column_name = 'document_urls') THEN
    ALTER TABLE producer_profiles ADD COLUMN document_urls jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================
-- EXTEND CATALOG ENTRIES
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catalog_entries' AND column_name = 'approval_status') THEN
    ALTER TABLE catalog_entries ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catalog_entries' AND column_name = 'approved_by') THEN
    ALTER TABLE catalog_entries ADD COLUMN approved_by uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catalog_entries' AND column_name = 'approved_at') THEN
    ALTER TABLE catalog_entries ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catalog_entries' AND column_name = 'rejection_reason') THEN
    ALTER TABLE catalog_entries ADD COLUMN rejection_reason text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catalog_entries' AND column_name = 'sync_rights_pct') THEN
    ALTER TABLE catalog_entries ADD COLUMN sync_rights_pct numeric DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- EXTEND CONTRACTS
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'approval_status') THEN
    ALTER TABLE contracts ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'approved_by') THEN
    ALTER TABLE contracts ADD COLUMN approved_by uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'approved_at') THEN
    ALTER TABLE contracts ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'rejection_reason') THEN
    ALTER TABLE contracts ADD COLUMN rejection_reason text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'sync_rights_pct') THEN
    ALTER TABLE contracts ADD COLUMN sync_rights_pct numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'template_id') THEN
    ALTER TABLE contracts ADD COLUMN template_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'renewal_option') THEN
    ALTER TABLE contracts ADD COLUMN renewal_option text DEFAULT 'none' CHECK (renewal_option IN ('none', 'auto', 'manual'));
  END IF;
END $$;

-- Update contract_type constraint
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_contract_type_check;
ALTER TABLE contracts ADD CONSTRAINT contracts_contract_type_check
  CHECK (contract_type IN ('exclusive', 'non-exclusive', 'work-for-hire', 'licensing', 'distribution'));

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producer_id uuid REFERENCES producer_profiles(id),
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'MWK',
  payment_type text NOT NULL CHECK (payment_type IN ('membership', 'late_renewal', 'contract_registration', 'royalty_distribution')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  paychangu_tx_id text DEFAULT '',
  paychangu_reference text DEFAULT '',
  payment_method text DEFAULT '' CHECK (payment_method IN ('', 'airtel_money', 'tnm_mpamba', 'national_bank', 'card')),
  receipt_url text DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin', 'auditor'))
  );

-- ============================================
-- PAYMENT REMINDERS
-- ============================================
CREATE TABLE IF NOT EXISTS payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type text NOT NULL DEFAULT 'email',
  days_before_expiry integer,
  sent_at timestamptz DEFAULT now(),
  delivery_status text DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed'))
);
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reminders"
  ON payment_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System insert reminders"
  ON payment_reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CONTRACT TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('exclusive', 'non-exclusive', 'work-for-hire', 'licensing', 'distribution')),
  description text DEFAULT '',
  template_content jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read active templates"
  ON contract_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage templates"
  ON contract_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin'))
  );

CREATE POLICY "Admins update templates"
  ON contract_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin'))
  );

-- ============================================
-- ROYALTY SPLITS
-- ============================================
CREATE TABLE IF NOT EXISTS royalty_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  recipient_role text NOT NULL CHECK (recipient_role IN ('producer', 'artist', 'songwriter', 'publisher', 'other')),
  percentage numeric NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE royalty_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read splits via contracts"
  ON royalty_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN catalog_entries ce ON c.catalog_entry_id = ce.id
      JOIN producer_profiles pp ON ce.producer_id = pp.id
      WHERE c.id = contract_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users create splits for own contracts"
  ON royalty_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN catalog_entries ce ON c.catalog_entry_id = ce.id
      JOIN producer_profiles pp ON ce.producer_id = pp.id
      WHERE c.id = contract_id AND pp.user_id = auth.uid()
    )
  );

-- ============================================
-- DISPUTES
-- ============================================
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filed_by uuid NOT NULL REFERENCES auth.users(id),
  record_type text NOT NULL CHECK (record_type IN ('catalog_entry', 'contract', 'royalty')),
  record_id uuid NOT NULL,
  dispute_type text NOT NULL CHECK (dispute_type IN ('ownership', 'royalty', 'copyright', 'contract_breach', 'other')),
  description text NOT NULL DEFAULT '',
  status text DEFAULT 'filed' CHECK (status IN ('filed', 'under_review', 'mediation', 'arbitration', 'resolved', 'dismissed')),
  resolution text DEFAULT '',
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (auth.uid() = filed_by OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin', 'moderator', 'auditor')));

CREATE POLICY "Users file disputes"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = filed_by);

CREATE POLICY "Admins update disputes"
  ON disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin', 'moderator'))
  );

-- ============================================
-- DISPUTE EVIDENCE
-- ============================================
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text DEFAULT 'document',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dispute participants read evidence"
  ON dispute_evidence FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM disputes WHERE id = dispute_id AND (filed_by = auth.uid() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin', 'moderator', 'auditor'))))
  );

CREATE POLICY "Dispute parties upload evidence"
  ON dispute_evidence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  channel text DEFAULT 'in_app' CHECK (channel IN ('email', 'sms', 'in_app')),
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  reference_type text DEFAULT '',
  reference_id text DEFAULT '',
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- IPI APPLICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS ipi_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES producer_profiles(id),
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  ipi_number text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'assigned')),
  notes text DEFAULT '',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ipi_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers read own IPI applications"
  ON ipi_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = requested_by OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin')));

CREATE POLICY "Producers request IPI"
  ON ipi_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Admins update IPI applications"
  ON ipi_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin'))
  );

-- ============================================
-- SYSTEM SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin'))
  );

CREATE POLICY "Admins update settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'paeam_admin'))
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_disputes_filed_by ON disputes(filed_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_royalty_splits_contract_id ON royalty_splits(contract_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_catalog_entries_approval ON catalog_entries(approval_status);
CREATE INDEX IF NOT EXISTS idx_contracts_approval ON contracts(approval_status);
CREATE INDEX IF NOT EXISTS idx_producer_profiles_membership ON producer_profiles(membership_status);

-- ============================================
-- SEED DEFAULT SETTINGS
-- ============================================
INSERT INTO system_settings (key, value) VALUES
  ('membership_fee', '15000'),
  ('late_renewal_fee', '18750'),
  ('contract_registration_fee', '5000'),
  ('royalty_distribution_fee_pct', '5'),
  ('royalty_distribution_min_fee', '1000'),
  ('trial_duration_days', '14'),
  ('grace_period_days', '30'),
  ('session_timeout_minutes', '30'),
  ('otp_expiry_minutes', '10'),
  ('verification_link_expiry_hours', '24'),
  ('password_min_length', '12'),
  ('password_expiry_days', '90')
ON CONFLICT (key) DO NOTHING;

-- Seed default contract templates
INSERT INTO contract_templates (name, contract_type, description, template_content) VALUES
  ('Exclusive Production Agreement', 'exclusive', 'Standard exclusive production rights agreement', '{"royalty_pct": 50, "mechanical_pct": 50, "performance_pct": 50, "publishing_pct": 50, "duration_months": 24, "territory": "Worldwide"}'),
  ('Non-Exclusive Beat License', 'non-exclusive', 'Non-exclusive license for beat usage', '{"royalty_pct": 15, "mechanical_pct": 0, "performance_pct": 0, "publishing_pct": 0, "duration_months": 12, "territory": "Malawi"}'),
  ('Work for Hire Agreement', 'work-for-hire', 'Full rights transfer work-for-hire', '{"royalty_pct": 0, "mechanical_pct": 0, "performance_pct": 0, "publishing_pct": 0, "duration_months": 0, "territory": "Worldwide"}'),
  ('Distribution Agreement', 'distribution', 'Digital and physical distribution', '{"royalty_pct": 30, "mechanical_pct": 50, "performance_pct": 50, "publishing_pct": 50, "duration_months": 36, "territory": "Africa"}')
ON CONFLICT DO NOTHING;
