const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL.trim()).hostname : null
  } catch {
    return null
  }
})()

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Imagens carregadas na dashboard (Supabase Storage, bucket público)
      ...(supabaseHost ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }] : []),
    ],
  },
}

export default nextConfig
