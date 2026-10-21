import { formatDate, formatEUR, paymentTypeLabels } from '@/lib/finance/labels'

export type ContractData = {
  clientName: string
  clientCompany: string
  clientNif: string | null
  projectName: string
  scope: string
  totalAmount: number
  paymentType: 'unico' | 'parcelado'
  installments: number | null
  startDate: string
  dueDate: string | null
}

/**
 * Texto do contrato — RASCUNHO, ponto de partida a rever por um advogado antes de usar com clientes
 * reais (dados legais da BillTech, foro competente, cláusulas de propriedade intelectual/rescisão).
 * Componente de apresentação puro, sem acesso a dados — usado tanto na pré-visualização do admin
 * como na página de leitura do cliente, para nunca poderem mostrar textos diferentes.
 */
export function ContractDocument({ data }: { data: ContractData }) {
  const paymentDescription =
    data.paymentType === 'parcelado' && data.installments
      ? `em ${data.installments}x de ${formatEUR(data.totalAmount / data.installments)} (aprox.)`
      : paymentTypeLabels[data.paymentType].toLowerCase()

  return (
    <article className="grid gap-6 text-sm leading-7">
      <header className="border-b border-border pb-6 text-center">
        <h1 className="text-xl font-black tracking-tight">Contrato de Prestação de Serviços de Desenvolvimento Digital</h1>
      </header>

      <p>
        Entre <strong>BillTech</strong> [dados legais a confirmar — nome legal, NIF, morada], adiante designada por <strong>&quot;Prestador&quot;</strong>, e{' '}
        <strong>{data.clientCompany || data.clientName}</strong>
        {data.clientNif ? (
          <>
            , NIF <strong>{data.clientNif}</strong>
          </>
        ) : (
          <> [NIF do cliente ainda não definido]</>
        )}
        , adiante designado por <strong>&quot;Cliente&quot;</strong>, é celebrado o presente contrato, que se rege pelas cláusulas seguintes:
      </p>

      <section>
        <h2 className="font-bold">1. Objeto</h2>
        <p>
          O Prestador compromete-se a desenvolver para o Cliente o projeto <strong>&quot;{data.projectName}&quot;</strong>, com o âmbito descrito no Anexo I: {data.scope}
        </p>
      </section>

      <section>
        <h2 className="font-bold">2. Preço e condições de pagamento</h2>
        <p>
          O valor total do serviço é de <strong>{formatEUR(data.totalAmount)}</strong>, a pagar {paymentDescription}, com vencimento conforme acordado. O não pagamento nas datas acordadas pode
          implicar a suspensão dos trabalhos até regularização.
        </p>
      </section>

      <section>
        <h2 className="font-bold">3. Prazo</h2>
        <p>
          Os trabalhos têm início previsto em <strong>{formatDate(data.startDate)}</strong>
          {data.dueDate ? (
            <>
              {' '}
              e entrega prevista em <strong>{formatDate(data.dueDate)}</strong>
            </>
          ) : null}
          , salvo atrasos não imputáveis ao Prestador (ex.: falta de conteúdos/acessos por parte do Cliente).
        </p>
      </section>

      <section>
        <h2 className="font-bold">4. Obrigações do Prestador</h2>
        <p>Desenvolver o projeto de acordo com o âmbito acordado, com qualidade profissional, e prestar suporte técnico razoável após a entrega.</p>
      </section>

      <section>
        <h2 className="font-bold">5. Obrigações do Cliente</h2>
        <p>Fornecer atempadamente os conteúdos, acessos e informações necessários, e efetuar os pagamentos acordados.</p>
      </section>

      <section>
        <h2 className="font-bold">6. Propriedade intelectual</h2>
        <p>Após o pagamento integral, os direitos sobre o resultado final entregue transferem-se para o Cliente; o Prestador mantém o direito de usar o projeto como referência/portefólio, salvo acordo em contrário por escrito.</p>
      </section>

      <section>
        <h2 className="font-bold">7. Confidencialidade</h2>
        <p>Ambas as partes comprometem-se a não divulgar informação confidencial trocada no âmbito deste contrato.</p>
      </section>

      <section>
        <h2 className="font-bold">8. Proteção de dados</h2>
        <p>Qualquer dado pessoal tratado no âmbito do projeto segue o Regulamento Geral de Proteção de Dados (RGPD).</p>
      </section>

      <section>
        <h2 className="font-bold">9. Rescisão</h2>
        <p>Qualquer das partes pode rescindir mediante aviso prévio por escrito, mantendo-se devido o valor proporcional ao trabalho já realizado.</p>
      </section>

      <section>
        <h2 className="font-bold">10. Lei aplicável e foro</h2>
        <p>Aplica-se a lei portuguesa; para qualquer litígio é competente o foro da comarca [a definir].</p>
      </section>

      <footer className="mt-4 grid gap-10 border-t border-border pt-6">
        <p>Feito em dois exemplares, {formatDate(new Date().toISOString().slice(0, 10))}.</p>
        <div className="grid grid-cols-2 gap-8 text-center">
          <div className="border-t border-foreground/40 pt-2">Assinatura do Prestador</div>
          <div className="border-t border-foreground/40 pt-2">Assinatura do Cliente</div>
        </div>
      </footer>
    </article>
  )
}
