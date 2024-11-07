// app/api/send-scheduled-emails/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/db/supabase';
import { OutreachUser } from '@/utils/types';
import { sendEmailWithPdfFromUrl, sendEmail, refreshAccessToken } from '@/utils/google/emailGoogleV2';
import { sendOutlookEmailWithPdfFromUrl, sendOutlookEmail, getAccessToken } from '@/utils/ms/emailMs';
import { logThis } from '@/utils/saveLog';

export async function POST() {
  const response = await testRefreshData();
  return NextResponse.json(response, { status: response.status });
}

async function testRefreshData () {
  const futureTime = (mins: number) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() + mins)
    return date.toISOString() //.slice(0, 16)
  }

  const diffDateInMin = (d1: string, d2: string) => {
    const differenceInMs = new Date(d2).getTime() - new Date(d1).getTime();
    return differenceInMs / (1000 * 60);
  }
  const { data: refreshData, error:refreshError }: { data: OutreachUser[] | null; error: any } = await supabase
  .from('outreach')
  .select(`
      *,
      user_profile!user_profile_id (
      provider_token, provider_refresh_token, provider_expire_at, composed!user_profile_id(resume_link, resume_link_pdfcontent)
      )
  `) // auth_user:auth__user!id(email)
  .eq('status', 'Test')
  .lte('scheduled_datetime_utc', futureTime(30))
  .gte('scheduled_datetime_utc', futureTime(10))
  
  const lst: OutreachUser[] = []

  refreshData?.map((email) => {
    if (
      email.user_profile.provider_expire_at === null ||
      diffDateInMin(email.user_profile.provider_expire_at, futureTime(60)) < 50
    ) lst.push(email)
    
  })

  
  
  console.log(refreshData, lst, futureTime(60))
  return { message: 'Scheduled emails processed', status: 200 };

}

async function testLogger () {

  logThis('Test')

  return { message: 'Executed', status: 200 };
}

async function processTestEmails () {
  
  const { data, error } = await supabase.from('outreach')
  .select('*')
  .eq('status', 'Test')

  console.log(data) // [{}...]
  if (data) {
    const single = data[0]
    const repeatedList = [];
    let j = 1
    for (let i = 0; i < 6; i++) {

      const item = { ...single };
      delete item.id;
      
      if (i % 2 === 1) {
        const date = new Date(item.scheduled_datetime_utc); // assuming `timestamp` is a date field
        date.setMinutes(date.getMinutes() + j);
        item.scheduled_datetime_utc = date.toISOString();
        j++
      } else {
        const date = new Date(item.scheduled_datetime_utc); // assuming `timestamp` is a date field
        date.setMinutes(date.getMinutes() + j);
        item.scheduled_datetime_utc = date.toISOString();
      }
      
      repeatedList.push(item);
    }
    console.log(repeatedList)
    const { error: error1 } = await supabase.from('outreach').insert(repeatedList)
    if (error1) console.log(error1)
  }


  return { message: 'Scheduled emails processed', status: 200 };
}
