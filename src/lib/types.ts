export type UserRole = 'super_admin' | 'paeam_admin' | 'moderator' | 'producer' | 'artist' | 'viewer' | 'auditor';
export type MembershipStatus = 'trial' | 'active' | 'grace' | 'suspended' | 'bank_transfer_pending';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
export type ApprovalStatus = 'pending' | 'pending_admin_approval' | 'approved' | 'rejected' | 'locked' | 'pending_artist_approval' | 'pending_association_approval' | 'fully_locked';
export type PaymentType = 'membership' | 'late_renewal' | 'contract_registration' | 'royalty_distribution';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'bank_transfer_pending';
export type PaymentMethod = '' | 'airtel_money' | 'tnm_mpamba' | 'national_bank' | 'card';
export type ContractType = 'exclusive' | 'non-exclusive' | 'work-for-hire' | 'licensing' | 'distribution';
export type DisputeType = 'ownership' | 'royalty' | 'copyright' | 'contract_breach' | 'other';
export type DisputeStatus = 'filed' | 'pending_admin_review' | 'under_review' | 'mediation' | 'arbitration' | 'resolved' | 'dismissed';
export type RenewalOption = 'none' | 'auto' | 'manual';
export type OwnershipStatus = 'owned' | 'co-owned' | 'licensed' | 'work-for-hire';
export type FileType = 'master_wav' | 'master_mp3' | 'instrumental' | 'contract_pdf' | 'split_sheet_pdf' | 'session_file' | 'artwork' | 'copyright_certificate' | 'other';
export type RecordType = 'catalog_entry' | 'contract';
export type RecipientRole = 'producer' | 'artist' | 'songwriter' | 'publisher' | 'other';
export type IpiRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ProducerProfile {
  id: string;
  user_id: string;
  full_legal_name: string;
  stage_name: string;
  national_id: string | null;
  phone_number: string;
  email: string;
  studio_address: string;
  association_membership_number: string | null;
  tax_id: string | null;
  bank_details_encrypted: string;
  profile_photo_url: string;
  association_verification_status: VerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
  ipi_number: string | null;
  membership_status: MembershipStatus;
  membership_expires_at: string | null;
  trial_started_at: string | null;
  bank_name: string;
  account_number_encrypted: string;
  digital_signature: string;
  document_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface CatalogEntry {
  id: string;
  producer_id: string;
  song_title: string;
  isrc_code: string;
  producer_name: string;
  artist_names: string[];
  songwriters: string[];
  beat_ownership_status: OwnershipStatus;
  date_created: string | null;
  date_released: string | null;
  genre: string;
  duration_seconds: number;
  bpm: number | null;
  musical_key: string;
  split_sheet_url: string;
  publishing_details: string;
  is_locked: boolean;
  content_hash: string;
  version: number;
  parent_version_id: string | null;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  admin_approved_by: string | null;
  admin_approved_at: string | null;
  rejection_reason: string;
  rejection_date: string | null;
  sync_rights_pct: number;
  created_at: string;
  updated_at: string;
}

export interface CatalogFile {
  id: string;
  catalog_entry_id: string;
  file_type: FileType;
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  uploaded_at: string;
}

export interface Contract {
  id: string;
  catalog_entry_id: string;
  contract_type: ContractType;
  royalty_percentage: number;
  mechanical_rights_pct: number;
  performance_rights_pct: number;
  publishing_split_pct: number;
  sync_rights_pct: number;
  agreement_duration_months: number;
  territory: string;
  payment_schedule: string;
  producer_signature: string;
  artist_signature: string;
  association_witness_signature: string;
  is_locked: boolean;
  content_hash: string;
  version: number;
  parent_version_id: string | null;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  admin_approved_by: string | null;
  admin_approved_at: string | null;
  rejection_reason: string;
  rejection_date: string | null;
  template_id: string | null;
  renewal_option: RenewalOption;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  contract_type: ContractType;
  description: string;
  template_content: Record<string, unknown>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoyaltySplit {
  id: string;
  contract_id: string;
  recipient_name: string;
  recipient_role: RecipientRole;
  percentage: number;
  created_at: string;
}

export interface LockApproval {
  id: string;
  record_type: RecordType;
  record_id: string;
  artist_id: string | null;
  association_id: string | null;
  producer_approved: boolean;
  producer_approved_at: string | null;
  producer_approval_hash: string;
  artist_approved: boolean;
  artist_approved_at: string | null;
  artist_approval_hash: string;
  association_approved: boolean;
  association_approved_at: string | null;
  association_approval_hash: string;
  is_fully_locked: boolean;
  locked_at: string | null;
  lock_initiated_at: string | null;
  lock_completed_at: string | null;
  unlock_request_reason: string;
  unlock_requested_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  record_type: string;
  record_id: string;
  old_data: Record<string, unknown>;
  new_data: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  producer_id: string | null;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  paychangu_tx_id: string;
  paychangu_reference: string;
  payment_method: PaymentMethod;
  receipt_url: string;
  description: string;
  proof_of_payment_url: string;
  admin_notes: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Dispute {
  id: string;
  filed_by: string;
  record_type: 'catalog_entry' | 'contract' | 'royalty';
  record_id: string;
  dispute_type: DisputeType;
  description: string;
  status: DisputeStatus;
  resolution: string;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeEvidence {
  id: string;
  dispute_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string;
  description: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  channel: 'email' | 'sms' | 'in_app';
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  reference_type: string;
  reference_id: string;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface IpiApplication {
  id: string;
  producer_id: string;
  requested_by: string;
  ipi_number: string;
  status: 'pending' | 'approved' | 'rejected' | 'assigned';
  notes: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface IpiRequest {
  id: string;
  producer_id: string;
  requested_by: string;
  requested_ipi: string;
  status: IpiRequestStatus;
  assigned_ipi: string | null;
  admin_approved_at: string | null;
  admin_approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_by: string | null;
  assigned_at: string;
}
