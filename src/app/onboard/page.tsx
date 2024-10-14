'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { supabase } from '@/lib/db/supabase'
import { Session, User } from '@supabase/supabase-js';
import { getCookie, deleteCookie } from '@/utils/getCookie'

export default function RegistrationPage() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [rolePreList, setRolePreList] = useState<string[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [providerToken, setProviderToken] = useState<string | null | undefined>(null)
  const [providerRefreshToken, setProviderRefreshToken] = useState<string | null | undefined>(null)
  const router = useRouter(); // The updated hook for navigation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (/\s/.test(username)) {
      alert("Username should not contain spaces.");
      return; // Prevent form submission if spaces are found
    } 

    if (!name || !username || !role) {
      alert("Please fill all blanks before proceeding.");
      return; // Prevent form submission if spaces are found
    } 

    // Here you would typically send the data to your backend
    const { error } = await supabase.from('user_profile').insert([
      {
        id: user?.id,
        username: username,
        full_name: name,
        role_type: role,
        provider_token: providerToken,
        provider_refresh_token: providerRefreshToken
      }
    ])

    if (error) {
      console.error('Error:', error)
    } else {
      // console.log('Submitted:', { username, name, role })
    }

    // Reset form fields after submission
    setName('')
    setUsername('')
    setRole('')
    router.push('/home')
  }

  useEffect(() => {
    (async () => { // Get Enum List
      
      const { data, error } = await supabase.rpc('get_enum_values', {
        enum_name: 'role_type' // Replace with your actual enum type
      });
      
      if (error) {
        console.error(error)
      } else {
        // console.log(data)
        setRolePreList(data);
      }

      const providerTokenCookie: string | null = getCookie('sb-provider-token');
      const providerRefreshTokenCookie: string | null = getCookie('sb-provider-refresh-token');

      if (providerTokenCookie && providerRefreshTokenCookie) {
        setProviderToken(providerTokenCookie)
        setProviderRefreshToken(providerRefreshTokenCookie)
        deleteCookie('sb-provider-token')
        deleteCookie('sb-provider-refresh-token')
      }

      const { data: { session } } = await supabase.auth.getSession();
      // console.log(session)
      if (session) {
        setUser(session.user)
        setName(session.user?.user_metadata?.full_name)
      }

    })();
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto mt-[180px]">
      <CardHeader>
        <CardTitle className=''>Welcome to Automail</CardTitle>
        <CardDescription>Set up your new account to get started.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="Username">Username</Label>
            <Input 
              id="username" 
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {rolePreList.map((role) => (
                  <SelectItem value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className='flex justify-end'>
          <Button type="submit" className="w-full" onClick={handleSubmit}>Next</Button>
        </CardFooter>
      </form>
    </Card>
  )
}