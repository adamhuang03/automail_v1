// app/api/send-scheduled-emails/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/db/supabase';
import { Outreach } from '@/utils/types';

const refreshAccessToken = async (refreshToken: string) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oAuth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const res = await oAuth2Client.refreshAccessToken();
    return res.credentials.access_token;
  } catch (error) {
    throw new Error(`Error refreshing access token: ${error}`);
  }
};

export async function POST() {
  const newToken = await refreshAccessToken(
    ''
  )
  return NextResponse.json({ message: `${newToken}`}, { status: 200 });
}