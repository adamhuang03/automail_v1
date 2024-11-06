// app/api/send-scheduled-emails/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/db/supabase';
import { OutreachUser } from '@/utils/types';
import { sendEmailWithPdfFromUrl, sendEmail, refreshAccessToken } from '@/utils/google/emailGoogleV2';
import { sendOutlookEmailWithPdfFromUrl, sendOutlookEmail, getAccessToken } from '@/utils/ms/emailMs';

export async function POST() {
  const response = await processScheduledEmails();
  return NextResponse.json(response, { status: response.status });
}

async function processScheduledEmails() {
  const currentTime = new Date().toISOString().slice(0, 16);
  console.log("1 Time Check: ", currentTime)

  // Fetch scheduled emails
  const { data: emails, error }: { data: OutreachUser[] | null; error: any } = await supabase
    .from('outreach')
    .select(`
        *,
        user_profile!user_profile_id (
        provider_token, provider_refresh_token, composed!user_profile_id(resume_link, resume_link_pdfcontent)
        )
    `) // auth_user:auth__user!id(email)
    .eq('status', 'Scheduled')            
    .lte('scheduled_datetime_utc', currentTime);
    // if (emails) console.log(emails[0].user_profile.composed)
  
  // === Update sending all at once

  console.log("2 Data Check: ", emails)
  
  if (error) {
    console.error('Error fetching emails:', error);
    return { message: 'Error fetching scheduled emails', error, status: 500 };
  }

  

  if (emails && emails.length > 0) {
    
    // Mass update id
    const idsList = []
    for (const email of emails) {
      idsList.push(email.id)
    }
    await supabase.from('outreach').update({ status: 'Sending' }).in('id', idsList);

    console.log("3 Email Loop Check Point:")
    for (const email of emails) {

      console.log('Email Copy: ', email)
      if (email.provider_name === 'azure') {
        console.log('Processing ms')
        processMs(email)
      } else if (email.provider_name === 'google') {
        console.log('Processing gmail')
        processGmail(email)
      }
      
    }
  }

  return { message: 'Scheduled emails processed', status: 200 };
}

async function processGmail(email: OutreachUser) {
  // This for loop need to be refactored to allow for MS and Google seperate flows based on account
  const accessToken = email.user_profile.provider_token;
  const resumeLink = email.user_profile.composed.resume_link;
  const pdfContent = email.user_profile.composed.resume_link_pdfcontent;
  const refreshToken = email.user_profile.provider_refresh_token;

  const oAuth2Client = new google.auth.OAuth2();
  oAuth2Client.setCredentials({ access_token: accessToken });

  // try {
  //   console.log("trying processGmail: ", email)
  //   if (resumeLink && pdfContent) {
  //     console.log("processGmail: ResumeLink")
  //     await sendEmailWithPdfFromUrl(
  //       oAuth2Client, 
  //       email.to_email, 
  //       email.subject_generated, 
  //       email.email_generated,
  //       resumeLink,
  //       pdfContent
  //     );
  //     await supabase.from('outreach').update({ status: 'Sent w Attachment' }).eq('id', email.id);
  //     console.log(`Email w attachment sent to ${email.to_email}`);
  //   } else {
  //     await sendEmail(oAuth2Client, email.to_email, email.subject_generated, email.email_generated);
  //     await supabase.from('outreach').update({ status: 'Sent' }).eq('id', email.id);
  //     console.log(`Email sent to ${email.to_email}`);
  //   }
  // } catch (error) {
    console.log('Access token expired. Refreshing...');
    try {
      // await supabase.from('outreach').update({ status: 'Refreshing' }).eq('id', email.id);
      const newAccessToken = await refreshAccessToken(refreshToken);

      await supabase
        .from('user_profile')
        .update({ provider_token: newAccessToken })
        .eq('id', email.user_profile_id);

      oAuth2Client.setCredentials({ access_token: newAccessToken });
      if (resumeLink && pdfContent) {
        await sendEmailWithPdfFromUrl(
          oAuth2Client, 
          email.to_email, 
          email.subject_generated, 
          email.email_generated,
          resumeLink,
          pdfContent
        );
        await supabase.from('outreach').update({ status: 'Sent w Attachment' }).eq('id', email.id);
        console.log(`Email w attachment sent to ${email.to_email} after refreshing token`);
      } else {
        await sendEmail(oAuth2Client, email.to_email, email.subject_generated, email.email_generated);
        await supabase.from('outreach').update({ status: 'Sent' }).eq('id', email.id);
        console.log(`Email sent to ${email.to_email} after refreshing token`);
      }

    } catch (refreshError) {
      console.error(`Failed to refresh access token for ${email.user_profile_id}:`, refreshError);
    }
  // }
}

async function processMs(email: OutreachUser) {
  // This for loop need to be refactored to allow for MS and Google seperate flows based on account
  let accessToken = email.user_profile.provider_token;
  const refreshToken = email.user_profile.provider_refresh_token;
  const resumeLink = email.user_profile.composed.resume_link;

  try {
    // Send the email with or without an attachment
    if (resumeLink) {
      await sendOutlookEmailWithPdfFromUrl(accessToken, email.to_email, email.subject_generated, email.email_generated, resumeLink);
      await supabase.from('outreach').update({ status: 'Sent w Attachment' }).eq('id', email.id);
      console.log(`Email with attachment sent to ${email.to_email}`);
    } else {
      await sendOutlookEmail(accessToken, email.to_email, email.subject_generated, email.email_generated);
      await supabase.from('outreach').update({ status: 'Sent' }).eq('id', email.id);
      console.log(`Email sent to ${email.to_email}`);
    }
  } catch (error) {
    console.error('Access token expired. Refreshing...');

    try {
      // Refresh the access token using the refresh token
      const accessToken = await getAccessToken(refreshToken);

      // Save the new access token to the database
      await supabase
        .from('user_profile')
        .update({ provider_token: accessToken })
        .eq('id', email.user_profile_id);

      console.error(1)
      // Retry sending the email
      if (resumeLink) {
        await sendOutlookEmailWithPdfFromUrl(accessToken || '', email.to_email, email.subject_generated, email.email_generated, resumeLink);
        await supabase.from('outreach').update({ status: 'Sent w Attachment' }).eq('id', email.id);
        console.log(`Email with attachment sent to ${email.to_email} after refreshing token`);
      } else {
        await sendOutlookEmail(accessToken || '', email.to_email, email.subject_generated, email.email_generated);
        await supabase.from('outreach').update({ status: 'Sent' }).eq('id', email.id);
        console.log(`Email sent to ${email.to_email} after refreshing token`);
      }
    
    } catch (refreshError) {
      console.error(`Failed to refresh access token for ${email.user_profile_id}:`, refreshError);
    }
  }
}