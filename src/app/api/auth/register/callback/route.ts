import { supabase } from '@/lib/db/supabase';
import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers'; // Import cookies utility

export async function GET(req: NextRequest) {
  // Extract access_token and refresh_token from the URL (or could be passed in body/query params)
  const { searchParams } = new URL(req.url);
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'Access token or refresh token is missing' }, { status: 400 });
  }

  // Use the access token to set the session directly
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Optionally set the access and refresh tokens in secure cookies for future requests
  cookies().set('sb-access-token', accessToken, {
    httpOnly: true,
    secure: true,
    path: '/',
    sameSite: 'lax',
  });

  cookies().set('sb-refresh-token', refreshToken, {
    httpOnly: true,
    secure: true,
    path: '/',
    sameSite: 'lax',
  });

  return NextResponse.redirect(new URL('/onboard', req.url))
}
