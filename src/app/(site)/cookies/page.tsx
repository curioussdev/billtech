import type { Metadata } from 'next'
import { DEFAULT_CONTACT_EMAIL } from '@/data/site'

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Que cookies e tecnologias semelhantes o site da BillTech utiliza — e as que não utiliza.',
  alternates: { canonical: '/cookies' },
  robots: { index: true, follow: true },
}

const UPDATED_AT = '22 de setembro de 2026'

export default function CookiesPage() {
  return (
    <article className="px-5 pb-24 pt-32 lg:px-8 lg:pt-40">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Política de Cookies</h1>
        <p className="mt-3 text-sm text-muted-foreground">Última atualização: {UPDATED_AT}</p>

        <div className="mt-10 grid gap-8 text-base leading-8 text-muted-foreground">
          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">1. O que é um cookie</h2>
            <p>
              Um cookie é um pequeno ficheiro de texto que um site guarda no seu navegador para lembrar informação entre visitas — por exemplo,
              preferências ou uma sessão iniciada. "Tecnologias semelhantes" incluem o armazenamento local do navegador (localStorage,
              sessionStorage), com um funcionamento parecido mas guardado apenas no seu dispositivo.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">2. O que este site NÃO faz</h2>
            <p>
              Ao contrário da maioria dos sites, a área pública do billtech.online não usa cookies de publicidade, não usa cookies de
              redes sociais nem de terceiros para o seguir noutros sites, e não usa o Google Analytics ou ferramentas semelhantes. Enquanto
              visitante anónimo do site, o seu navegador não recebe nenhum cookie.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">3. Analítica própria (sem cookies)</h2>
            <p>
              Para sabermos quantas pessoas visitam o site e quais as páginas mais úteis, usamos um sistema de analítica desenvolvido por nós,
              que:
            </p>
            <ul className="mt-3 grid gap-2 pl-5 [&>li]:list-disc">
              <li>Não usa cookies — guarda apenas um identificador de sessão temporário no armazenamento local do seu navegador, apagado quando fecha o separador;</li>
              <li>Não recolhe nome, email ou qualquer dado que o identifique pessoalmente;</li>
              <li>Respeita automaticamente o sinal "Do Not Track" do seu navegador;</li>
              <li>Pode ser desligado a qualquer momento (ver secção 5).</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">4. Cookies estritamente necessários (áreas privadas)</h2>
            <p>
              As áreas de administração e a área de cliente (que exigem sessão iniciada) usam um cookie estritamente necessário para manter a
              sua sessão autenticada. Este cookie não é usado para publicidade nem para o seguir fora destas áreas, e é indispensável para o
              acesso funcionar — por isso não está sujeito a pedido de consentimento, nos termos da lei aplicável.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">5. Como gerir as suas preferências</h2>
            <p>
              Na primeira visita, mostramos um aviso onde pode aceitar ou recusar a analítica própria. Pode mudar de ideias a qualquer
              momento através do link <strong>"Gerir cookies"</strong>, no rodapé de qualquer página, sem precisar de limpar dados do
              navegador. Pode também bloquear ou apagar cookies diretamente nas definições do navegador — nesse caso, as áreas privadas do
              site (login) deixam de funcionar corretamente, já que dependem do cookie de sessão.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">6. Mais informação</h2>
            <p>
              Para saber como tratamos os dados que nos envia através do formulário de contacto, consulte a nossa{' '}
              <a href="/privacidade" className="font-medium text-primary underline-offset-4 hover:underline">
                Política de Privacidade
              </a>
              . Para dúvidas sobre esta política, contacte-nos em{' '}
              <a href={`mailto:${DEFAULT_CONTACT_EMAIL}`} className="font-medium text-primary underline-offset-4 hover:underline">
                {DEFAULT_CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </article>
  )
}
