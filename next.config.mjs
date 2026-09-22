const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL.trim()).hostname : null
  } catch {
    return null
  }
})()

const isDev = process.env.NODE_ENV === 'development'

/**
 * Content-Security-Policy única para todo o site (landing pública, /admin e /area-cliente — os três
 * correm sob o mesmo domínio e partilham os mesmos riscos de XSS/clickjacking).
 *
 * Nota sobre `script-src`: o App Router do Next injeta o payload de hidratação (RSC/"__next_f") em
 * `<script>` inline em CADA página, gerado por pedido — não dá para hash-lo em build. A alternativa
 * "sem unsafe-inline" são nonces por pedido (guia oficial: content-security-policy.md), mas isso
 * obriga a renderização dinâmica em TODAS as páginas (perde-se o ISR/estático da landing, o oposto do
 * que a Fase 2 pede). Por isso seguimos a variante "sem nonce" que os próprios docs do Next recomendam
 * para quem quer manter páginas estáticas: `'unsafe-inline'` em script/style, mas com todo o resto
 * (object-src, frame-ancestors, base-uri, form-action) estrito. Continua a bloquear o vetor mais comum
 * de XSS (carregar um <script src="https://atacante.com/x.js"> externo) e todo o clickjacking/framing.
 * Se um dia quiser máximo rigor e aceitar perder o estático, dá para migrar para nonces no `proxy.ts`.
 */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://images.unsplash.com${supabaseHost ? ` https://${supabaseHost}` : ''};
  font-src 'self' data:;
  connect-src 'self'${supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : ''};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim()

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspHeader },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Cinturão e suspensórios: frame-ancestors (CSP, acima) é o que os browsers atuais respeitam,
  // X-Frame-Options cobre os que ainda não leem CSP.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Só tem efeito em HTTPS (Vercel já força HTTPS); preload exige registo em hstspreload.org, por isso
  // fica de fora para não criar uma promessa que ainda não cumprimos.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

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
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
