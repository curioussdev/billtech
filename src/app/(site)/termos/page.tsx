import type { Metadata } from 'next'
import { DEFAULT_CONTACT_EMAIL } from '@/data/site'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Condições de utilização do site e dos serviços da BillTech.',
  alternates: { canonical: '/termos' },
  robots: { index: true, follow: true },
}

const UPDATED_AT = '22 de setembro de 2026'

export default function TermsPage() {
  return (
    <article className="px-5 pb-24 pt-32 lg:px-8 lg:pt-40">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Termos de Uso</h1>
        <p className="mt-3 text-sm text-muted-foreground">Última atualização: {UPDATED_AT}</p>

        <div className="mt-10 grid gap-8 text-base leading-8 text-muted-foreground">
          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">1. Aceitação dos termos</h2>
            <p>
              Ao aceder e utilizar o site billtech.online ("o Site"), operado pela BillTech (José Lopes), aceita os presentes Termos de Uso.
              Se não concordar com algum destes termos, pedimos que não utilize o Site.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">2. Objeto do site</h2>
            <p>
              O Site tem como finalidade apresentar os serviços de desenvolvimento de websites, sistemas web e automações da BillTech, mostrar
              exemplos de projetos realizados e permitir que potenciais clientes entrem em contacto para pedir uma proposta.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">3. Propriedade intelectual</h2>
            <p>
              O conteúdo do Site — textos, imagens, logótipo, código-fonte e design — é propriedade da BillTech ou é usado com a devida
              autorização, e está protegido por direitos de autor. Não é permitida a reprodução, distribuição ou utilização comercial deste
              conteúdo sem autorização prévia por escrito.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">4. Uso permitido</h2>
            <p>Compromete-se a utilizar o Site de forma lícita e a não:</p>
            <ul className="mt-3 grid gap-2 pl-5 [&>li]:list-disc">
              <li>Tentar aceder sem autorização a áreas restritas (dashboard administrativo, área de cliente) ou a dados de terceiros;</li>
              <li>Introduzir vírus, código malicioso ou tentar comprometer a segurança do Site;</li>
              <li>Usar sistemas automatizados para recolher dados do Site (scraping) sem autorização;</li>
              <li>Submeter informação falsa através do formulário de contacto.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">5. Serviços contratados</h2>
            <p>
              As condições específicas de cada projeto (âmbito, prazos, valores e forma de pagamento) são acordadas separadamente com cada
              cliente, por proposta e/ou contrato próprio. Estes Termos de Uso regem apenas a utilização do Site institucional, não substituindo
              o contrato de prestação de serviços.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">6. Limitação de responsabilidade</h2>
            <p>
              O Site é disponibilizado "tal como está". Fazemos um esforço razoável para manter a informação atualizada e o Site disponível e
              seguro, mas não garantimos que esteja sempre livre de erros, interrupções ou vulnerabilidades. A BillTech não se responsabiliza
              por danos indiretos resultantes da utilização ou impossibilidade de utilização do Site.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">7. Ligações a sites de terceiros</h2>
            <p>
              O Site pode conter ligações para páginas de terceiros (ex.: WhatsApp, redes sociais). Não somos responsáveis pelo conteúdo ou
              pelas práticas de privacidade desses sites externos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">8. Alterações a estes termos</h2>
            <p>
              Podemos atualizar estes Termos de Uso periodicamente. A data no topo desta página indica a versão mais recente. O uso continuado
              do Site após uma alteração implica a aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">9. Lei aplicável</h2>
            <p>
              Estes Termos de Uso são regidos pela lei portuguesa. Qualquer litígio será submetido ao foro competente em Portugal, sem prejuízo
              dos direitos que assistam ao consumidor ao abrigo de legislação de proteção do consumidor aplicável.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">10. Contacto</h2>
            <p>
              Para questões sobre estes Termos de Uso, contacte-nos através de{' '}
              <a href={`mailto:${DEFAULT_CONTACT_EMAIL}`} className="font-medium text-primary underline-offset-4 hover:underline">
                {DEFAULT_CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <p className="rounded-2xl border border-dashed border-border p-4 text-sm">
            Este texto é um modelo de referência. Recomendamos a revisão por um profissional jurídico antes de o considerar como aviso legal
            definitivo, sobretudo quando os contratos de prestação de serviço evoluírem.
          </p>
        </div>
      </div>
    </article>
  )
}
