import type { Metadata } from 'next'
import { DEFAULT_CONTACT_EMAIL } from '@/data/site'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como a BillTech recolhe, usa e protege os seus dados pessoais, em conformidade com o RGPD.',
  alternates: { canonical: '/privacidade' },
  robots: { index: true, follow: true },
}

const UPDATED_AT = '22 de setembro de 2026'

export default function PrivacyPage() {
  return (
    <article className="px-5 pb-24 pt-32 lg:px-8 lg:pt-40">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Política de Privacidade</h1>
        <p className="mt-3 text-sm text-muted-foreground">Última atualização: {UPDATED_AT}</p>

        <div className="prose-legal mt-10 grid gap-8 text-base leading-8 text-muted-foreground">
          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">1. Quem somos</h2>
            <p>
              A BillTech ("nós", "a BillTech") é operada por José Lopes e presta serviços de desenvolvimento de websites, sistemas e automações
              para empresas. Esta política explica que dados pessoais recolhemos através do site billtech.online, para que servem e quais são os
              seus direitos, em conformidade com o Regulamento Geral de Proteção de Dados (RGPD — Regulamento (UE) 2016/679).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">2. Que dados recolhemos</h2>
            <p>Recolhemos dados pessoais apenas quando nos contacta ativamente, através do formulário de contacto:</p>
            <ul className="mt-3 grid gap-2 pl-5 [&>li]:list-disc">
              <li>Nome</li>
              <li>Email</li>
              <li>Número de WhatsApp (opcional)</li>
              <li>A descrição do desafio ou pedido que nos escreve</li>
            </ul>
            <p className="mt-3">
              Além disso, o site regista de forma anónima e agregada o número de visitas e as páginas mais vistas, através de um sistema de
              analíticas próprio — ver detalhes na nossa <a href="/cookies" className="font-medium text-primary underline-offset-4 hover:underline">Política de Cookies</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">3. Para que usamos os seus dados</h2>
            <ul className="grid gap-2 pl-5 [&>li]:list-disc">
              <li>Responder ao seu pedido de contacto e preparar uma proposta ou diagnóstico;</li>
              <li>Comunicar consigo sobre um projeto em curso, se se tornar cliente;</li>
              <li>Cumprir obrigações legais (ex.: faturação), quando aplicável.</li>
            </ul>
            <p className="mt-3">Nunca vendemos os seus dados a terceiros, nem os usamos para publicidade não solicitada.</p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">4. Com quem partilhamos os seus dados</h2>
            <p>
              Os dados do formulário de contacto são processados por prestadores de serviços estritamente necessários ao envio e receção de
              email (ex.: Resend) e alojamento (Vercel, Supabase), que atuam como subcontratantes e estão vinculados a obrigações de
              confidencialidade e segurança compatíveis com o RGPD. Não partilhamos os seus dados com terceiros para fins de marketing.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">5. Quanto tempo guardamos os seus dados</h2>
            <p>
              Guardamos os dados do formulário de contacto pelo tempo necessário para responder ao seu pedido e, caso avance um projeto
              connosco, durante a relação comercial e o período exigido por obrigações fiscais e contabilísticas. Pode pedir a eliminação dos
              seus dados a qualquer momento, nos termos da secção 7.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">6. Segurança</h2>
            <p>
              O site é servido exclusivamente por HTTPS (encriptação em trânsito), aplica cabeçalhos de segurança estritos (Content-Security-Policy,
              proteção contra clickjacking, entre outros) e os dados ficam alojados em infraestrutura com controlo de acesso e cifra em repouso.
              Nenhum sistema é 100% infalível, mas tratamos a segurança dos seus dados como uma prioridade, não um extra.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">7. Os seus direitos</h2>
            <p>Ao abrigo do RGPD, tem direito a:</p>
            <ul className="mt-3 grid gap-2 pl-5 [&>li]:list-disc">
              <li>Aceder aos dados pessoais que temos sobre si;</li>
              <li>Pedir a retificação de dados incorretos ou incompletos;</li>
              <li>Pedir o apagamento dos seus dados ("direito a ser esquecido");</li>
              <li>Opor-se ao tratamento ou pedir a sua limitação;</li>
              <li>Pedir a portabilidade dos seus dados;</li>
              <li>Apresentar reclamação junto da Comissão Nacional de Proteção de Dados (CNPD), em www.cnpd.pt.</li>
            </ul>
            <p className="mt-3">
              Para exercer qualquer um destes direitos, contacte-nos através de{' '}
              <a href={`mailto:${DEFAULT_CONTACT_EMAIL}`} className="font-medium text-primary underline-offset-4 hover:underline">
                {DEFAULT_CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">8. Alterações a esta política</h2>
            <p>
              Podemos atualizar esta política periodicamente para refletir alterações legais ou nos nossos serviços. A data no topo desta
              página indica a versão mais recente.
            </p>
          </section>

          <p className="rounded-2xl border border-dashed border-border p-4 text-sm">
            Este texto é um modelo de referência, escrito para cobrir o funcionamento atual do site. Recomendamos a revisão por um
            profissional jurídico antes de o considerar como aviso legal definitivo, sobretudo se a atividade crescer (ex.: novos
            subcontratantes, dados de clientes com contratos, ou expansão para outros países).
          </p>
        </div>
      </div>
    </article>
  )
}
