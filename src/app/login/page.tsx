'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Loader2 } from 'lucide-react'

// Initialize the Supabase client
import { supabase } from '@/lib/db/supabase'

export default function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithOAuth({ provider })
    
    if (error) {
      setError(error.message)
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
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
          </Button>
        </form>
        <div className="mt-4 flex flex-col space-y-2">
          <Button variant="outline" onClick={() => handleSocialLogin('google')} disabled={loading}>
            Sign in with Google
          </Button>
          <Button variant="outline" onClick={() => handleSocialLogin('github')} disabled={loading}>
            <Github className="mr-2 h-4 w-4" />
            Sign in with GitHub
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
  )
}