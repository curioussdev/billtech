import { MOCK_NOW } from '@/data/mock/projects'
import type { ClientLoyalty, DiscountCode, Installment, Invoice, Payment } from '@/types/finance'

/**
 * DADOS DE DEMONSTRAÇÃO — 5 clientes, 15 faturas, 3 códigos de desconto, como pedido. Os 5 clientes
 * são os mesmos 5 leads já marcados como "ganho" em `mock/leads.ts` (Oficina Rápida Norte, Centro
 * Médico Aurora, Loja Ponto Verde, Padaria Real, Imobiliária Costa Verde) — a mesma história contada
 * de ponta a ponta: primeiro leads, depois negócio fechado, agora faturação. Substituir por perfis e
 * faturas reais assim que houver clientes a pagar a sério.
 *
 * IDs de cliente aqui são apenas texto (não UUIDs de `profiles`) — este ficheiro só alimenta o
 * caminho de mock (sem base de dados, ou tabela `invoices` ainda vazia). `getInvoices()` (Fase 2/3)
 * segue o mesmo padrão de `listLeads`/`listGoals`: lê a tabela real quando houver dados, senão mostra
 * isto.
 */

const DAY_MS = 86_400_000
const ago = (days: number) => new Date(new Date(MOCK_NOW).getTime() - days * DAY_MS).toISOString().slice(0, 10)
const ahead = (days: number) => new Date(new Date(MOCK_NOW).getTime() + days * DAY_MS).toISOString().slice(0, 10)

export type MockFinanceClient = { id: string; name: string; email: string; company: string }

export const mockFinanceClients: MockFinanceClient[] = [
  { id: 'fc-oficina-rapida-norte', name: 'Joana Freitas', email: 'joana@oficinarapidanorte.pt', company: 'Oficina Rápida Norte' },
  { id: 'fc-centro-medico-aurora', name: 'Carlos Pinto', email: 'carlos@centromedicoaurora.pt', company: 'Centro Médico Aurora' },
  { id: 'fc-loja-ponto-verde', name: 'Pedro Nunes', email: 'pedro@lojapontoverde.pt', company: 'Loja Ponto Verde' },
  { id: 'fc-padaria-real', name: 'Helena Costa', email: 'helena@padariareal.pt', company: 'Padaria Real' },
  { id: 'fc-imobiliaria-costa-verde', name: 'Miguel Santos', email: 'miguel@imobiliariacostaverde.pt', company: 'Imobiliária Costa Verde' },
]

export const mockLoyalty: ClientLoyalty[] = [
  { clientId: 'fc-oficina-rapida-norte', loyaltyPoints: 320, loyaltyTier: 'silver', totalSpent: 2600, updatedAt: MOCK_NOW },
  { clientId: 'fc-centro-medico-aurora', loyaltyPoints: 1450, loyaltyTier: 'gold', totalSpent: 12500, updatedAt: MOCK_NOW },
  { clientId: 'fc-loja-ponto-verde', loyaltyPoints: 80, loyaltyTier: 'bronze', totalSpent: 0, updatedAt: MOCK_NOW },
  { clientId: 'fc-padaria-real', loyaltyPoints: 2600, loyaltyTier: 'platinum', totalSpent: 23000, updatedAt: MOCK_NOW },
  { clientId: 'fc-imobiliaria-costa-verde', loyaltyPoints: 450, loyaltyTier: 'silver', totalSpent: 1500, updatedAt: MOCK_NOW },
]

export const mockDiscountCodes: DiscountCode[] = [
  { id: 'disc-fidelidade10', code: 'FIDELIDADE10', percentage: 10, fixedAmount: null, isActive: true, usageLimit: null, usedCount: 4, createdAt: ago(120) },
  { id: 'disc-bemvindo50', code: 'BEMVINDO50', percentage: null, fixedAmount: 50, isActive: true, usageLimit: 100, usedCount: 12, createdAt: ago(200) },
  { id: 'disc-promo2025', code: 'PROMO2025', percentage: 15, fixedAmount: null, isActive: false, usageLimit: 50, usedCount: 50, createdAt: ago(365) },
]

type InvoiceSeed = {
  invoice: Invoice
  installments?: Installment[]
  payments?: Payment[]
}

const seeds: InvoiceSeed[] = [
  // ─── Oficina Rápida Norte ───────────────────────────────────────────────
  {
    invoice: { id: 'inv-01', clientId: 'fc-oficina-rapida-norte', projectId: null, description: 'Website institucional — Oficina Rápida Norte', totalAmount: 2200, discountAmount: 0, discountCodeId: null, finalAmount: 2200, status: 'pago', dueDate: ago(40), paymentType: 'unico', createdAt: ago(55), updatedAt: ago(38) },
    payments: [{ id: 'pay-01', invoiceId: 'inv-01', installmentId: null, amount: 2200, status: 'sucesso', stripePaymentIntentId: null, stripeCheckoutSessionId: null, paymentMethod: 'transferencia', paidAt: ago(38), createdAt: ago(38) }],
  },
  {
    invoice: { id: 'inv-02', clientId: 'fc-oficina-rapida-norte', projectId: null, description: 'Manutenção mensal — setembro', totalAmount: 1200, discountAmount: 0, discountCodeId: null, finalAmount: 1200, status: 'atrasado', dueDate: ago(10), paymentType: 'unico', createdAt: ago(25), updatedAt: ago(25) },
  },
  {
    invoice: { id: 'inv-03', clientId: 'fc-oficina-rapida-norte', projectId: null, description: 'Integração de agendamento online', totalAmount: 1200, discountAmount: 0, discountCodeId: null, finalAmount: 1200, status: 'pendente', dueDate: ahead(20), paymentType: 'parcelado', createdAt: ago(5), updatedAt: ago(5) },
    installments: [
      { id: 'ins-03-1', invoiceId: 'inv-03', installmentNumber: 1, amount: 400, dueDate: ago(2), status: 'pago', stripePaymentIntentId: null, createdAt: ago(5) },
      { id: 'ins-03-2', invoiceId: 'inv-03', installmentNumber: 2, amount: 400, dueDate: ahead(10), status: 'pendente', stripePaymentIntentId: null, createdAt: ago(5) },
      { id: 'ins-03-3', invoiceId: 'inv-03', installmentNumber: 3, amount: 400, dueDate: ahead(40), status: 'pendente', stripePaymentIntentId: null, createdAt: ago(5) },
    ],
    payments: [{ id: 'pay-03', invoiceId: 'inv-03', installmentId: 'ins-03-1', amount: 400, status: 'sucesso', stripePaymentIntentId: null, stripeCheckoutSessionId: null, paymentMethod: 'mbway', paidAt: ago(2), createdAt: ago(2) }],
  },

  // ─── Centro Médico Aurora ───────────────────────────────────────────────
  {
    invoice: { id: 'inv-04', clientId: 'fc-centro-medico-aurora', projectId: null, description: 'Dashboard financeiro e de agendamentos', totalAmount: 6000, discountAmount: 0, discountCodeId: null, finalAmount: 6000, status: 'pago', dueDate: ago(90), paymentType: 'unico', createdAt: ago(110), updatedAt: ago(88) },
    payments: [{ id: 'pay-04', invoiceId: 'inv-04', installmentId: null, amount: 6000, status: 'sucesso', stripePaymentIntentId: null, stripeCheckoutSessionId: null, paymentMethod: 'transferencia', paidAt: ago(88), createdAt: ago(88) }],
  },
  {
    invoice: { id: 'inv-05', clientId: 'fc-centro-medico-aurora', projectId: null, description: 'Módulo de faturação eletrónica', totalAmount: 4500, discountAmount: 450, discountCodeId: 'disc-fidelidade10', finalAmount: 4050, status: 'pago', dueDate: ago(30), paymentType: 'unico', createdAt: ago(45), updatedAt: ago(28) },
    payments: [{ id: 'pay-05', invoiceId: 'inv-05', installmentId: null, amount: 4050, status: 'sucesso', stripePaymentIntentId: null, stripeCheckoutSessionId: null, paymentMethod: 'cartao', paidAt: ago(28), createdAt: ago(28) }],
  },
  {
    invoice: { id: 'inv-06', clientId: 'fc-centro-medico-aurora', projectId: null, description: 'Relatórios automáticos por email', totalAmount: 3000, discountAmount: 0, discountCodeId: null, finalAmount: 3000, status: 'pendente', dueDate: ahead(15), paymentType: 'parcelado', createdAt: ago(10), updatedAt: ago(10) },
    installments: [
      { id: 'ins-06-1', invoiceId: 'inv-06', installmentNumber: 1, amount: 1000, dueDate: ago(5), status: 'pago', stripePaymentIntentId: null, createdAt: ago(10) },
      { id: 'ins-06-2', invoiceId: 'inv-06', installmentNumber: 2, amount: 1000, dueDate: ago(1), status: 'pago', stripePaymentIntentId: null, createdAt: ago(10) },
      { id: 'ins-06-3', invoiceId: 'inv-06', installmentNumber: 3, amount: 1000, dueDate: ahead(29), status: 'pendente', stripePaymentIntentId: null, createdAt: ago(10) },
    ],
    payments: [
      { id: 'pay-06-1', invoiceId: 'inv-06', installmentId: 'ins-06-1', amount: 1000, status: 'sucesso', stripePaymentIntentId: null, stripeCheckoutSessionId: null, paymentMethod: 'cartao', paidAt: ago(5), createdAt: ago(5) },
      { id: 'pay-06-2', invoiceId: 'inv-06', installmentId: 'ins-06-2', amount: 1000, status: 'sucesso', stripePaymentIntentId: null, stripeCheckoutSessionId: null, paymentMethod: 'cartao', paidAt: ago(1), createdAt: ago(1) },
    ],
  },

  // ─── Loja Ponto Verde ───────────────────────────────────────────────────
  {
    invoice: { id: 'inv-07', clientId: 'fc-loja-ponto-verde', projectId: null, description: 'Loja online — configuração inicial', totalAmount: 1800, discountAmount: 0, discountCodeId: null, finalAmount: 1800, status: 'pendente', dueDate: ahead(5), paymentType: 'unico', createdAt: ago(3), updatedAt: ago(3) },
  },
  {
    invoice: { id: 'inv-08', clientId: 'fc-loja-ponto-verde', projectId: null, description: 'Integração com meio de pagamento adicional', totalAmount: 900, discountAmount: 0, discountCodeId: null, finalAmount: 900, status: 'cancelado', dueDate: ago(20), paymentType: 'unico', createdAt: ago(35), updatedAt: ago(15) },
  },
  {
    invoice: { id: 'inv-09', clientId: 'fc-loja-ponto-verde', projectId: null, description: 'Catálogo de produtos — 2ª fase', totalAmount: 2400, discountAmount: 0, discountCodeId: null, finalAmount: 2400, status: 'pendente', dueDate: ahead(30), paymentType: 'parcelado', createdAt: ago(2), updatedAt: ago(2) },
    installments: [
      { id: 'ins-09-1', invoiceId: 'inv-09', installmentNumber: 1, amount: 1200, dueDate: ahead(3), status: 'pendente', stripePaymentIntentId: null, createdAt: ago(2) },
      { id: 'ins-09-2', invoiceId: 'inv-09', installmentNumber: 2, amount: 1200, dueDate: ahead(33), status: 'pendente', stripePaymentIntentId: null, createdAt: ago(2) },
    ],
  },

  // ─── Padaria Real (cliente mais fiel — nível platinum) ─────────────────
  {
    invoice: { id: 'inv-10', clientId: 'fc-padaria-real', projectId: null, description: 'App de encomendas — desenvolvimento completo', totalAmount: 9000, discountAmount: 0, discountCodeId: null, finalAmount: 9000, status: 'pago', dueDate: ago(200), paymentType: 'unico', createdAt: ago(220), updatedAt: ago(198) },
    payments: [{ id: 'pay-10', invoiceId: 'inv-10', installmentId: null, amount: 9000, status: 'sucesso', stripePaymentIntentId: null, stripeCheckoutSessionId: null, paymentMethod: 'transferencia', paidAt: ago(198), createdAt: ago(198) }],
  },
  {
    invoice: { id: 'inv-11', clientId: 'fc-padaria-real', projectId: null, description: 'Programa de fidelização de clientes', totalAmount: 7500, discountAmount: 750, discountCodeId: 'disc-fidelidade10', finalAmount: 6750, status: 'pago', dueDate: ago(100), paymentType: 'unico', createdAt: ago(120), updatedAt: ago(97) },
    payments: [{ id: 'pay-11', invoiceId: 'inv-11', installmentId: null, amount: 6750, status: 'sucesso', stripePaymentIntentId: null, stripeCheckoutSessionId: null, paymentMethod: 'cartao', paidAt: ago(97), createdAt: ago(97) }],
  },
  {
    invoice: { id: 'inv-12', clientId: 'fc-padaria-real', projectId: null, description: 'Manutenção anual — renovação', totalAmount: 6500, discountAmount: 0, discountCodeId: null, finalAmount: 6500, status: 'pago', dueDate: ago(20), paymentType: 'unico', createdAt: ago(35), updatedAt: ago(18) },
    payments: [{ id: 'pay-12', invoiceId: 'inv-12', installmentId: null, amount: 6500, status: 'sucesso', stripePaymentIntentId: null, stripeCheckoutSessionId: null, paymentMethod: 'transferencia', paidAt: ago(18), createdAt: ago(18) }],
  },

  // ─── Imobiliária Costa Verde ────────────────────────────────────────────
  {
    invoice: { id: 'inv-13', clientId: 'fc-imobiliaria-costa-verde', projectId: null, description: 'CRM de imóveis — licença anual', totalAmount: 4200, discountAmount: 0, discountCodeId: null, finalAmount: 4200, status: 'atrasado', dueDate: ago(15), paymentType: 'unico', createdAt: ago(30), updatedAt: ago(30) },
  },
  {
    invoice: { id: 'inv-14', clientId: 'fc-imobiliaria-costa-verde', projectId: null, description: 'Portal de propostas para clientes e proprietários', totalAmount: 4500, discountAmount: 0, discountCodeId: null, finalAmount: 4500, status: 'atrasado', dueDate: ago(5), paymentType: 'parcelado', createdAt: ago(60), updatedAt: ago(4) },
    installments: [
      { id: 'ins-14-1', invoiceId: 'inv-14', installmentNumber: 1, amount: 1500, dueDate: ago(35), status: 'pago', stripePaymentIntentId: null, createdAt: ago(60) },
      { id: 'ins-14-2', invoiceId: 'inv-14', installmentNumber: 2, amount: 1500, dueDate: ago(5), status: 'atrasado', stripePaymentIntentId: null, createdAt: ago(60) },
      { id: 'ins-14-3', invoiceId: 'inv-14', installmentNumber: 3, amount: 1500, dueDate: ahead(25), status: 'pendente', stripePaymentIntentId: null, createdAt: ago(60) },
    ],
    payments: [{ id: 'pay-14-1', invoiceId: 'inv-14', installmentId: 'ins-14-1', amount: 1500, status: 'sucesso', stripePaymentIntentId: null, stripeCheckoutSessionId: null, paymentMethod: 'cartao', paidAt: ago(35), createdAt: ago(35) }],
  },
  {
    invoice: { id: 'inv-15', clientId: 'fc-imobiliaria-costa-verde', projectId: null, description: 'Automação de email e WhatsApp — extensão', totalAmount: 800, discountAmount: 0, discountCodeId: null, finalAmount: 800, status: 'pendente', dueDate: ahead(12), paymentType: 'unico', createdAt: ago(1), updatedAt: ago(1) },
  },
]

export const mockInvoices: Invoice[] = seeds.map((s) => s.invoice)
export const mockInstallments: Installment[] = seeds.flatMap((s) => s.installments ?? [])
export const mockPayments: Payment[] = seeds.flatMap((s) => s.payments ?? [])
