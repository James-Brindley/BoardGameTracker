import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'funbvnfgdrcjkykxdyst'
const supabaseKey = 'sb_publishable_9hs47u63lACuH6oviQ4FhA_345LjDYJ'

export const supabase = createClient(supabaseUrl, supabaseKey)
