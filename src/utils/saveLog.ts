import { supabase } from "@/lib/db/supabase"

export const logThis = async (message: string) => {
    const timestampz = new Date().toISOString()
    const { error } = await supabase.from('logs').insert({
        message: message,
        logged_at: timestampz
    })
    if (error) console.log(error)
}