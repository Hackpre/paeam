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
  association_verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  verified_at: string | null;
  verified_by: string | null;
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
  beat_ownership_status: 'owned' | 'co-owned' | 'licensed' | 'work-for-hire';
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
  created_at: string;
  updated_at: string;
}

export interface CatalogFile {
  id: string;
  catalog_entry_id: string;
  file_type: 'master_wav' | 'master_mp3' | 'instrumental' | 'contract_pdf' | 'split_sheet_pdf' | 'session_file' | 'artwork' | 'copyright_certificate' | 'other';
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  uploaded_at: string;
}

export interface Contract {
  id: string;
  catalog_entry_id: string;
  contract_type: 'exclusive' | 'non-exclusive' | 'work-for-hire';
  royalty_percentage: number;
  mechanical_rights_pct: number;
  performance_rights_pct: number;
  publishing_split_pct: number;
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
  created_at: string;
  updated_at: string;
}

export interface LockApproval {
  id: string;
  record_type: 'catalog_entry' | 'contract';
  record_id: string;
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
