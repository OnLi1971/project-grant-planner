import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://vkhyvziywciwlcehtaxw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHl2eml5d2Npd2xjZWh0YXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDgzNTYsImV4cCI6MjA3MDQ4NDM1Nn0.40nPN6fHLXKgJHbNtYWrGiV3VZQ3GG8kLeOqWd92wz0';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);