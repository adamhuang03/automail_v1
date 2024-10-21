// app/api/send-scheduled-emails/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/db/supabase';
import { OutreachUser } from '@/utils/types';
import axios from 'axios';

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

const sendEmailWithPdfFromUrl = async (
  oAuth2Client: any,
  to: string,
  subject: string,
  message: string,
  pdfUrl: string
) => {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  try {
    // Download the PDF from the URL
    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const pdfContent = Buffer.from(response.data).toString('base64');
    const fileName = pdfUrl.split('/').pop(); // You can also derive this from the URL if needed

    console.error(fileName)

    // Construct the raw email message with attachment
    const rawMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: multipart/mixed; boundary="boundary_example"',
      '',
      '--boundary_example',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      message, // Email message body
      '',
      '--boundary_example',
      `Content-Type: application/pdf; name="${fileName}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${fileName}"`,
      '',
      pdfContent, // Base64 encoded PDF content
      '',
      '--boundary_example--',
      '', // could be causing the <end>
    ].join('\r\n');

    // Base64 encode the raw message and format it
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
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
        user_profile!user_profile_id (provider_token, provider_refresh_token, composed!user_profile_id(resume_link))
    `)
    .eq('status', 'Test')            
    .lte('scheduled_datetime_utc', currentTime);
  // if (emails) {
  //   console.error(emails[0].user_profile)
  //   return NextResponse.json({ message: 'Got it'}, { status: 200 });
  // }
  if (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ message: 'Error fetching scheduled emails', error }, { status: 500 });
  }

  if (emails && emails.length > 0) {
    for (const email of emails) {
      const accessToken = email.user_profile.provider_token;
      const resumeLink = email.user_profile.composed.resume_link;
      const refreshToken = email.user_profile.provider_refresh_token;

      const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials({ access_token: accessToken });

      try {

        if (resumeLink) {
          await sendEmailWithPdfFromUrl(
            oAuth2Client, 
            email.to_email, 
            email.subject_generated, 
            email.email_generated,
            resumeLink
          );
          await supabase.from('outreach').update({ status: 'Sent w Attachment' }).eq('id', email.id);
          console.log(`Email w attachment sent to ${email.to_email}`);
        } else {
          
          // Test if the access token is valid by sending the email
          await sendEmail(oAuth2Client, email.to_email, email.subject_generated, email.email_generated);
          // Mark email as sent in the database
          await supabase.from('outreach').update({ status: 'Sent' }).eq('id', email.id);
          console.log(`Email sent to ${email.to_email}`);

        }

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
