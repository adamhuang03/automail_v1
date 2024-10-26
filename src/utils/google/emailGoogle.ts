import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/db/supabase';
import { OutreachUser } from '@/utils/types';
import axios from 'axios';

export const sendEmail = async (oAuth2Client: any, to: string, subject: string, message: string) => {
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

export const sendEmailWithPdfFromUrl = async (
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
    const decodedFileName = fileName ? decodeURIComponent(fileName) : ''

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
      `Content-Type: application/pdf; name="${decodedFileName}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${decodedFileName}"`,
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