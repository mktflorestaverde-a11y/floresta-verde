import * as XLSX from 'xlsx';
import { Customer, Order, OrderStatus, BoletoTermStatus, CustomerSegment } from '../types/crm';
import { formatISODate } from './crmCalculations';
import { normalizeText, normalizePhone } from './excelImporter';

export interface OrderColumnMapping {
  customerCol: string;
  dateCol: string;
  totalCol: string;
  itemsCol: string;
  statusCol: string;
  paymentMethodCol: string;
  orderNumberCol: string;
  dueDateCol: string;
}

export interface ParsedOrderRow {
  rowIndex: number;
  raw: Record<string, any>;
  customerIdentifier: string;
  matchedCustomer?: Customer;
  isNewCustomerNeeded: boolean;
  orderId: string;
  orderDate: string; // YYYY-MM-DD
  totalAmount: number;
  itemsSummary: string;
  status: OrderStatus;
  paymentMethod: string;
  isTermPayment: boolean;
  termDays?: number;
  termDueDate?: string;
  termStatus?: BoletoTermStatus;
  customerSegment: CustomerSegment;
  isValid: boolean;
  validationError?: string;
}

export interface OrdersImportPreviewResult {
  fileName: string;
  totalRows: number;
  validRows: number;
  totalValueSum: number;
  matchedCustomersCount: number;
  newCustomersCount: number;
  availableColumns: string[];
  detectedMapping: OrderColumnMapping;
  rows: ParsedOrderRow[];
}

/**
 * Converte datas do Excel (números seriais, DD/MM/AAAA, AAAA-MM-DD, etc.) para 'YYYY-MM-DD'
 */
export function parseExcelDate(val: any): string {
  if (!val) return formatISODate(new Date());

  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return formatISODate(val);
    }
  }

  // Serial numérico do Excel (ex: 45321)
  if (typeof val === 'number') {
    // Offset padrão do Excel a partir de 30/12/1899
    const utcDays = Math.floor(val - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return formatISODate(date);
    }
  }

  const str = String(val).trim();

  // Serial em string pura de 5 dígitos (ex: "45321")
  if (/^\d{5}$/.test(str)) {
    const num = parseInt(str, 10);
    const utcDays = Math.floor(num - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return formatISODate(date);
    }
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  // DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const brMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    let year = brMatch[3];
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return formatISODate(parsed);
  }

  return formatISODate(new Date());
}

/**
 * Converte valores monetários brasileiros (R$ 1.450,50, 1450.50, 1450,50) para float
 */
export function parseBRLValue(rawVal: any): number {
  if (rawVal === null || rawVal === undefined) return 0;
  if (typeof rawVal === 'number') {
    return isNaN(rawVal) ? 0 : Math.round(rawVal * 100) / 100;
  }

  let str = String(rawVal).trim();
  if (!str) return 0;

  // Remove moeda e espaços
  str = str.replace(/[R$\s]/gi, '');

  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // 1.450,50 -> 1450.50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,450.50 -> 1450.50
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Normaliza o status do pedido
 */
export function parseOrderStatus(rawVal: any): OrderStatus {
  if (!rawVal) return 'pago';
  const norm = normalizeText(String(rawVal));

  if (norm.includes('canc') || norm.includes('estorn') || norm.includes('devolv')) {
    return 'cancelado';
  }
  if (norm.includes('pend') || norm.includes('abert') || norm.includes('aguard') || norm.includes('venc')) {
    return 'pendente';
  }
  return 'pago';
}

/**
 * Extrai detalhes de pagamento e boleto
 */
export function parsePaymentDetails(
  rawMethod: any,
  rawDueDate: any,
  orderDate: string,
  status: OrderStatus
): {
  isTermPayment: boolean;
  paymentMethod: string;
  termDays?: number;
  termDueDate?: string;
  termStatus?: BoletoTermStatus;
} {
  const normMethod = normalizeText(String(rawMethod || ''));
  const isBoleto =
    normMethod.includes('boleto') ||
    normMethod.includes('prazo') ||
    normMethod.includes('fatur') ||
    normMethod.includes('duplicata');

  let termDays: number | undefined = undefined;
  let termDueDate: string | undefined = undefined;
  let termStatus: BoletoTermStatus | undefined = undefined;

  if (rawDueDate) {
    termDueDate = parseExcelDate(rawDueDate);
  }

  if (isBoleto) {
    if (normMethod.includes('14')) termDays = 14;
    else if (normMethod.includes('21')) termDays = 21;
    else if (normMethod.includes('28')) termDays = 28;
    else if (normMethod.includes('30')) termDays = 30;
    else if (normMethod.includes('45')) termDays = 45;
    else if (normMethod.includes('60')) termDays = 60;
    else termDays = 28;

    if (!termDueDate && orderDate && termDays) {
      const dt = new Date(orderDate + 'T12:00:00');
      dt.setDate(dt.getDate() + termDays);
      termDueDate = formatISODate(dt);
    }

    if (status === 'pago') {
      termStatus = 'pago';
    } else if (termDueDate) {
      const today = formatISODate(new Date());
      if (termDueDate < today) {
        termStatus = 'vencido';
      } else if (termDueDate === today) {
        termStatus = 'vence_hoje';
      } else {
        termStatus = 'em_dia';
      }
    } else {
      termStatus = 'em_dia';
    }
  }

  const paymentMethod = rawMethod
    ? String(rawMethod).trim()
    : isBoleto
    ? `Boleto Faturado (${termDays || 28} dias)`
    : 'Boleto / Pix';

  return {
    isTermPayment: isBoleto,
    paymentMethod,
    termDays,
    termDueDate,
    termStatus,
  };
}

/**
 * Detecta automaticamente o mapeamento de colunas de pedidos da planilha
 */
export function detectOrderColumnMapping(headers: string[]): OrderColumnMapping {
  const mapping: OrderColumnMapping = {
    customerCol: '',
    dateCol: '',
    totalCol: '',
    itemsCol: '',
    statusCol: '',
    paymentMethodCol: '',
    orderNumberCol: '',
    dueDateCol: '',
  };

  for (const h of headers) {
    const norm = normalizeText(h);

    // Cliente / Destinatário / Razão / Fantasia
    if (!mapping.customerCol && (norm.includes('cliente') || norm.includes('comprador') || norm.includes('empresa') || norm.includes('razao') || norm.includes('fantasia') || norm === 'nome')) {
      mapping.customerCol = h;
      continue;
    }

    // Data da venda / Data do Pedido
    if (!mapping.dateCol && (norm.includes('data') || norm.includes('emissao') || norm.includes('dia') || norm === 'dt')) {
      mapping.dateCol = h;
      continue;
    }

    // Valor Total / Total
    if (!mapping.totalCol && (norm.includes('total') || norm.includes('valor') || norm.includes('preco') || norm.includes('subtotal') || norm.includes('faturado'))) {
      mapping.totalCol = h;
      continue;
    }

    // Produtos / Itens / Descrição
    if (!mapping.itemsCol && (norm.includes('produto') || norm.includes('item') || norm.includes('itens') || norm.includes('descricao') || norm.includes('mercadoria') || norm.includes('resumo'))) {
      mapping.itemsCol = h;
      continue;
    }

    // Status / Situação
    if (!mapping.statusCol && (norm.includes('status') || norm.includes('situacao') || norm.includes('estado') || norm.includes('fase'))) {
      mapping.statusCol = h;
      continue;
    }

    // Forma de Pagamento
    if (!mapping.paymentMethodCol && (norm.includes('pagamento') || norm.includes('forma') || norm.includes('meio') || norm.includes('condicao'))) {
      mapping.paymentMethodCol = h;
      continue;
    }

    // Vencimento do Boleto / Prazo
    if (!mapping.dueDateCol && (norm.includes('vencimento') || norm.includes('prazo') || norm.includes('venc'))) {
      mapping.dueDateCol = h;
      continue;
    }

    // Número do Pedido / Código
    if (!mapping.orderNumberCol && (norm.includes('pedido') || norm.includes('numero') || norm.includes('codigo') || norm.includes('id') || norm === 'num')) {
      mapping.orderNumberCol = h;
      continue;
    }
  }

  // Fallback inteligente caso títulos não tenham coincidido
  if (!mapping.customerCol && headers.length > 0) mapping.customerCol = headers[0];
  if (!mapping.dateCol && headers.length > 1) mapping.dateCol = headers[1];
  if (!mapping.totalCol && headers.length > 2) mapping.totalCol = headers[2];
  if (!mapping.itemsCol && headers.length > 3) mapping.itemsCol = headers[3];

  return mapping;
}

/**
 * Processa as linhas cruas da planilha mapeando pedidos para clientes do CRM
 */
export function processOrdersExcelData(
  fileName: string,
  headers: string[],
  rawRows: Record<string, any>[],
  mapping: OrderColumnMapping,
  existingCustomers: Customer[]
): OrdersImportPreviewResult {
  const rows: ParsedOrderRow[] = [];

  // Mapeamentos rápidos de clientes existentes para correspondência precisa
  const customerByCleanDoc = new Map<string, Customer>();
  const customerByEmail = new Map<string, Customer>();
  const customerByPhone = new Map<string, Customer>();
  const customerByTradeName = new Map<string, Customer>();
  const customerByName = new Map<string, Customer>();

  for (const c of existingCustomers) {
    if (c.document) {
      const cleanDoc = c.document.replace(/\D/g, '');
      if (cleanDoc) customerByCleanDoc.set(cleanDoc, c);
    }
    if (c.email) customerByEmail.set(normalizeText(c.email), c);
    const pDigits = (c.phone || c.whatsapp || '').replace(/\D/g, '');
    if (pDigits.length >= 8) customerByPhone.set(pDigits, c);
    if (c.tradeName) customerByTradeName.set(normalizeText(c.tradeName), c);
    if (c.name) customerByName.set(normalizeText(c.name), c);
  }

  let matchedCustomersCount = 0;
  let newCustomersCount = 0;
  let totalValueSum = 0;

  rawRows.forEach((row, idx) => {
    const rawCustomer = String(row[mapping.customerCol] || '').trim();
    const rawDate = row[mapping.dateCol];
    const rawTotal = row[mapping.totalCol];
    const rawItems = row[mapping.itemsCol];
    const rawStatus = row[mapping.statusCol];
    const rawPayment = row[mapping.paymentMethodCol];
    const rawDueDate = row[mapping.dueDateCol];
    const rawOrderNum = row[mapping.orderNumberCol];

    // Ignora linhas totalmente vazias
    if (!rawCustomer && !rawDate && !rawTotal && !rawItems) {
      return;
    }

    const customerIdentifier = rawCustomer || 'Cliente Sem Identificação';
    const normIdentifier = normalizeText(customerIdentifier);
    const idDigits = customerIdentifier.replace(/\D/g, '');

    // Busca do cliente
    let matched: Customer | undefined;

    // 1. Por documento (CNPJ/CPF se contiver dígitos)
    if (idDigits.length >= 11 && customerByCleanDoc.has(idDigits)) {
      matched = customerByCleanDoc.get(idDigits);
    }
    // 2. Por email se parecer com email
    else if (normIdentifier.includes('@') && customerByEmail.has(normIdentifier)) {
      matched = customerByEmail.get(normIdentifier);
    }
    // 3. Por telefone
    else if (idDigits.length >= 8 && customerByPhone.has(idDigits)) {
      matched = customerByPhone.get(idDigits);
    }
    // 4. Por Nome Fantasia exato
    else if (customerByTradeName.has(normIdentifier)) {
      matched = customerByTradeName.get(normIdentifier);
    }
    // 5. Por Razão Social / Nome exato
    else if (customerByName.has(normIdentifier)) {
      matched = customerByName.get(normIdentifier);
    }
    // 6. Por aproximação (contém substring no nome fantasia ou razão social)
    else {
      matched = existingCustomers.find((c) => {
        const cTrade = normalizeText(c.tradeName);
        const cName = normalizeText(c.name);
        return (
          (cTrade && normIdentifier.includes(cTrade)) ||
          (cTrade && cTrade.includes(normIdentifier)) ||
          (cName && normIdentifier.includes(cName)) ||
          (cName && cName.includes(normIdentifier))
        );
      });
    }

    const isNewCustomerNeeded = !matched;
    if (matched) {
      matchedCustomersCount++;
    } else {
      newCustomersCount++;
    }

    const totalAmount = parseBRLValue(rawTotal);
    totalValueSum += totalAmount;

    const orderDate = parseExcelDate(rawDate);
    const status = parseOrderStatus(rawStatus);
    const paymentDetails = parsePaymentDetails(rawPayment, rawDueDate, orderDate, status);

    const itemsSummary = rawItems
      ? String(rawItems).trim()
      : 'Linha de Difusores & Aromatizantes Floresta Verde';

    const orderId = rawOrderNum
      ? String(rawOrderNum).trim()
      : `PED-${orderDate.replace(/-/g, '')}-${idx + 1}`;

    const customerSegment: CustomerSegment = matched?.segment || 'b2b';

    const isValid = Boolean(customerIdentifier && totalAmount > 0);
    const validationError = !isValid
      ? !customerIdentifier
        ? 'Identificação do cliente não informada'
        : 'Valor total do pedido inválido ou zerado'
      : undefined;

    rows.push({
      rowIndex: idx + 2,
      raw: row,
      customerIdentifier,
      matchedCustomer: matched,
      isNewCustomerNeeded,
      orderId,
      orderDate,
      totalAmount,
      itemsSummary,
      status,
      paymentMethod: paymentDetails.paymentMethod,
      isTermPayment: paymentDetails.isTermPayment,
      termDays: paymentDetails.termDays,
      termDueDate: paymentDetails.termDueDate,
      termStatus: paymentDetails.termStatus,
      customerSegment,
      isValid,
      validationError,
    });
  });

  return {
    fileName,
    totalRows: rows.length,
    validRows: rows.filter((r) => r.isValid).length,
    totalValueSum,
    matchedCustomersCount,
    newCustomersCount,
    availableColumns: headers,
    detectedMapping: mapping,
    rows,
  };
}

/**
 * Constrói os pedidos estruturados e os novos clientes para inserir no CRM
 */
export function buildOrdersAndCustomersFromImport(
  parsedRows: ParsedOrderRow[],
  targetSegment: CustomerSegment = 'b2b'
): { ordersToInsert: Order[]; newCustomersToInsert: Customer[] } {
  const ordersToInsert: Order[] = [];
  const createdCustomersMap = new Map<string, Customer>();

  parsedRows.forEach((r, idx) => {
    if (!r.isValid) return;

    let customerId: string;
    let customerName: string;
    let customerSegment: CustomerSegment;

    if (r.matchedCustomer) {
      customerId = r.matchedCustomer.id;
      customerName = r.matchedCustomer.tradeName || r.matchedCustomer.name;
      customerSegment = r.matchedCustomer.segment;
    } else {
      // Verifica se já criamos um cliente com esse mesmo identificador nesta mesma importação
      const normKey = normalizeText(r.customerIdentifier);
      if (createdCustomersMap.has(normKey)) {
        const created = createdCustomersMap.get(normKey)!;
        customerId = created.id;
        customerName = created.tradeName || created.name;
        customerSegment = created.segment;
      } else {
        const newCustId = `cust-imp-${Date.now()}-${idx}`;
        const newCust: Customer = {
          id: newCustId,
          name: r.customerIdentifier,
          tradeName: r.customerIdentifier,
          segment: targetSegment,
          email: '',
          phone: '',
          whatsapp: '',
          channelOrigin: 'Planilha Excel (Histórico de Pedidos)',
          funnelStage: 'primeira_compra',
          assignedTo: 'Equipe Comercial',
          createdAt: r.orderDate,
          notes: `Cadastrado automaticamente ao importar histórico de pedidos via Excel em ${new Date().toLocaleDateString('pt-BR')}.`,
        };
        createdCustomersMap.set(normKey, newCust);
        customerId = newCustId;
        customerName = newCust.tradeName || newCust.name;
        customerSegment = targetSegment;
      }
    }

    const order: Order = {
      id: r.orderId.startsWith('PED-') || r.orderId.startsWith('ord-') ? r.orderId : `ord-${r.orderId}`,
      customerId,
      customerName,
      customerSegment,
      date: r.orderDate,
      totalAmount: r.totalAmount,
      status: r.status,
      itemsSummary: r.itemsSummary,
      paymentMethod: r.paymentMethod,
      isTermPayment: r.isTermPayment,
      termDays: r.termDays,
      termDueDate: r.termDueDate,
      termStatus: r.termStatus,
      notes: `Importado via planilha Excel (${r.orderId})`,
    };

    ordersToInsert.push(order);
  });

  return {
    ordersToInsert,
    newCustomersToInsert: Array.from(createdCustomersMap.values()),
  };
}

/**
 * Gera e baixa uma planilha modelo do Excel (.xlsx) com o formato recomendado para pedidos
 */
export function downloadSampleOrdersTemplate(): void {
  const sampleData = [
    {
      'Cliente': 'Aromas & Bem Estar Ltda',
      'Data do Pedido': '2026-02-15',
      'Valor Total': 2850.00,
      'Produtos / Itens': '24x Difusor Alecrim Silvestre 250ml + 12x Home Spray Capim Limão',
      'Status': 'Pago',
      'Forma de Pagamento': 'Boleto Faturado 28 dias',
      'Vencimento Boleto': '2026-03-15',
      'Número do Pedido': 'PED-1081',
    },
    {
      'Cliente': 'Boutique Essência da Mata ME',
      'Data do Pedido': '2026-02-28',
      'Valor Total': 1420.50,
      'Produtos / Itens': '18x Velas Aromáticas Lavanda Francesa + 6x Óleos Essenciais Puros',
      'Status': 'Pago',
      'Forma de Pagamento': 'Pix à Vista',
      'Vencimento Boleto': '',
      'Número do Pedido': 'PED-1082',
    },
    {
      'Cliente': 'Distribuidora Serra Verde Eireli',
      'Data do Pedido': '2026-03-10',
      'Valor Total': 4590.00,
      'Produtos / Itens': '48x Difusor Lavanda do Campo + 24x Sabonete Líquido Floresta',
      'Status': 'Pago',
      'Forma de Pagamento': 'Boleto Faturado 30 dias',
      'Vencimento Boleto': '2026-04-09',
      'Número do Pedido': 'PED-1083',
    },
    {
      'Cliente': 'Casa & Jardim Decorações Ltda',
      'Data do Pedido': '2026-03-25',
      'Valor Total': 890.00,
      'Produtos / Itens': '12x Home Spray Bambu Imperial',
      'Status': 'Pendente',
      'Forma de Pagamento': 'Boleto Faturado 28 dias',
      'Vencimento Boleto': '2026-04-22',
      'Número do Pedido': 'PED-1084',
    },
    {
      'Cliente': 'Hotel & Spa Reserva da Colina',
      'Data do Pedido': '2026-04-05',
      'Valor Total': 3240.00,
      'Produtos / Itens': 'Kit Amenities Hotelaria Premium (50 frascos 60ml + 30 Difusores)',
      'Status': 'Pago',
      'Forma de Pagamento': 'Transferência Bancária',
      'Vencimento Boleto': '',
      'Número do Pedido': 'PED-1085',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 32 }, // Cliente
    { wch: 16 }, // Data do Pedido
    { wch: 14 }, // Valor Total
    { wch: 45 }, // Produtos / Itens
    { wch: 12 }, // Status
    { wch: 28 }, // Forma de Pagamento
    { wch: 18 }, // Vencimento Boleto
    { wch: 18 }, // Número do Pedido
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico de Pedidos');

  XLSX.writeFile(workbook, 'modelo_importacao_pedidos_floresta_verde.xlsx');
}
