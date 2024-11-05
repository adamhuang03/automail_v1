'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // New import for Next.js 13
import { supabase } from '@/lib/db/supabase';
// This is the login flow pulled

export default function AuthCallback() {
  const router = useRouter(); // The updated hook for navigation

  useEffect(() => {
    // Parse the URL hash for the access token, refresh token, etc.
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    
    window.history.replaceState({}, document.title, window.location.pathname);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const providerRefreshToken = params.get('provider_refresh_token');
    const providerToken = params.get('provider_token');

    // console.log(params);

    (async () => {
      
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken ,
          refresh_token: refreshToken
        });

        document.cookie = `sb-access-token=${accessToken}; path=/; secure; samesite=lax`;
        document.cookie = `sb-refresh-token=${refreshToken}; path=/; secure; samesite=lax`;
        document.cookie = `sb-provider-refresh-token=${providerRefreshToken}; path=/; secure; samesite=lax`;
        document.cookie = `sb-provider-token=${providerToken}; path=/; secure; samesite=lax`;

        // if I keep this on for MS flow, it routes to login for some reason then gotes to home? is it cuz of the async
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (session) {
          const { error } = await supabase.from('user_profile')
          .update({ provider_token: providerToken, provider_refresh_token: providerRefreshToken})
          .eq('id', session.user.id);
          if (error) {
            console.log(error)
          }
        }

        router.replace('/home');
      } else {
        router.replace('/login');
      }
    })();
  }, []);

  return <div>Loading...</div>; // Show a loading state while processing the tokens
}
