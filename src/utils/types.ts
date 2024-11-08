// components/ColdOutreach/types.ts
export type Prospect = {
    name: string;
    email: string;
    scheduledTime: string;
  }
  
export type FirmGroup = {
    firm: string;
    prospects: Prospect[];
  }

export type UserProfile = {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    created_at: string
    role_type: string
  }

export type Composed = {
    user_profile_id: string
    subject: string
    composed_template: string
    resume_link_filepath: string | null
    resume_link: string | null
    resume_link_pdfcontent: string | null
    created_at: string
  }

export type OutreachUser = {
    id: string
    status: string
    user_profile: {
      composed: {
        resume_link: string
        resume_link_pdfcontent: string
      }
      full_name: string
      provider_token: string
      provider_refresh_token: string
      provider_expire_at: string
      provider_refresh_error: number
    }
    user_profile_id: string
    to_name: string
    to_email: string
    to_firm: string
    firm_email_id: number
    firm_email_user_id: number
    subject_generated: string
    email_generated: string
    scheduled_datetime_utc: string
    provider_name: string
    created_at: string
  }

export type Outreach = {
    id: string
    status: string
    user_profile_id: string
    to_name: string
    to_email: string
    to_firm: string
    firm_email_id: number
    firm_email_user_id: number
    subject_generated: string
    email_generated: string
    scheduled_datetime_utc: string
    provider_name: string
    created_at: string
  }

export type FirmEmailUserInsert = {
  user_profile_id: string
  firm_name: string
  email_ending: string
}

  