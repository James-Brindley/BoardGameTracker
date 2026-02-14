import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Your project URL based on the ID you shared
const supabaseUrl = 'https://funbvnfgdrcjkykxdyst.supabase.co'

// Copy the long string from the 'anon' 'public' box on that page
const supabaseKey = 'sb_publishable_9hs47u63lACuH6oviQ4FhA_345LjDYJ'

export const supabase = createClient(supabaseUrl, supabaseKey)
