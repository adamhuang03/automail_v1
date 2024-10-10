import { supabase } from "@/lib/db/supabase";

export const signup = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
  
  if (error) {
      console.error('Error signing up:', error);
  }
  
  if (data?.user) {
    // Insert user profile details into the custom table
    const { error: insertError } = await supabase
      .from('user_profile')
      .insert({
        id: data.user.id, // Use the same user ID from the auth.users table
        username: 'new_user',
        full_name: 'New User',
      });

    if (insertError) {
      console.error('Error inserting profile:', insertError.message);
    }
  }
}

