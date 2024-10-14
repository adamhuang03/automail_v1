'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // New import for Next.js 13
import { supabase } from '@/lib/db/supabase';

export default function AuthCallback() {
  const router = useRouter(); // The updated hook for navigation

  useEffect(() => {
    // Parse the URL hash for the access token, refresh token, etc.
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    window.history.replaceState({}, document.title, window.location.pathname);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    (async () => {
      let retries = 3; // Try up to 3 times
      let session = null;

      while (retries > 0 && session === null) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
        console.log(data)

        if (session) {

          if (accessToken && refreshToken) {
            // Store tokens in cookies or localStorage (based on your app's needs)
            document.cookie = `accessToken=${accessToken}; path=/; Secure; HttpOnly;`;
            document.cookie = `refreshToken=${refreshToken}; path=/; Secure; HttpOnly;`;
            
            document.cookie = `accessTokenProvider=${session.provider_token}; Secure; HttpOnly; SameSite=Strict;`;
            document.cookie = `refreshTokenProvider=${session.provider_refresh_token}; Secure; HttpOnly; SameSite=Strict;`;
      
            // Optionally, store in localStorage instead
            // localStorage.setItem('accessToken', accessToken);
            // localStorage.setItem('refreshToken', refreshToken);
      
            // Redirect to the final destination (e.g., dashboard)
            router.replace('/onboard');
          }

        }

        retries -= 1;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }

      if (!session) {
        console.error('Session not found. Please log in again.');
        router.replace('/login'); // Redirect if no session is found
      }
    })();
    
    // if (accessToken && refreshToken) {
    //   // Store tokens in cookies or localStorage (based on your app's needs)
    //   document.cookie = `accessToken=${accessToken}; path=/; Secure; HttpOnly;`;
    //   document.cookie = `refreshToken=${refreshToken}; path=/; Secure; HttpOnly;`;

    //   // Optionally, store in localStorage instead
    //   // localStorage.setItem('accessToken', accessToken);
    //   // localStorage.setItem('refreshToken', refreshToken);

    //   // Redirect to the final destination (e.g., dashboard)
    //   router.replace('/onboard');
    // }
  }, [router]);

  return <div>Loading...</div>; // Show a loading state while processing the tokens
}
