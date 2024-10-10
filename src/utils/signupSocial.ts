import { supabase } from "@/lib/db/supabase";

export const handleSocialLogin = async (provider: 'google' | 'github', openInNewTab: boolean = false) => {
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}` // You can redirect the user back to the app
    }
  });

  if (error) {
    console.error('Error with OAuth sign-in:', error);
  } else if (data?.user) {
    // Check if the user has a profile, or create one
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      // If no profile exists, create a new one
      const { error: insertError } = await supabase
        .from('user_profile')
        .insert({
          id: data.user.id, // Use the user ID from Supabase's auth.users table
          username: data.user.email.split('@')[0], // Example username from email
          full_name: data.user.user_metadata?.full_name || '', // Fetch full name from user metadata
        });

      if (insertError) {
        console.error('Error creating profile:', insertError.message);
      }
    }
  }
}