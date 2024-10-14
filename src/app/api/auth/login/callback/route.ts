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
  const { data: session, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 400 });
  }

  // Update the user profile with the provider tokens
  const { error: profileUpdateError } = await supabase
    .from('user_profile')
    .update({
      provider_token: session.session?.provider_token, // Update with the provider token
      provider_refresh_token: session.session?.provider_refresh_token, // Update with the refresh token
    })
    .eq('id', session.user?.id); // Use the user ID to match the profile

  if (profileUpdateError) {
    return NextResponse.json({ error: profileUpdateError.message }, { status: 400 });
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

  // Redirect the user to the home page
  return NextResponse.redirect(new URL('/home', req.url));
}
