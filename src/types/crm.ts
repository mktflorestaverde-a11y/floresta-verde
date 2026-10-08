export type CustomerSegment = 'b2b' | 'b2c';

export type B2BFunnelStage = 
  | 'novos_contatos'
  | 'qualificados'
  | 'proposta'
  | 'primeira_compra'
  | 'recompra'
  | 'perdido';

export type B2CFunnelStage = 
  | 'visitantes'
  | 'carrinho'
  | 'primeira_compra'
  | 'recompra';

export type FunnelStage = B2BFunnelStage | B2CFunnelStage;

export type OrderStatus = 'pago' | 'pendente' | 'cancelado';

export type BoletoTermStatus = 'em_dia' | 'vence_hoje' | 'vencido' | 'pago';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerSegment: CustomerSegment;
  date: string; // ISO format 'YYYY-MM-DD'
  totalAmount: number; // in BRL
  status: OrderStatus;
  itemsSummary: string;
  paymentMethod?: string;
  notes?: string;
  // Campos específicos para Vendas a Prazo / Boletos
  isTermPayment?: boolean; // Compra realizada no boleto / faturado
  termDays?: number; // Prazo concedido: 14, 21, 28, 30, 45, 60 dias
  termDueDate?: string; // Data de vencimento do boleto 'YYYY-MM-DD'
  termStatus?: BoletoTermStatus; // Status do boleto
  boletoBarcode?: string; // Número do boleto ou linha digitável
  boletoPaidDate?: string; // Data em que o boleto foi liquidado
}

export interface Customer {
  id: string;
  name: string; // Razão social ou Nome completo
  tradeName?: string; // Nome fantasia
  segment: CustomerSegment;
  email: string;
  phone: string;
  whatsapp?: string;
  document?: string; // CNPJ ou CPF
  contactPerson?: string; // Nome do responsável/comprador
  channelOrigin: string; // ex: 'Indicação', 'E-commerce', 'Feira / Evento', 'Instagram', 'Prospecção ativa'
  funnelStage: FunnelStage;
  assignedTo?: string; // Responsável pelo atendimento
  notes?: string;
  createdAt: string; // ISO format 'YYYY-MM-DD'
  customCycleDays?: number; // Ciclo médio personalizado (opcional)
  creditLimit?: number; // Limite de crédito concedido (R$)
  preferredPaymentTerm?: string; // Prazo preferencial, ex: 'Boleto 28 dias'
}

export type ReactivationStatus = 'em_dia' | 'atencao' | 'em_atraso' | 'sem_compra';

export interface CustomerWithMetrics extends Customer {
  firstOrderDate?: string;
  lastOrderDate?: string;
  paidOrdersCount: number;
  totalSpent: number;
  averageTicket: number;
  timeAsCustomerText: string;
  daysSinceLastOrder: number | null;
  averageIntervalDays: number | null;
  effectiveCycleDays: number;
  reactivationStatus: ReactivationStatus;
  predictedNextOrderDate: string | null;
  overdueDays: number;
}

export interface CycleSettings {
  b2bDefaultCycleDays: number; // ex: 45
  b2cDefaultCycleDays: number; // ex: 30
  warningThresholdPercent: number; // ex: 80%
}

export interface EcommerceMetrics {
  b2cVisitorsCount: number; // Top of funnel for B2C
  b2cCartCount: number;     // Abandoned/active cart for B2C
  lastSyncedAt?: string;
}

export type FilterPeriod = '7d' | '30d' | '90d' | '12m';
export type SegmentFilter = 'all' | 'b2b' | 'b2c';

export interface OverviewMetrics {
  revenue: number;
  revenueChangePercent: number;
  ordersCount: number;
  ordersChangePercent: number;
  repurchaseRate: number; // Percentage, e.g. 34.8
  repurchaseRateChangePP: number; // Percentage points, e.g. +6.1
  averageIntervalDays: number | null;
  averageIntervalChangeDays: number | null; // e.g. -9
}

export interface FunnelStageData {
  id: string;
  name: string;
  count: number;
  percentage: number; // % relative to top of funnel
  colorClass: string;
}

export interface PurchaseRhythmPoint {
  dateKey: string;
  displayDate: string; // e.g. '27 abr'
  b2bCount: number;
  b2cCount: number;
  totalAmount: number;
}

export interface RecencyBreakdown {
  upTo30DaysPercent: number;
  upTo30DaysCount: number;
  between31And60DaysPercent: number;
  between31And60DaysCount: number;
  moreThan60DaysPercent: number;
  moreThan60DaysCount: number;
}

export type TermPurchaseEligibility =
  | 'bloqueado_atraso'
  | 'aguardando_boleto'
  | 'liberado_recompra'
  | 'urgente_recompra';

export interface TermCustomerCalculation {
  customer: Customer;
  termOrders: Order[];
  latestTermOrder: Order | null;
  openOrdersCount: number;
  totalOpenDebt: number; // Valor total em aberto a pagar
  totalHistoricalTerm: number; // Total histórico comprado a prazo
  // Boleto status:
  hasOpenBoleto: boolean;
  hasOverdueBoleto: boolean;
  activeBoletoDueDate: string | null;
  daysUntilBoletoDue: number | null; // Se positivo = faltam X dias. Se negativo = atrasado há X dias.
  boletoStatus: BoletoTermStatus | 'sem_boletos';
  // Prazo de quanto tempo para comprar:
  eligibility: TermPurchaseEligibility;
  daysUntilNextPurchase: number; // Se <= 0, já está no momento ou passou da hora de comprar
  predictedNextPurchaseDate: string | null;
  purchaseStatusText: string;
  recommendedAction: string;
}

export interface TermMetrics {
  totalOpenDebt: number;
  totalHistoricalVolume: number;
  openOrdersCount: number;
  overdueOrdersCount: number;
  overdueDebtAmount: number;
  dueSoonOrdersCount: number; // Vencendo nos próximos 7 dias
  readyForRepurchaseCount: number; // Liberados e no prazo de compra
  averageTermDays: number;
}

export type UserRole = 'master' | 'diretor' | 'comercial' | 'vendedor' | 'financeiro';

export interface CRMUserAccount {
  id: string;
  username: string; // Ex: CESARDIRETOR, MARIANA, LUCAS
  password?: string; // Senha para autenticação
  name: string; // Nome completo do usuário
  role: UserRole;
  roleLabel: string;
  isMaster: boolean; // Apenas o master pode criar/gerenciar acessos
  status: 'ativo' | 'inativo';
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string; // YYYY-MM-DD
  lastLoginAt?: string;
  createdBy?: string;
}
