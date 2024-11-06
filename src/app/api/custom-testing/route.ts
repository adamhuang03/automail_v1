// app/api/send-scheduled-emails/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/db/supabase';
import { OutreachUser } from '@/utils/types';
import { sendEmailWithPdfFromUrl, sendEmail, refreshAccessToken } from '@/utils/google/emailGoogleV2';
import { sendOutlookEmailWithPdfFromUrl, sendOutlookEmail, getAccessToken } from '@/utils/ms/emailMs';

export async function POST() {
  const response = await processTestEmails();
  return NextResponse.json(response, { status: response.status });
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
