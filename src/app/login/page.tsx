'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Loader2 } from 'lucide-react'
import Image from 'next/image'

// Initialize the Supabase client
import { supabase } from '@/lib/db/supabase'

export default function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter(); // The updated hook for navigation

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError(error.message)
    } else {
      // Redirect or update UI state on successful login
      console.log('Logged in successfully')
    }
    
    setLoading(false)
  }

  const handleSocialLogin = async (provider: 'google' | 'github', loginBool: boolean) => {
    setLoading(true)
    setError(null)

    // First check if the user is already signed in
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const accessToken = session.access_token;
      const expiresAt = session.expires_at || 0 // Expiration time (in UNIX timestamp)
      
      console.log('Access token will expire at:', new Date(expiresAt * 1000)); // Convert UNIX timestamp to readable date
      console.log('Expires in:', session.expires_in, 'seconds'); // Time left before expiration
    
      if (Date.now() >= expiresAt * 1000) {
        console.log('Session has expired, please log in again.');
      } else {
        console.log(session.user.id)
        router.push('/home/user');
      }
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: loginBool 
            ? `${window.location.origin}/auth/login/callback`  // Redirect for login
            : `${window.location.origin}/api/auth/callback/register`  // Redirect for sign up
        }
      });
    
      if (error) {
        setError(error.message);
      }
    
      setLoading(false);
    }
    
    setLoading(false)
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }
    
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    
    if (error) {
      setError(error.message)
    } else {
      setError('Password reset email sent. Check your inbox.')
    }
    
    setLoading(false)
  }

  return (
    <div className='flex flex-col justify-center'>
      <div className="flex justify-center mb-8 mt-[120px]">
        <Image
          src="/images/logo.png"
          alt="Automail Logo"
          width={300}
          height={100}
          className="block" // Makes sure the image is a block element to align properly
        />
      </div>
      <div className='flex flex-row justify-center'>
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button variant="default" onClick={() => handleSocialLogin('google', true)} disabled={loading}>
                Log in with Google
              </Button>
            </div>
            <Button variant="link" className="mt-2 w-full" onClick={handlePasswordReset} disabled={loading}>
              Forgot password?
            </Button>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        <Card className="w-[350px] ml-6">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Sign up for an account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button variant="outline" onClick={() => handleSocialLogin('google', false)} disabled={loading}>
                Register with Google
              </Button>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    
  )
}