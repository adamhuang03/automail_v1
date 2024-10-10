'use client'
import { signup } from "@/utils/signupSupabase";
import { Button } from "@/components/ui/button";
import { handleSocialLogin } from "@/utils/signupSocial";

export default function LoginComponent() {

  const handleSignUp = async () => {
    const res = await signup('huangadam9@gmail.com', 'testpassword')
    console.log(res)
  }
  
  return (
    <main className="flex flex-1 justify-center">
      <Button variant="outline" onClick={handleSignUp}>Sign Up</Button>
      <Button variant="outline" onClick={() => handleSocialLogin('google')}>
        Sign in with Google
      </Button>
    </main>
    
  )
}