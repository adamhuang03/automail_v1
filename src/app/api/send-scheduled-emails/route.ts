// app/api/send-scheduled-emails/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/db/supabase';
import { OutreachUser } from '@/utils/types';

const sendEmail = async (oAuth2Client: any, to: string, subject: string, message: string) => {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const rawMessage = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\n\r\n${message}`
  ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  try {
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    return result.data;
  } catch (error) {
    throw new Error(`Error sending email: ${error}`);
  }
};

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
    const newAccessToken = res.credentials.access_token;
    return newAccessToken;
  } catch (error) {
    throw new Error(`Error refreshing access token: ${error}`);
  }
};

export async function POST() {
  const currentTime = new Date().toISOString().slice(0, 16);

  // Fetch scheduled emails
  const { data: emails, error }: { data: OutreachUser[] | null; error: any } = await supabase
    .from('outreach')
    .select(`
        *,
        user_profile!user_profile_id (provider_token, provider_refresh_token)
    `)
    .eq('status', 'Scheduled')            
    .lte('scheduled_datetime_utc', currentTime);

  if (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ message: 'Error fetching scheduled emails', error }, { status: 500 });
  }

  if (emails && emails.length > 0) {
    for (const email of emails) {
      let accessToken = email.user_profile.provider_token;
      const refreshToken = email.user_profile.provider_refresh_token;

      const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials({ access_token: accessToken });

      try {
        // Test if the access token is valid by sending the email
        await sendEmail(oAuth2Client, email.to_email, email.subject_generated, email.email_generated);
        // Mark email as sent in the database
        await supabase.from('outreach').update({ status: 'Sent' }).eq('id', email.id);
        console.log(`Email sent to ${email.to_email}`);
      } catch (error) {
        console.log('Access token expired. Refreshing...');
        try {
          // Refresh the access token using the refresh token
          const newAccessToken = await refreshAccessToken(refreshToken);

          // Save the new token in the database
          await supabase
            .from('user_profile')
            .update({ provider_token: newAccessToken })
            .eq('id', email.user_profile_id);

          // Retry sending the email with the new access token
          oAuth2Client.setCredentials({ access_token: newAccessToken });
          await sendEmail(oAuth2Client, email.to_email, email.subject_generated, email.email_generated);
          await supabase.from('outreach').update({ status: 'Sent' }).eq('id', email.id);
          console.log(`Email sent to ${email.to_email} after refreshing token`);
        } catch (refreshError) {
          console.error(`Failed to refresh access token for ${email.user_profile_id}:`, refreshError);
        }
      }
    }
  }

  return NextResponse.json({ message: 'Scheduled emails processed' }, { status: 200 });
}
