import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://funbvnfgdrcjkykxdyst.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bmJ2bmZnZHJjamt5a3hkeXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMjI0OTgsImV4cCI6MjA4NjU5ODQ5OH0.l4JPx0EEwozTUOiYxQh-7rPVDfcid8y17IytfKEd9zU'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Console check to verify connection
console.log("Supabase Client Initialized for project: funbvnfgdrcjkykxdyst");
