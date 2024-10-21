// Unused because need an infinite link
import { supabase } from "@/lib/db/supabase";

const getSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase
      .storage
      .from('resume_link')  // Replace with your actual bucket name
      .createSignedUrl(filePath, 60);  // 60 seconds validity for the signed URL
  
    if (error) {
      console.error("Error creating signed URL:", error.message);
      return null;
    }
  
    return data?.signedUrl || null;
  };