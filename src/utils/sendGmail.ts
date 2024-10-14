import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

// Function to send a single email using Gmail API
export const sendEmail = async (accessToken: string, to: string, subject: string, message: string) => {
  const oAuth2Client = new google.auth.OAuth2();
  oAuth2Client.setCredentials({ access_token: accessToken });

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
    console.error('Error sending email:', error);
    throw error;
  }
};