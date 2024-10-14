import { supabase } from '@/lib/db/supabase';
import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers'; // Import cookies utility

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Authorization code is missing' }, { status: 400 });
  }

  // Exchange the authorization code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const session = data.session;

  if (session) {
    // Set the access token as an HTTP-only cookie
    cookies().set('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
    });

    // Optionally set refresh token if needed
    cookies().set('sb-refresh-token', session.refresh_token || '', {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Session could not be created' }, { status: 500 });
}
