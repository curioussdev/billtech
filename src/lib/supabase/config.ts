export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** Sem as chaves o site continua a funcionar com o conteúdo por omissão (sem dashboard nem login). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const MEDIA_BUCKET = 'site-media'
