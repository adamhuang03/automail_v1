import { NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider, TokenCredentialAuthenticationProviderOptions } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { supabase } from '@/lib/db/supabase';
import { OutreachUser } from '@/utils/types';
import axios from 'axios';
import { ConfidentialClientApplication } from '@azure/msal-node'; //npm install @azure/msal-node @microsoft/microsoft-graph-client
import { ClientSecretCredential } from '@azure/identity'; //npm install @azure/identity

// Initialize MSAL (Microsoft Authentication Library)
const msalClient = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.OUTLOOK_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/common`, //https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID}
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET || "",
  },
});

// Create a ClientSecretCredential for the TokenCredentialAuthenticationProvider
const credential = new ClientSecretCredential(
  process.env.OUTLOOK_TENANT_ID || "",
  process.env.OUTLOOK_CLIENT_ID || "",
  process.env.OUTLOOK_CLIENT_SECRET || ""
);

export const getAccessToken = async (refreshToken: string, email: OutreachUser): Promise<string | undefined> => {
  try {
    const response = await msalClient.acquireTokenByRefreshToken({
      refreshToken,
      scopes: ['https://graph.microsoft.com/.default'],
    });

    return response?.accessToken;
  } catch (error: any) {
    throw new Error(`${email.id}-Error acquiring access token: ${error.message}`);
  }
};

export const sendOutlookEmail = async (accessToken: string, to: string, subject: string, message: string) => {
  const authProviderOptions: TokenCredentialAuthenticationProviderOptions = {
    scopes: ['https://graph.microsoft.com/.default'],
  };

  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  try {
    const emailMessage = {
      message: {
        subject,
        body: {
          contentType: 'Text',
          content: message,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
      saveToSentItems: true,
    };

    const result = await client.api(`/me/sendMail`).post(emailMessage);
    return result;
  } catch (error: any) {
    throw new Error(`Error sending email: ${error.message}`);
  }
};

export const sendOutlookEmailWithPdfFromUrl = async (
  accessToken: string,
  to: string,
  subject: string,
  message: string,
  pdfUrl: string,
  pdfContent: string
) => {
  const authProviderOptions: TokenCredentialAuthenticationProviderOptions = {
    scopes: ['https://graph.microsoft.com/.default'],
  };

  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  try {
    // const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    // const pdfContent = Buffer.from(response.data).toString('base64');
    const fileName = pdfUrl.split('/').pop(); // You can also derive this from the URL if needed
    const decodedFileName = fileName ? decodeURIComponent(fileName) : ''
    console.log(pdfContent)
    const emailMessage = {
      message: {
        subject,
        body: {
          contentType: 'Text',
          content: message,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
        attachments: [
          {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: decodedFileName,
            contentBytes: pdfContent,
          },
        ],
      },
      saveToSentItems: true,
    };

    const result = await client.api(`/me/sendMail`).post(emailMessage)
    return result;
  } catch (error: any) {
    throw new Error(`Error sending email with attachment: ${error.message}`);
  }
};
