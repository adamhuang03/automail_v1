import { NextResponse } from "next/server";

export async function POST() {
  const accessToken = 'ya29.a0AcM612x74X2CiPgSUKpj5v7uaj9OuK6A3wMHWTDUMiK5bYhGSMV3hFEIBTAq0C8AEQ33tXyeU61UXMb9SXLJjksVY8dCODJwpjm3tZS14km3LASEtAO8DRx0rzE7sdvQdtd98g8vdFCcXChImejM9wEgL7Rm9aMLwocwV614aCgYKAVMSARMSFQHGX2MiNsDyWB0RKTl8kDYJXQNCyQ0175';

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
    const tokenInfo = await response.json();

    if (tokenInfo.error) {
      return NextResponse.json({ message: `Token error: ${tokenInfo.error}` }, { status: 400 });
    }

    // Token info will include expiration time (in seconds)
    const expirationTime = tokenInfo.exp; // `exp` is a Unix timestamp in seconds
    const expirationDate = new Date(expirationTime * 1000); // Convert to milliseconds for JavaScript Date object

    return NextResponse.json({
      message: `Token is valid and will expire at: ${expirationDate.toISOString()}`
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: `Error fetching token info: ${error}` }, { status: 500 });
  }
}
