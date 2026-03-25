export type UserRole = 'mandant' | 'anwalt' | 'admin'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type DocumentType = 'anwaltszulassung' | 'identitaetsnachweis'
export type DocumentStatus = 'pending_review' | 'approved' | 'rejected'

export interface Profile {
  id: string
  role: UserRole
  first_name?: string
  last_name?: string
  email: string
  phone?: string
  avatar_url?: string
  is_profile_complete?: boolean
  created_at?: string
  updated_at?: string
}

export interface LawyerProfile {
  id: string
  user_id: string
  headline?: string
  bio?: string
  city?: string
  minute_rate?: number
  specializations?: string[]
  languages?: string[]
  experience_years?: number
  verification_status?: VerificationStatus
  is_available?: boolean
  rating?: number
  total_reviews?: number
  total_consultations?: number
  created_at?: string
  updated_at?: string
}

export interface LawyerDocument {
  id: string
  user_id: string
  document_type: DocumentType
  file_path: string
  original_filename: string
  status?: DocumentStatus
  rejection_reason?: string
  created_at?: string
}

export type AvailabilityStatus = 'online' | 'busy' | 'offline'
export type SessionStatus = 'requested' | 'accepted' | 'active' | 'completed' | 'declined' | 'cancelled'
export type SessionType = 'chat' | 'video'

export interface ConsultationSession {
  id: string
  mandant_id: string
  anwalt_id: string
  status: SessionStatus
  type: SessionType
  started_at?: string
  ended_at?: string
  duration_seconds?: number
  created_at?: string
  updated_at?: string
}

export interface ChatMessage {
  id: string
  session_id: string
  sender_id: string
  content: string
  created_at?: string
}

export interface LawyerWithProfile extends LawyerProfile {
  profile: Profile
}