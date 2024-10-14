import { google } from 'googleapis';
import { NextResponse } from 'next/server';


const refreshAccessToken = async (oAuth2Client: any) => {
  try {
    const { credentials } = await oAuth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    throw new Error('Failed to refresh access token');
  }
};

export async function POST() {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    // Set the access token (this would usually come from your Supabase or session)
    oAuth2Client.setCredentials({
      access_token: 'ya29.a0AcM612x74X2CiPgSUKpj5v7uaj9OuK6A3wMHWTDUMiK5bYhGSMV3hFEIBTAq0C8AEQ33tXyeU61UXMb9SXLJjksVY8dCODJwpjm3tZS14km3LASEtAO8DRx0rzE7sdvQdtd98g8vdFCcXChImejM9wEgL7Rm9aMLwocwV614aCgYKAVMSARMSFQHGX2MiNsDyWB0RKTl8kDYJXQNCyQ0175',
    });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Test if the client works by fetching the user profile from Gmail API
    const user = await gmail.users.getProfile({ userId: 'me' });

    // Log and return the user profile and credentials details
    return NextResponse.json({
      message: 'Client and token are working',
      credentials: oAuth2Client.credentials,
      userProfile: user.data,
    }, { status: 200 });
    
  } catch (error) {
    // Catch and log any errors
    console.error('Error authenticating with Google API:', error);
    return NextResponse.json({ 
      message: 'Failed to authenticate with Google API', 
      error: error
    }, { status: 500 });
  }
}
