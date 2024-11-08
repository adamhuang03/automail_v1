// app/api/send-scheduled-emails/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase, supabaseServer } from '@/lib/db/supabase';
import { OutreachUser } from '@/utils/types';
import { sendEmailWithPdfFromUrl, sendEmail, refreshAccessToken } from '@/utils/google/emailGoogleV2';
import { sendOutlookEmailWithPdfFromUrl, sendOutlookEmail, getAccessToken } from '@/utils/ms/emailMs';
import { logThis } from '@/utils/saveLog';
import { sendAutomailEmail } from '@/utils/google/sendAutomailEmail';

export async function POST() {
  const response = await createMsTestEmails();
  return NextResponse.json(response, { status: response.status });
}

async function findAuth() {
  const { data } =  await supabaseServer.auth.admin.getUserById('08ee2055-e95b-4df0-b58b-f9f0e83d3abd')
  console.log(data.user?.email)
  return { message: 'Scheduled emails processed', status: 200 };
}

async function sendEmailTest() {

  await sendAutomailEmail ('adam.huang@mail.utoronto.ca', "test Automail ", "test Automail ", "")
  return { message: 'Scheduled emails processed', status: 200 };
}

async function testHasan() {
  const refresh = "M.C554_BL2.0.U.-Cl0lpTkadIBltoFO2b2hpm8LEGzzbrwwmLK!17MyLpQam3Yi0qoyyf83BW*IqkIK4Yfz67*8rbXSitDfRkC8lZULkIr3eEUxaoGt0wF7VKR6otuErhrW4oPji0zG0ryd6Mdh02LCUW6oU3e2D3Skal8J47JKapaVjVCGj1PHfGQUXOuLUFwENLjfoZJ67VtdzM7KRbJ1U5R1LmNokmhnJ2Hr9dscaef0hofHVhJ6AXUKWzZKNaYVrUXkSM0X4tss4HvYZfLnCLZBD6QEr5n*QFY40E6ftPUJ32XS3hK5TLryOaZliXCn6Hj97OJoWVET2vw7JAVkHJqzAE!LelfSVm8$"

  const access = await getAccessToken(refresh)
  // , {
  //   id: 'ng',
  //   status: 'string',
  //   user_profile: {
  //     composed: {
  //       resume_link: 'string',
  //       resume_link_pdfcontent: 'string',
  //     },
  //     provider_token: 'string',
  //     provider_refresh_token: 'string',
  //     provider_expire_at: 'string',
  //   },
  //   user_profile_id: 'string',
  //   to_name: 'string',
  //   to_email: 'string',
  //   to_firm: 'string',
  //   firm_email_id: 0,
  //   firm_email_user_id: 0,
  //   subject_generated: 'string',
  //   email_generated: 'string',
  //   scheduled_datetime_utc: 'string',
  //   provider_name: 'string',
  //   created_at: 'string',
  // })
  console.log(access)
  return { message: 'Scheduled emails processed', status: 200 };
}

// ===========================================================================
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
  .eq('status', 'Scheduled')
  .lte('scheduled_datetime_utc', futureTime(30))
  .gte('scheduled_datetime_utc', futureTime(5))
  
  const lst: OutreachUser[] = []

  refreshData?.map((email) => {
    if (
      email.user_profile.provider_expire_at === null ||
      diffDateInMin(email.user_profile.provider_expire_at, futureTime(0)) > 0 // Expired
    ) lst.push(email)
    
  })

  
  
  console.log(lst, futureTime(60))
  return { message: 'Scheduled emails processed', status: 200 };

}

// ===========================================================================
async function testLogger () {

  logThis('Test')

  return { message: 'Executed', status: 200 };
}

// ===========================================================================
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

// ============================================================================
async function createMsTestEmails () {
  const template = (userProfileId: string, toEmail: string, scheduledTime: Date, providerName: string) => {
    return {
        status: 'Test',
        user_profile_id: userProfileId, // adamhuangshuo@outlook.com
        to_name: 'Test Email',
        to_email: toEmail,
        to_firm: 'University of Toronto',
        firm_email_id: 'a77d1062-eb02-4424-832a-3002cbf44de2',
        firm_email_user_id: null,
        subject_generated: 'Testing Azure',
        email_generated: 'Testing Azure Body',
        scheduled_datetime_utc: scheduledTime,
        provider_name: providerName
      }
  }

  const futureTime = (min: number) => {
    return new Date(Date.now() + min * 60 * 1000)
  }

  const options: Record<number, string[]> = {
    1: ['08ee2055-e95b-4df0-b58b-f9f0e83d3abd', 'hashu2003@gmail.com', 'google'],//No attachment
    2: ['2c4b3f5f-3f61-483f-a63d-66844a264bd5', 'hrn_2003@hotmail.com', 'azure'], //No attachment
    3: ['a4195823-f15c-4565-b4ad-fc556845db70', 'productionadamh@gmail.com', 'google' ], //Has attachment
    4: ['abc0e75d-7efb-4ea6-b8ca-bca77d874abd', 'adamhuangshuo@outlook.com', 'azure'] //Has attachment
  }

  const prepEmail = (fromNum: number, toNum: number, scheduledTime: Date) => {
    return template(options[fromNum][0], options[toNum][1], scheduledTime, options[fromNum][2])
  }

  // Test Cases
  

  // gmail to gmail w attachment


  // 1 gmail to outlook, 1 outlook to gmail at the same time from different accounts (no attachment)
  // 1 gmail to outlook, 1 outlook to gmail at the same time from different accounts (w attachment)
  // 1 gmail 2 hour since last email, 1 outlooks 2 hours since last email with and without attachement

  const listToSend = [
    prepEmail(1, 2, futureTime(15)),
    prepEmail(2, 3, futureTime(15)),

    // // Time test + provider test
    // // gmail to outlook works, outlook to gmail works (same time)
    // // gmail to outlook works, outlook to gmail works (different time)
    // // if ok, azure can send to googl and google and send to azure at same and different times
    // prepEmail(1, 2, futureTime(15)),
    // prepEmail(4, 3, futureTime(15)),

    // prepEmail(1, 2, futureTime(20)),
    // prepEmail(4, 3, futureTime(25)),

    // // self provider test w attachment and without
    // // Gmail to gmail w attachment
    // // outlook to outlook w attachment
    // // both without attachment
    // // if ok, providers can send to each other with and without attachment
    // prepEmail(3, 1, futureTime(60)),
    // prepEmail(4, 2, futureTime(60)),
    // prepEmail(1, 3, futureTime(65)),
    // prepEmail(2, 4, futureTime(65)),

    // // 2 hour apart sending test for (no attachment) -- proven attachment alr
    // // outlookt to gmail
    // // gmail to outlook
    // // if ok, refresh token is working
    // prepEmail(2, 4, futureTime(300)),
    // prepEmail(1, 3, futureTime(300)),

    // // mass spam test 3 emails sending out at once no attachment
    // // outlook test
    // // attachment test
    // // cross send test
    // // if ok, ...
    // // 1) sending out 12 emails executes <1 min
    // // 2) multiple with attachments can send out at once
    // // ...3) can cross send at same time -> less important
    // prepEmail(1, 2, futureTime(180)), // google no attachment
    // prepEmail(1, 3, futureTime(180)),
    // prepEmail(1, 4, futureTime(180)),
    // prepEmail(2, 1, futureTime(180)), // azure no attachment
    // prepEmail(2, 3, futureTime(180)),
    // prepEmail(2, 4, futureTime(180)),
    // prepEmail(3, 1, futureTime(180)), // google w attachment
    // prepEmail(3, 2, futureTime(180)),
    // prepEmail(3, 4, futureTime(180)),
    // prepEmail(4, 1, futureTime(180)), // azure w attachment
    // prepEmail(4, 2, futureTime(180)),
    // prepEmail(4, 3, futureTime(180)),
  ]
  // console.log(listToSend)

  const { error: error1 } = await supabase.from('outreach').insert(
    listToSend
  )

  return { message: 'Scheduled emails processed', status: 200 };
}
