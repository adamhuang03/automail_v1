// app/api/send-scheduled-emails/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/db/supabase';
import { OutreachUser } from '@/utils/types';
import { sendEmailWithPdfFromUrl, sendEmail, refreshAccessToken } from '@/utils/google/emailGoogleV2';
import { sendOutlookEmailWithPdfFromUrl, sendOutlookEmail, getAccessToken } from '@/utils/ms/emailMs';
import { logThis } from '@/utils/saveLog';

export async function POST() {
  const response = await processScheduledEmails();
  return NextResponse.json(response, { status: response.status });
}

async function processScheduledEmails() {
  logThis("Starting")
  const currentTime = new Date().toISOString().slice(0, 16);
  const futureTime = (mins: number) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() + mins)
    return date.toISOString().slice(0, 16)
  }
  const diffDateInMin = (d1: string, d2: string) => {
    const differenceInMs = new Date(d2).getTime() - new Date(d1).getTime();
    return differenceInMs / (1000 * 60);
  }

  const combinedPromises: Promise<any>[] = [];

  const { data: refreshData, error:refreshError }: { data: OutreachUser[] | null; error: any } = await supabase
    .from('outreach')
    .select(`
        *,
        user_profile!user_profile_id (
        provider_token, provider_refresh_token, provider_expire_at, composed!user_profile_id(resume_link, resume_link_pdfcontent)
        )
    `) // auth_user:auth__user!id(email)
    .eq('status', 'Scheduled')            
    .lte('scheduled_datetime_utc', futureTime(30))
    .gte('scheduled_datetime_utc', futureTime(5))
    // .or(`user_profile.provider_expire_at.lt.${futureTime(60)},user_profile.provider_expire_at.is.null`);
    // .lt('user_profile.provider_expire_at', futureTime(60))
  
  if (refreshData) {
    
    const refreshPromises = refreshData.map(async(email) => {
      // make sure you refresh not per email but per user
      if (
        email.user_profile.provider_expire_at === null ||
        diffDateInMin(futureTime(0), email.user_profile.provider_expire_at) < 0
      ) {
        const newAccessToken = await refreshAccessToken(email.user_profile.provider_refresh_token);
        const { error } = await supabase
          .from('user_profile')
          .update({ provider_token: newAccessToken, provider_expire_at: futureTime(50) })
          .eq('id', email.user_profile_id);
        if (error) await logThis(`${email.id}-Error: ${error}`)
      }
    })

    if (refreshPromises.length > 0) logThis("Refresh Available")

    combinedPromises.push(...refreshPromises);
    
  }

  const { data: emails, error }: { data: OutreachUser[] | null; error: any } = await supabase
    .from('outreach')
    .select(`
        *,
        user_profile!user_profile_id (
        provider_token, provider_refresh_token, provider_expire_at, composed!user_profile_id(resume_link, resume_link_pdfcontent)
        )
    `) // auth_user:auth__user!id(email)
    .eq('status', 'Scheduled')            
    .lte('scheduled_datetime_utc', currentTime);
  
  if (error) {
    console.error('Error fetching emails:', error);
    return { message: 'Error fetching scheduled emails', error, status: 500 };
  }

  if (emails && emails.length > 0) {
    logThis("Email Available")
    // Mass update id
    const idsList = []
    for (const email of emails) {
      idsList.push(email.id)
    }
    await supabase.from('outreach').update({ status: 'Sending' }).in('id', idsList);

    // logThis(`3 Email Loop Check Point:`)
    const emailPromises = emails.map(async (email) => {

      if (email.provider_name === 'azure') {
        console.log('Processing ms')
        await processMs(email)
      } else if (email.provider_name === 'google') {
        console.log('Processing gmail')
        await processGmail(email)
      }
    })
    combinedPromises.push(...emailPromises);
  }

  logThis("Preparing for combined batch processing");
  await Promise.all(combinedPromises); // Wait for both refresh and email send processes to complete
  logThis("All scheduled tasks processed");

  return { message: 'Scheduled emails processed', status: 200 };
} // Add logic where if <5 min and need token refresh (or not refreshed, just refresh it or check when the expireation is)

async function processGmail(email: OutreachUser) {
  // This for loop need to be refactored to allow for MS and Google seperate flows based on account
  const accessToken = email.user_profile.provider_token;
  const resumeLink = email.user_profile.composed.resume_link;
  const pdfContent = email.user_profile.composed.resume_link_pdfcontent;
  const refreshToken = email.user_profile.provider_refresh_token;

  const p1 = Date.now();
  logThis(`Sending email p01: ${p1}`)
  const oAuth2Client = new google.auth.OAuth2();
  // oAuth2Client.setCredentials({ access_token: accessToken });
  const p02 = Date.now();
  const d02 = (p02 - p1)/1000
  logThis(`d02: ${d02}`)

  // try {
  //   logThis(`trying processGmail: ", email)
  //   if (resumeLink && pdfContent) {
  //     logThis(`processGmail: ResumeLink")
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
    // console.log('Access token expired. Refreshing...');
    try {
      // await supabase.from('outreach').update({ status: 'Refreshing' }).eq('id', email.id);
      // const newAccessToken = await refreshAccessToken(refreshToken);
      const p03 = Date.now();
      const d03 = (p03 - p02)/1000
      logThis(`d03: ${d03}`)

      
      const p04 = Date.now();
      const d04 = (p04 - p03)/1000
      logThis(`d04: ${d04}`)

      oAuth2Client.setCredentials({ access_token: email.user_profile.provider_token });
      const p05 = Date.now();
      const d05 = (p05 - p04)/1000
      logThis(`d05: ${d05}`)

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
        logThis(`${email.id}: Email w attachment sent to ${email.to_email} after refreshing token`);
      } else {
        await sendEmail(oAuth2Client, email.to_email, email.subject_generated, email.email_generated);
        await supabase.from('outreach').update({ status: 'Sent' }).eq('id', email.id);
        logThis(`${email.id}: Email sent to ${email.to_email} after refreshing token`);
      }

    } catch (refreshError) {
      logThis(`${email.id}: Failed to refresh access token for ${email.user_profile_id}: ${refreshError}`);
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