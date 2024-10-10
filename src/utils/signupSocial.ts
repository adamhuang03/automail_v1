import { supabase } from "@/lib/db/supabase";

export const handleSocialLogin = async (provider: 'google' | 'github', openInNewTab: boolean = false) => {
  try {
    // Get the URL for the social login OAuth process
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}` // Ensure they return to the app after login
      }
    });

    if (error) {
      console.error('Error with OAuth sign-in:', error);
      return;
    }

    if (data?.url) {
      // If new tab is requested, open the OAuth URL in a new window
      if (openInNewTab) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        // If not, redirect in the same tab
        window.location.href = data.url;
      }
    }
  } catch (error) {
    console.error('An unexpected error occurred during social login:', error);
  }
};

// Function to check if a user has a profile or create one if it doesn't exist
export const checkOrCreateUserProfile = async (user: any) => {
  try {
    // Check if the user already has a profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // No profile exists, so create a new one
      const { error: insertError } = await supabase
        .from('user_profile')
        .insert({
          id: user.id, // Use the user ID from Supabase's auth.users table
          username: user.email.split('@')[0], // Example username from email
          full_name: user.user_metadata?.full_name || '', // Fetch full name from user metadata
        });

      if (insertError) {
        console.error('Error creating profile:', insertError.message);
      } else {
        console.log('Profile created successfully');
      }
    } else if (profile) {
      console.log('User profile already exists');
    }
  } catch (error) {
    console.error('Error checking or creating profile:', error);
  }
};

// On component mount or after successful OAuth redirect, you can trigger the profile check
export const handleUserAfterLogin = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return;
  }

  if (session?.user) {
    await checkOrCreateUserProfile(session.user);
  } else {
    console.log('No user session found');
  }
};
