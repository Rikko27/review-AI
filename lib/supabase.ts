import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// クライアント用（ブラウザから使う）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// サーバー用（API から使う・権限が強い）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
