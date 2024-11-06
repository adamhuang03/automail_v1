import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/db/supabase';
import { OutreachUser } from '@/utils/types';
import axios from 'axios';
import { logThis } from '../saveLog';

export const sendEmail = async (oAuth2Client: any, to: string, subject: string, message: string) => {
  const p1 = Date.now();
  logThis(`Sending email p1: ${p1}`)
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  
  const p2 = Date.now();
  const d2 = (p2 - p1)/1000
  logThis(`d2: ${d2}`)

  const rawMessage = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\n\r\n${message}`
  ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const p3 = Date.now();
  const d3 = (p3 - p2)/1000
  logThis(`d2: ${d3}`)

  try {
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });
    const p4 = Date.now();
    const d4 = (p4 - p3)/1000
    logThis(`d4: ${d4}`)

    return result.data;
  } catch (error) {
    throw new Error(`Error sending email: ${error}`);
  }
};

export const sendEmailWithPdfFromUrl = async (
  oAuth2Client: any,
  to: string,
  subject: string,
  message: string,
  pdfUrl: string,
  pdfContent: string
) => {
  // logThis(`processGmail: Grabbing gmail`)
  const p1 = Date.now();
  logThis(`Sending email p1: ${p1}`)
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  
  try {
    // Download the PDF from the URL
    // logThis(`processGmail: trying pdf download`)

    const p2 = Date.now();
    const d2 = (p2 - p1)/1000
    logThis(`d2: ${d2}`)
    const fileName = pdfUrl.split('/').pop(); // You can also derive this from the URL if needed
    const decodedFileName = fileName ? decodeURIComponent(fileName) : ''

    const p3 = Date.now();
    const d3 = (p3 - p2)/1000
    logThis(`d3: ${d3}`)

    // Construct the raw email message with attachment
    // logThis(`processGmail: begin compiling message`)
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
      `Content-Type: application/pdf; name="${decodedFileName}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${decodedFileName}"`,
      '',
      pdfContent, // Base64 encoded PDF content
      '',
      '--boundary_example--',
      '', // could be causing the <end>
    ].join('\r\n');

    const p4 = Date.now();
    const d4 = (p4 - p3)/1000
    logThis(`d4: ${d4}`)

    // Base64 encode the raw message and format it
    // logThis(`processGmail: encoding message`)
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const p5 = Date.now();
    const d5 = (p5 - p4)/1000
    logThis(`d5: ${d5}`)

    // Send the email
    // logThis(`processGmail: preparing to send email`)
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    logThis(`processGmail: email sent ... ${result.data}`)
    const p6 = Date.now();
    const d6 = (p6 - p5)/1000
    logThis(`d6: ${d6}`)

    return result.data;
  } catch (error) {
    throw new Error(`Error sending email: ${error}`);
  }
};


export const refreshAccessToken = async (refreshToken: string) => {
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