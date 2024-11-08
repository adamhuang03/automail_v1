// app/api/send-scheduled-emails/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase, supabaseServer } from '@/lib/db/supabase';
import { OutreachUser } from '@/utils/types';
import { sendEmailWithPdfFromUrl, sendEmail, refreshAccessToken } from '@/utils/google/emailGoogleV2';
import { sendOutlookEmailWithPdfFromUrl, sendOutlookEmail, getAccessToken } from '@/utils/ms/emailMsV2';
import { logThis } from '@/utils/saveLog';
import { sendAutomailEmail } from '@/utils/google/sendAutomailEmail';

const status = 'Test'

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
  const errorLogs: string[] = []; // Array to collect errors

  let refreshCount = 0
  const refreshList: string[] = []
  let emailCount = 0
  const emailList: string[] = []

  const { data: refreshData, error:refreshError }: { data: OutreachUser[] | null; error: any } = await supabase
    .from('outreach')
    .select(`
        *,
        user_profile!user_profile_id (
        full_name, provider_token, provider_refresh_token, provider_expire_at, provider_refresh_error, composed!user_profile_id(resume_link, resume_link_pdfcontent)
        )
    `) // auth_user:auth__user!id(email)
    .eq('status', status)            
    .lte('scheduled_datetime_utc', futureTime(30))
    .gte('scheduled_datetime_utc', futureTime(3))
    // .or(`user_profile.provider_expire_at.lt.${futureTime(60)},user_profile.provider_expire_at.is.null`);
    // .lt('user_profile.provider_expire_at', futureTime(60))
  if (refreshData) {
    
    refreshData.map((email) => {
      if (
        (
          email.user_profile.provider_expire_at === null ||
          diffDateInMin(email.user_profile.provider_expire_at, futureTime(0)) > 0
        ) && email.provider_name === 'google'
      ) {
        refreshCount++
        refreshList.push(email.id)
      }
    })
    const refreshPromises = refreshData.map(async (email) => {
      try {
        if (
          (
            email.user_profile.provider_expire_at === null ||
            diffDateInMin(email.user_profile.provider_expire_at, futureTime(0)) > 0
          ) && email.provider_name === 'google'
        ) {
          const newAccessToken = await refreshAccessToken(email.user_profile.provider_refresh_token, email);
          const { error } = await supabase
            .from('user_profile')
            .update({ provider_token: newAccessToken, provider_expire_at: futureTime(50) })
            .eq('id', email.user_profile_id);
          if (error) errorLogs.push(`Supabase Error Google(${email.id}): ${JSON.stringify(error)}`);
          await supabase.from('user_profile').update({ provider_refresh_error: 0 }).eq('id', email.user_profile_id);
        } 
        
        else if (
          (
            email.user_profile.provider_expire_at === null ||
            diffDateInMin(email.user_profile.provider_expire_at, futureTime(0)) > 0
          ) && email.provider_name === 'azure'
        ) {
          const newAccessToken = await getAccessToken(email.user_profile.provider_refresh_token, email);
          const { error } = await supabase
            .from('user_profile')
            .update({ provider_token: newAccessToken, provider_expire_at: futureTime(50) })
            .eq('id', email.user_profile_id);
          if (error) errorLogs.push(`Supabase Error Azure (${email.id}): ${JSON.stringify(error)}`);
          await supabase.from('user_profile').update({ provider_refresh_error: 0 }).eq('id', email.user_profile_id);
        }
      } catch (error) {
        errorLogs.push(`Refresh Error (${email.id}): ${JSON.stringify(error)}`);
        await supabase.from('outreach').update({ status: 'Editing' }).eq('id', email.id);
        if (email.user_profile.provider_refresh_error === 0) {
          await supabase.from('user_profile').update({ provider_refresh_error: 1 }).eq('id', email.user_profile_id);
          const { data: userData } =  await supabaseServer.auth.admin.getUserById(email.user_profile_id)
          const { success } = await sendAutomailEmail(
            userData.user?.email as string,
            "automail alert ... come refresh account :)",
            "",
            `<p>hey <b>${email.user_profile.full_name.split(' ')[0]}</b>, this is <b>adam</b> from the automail team!</p>
            <p>we noticed some of your emails were backlogged due to account inactivity...</p>
            <p>
              so come join us back on 
              <a href="https://automail-v1.vercel.app" target="_blank" style="color: #1a73e8;">Automail</a>
              to confirm and re-schedule your emails! thanks for being patient and happy cold emailing :)</p>
            <p>automail</p>`
          )
          if (!success) logThis(`${email.id} - (${userData.user?.email as string}) Email to refresh token could not be sent...`)
          else logThis(`${email.id} - Refresh request sent (${userData.user?.email as string})`)
        } else logThis(`${email.id} - Already refresh requested`)
      }
    });

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
    .eq('status', status)            
    .lte('scheduled_datetime_utc', currentTime);
  
  if (error) {
    // console.error('Error fetching emails:', error);
    errorLogs.push(`Supabase Error (Failed to get drafted emails): ${JSON.stringify(error)}`);
    return { message: 'Error fetching scheduled emails', error, status: 500 };
  }

  if (emails && emails.length > 0) {
    // Mass update id
    for (const email of emails) {
      emailList.push(email.id)
      emailCount++
    }
    await supabase.from('outreach').update({ status: 'Sending' }).in('id', emailList);

    // logThis(`3 Email Loop Check Point:`)
    const emailPromises = emails.map(async (email) => {
      try {
        if (email.provider_name === 'azure') {
          await processMs(email);
        } else if (email.provider_name === 'google') {
          await processGmail(email);
        }
      } catch (error) {
        errorLogs.push(`Send Email Error (${email.id}): ${JSON.stringify(error)}`);
        await supabase.from('outreach').update({ status: 'Error' }).eq('id', email.id);
      }
    });
    combinedPromises.push(...emailPromises);
  }

  
  await Promise.all(combinedPromises); // Wait for both refresh and email send processes to complete
  if (emailCount + refreshCount > 0) {
    logThis(
      `Batch Processing Begins\n\n` +
      `Refresh Count: ${refreshCount} -> List: ${JSON.stringify(refreshList)}\n\n` +
      `Email Sent Count: ${emailCount} -> List: ${JSON.stringify(emailList)}` +
      `${errorLogs.join('\n')}`
    );
  }
  return { message: 'Scheduled emails processed', status: 200 };
} // Add logic where if <5 min and need token refresh (or not refreshed, just refresh it or check when the expireation is)

async function processGmail(email: OutreachUser) {
  // This for loop need to be refactored to allow for MS and Google seperate flows based on account
  // const accessToken = email.user_profile.provider_token;
  const resumeLink = email.user_profile.composed.resume_link;
  const pdfContent = email.user_profile.composed.resume_link_pdfcontent;
  // const refreshToken = email.user_profile.provider_refresh_token;

  // const logList: string[] = [] // because we are batch promising
  const p1 = Date.now();
  
  const oAuth2Client = new google.auth.OAuth2();
  // oAuth2Client.setCredentials({ access_token: accessToken });
  // const p02 = Date.now();
  // const d02 = (p02 - p1)/1000
  // logList.push(`Auth Duration: ${d02}`)

    try {
      // await supabase.from('outreach').update({ status: 'Refreshing' }).eq('id', email.id);
      // const newAccessToken = await refreshAccessToken(refreshToken);
      // const p03 = Date.now();
      // const d03 = (p03 - p02)/1000

      
      // const p04 = Date.now();
      // const d04 = (p04 - p03)/1000

      oAuth2Client.setCredentials({ access_token: email.user_profile.provider_token });
      // const p05 = Date.now();
      // const d05 = (p05 - p04)/1000

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
        const p05 = Date.now();
        const d05 = (p05 - p1)/1000
        logThis(`${email.id}: Email w attachment sent to ${email.to_email}\nDuration: ${d05}secs`);
      } else {
        await sendEmail(oAuth2Client, email.to_email, email.subject_generated, email.email_generated);
        await supabase.from('outreach').update({ status: 'Sent' }).eq('id', email.id);
        const p05 = Date.now();
        const d05 = (p05 - p1)/1000
        logThis(`${email.id}: Email sent to ${email.to_email}\nDuration: ${d05}secs`);
      }

    } catch (refreshError) {
      console.log(`${email.id}: Failed to refresh access token for ${email.user_profile_id}: ${refreshError}`);
    }
  // }
}

async function processMs(email: OutreachUser) {
  // This for loop need to be refactored to allow for MS and Google seperate flows based on account
  // let accessToken = email.user_profile.provider_token;
  // const refreshToken = email.user_profile.provider_refresh_token;
  const resumeLink = email.user_profile.composed.resume_link;
  const pdfContent = email.user_profile.composed.resume_link_pdfcontent;
  const p1 = Date.now();

  try {
    // Send the email with or without an attachment
    if (resumeLink && pdfContent) {
      await sendOutlookEmailWithPdfFromUrl(
        email.user_profile.provider_token, 
        email.to_email, 
        email.subject_generated, 
        email.email_generated, 
        resumeLink,
        pdfContent
      );
      await supabase.from('outreach').update({ status: 'Sent w Attachment' }).eq('id', email.id);
      const p05 = Date.now();
      const d05 = (p05 - p1)/1000
      logThis(`${email.id}: Email w attachment sent to ${email.to_email}\nDuration: ${d05}secs`);
    } else {
      await sendOutlookEmail(email.user_profile.provider_token, email.to_email, email.subject_generated, email.email_generated);
      await supabase.from('outreach').update({ status: 'Sent' }).eq('id', email.id);
      const p05 = Date.now();
        const d05 = (p05 - p1)/1000
        logThis(`${email.id}: Email sent to ${email.to_email}\nDuration: ${d05}secs`);
    }
  } catch (error) {
    console.log(`${email.id}: Failed to send email for ${email.user_profile_id} -> Error: ${error} ... \n${email.user_profile.provider_token}`);

    // try {
    //   // Refresh the access token using the refresh token
    //   const accessToken = await getAccessToken(refreshToken);

    //   // Save the new access token to the database
    //   await supabase
    //     .from('user_profile')
    //     .update({ provider_token: accessToken })
    //     .eq('id', email.user_profile_id);

    //   console.error(1)
    //   // Retry sending the email
    //   if (resumeLink) {
    //     await sendOutlookEmailWithPdfFromUrl(accessToken || '', email.to_email, email.subject_generated, email.email_generated, resumeLink);
    //     await supabase.from('outreach').update({ status: 'Sent w Attachment' }).eq('id', email.id);
    //     console.log(`Email with attachment sent to ${email.to_email} after refreshing token`);
    //   } else {
    //     await sendOutlookEmail(accessToken || '', email.to_email, email.subject_generated, email.email_generated);
    //     await supabase.from('outreach').update({ status: 'Sent' }).eq('id', email.id);
    //     console.log(`Email sent to ${email.to_email} after refreshing token`);
    //   }
    
    // } catch (refreshError) {
    //   console.error(`Failed to refresh access token for ${email.user_profile_id}:`, refreshError);
    // }
  }
}