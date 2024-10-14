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
    '1//01bzadh5uxzp4CgYIARAAGAESNwF-L9Ir9M9G8Tg3tJ4pGzHaD1DjIBBm02fW2G_aI88i0LgYDL8Dnt5r9yb5WTLZKsmwuKQJHks'
  )
  return NextResponse.json({ message: `${newToken}`}, { status: 200 });
}