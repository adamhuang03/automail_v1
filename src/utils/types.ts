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
    created_at: string
  }

export type OutreachUser = {
    id: string
    status: string
    user_profile: {
      composed: {
        resume_link: string
      }
      provider_token: string
      provider_refresh_token: string
    }
    user_profile_id: string
    to_name: string
    to_email: string
    to_firm: string
    firm_email_id: number
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
    subject_generated: string
    email_generated: string
    scheduled_datetime_utc: string
    provider_name: string
    created_at: string
  }
  