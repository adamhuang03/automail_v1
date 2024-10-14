'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // New import for Next.js 13
import { supabase } from '@/lib/db/supabase';
import Cookies from 'js-cookie'; // Use js-cookie to manage client-side cookies

export default function AuthCallback() {
  const router = useRouter(); // The updated hook for navigation

  useEffect(() => {
    // Parse the URL hash for the access token, refresh token, etc.
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    
    window.history.replaceState({}, document.title, window.location.pathname);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    console.log(params);

    (async () => {
      
      if (accessToken && refreshToken) {
        // const { error } = await supabase.auth.setSession({
        //   access_token: accessToken ,
        //   refresh_token: refreshToken
        // });

        Cookies.set('sb-access-token', accessToken, {
          httpOnly: false, // Can't set httpOnly in client-side cookies
          secure: true,
          path: '/',
          sameSite: 'lax',
        });

        Cookies.set('sb-refresh-token', refreshToken, {
          httpOnly: false, // Can't set httpOnly in client-side cookies
          secure: true,
          path: '/',
          sameSite: 'lax',
        });

        router.replace('/onboard');
      } else {
        console.log('na')
        // router.replace('/login');
      }
    })();
  }, [router]);

  return <div>Loading...</div>; // Show a loading state while processing the tokens
}
