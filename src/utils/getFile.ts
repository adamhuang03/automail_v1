import { supabase } from "@/lib/db/supabase";

export const getFileUrl = async(filePath: string, bucket: string) => {
  const { data } = await supabase.storage.from(bucket)  // Replace with your bucket name
    .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      console.error("Error getting file URL: The file may not exist or is in a private bucket.");
      return null;
    }

  return data.publicUrl;
};