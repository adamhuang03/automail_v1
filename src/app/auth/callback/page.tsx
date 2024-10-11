'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // New import for Next.js 13

export default function AuthCallback() {
  const router = useRouter(); // The updated hook for navigation

  useEffect(() => {
    // Parse the URL hash for the access token, refresh token, etc.
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    window.history.replaceState({}, document.title, window.location.pathname);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // Store tokens in cookies or localStorage (based on your app's needs)
      document.cookie = `accessToken=${accessToken}; path=/; Secure; HttpOnly;`;
      document.cookie = `refreshToken=${refreshToken}; path=/; Secure; HttpOnly;`;

      // Optionally, store in localStorage instead
      // localStorage.setItem('accessToken', accessToken);
      // localStorage.setItem('refreshToken', refreshToken);

      // Redirect to the final destination (e.g., dashboard)
      router.replace('/home/user');
    }
  }, [router]);

  return <div>Loading...</div>; // Show a loading state while processing the tokens
}
