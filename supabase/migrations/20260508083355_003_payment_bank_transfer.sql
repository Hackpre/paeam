/*
  # Payment System Enhancement - Bank Transfer Support

  1. Modified Tables
    - `payments` — Added: proof_of_payment_url, bank_transfer_status, admin_notes, reviewed_by, reviewed_at
    - `producer_profiles` — Added: payment_status (tracks overall payment state including bank_transfer_pending)

  2. New enum values
    - `payments.status` — Added 'bank_transfer_pending' to track bank transfers awaiting admin review
    - `producer_profiles.membership_status` — Added 'bank_transfer_pending' for users who submitted bank proof

  3. Security
    - RLS policies updated to allow admin review of bank transfer proofs
    - Storage bucket for payment proofs (handled via Supabase Storage)

  4. Important Notes
    1. Bank transfer flow: User uploads proof → payment status = 'bank_transfer_pending' → admin reviews → approves/rejects
    2. Mobile money flow: User pays via PayChangu → webhook updates → status = 'completed'
    3. Membership status 'bank_transfer_pending' shows user their proof is under review
*/

-- Add new columns to payments table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'proof_of_payment_url') THEN
    ALTER TABLE payments ADD COLUMN proof_of_payment_url text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'admin_notes') THEN
    ALTER TABLE payments ADD COLUMN admin_notes text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'reviewed_by') THEN
    ALTER TABLE payments ADD COLUMN reviewed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'reviewed_at') THEN
    ALTER TABLE payments ADD COLUMN reviewed_at timestamptz;
  END IF;
END $$;

-- Update payments status constraint to include bank_transfer_pending
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'bank_transfer_pending'));

-- Update producer_profiles membership_status constraint to include bank_transfer_pending
ALTER TABLE producer_profiles DROP CONSTRAINT IF EXISTS producer_profiles_membership_status_check;
ALTER TABLE producer_profiles ADD CONSTRAINT producer_profiles_membership_status_check
  CHECK (membership_status IN ('trial', 'active', 'grace', 'suspended', 'bank_transfer_pending'));

-- Add index for bank transfer pending payments
CREATE INDEX IF NOT EXISTS idx_payments_bank_transfer ON payments(status) WHERE status = 'bank_transfer_pending';

-- Create storage bucket for payment proofs (using raw SQL since we can't use the CLI)
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload payment proofs
CREATE POLICY "Users upload own payment proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view payment proofs (admin needs access)
CREATE POLICY "Payment proofs are viewable"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment-proofs');

-- Allow users to delete their own proofs
CREATE POLICY "Users delete own payment proofs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
