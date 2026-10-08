import {
  Customer,
  CustomerWithMetrics,
  CycleSettings,
  FilterPeriod,
  FunnelStageData,
  Order,
  OverviewMetrics,
  PurchaseRhythmPoint,
  RecencyBreakdown,
  ReactivationStatus,
  SegmentFilter,
  TermCustomerCalculation,
  TermMetrics,
  BoletoTermStatus,
  TermPurchaseEligibility,
} from '../types/crm';

// Helper for dates
export const parseISODate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = clean.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

export const normalizeDate = (d: Date, endOfDay = false): Date => {
  const norm = new Date(d);
  if (endOfDay) {
    norm.setHours(23, 59, 59, 999);
  } else {
    norm.setHours(0, 0, 0, 0);
  }
  return norm;
};

export const formatISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatBRL = (value: number, includeDecimals = false): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(value);
};

export const formatNumberBR = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const formatPercentBR = (value: number, fractionDigits = 1): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value) + '%';
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const formatShortDateBR = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parts[2];
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${day} ${months[monthIdx] || ''}`;
};

export const diffInDays = (dateA: Date, dateB: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const utcB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  return Math.round(Math.abs(utcA - utcB) / msPerDay);
};

export const getPeriodDays = (period: FilterPeriod): number => {
  switch (period) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '12m': return 365;
  }
};

/**
 * Filter paid orders by date range and optional segment
 */
export const filterPaidOrders = (
  orders: Order[],
  startDate: Date,
  endDate: Date,
  segment?: SegmentFilter
): Order[] => {
  const start = normalizeDate(startDate, false);
  const end = normalizeDate(endDate, true);
  return orders.filter((order) => {
    if (order.status !== 'pago') return false;
    if (segment && segment !== 'all' && order.customerSegment !== segment) return false;
    const orderDate = normalizeDate(parseISODate(order.date), false);
    return orderDate >= start && orderDate <= end;
  });
};

/**
 * Calculate detailed metrics for single customer based on all orders
 */
export const calculateCustomerMetrics = (
  customer: Customer,
  allOrders: Order[],
  settings: CycleSettings,
  referenceDate: Date = new Date()
): CustomerWithMetrics => {
  // Only paid orders are used for purchase metrics
  const paidOrders = allOrders
    .filter((o) => o.customerId === customer.id && o.status === 'pago')
    .sort((a, b) => parseISODate(a.date).getTime() - parseISODate(b.date).getTime());

  const paidOrdersCount = paidOrders.length;
  const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageTicket = paidOrdersCount > 0 ? totalSpent / paidOrdersCount : 0;

  const firstOrderDate = paidOrdersCount > 0 ? paidOrders[0].date : undefined;
  const lastOrderDate = paidOrdersCount > 0 ? paidOrders[paidOrdersCount - 1].date : undefined;

  // Days since last order
  let daysSinceLastOrder: number | null = null;
  if (lastOrderDate) {
    daysSinceLastOrder = diffInDays(referenceDate, parseISODate(lastOrderDate));
  }

  // Average interval between consecutive orders
  let averageIntervalDays: number | null = null;
  if (paidOrdersCount >= 2) {
    let totalInterval = 0;
    for (let i = 1; i < paidOrdersCount; i++) {
      const prev = parseISODate(paidOrders[i - 1].date);
      const curr = parseISODate(paidOrders[i].date);
      totalInterval += diffInDays(curr, prev);
    }
    averageIntervalDays = Math.round(totalInterval / (paidOrdersCount - 1));
  }

  // Effective cycle for reactivation comparison
  const defaultCycle = customer.segment === 'b2b' 
    ? settings.b2bDefaultCycleDays 
    : settings.b2cDefaultCycleDays;
  
  const effectiveCycleDays = customer.customCycleDays || averageIntervalDays || defaultCycle;

  // Reactivation Status
  let reactivationStatus: ReactivationStatus = 'sem_compra';
  let overdueDays = 0;
  let predictedNextOrderDate: string | null = null;

  if (lastOrderDate && daysSinceLastOrder !== null) {
    // Predicted next order: last order + effectiveCycleDays
    const lastDate = parseISODate(lastOrderDate);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + effectiveCycleDays);
    predictedNextOrderDate = formatISODate(nextDate);

    const warningLimit = effectiveCycleDays * (settings.warningThresholdPercent / 100);

    if (daysSinceLastOrder > effectiveCycleDays) {
      reactivationStatus = 'em_atraso';
      overdueDays = daysSinceLastOrder - effectiveCycleDays;
    } else if (daysSinceLastOrder >= warningLimit) {
      reactivationStatus = 'atencao';
      overdueDays = 0;
    } else {
      reactivationStatus = 'em_dia';
      overdueDays = 0;
    }
  }

  // Time as customer text (from first order date or created date)
  const originDateStr = firstOrderDate || customer.createdAt;
  const totalDays = diffInDays(referenceDate, parseISODate(originDateStr));
  let timeAsCustomerText = '';
  if (totalDays < 30) {
    timeAsCustomerText = `${totalDays} dias`;
  } else if (totalDays < 365) {
    const months = Math.floor(totalDays / 30);
    timeAsCustomerText = months === 1 ? '1 mês' : `${months} meses`;
  } else {
    const years = (totalDays / 365).toFixed(1).replace('.', ',');
    timeAsCustomerText = `${years} anos`;
  }

  return {
    ...customer,
    firstOrderDate,
    lastOrderDate,
    paidOrdersCount,
    totalSpent,
    averageTicket,
    timeAsCustomerText,
    daysSinceLastOrder,
    averageIntervalDays,
    effectiveCycleDays,
    reactivationStatus,
    predictedNextOrderDate,
    overdueDays,
  };
};

/**
 * Overview primary KPI cards calculation
 */
export const calculateOverviewMetrics = (
  orders: Order[],
  customersWithMetrics: CustomerWithMetrics[],
  period: FilterPeriod,
  segment: SegmentFilter,
  referenceDate: Date = new Date(),
  isDemoMode: boolean = false
): OverviewMetrics => {
  const days = getPeriodDays(period);

  // Current period bounds
  const currentEnd = new Date(referenceDate);
  const currentStart = new Date(referenceDate);
  currentStart.setDate(currentStart.getDate() - days);

  // Previous period bounds (same length immediately prior)
  const prevEnd = new Date(currentStart);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);

  // 1. Revenue & Orders
  const currentOrders = filterPaidOrders(orders, currentStart, currentEnd, segment);
  const prevOrders = filterPaidOrders(orders, prevStart, prevEnd, segment);

  const revenue = currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const prevRevenue = prevOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const revenueChangePercent = prevRevenue > 0
    ? ((revenue - prevRevenue) / prevRevenue) * 100
    : 0;

  const ordersCount = currentOrders.length;
  const prevOrdersCount = prevOrders.length;

  const ordersChangePercent = prevOrdersCount > 0
    ? ((ordersCount - prevOrdersCount) / prevOrdersCount) * 100
    : 0;

  // 2. Repurchase rate (taxa de recompra)
  // Proportion of purchasing customers who have at least a second purchase
  const eligibleCustomers = customersWithMetrics.filter((c) => {
    if (segment !== 'all' && c.segment !== segment) return false;
    return c.paidOrdersCount >= 1;
  });

  const repurchasers = eligibleCustomers.filter((c) => c.paidOrdersCount >= 2);
  const repurchaseRate = eligibleCustomers.length > 0
    ? (repurchasers.length / eligibleCustomers.length) * 100
    : 0;

  // Baseline previous rate comparison
  let repurchaseRateChangePP = 0;
  if (isDemoMode) {
    const prevRepurchaseRate = repurchaseRate > 6 ? repurchaseRate - 6.1 : repurchaseRate;
    repurchaseRateChangePP = repurchaseRate - prevRepurchaseRate;
  } else {
    // In real mode: Calculate real previous period repurchase rate
    const prevOrderCustomerIds = new Set(prevOrders.map((o) => o.customerId));
    const prevEligible = eligibleCustomers.filter((c) => prevOrderCustomerIds.has(c.id));
    if (prevEligible.length > 0) {
      const prevRepurchasedCount = prevEligible.filter((c) => {
        const custPrevOrders = prevOrders.filter((o) => o.customerId === c.id);
        return custPrevOrders.length >= 2;
      }).length;
      const prevRate = (prevRepurchasedCount / prevEligible.length) * 100;
      repurchaseRateChangePP = repurchaseRate - prevRate;
    } else {
      repurchaseRateChangePP = 0;
    }
  }

  // 3. Average purchase interval (intervalo médio entre compras)
  const customersWithInterval = eligibleCustomers.filter(
    (c) => c.averageIntervalDays !== null && c.averageIntervalDays > 0
  );

  let averageIntervalDays: number | null = null;
  if (customersWithInterval.length > 0) {
    const total = customersWithInterval.reduce(
      (sum, c) => sum + (c.averageIntervalDays || 0),
      0
    );
    averageIntervalDays = Math.round(total / customersWithInterval.length);
  }

  // Comparison to previous interval
  let averageIntervalChangeDays: number | null = null;
  if (isDemoMode) {
    averageIntervalChangeDays = averageIntervalDays !== null ? -9 : null;
  } else {
    // In real mode: 0 or null if no historical baseline
    averageIntervalChangeDays = averageIntervalDays !== null ? 0 : null;
  }

  return {
    revenue,
    revenueChangePercent: Number(revenueChangePercent.toFixed(1)),
    ordersCount,
    ordersChangePercent: Number(ordersChangePercent.toFixed(1)),
    repurchaseRate: Number(repurchaseRate.toFixed(1)),
    repurchaseRateChangePP: Number(repurchaseRateChangePP.toFixed(1)),
    averageIntervalDays,
    averageIntervalChangeDays,
  };
};

/**
 * Funnel stage calculations for B2B and B2C
 */
export const calculateB2BFunnelData = (
  customers: Customer[],
  orders: Order[],
  isDemoMode: boolean = false
): FunnelStageData[] => {
  const b2bCustomers = customers.filter((c) => c.segment === 'b2b');

  // In DEMO mode: Return exact baseline matching the visual reference image
  if (isDemoMode) {
    return [
      {
        id: 'novos_contatos',
        name: 'Novos contatos',
        count: 1240,
        percentage: 100,
        colorClass: 'bg-[#4a5f2e]',
      },
      {
        id: 'qualificados',
        name: 'Qualificados',
        count: 780,
        percentage: 62.9,
        colorClass: 'bg-[#637d44]',
      },
      {
        id: 'proposta',
        name: 'Proposta',
        count: 420,
        percentage: 33.9,
        colorClass: 'bg-[#839e64]',
      },
      {
        id: 'primeira_compra',
        name: '1ª compra',
        count: 210,
        percentage: 16.9,
        colorClass: 'bg-[#a3be84]',
      },
      {
        id: 'recompra',
        name: 'Recompra',
        count: 94,
        percentage: 7.6,
        colorClass: 'bg-[#b7cf9b]',
      },
    ];
  }

  // In REAL mode: Calculate 100% purely from registered B2B customers and real orders!
  if (b2bCustomers.length === 0) {
    return [
      { id: 'novos_contatos', name: 'Novos contatos', count: 0, percentage: 0, colorClass: 'bg-[#4a5f2e]' },
      { id: 'qualificados', name: 'Qualificados', count: 0, percentage: 0, colorClass: 'bg-[#637d44]' },
      { id: 'proposta', name: 'Proposta', count: 0, percentage: 0, colorClass: 'bg-[#839e64]' },
      { id: 'primeira_compra', name: '1ª compra', count: 0, percentage: 0, colorClass: 'bg-[#a3be84]' },
      { id: 'recompra', name: 'Recompra', count: 0, percentage: 0, colorClass: 'bg-[#b7cf9b]' },
    ];
  }

  const stageWeights = {
    novos_contatos: 0,
    qualificados: 0,
    proposta: 0,
    primeira_compra: 0,
    recompra: 0,
  };

  b2bCustomers.forEach((c) => {
    const paidOrders = orders.filter((o) => o.customerId === c.id && o.status === 'pago');
    const isRepurchase = paidOrders.length >= 2 || c.funnelStage === 'recompra';
    const isFirstBuy = paidOrders.length === 1 || c.funnelStage === 'primeira_compra';
    const isProposal = c.funnelStage === 'proposta';
    const isQualified = c.funnelStage === 'qualificados';

    // Cumulative progression
    if (isRepurchase) {
      stageWeights.recompra += 1;
      stageWeights.primeira_compra += 1;
      stageWeights.proposta += 1;
      stageWeights.qualificados += 1;
      stageWeights.novos_contatos += 1;
    } else if (isFirstBuy) {
      stageWeights.primeira_compra += 1;
      stageWeights.proposta += 1;
      stageWeights.qualificados += 1;
      stageWeights.novos_contatos += 1;
    } else if (isProposal) {
      stageWeights.proposta += 1;
      stageWeights.qualificados += 1;
      stageWeights.novos_contatos += 1;
    } else if (isQualified) {
      stageWeights.qualificados += 1;
      stageWeights.novos_contatos += 1;
    } else {
      stageWeights.novos_contatos += 1;
    }
  });

  const top = stageWeights.novos_contatos > 0 ? stageWeights.novos_contatos : 1;

  return [
    {
      id: 'novos_contatos',
      name: 'Novos contatos',
      count: stageWeights.novos_contatos,
      percentage: stageWeights.novos_contatos > 0 ? 100 : 0,
      colorClass: 'bg-[#4a5f2e]',
    },
    {
      id: 'qualificados',
      name: 'Qualificados',
      count: stageWeights.qualificados,
      percentage: stageWeights.novos_contatos > 0 ? Number(((stageWeights.qualificados / top) * 100).toFixed(1)) : 0,
      colorClass: 'bg-[#637d44]',
    },
    {
      id: 'proposta',
      name: 'Proposta',
      count: stageWeights.proposta,
      percentage: stageWeights.novos_contatos > 0 ? Number(((stageWeights.proposta / top) * 100).toFixed(1)) : 0,
      colorClass: 'bg-[#839e64]',
    },
    {
      id: 'primeira_compra',
      name: '1ª compra',
      count: stageWeights.primeira_compra,
      percentage: stageWeights.novos_contatos > 0 ? Number(((stageWeights.primeira_compra / top) * 100).toFixed(1)) : 0,
      colorClass: 'bg-[#a3be84]',
    },
    {
      id: 'recompra',
      name: 'Recompra',
      count: stageWeights.recompra,
      percentage: stageWeights.novos_contatos > 0 ? Number(((stageWeights.recompra / top) * 100).toFixed(1)) : 0,
      colorClass: 'bg-[#b7cf9b]',
    },
  ];
};

export const calculateB2CFunnelData = (
  visitorsCount: number = 0,
  cartCount: number = 0,
  firstBuyCount: number = 0,
  repurchaseCount: number = 0,
  isDemoMode: boolean = false
): FunnelStageData[] => {
  if (isDemoMode) {
    const top = visitorsCount > 0 ? visitorsCount : 8500;
    const vCount = visitorsCount > 0 ? visitorsCount : 8500;
    const cCount = cartCount > 0 ? cartCount : 2890;
    const fCount = firstBuyCount > 0 ? firstBuyCount : 1030;
    const rCount = repurchaseCount > 0 ? repurchaseCount : 360;

    return [
      {
        id: 'visitantes',
        name: 'Visitantes',
        count: vCount,
        percentage: 100,
        colorClass: 'bg-[#4a5f2e]',
      },
      {
        id: 'carrinho',
        name: 'Carrinho',
        count: cCount,
        percentage: Number(((cCount / top) * 100).toFixed(1)),
        colorClass: 'bg-[#6d884d]',
      },
      {
        id: 'primeira_compra',
        name: '1ª compra',
        count: fCount,
        percentage: Number(((fCount / top) * 100).toFixed(1)),
        colorClass: 'bg-[#98b378]',
      },
      {
        id: 'recompra',
        name: 'Recompra',
        count: rCount,
        percentage: Number(((rCount / top) * 100).toFixed(1)),
        colorClass: 'bg-[#b8d09c]',
      },
    ];
  }

  // REAL MODE: 100% pure real data
  const top = visitorsCount > 0 ? visitorsCount : (firstBuyCount > 0 ? firstBuyCount : 1);
  const hasTraffic = visitorsCount > 0;

  return [
    {
      id: 'visitantes',
      name: 'Visitantes',
      count: visitorsCount,
      percentage: hasTraffic ? 100 : 0,
      colorClass: 'bg-[#4a5f2e]',
    },
    {
      id: 'carrinho',
      name: 'Carrinho',
      count: cartCount,
      percentage: hasTraffic ? Number(((cartCount / top) * 100).toFixed(1)) : 0,
      colorClass: 'bg-[#6d884d]',
    },
    {
      id: 'primeira_compra',
      name: '1ª compra',
      count: firstBuyCount,
      percentage: hasTraffic
        ? Number(((firstBuyCount / top) * 100).toFixed(1))
        : (firstBuyCount > 0 ? 100 : 0),
      colorClass: 'bg-[#98b378]',
    },
    {
      id: 'recompra',
      name: 'Recompra',
      count: repurchaseCount,
      percentage: hasTraffic
        ? Number(((repurchaseCount / top) * 100).toFixed(1))
        : (firstBuyCount > 0 ? Number(((repurchaseCount / firstBuyCount) * 100).toFixed(1)) : 0),
      colorClass: 'bg-[#b8d09c]',
    },
  ];
};

/**
 * Purchase rhythm chart points (time series of orders)
 */
export const calculatePurchaseRhythm = (
  orders: Order[],
  period: FilterPeriod = '30d',
  isDemoMode: boolean = false,
  refDate: Date = new Date()
): PurchaseRhythmPoint[] => {
  const paidOrders = orders.filter((o) => o.status === 'pago');

  // In DEMO MODE: Illustrative reference series
  if (isDemoMode) {
    const pointsMap = new Map<string, { b2b: number; b2c: number; amount: number }>();
    paidOrders.forEach((o) => {
      const key = o.date;
      const cur = pointsMap.get(key) || { b2b: 0, b2c: 0, amount: 0 };
      if (o.customerSegment === 'b2b') {
        cur.b2b += 1;
      } else {
        cur.b2c += 1;
      }
      cur.amount += o.totalAmount;
      pointsMap.set(key, cur);
    });

    const defaultKeys = [
      { key: '2026-04-27', label: '27 abr', b2b: 22, b2c: 45 },
      { key: '2026-04-30', label: '30 abr', b2b: 28, b2c: 58 },
      { key: '2026-05-03', label: '03 mai', b2b: 35, b2c: 88 },
      { key: '2026-05-06', label: '06 mai', b2b: 24, b2c: 48 },
      { key: '2026-05-09', label: '09 mai', b2b: 30, b2c: 52 },
      { key: '2026-05-12', label: '12 mai', b2b: 42, b2c: 90 },
      { key: '2026-05-15', label: '15 mai', b2b: 48, b2c: 115 },
      { key: '2026-05-18', label: '18 mai', b2b: 40, b2c: 78 },
      { key: '2026-05-21', label: '21 mai', b2b: 54, b2c: 110 },
      { key: '2026-05-24', label: '24 mai', b2b: 62, b2c: 135 },
      { key: '2026-05-27', label: '27 mai', b2b: 70, b2c: 165 },
    ];

    return defaultKeys.map((def) => {
      const actual = pointsMap.get(def.key);
      return {
        dateKey: def.key,
        displayDate: def.label,
        b2bCount: actual ? actual.b2b + def.b2b : def.b2b,
        b2cCount: actual ? actual.b2c + def.b2c : def.b2c,
        totalAmount: actual ? actual.amount : (def.b2b * 450 + def.b2c * 180),
      };
    });
  }

  // In REAL MODE: 100% Real Time-Series Data from real paid orders!
  // Generate date points across the chosen period
  const days = getPeriodDays(period);
  const stepDays = period === '7d' ? 1 : period === '30d' ? 3 : period === '90d' ? 9 : 30;
  const numSteps = Math.min(11, Math.max(7, Math.floor(days / stepDays)));

  const points: PurchaseRhythmPoint[] = [];
  const refTime = refDate.getTime();
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  for (let i = numSteps - 1; i >= 0; i--) {
    const intervalEnd = new Date(refTime);
    intervalEnd.setDate(intervalEnd.getDate() - i * stepDays);
    intervalEnd.setHours(23, 59, 59, 999);

    const intervalStart = new Date(intervalEnd);
    intervalStart.setDate(intervalStart.getDate() - (stepDays - 1));
    intervalStart.setHours(0, 0, 0, 0);

    const key = formatISODate(intervalEnd);
    const dayNum = intervalEnd.getDate();
    const label = `${String(dayNum).padStart(2, '0')} ${months[intervalEnd.getMonth()]}`;

    // Filter real paid orders that fall in this date window
    const ordersInInterval = paidOrders.filter((o) => {
      const oDate = normalizeDate(parseISODate(o.date), false);
      return oDate >= intervalStart && oDate <= intervalEnd;
    });

    const b2bCount = ordersInInterval.filter((o) => o.customerSegment === 'b2b').length;
    const b2cCount = ordersInInterval.filter((o) => o.customerSegment === 'b2c').length;
    const totalAmount = ordersInInterval.reduce((sum, o) => sum + o.totalAmount, 0);

    points.push({
      dateKey: key,
      displayDate: label,
      b2bCount,
      b2cCount,
      totalAmount,
    });
  }

  return points;
};

/**
 * Customer recency breakdown:
 * - Comprou há até 30 dias
 * - Comprou entre 31 e 60 dias
 * - Comprou há mais de 60 dias
 */
export const calculateRecencyBreakdown = (
  customersWithMetrics: CustomerWithMetrics[],
  segment: SegmentFilter,
  isDemoMode: boolean = false
): RecencyBreakdown => {
  const filtered = customersWithMetrics.filter((c) => {
    if (segment !== 'all' && c.segment !== segment) return false;
    return c.lastOrderDate !== undefined && c.daysSinceLastOrder !== null;
  });

  const total = filtered.length;
  if (total === 0) {
    if (isDemoMode) {
      return {
        upTo30DaysPercent: 62,
        upTo30DaysCount: 62,
        between31And60DaysPercent: 24,
        between31And60DaysCount: 24,
        moreThan60DaysPercent: 14,
        moreThan60DaysCount: 14,
      };
    }
    return {
      upTo30DaysPercent: 0,
      upTo30DaysCount: 0,
      between31And60DaysPercent: 0,
      between31And60DaysCount: 0,
      moreThan60DaysPercent: 0,
      moreThan60DaysCount: 0,
    };
  }

  let upTo30 = 0;
  let between31And60 = 0;
  let moreThan60 = 0;

  filtered.forEach((c) => {
    const days = c.daysSinceLastOrder!;
    if (days <= 30) {
      upTo30 += 1;
    } else if (days <= 60) {
      between31And60 += 1;
    } else {
      moreThan60 += 1;
    }
  });

  return {
    upTo30DaysPercent: Math.round((upTo30 / total) * 100),
    upTo30DaysCount: upTo30,
    between31And60DaysPercent: Math.round((between31And60 / total) * 100),
    between31And60DaysCount: between31And60,
    moreThan60DaysPercent: Math.round((moreThan60 / total) * 100),
    moreThan60DaysCount: moreThan60,
  };
};

/**
 * Filter customers for reactivation list
 */
export const getReactivationCustomers = (
  customersWithMetrics: CustomerWithMetrics[],
  segment: SegmentFilter,
  limit?: number
): CustomerWithMetrics[] => {
  const filtered = customersWithMetrics.filter((c) => {
    if (segment !== 'all' && c.segment !== segment) return false;
    // Only customers who have bought before and are in 'atencao' or 'em_atraso'
    return c.reactivationStatus === 'em_atraso' || c.reactivationStatus === 'atencao';
  });

  // Sort by most critical: 'em_atraso' first, then highest overdue days
  filtered.sort((a, b) => {
    if (a.reactivationStatus === 'em_atraso' && b.reactivationStatus !== 'em_atraso') return -1;
    if (b.reactivationStatus === 'em_atraso' && a.reactivationStatus !== 'em_atraso') return 1;
    const aOverdue = (a.daysSinceLastOrder || 0) - a.effectiveCycleDays;
    const bOverdue = (b.daysSinceLastOrder || 0) - b.effectiveCycleDays;
    return bOverdue - aOverdue;
  });

  if (limit && limit > 0) {
    return filtered.slice(0, limit);
  }

  return filtered;
};

/**
 * Calculates term payment data, boleto due dates and repurchase timeline countdowns
 * ("Clientes que compram no boleto, estão com o prazo de quanto tempo para comprar")
 */
export const calculateTermCustomersAndMetrics = (
  customers: Customer[],
  orders: Order[],
  settings: CycleSettings,
  refDate: Date = new Date()
): { termCustomers: TermCustomerCalculation[]; metrics: TermMetrics } => {
  const refTime = refDate.getTime();

  // Helper to determine if an order is term/boleto
  const isOrderTerm = (ord: Order): boolean => {
    if (ord.isTermPayment) return true;
    const pm = (ord.paymentMethod || '').toLowerCase();
    return pm.includes('boleto') || pm.includes('faturad') || pm.includes('prazo');
  };

  const termCustomers: TermCustomerCalculation[] = [];

  let totalOpenDebt = 0;
  let totalHistoricalVolume = 0;
  let openOrdersCount = 0;
  let overdueOrdersCount = 0;
  let overdueDebtAmount = 0;
  let dueSoonOrdersCount = 0;
  let readyForRepurchaseCount = 0;
  let totalTermDaysCount = 0;
  let sumTermDays = 0;

  customers.forEach((cust) => {
    // Orders for this customer
    const custOrders = orders.filter((o) => o.customerId === cust.id);
    const termOrders = custOrders.filter(isOrderTerm);

    // If customer has no term orders and no preferred term, but is B2B, check if we want to show them if they have any order
    if (termOrders.length === 0 && !cust.preferredPaymentTerm?.toLowerCase().includes('boleto')) {
      return;
    }

    // Sort term orders by date descending
    termOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestTermOrder = termOrders[0] || null;

    let custOpenDebt = 0;
    let hasOpenBoleto = false;
    let hasOverdueBoleto = false;
    let nearestDueOrder: Order | null = null;
    let minDueDateObj: Date | null = null;
    let custOpenOrdersCount = 0;

    for (const o of termOrders) {
      totalHistoricalVolume += o.totalAmount;
      const termDays = o.termDays || 30;
      sumTermDays += termDays;
      totalTermDaysCount += 1;

      // Determine if order is still open / unpaid
      const isPaid = o.status === 'pago' && o.termStatus !== 'vencido' && o.termStatus !== 'em_dia' && o.termStatus !== 'vence_hoje'
        ? o.termStatus === 'pago' || !o.termStatus
        : o.termStatus === 'pago';

      const isActuallyOpen = o.status === 'pendente' || (o.termStatus && o.termStatus !== 'pago');

      if (isActuallyOpen && o.status !== 'cancelado') {
        custOpenDebt += o.totalAmount;
        totalOpenDebt += o.totalAmount;
        openOrdersCount += 1;
        custOpenOrdersCount += 1;
        hasOpenBoleto = true;

        // Calculate due date
        let dueDate: Date;
        if (o.termDueDate) {
          dueDate = parseISODate(o.termDueDate);
        } else {
          // Default: order date + termDays
          dueDate = parseISODate(o.date);
          dueDate.setDate(dueDate.getDate() + termDays);
        }

        const daysDiff = Math.round((dueDate.getTime() - refTime) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
          hasOverdueBoleto = true;
          overdueOrdersCount += 1;
          overdueDebtAmount += o.totalAmount;
        } else if (daysDiff <= 7) {
          dueSoonOrdersCount += 1;
        }

        if (!minDueDateObj || dueDate < minDueDateObj) {
          minDueDateObj = dueDate;
          nearestDueOrder = o;
        }
      }
    }

    // Days until boleto due date
    let daysUntilBoletoDue: number | null = null;
    let activeBoletoDueDate: string | null = null;
    let boletoStatus: BoletoTermStatus | 'sem_boletos' = 'sem_boletos';

    const targetDueDate: Date | null = minDueDateObj;
    if (nearestDueOrder && targetDueDate !== null) {
      activeBoletoDueDate = formatISODate(targetDueDate);
      daysUntilBoletoDue = Math.round((targetDueDate.getTime() - refTime) / (1000 * 60 * 60 * 24));

      if (daysUntilBoletoDue < 0) {
        boletoStatus = 'vencido';
      } else if (daysUntilBoletoDue === 0) {
        boletoStatus = 'vence_hoje';
      } else {
        boletoStatus = 'em_dia';
      }
    } else if (termOrders.length > 0) {
      boletoStatus = 'pago';
    }

    // Now calculate "Prazo de quanto tempo para comprar":
    // Based on customer cycle and whether credit is blocked or open
    const effectiveCycle = cust.customCycleDays || (cust.segment === 'b2b' ? settings.b2bDefaultCycleDays : settings.b2cDefaultCycleDays);
    const lastOrder = custOrders[0] || null;

    let daysSinceLastOrder = 0;
    if (lastOrder) {
      daysSinceLastOrder = Math.round((refTime - parseISODate(lastOrder.date).getTime()) / (1000 * 60 * 60 * 24));
    }

    const daysUntilNextPurchase = effectiveCycle - daysSinceLastOrder;
    const predictedNextDate = new Date(refTime);
    predictedNextDate.setDate(predictedNextDate.getDate() + daysUntilNextPurchase);
    const predictedNextPurchaseDate = formatISODate(predictedNextDate);

    let eligibility: TermPurchaseEligibility = 'liberado_recompra';
    let purchaseStatusText = '';
    let recommendedAction = '';

    if (hasOverdueBoleto) {
      eligibility = 'bloqueado_atraso';
      const absDays = Math.abs(daysUntilBoletoDue || 1);
      purchaseStatusText = `BLOQUEADO: Boleto em atraso há ${absDays} dia${absDays > 1 ? 's' : ''}`;
      recommendedAction = 'Acionar cobrança no WhatsApp para quitar boleto e reativar compras';
    } else if (hasOpenBoleto) {
      eligibility = 'aguardando_boleto';
      if (daysUntilBoletoDue === 0) {
        purchaseStatusText = 'Boleto vence HOJE. Próxima compra liberada após confirmação';
        recommendedAction = 'Acompanhar liquidação hoje para autorizar novo pedido faturado';
      } else {
        purchaseStatusText = `Boleto vence em ${daysUntilBoletoDue} dias. Recompra estimada após quitação`;
        recommendedAction = 'Acompanhar vencimento; consultar comprador sobre reposição';
      }
    } else {
      // Boleto pago / Sem pendências
      if (daysUntilNextPurchase <= 0) {
        eligibility = 'urgente_recompra';
        readyForRepurchaseCount += 1;
        const passedDays = Math.abs(daysUntilNextPurchase);
        purchaseStatusText = passedDays === 0
          ? `MOMENTO IDEAL DE COMPRA! (Ciclo de ${effectiveCycle} dias atingido)`
          : `NO PRAZO DE COMPRAR! (Passaram ${passedDays} dias do ciclo de ${effectiveCycle}d)`;
        recommendedAction = 'Boleto quitado e crédito 100% liberado! Ligar para tirar pedido';
      } else {
        eligibility = 'liberado_recompra';
        purchaseStatusText = `Crédito liberado. Faltam ${daysUntilNextPurchase} dias para o ciclo de recompra`;
        recommendedAction = 'Boleto anterior pago. Apresentar lançamentos para a data prevista';
      }
    }

    termCustomers.push({
      customer: cust,
      termOrders,
      latestTermOrder,
      openOrdersCount: custOpenOrdersCount,
      totalOpenDebt: custOpenDebt,
      totalHistoricalTerm: termOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      hasOpenBoleto,
      hasOverdueBoleto,
      activeBoletoDueDate,
      daysUntilBoletoDue,
      boletoStatus,
      eligibility,
      daysUntilNextPurchase,
      predictedNextPurchaseDate,
      purchaseStatusText,
      recommendedAction,
    });
  });

  // Sort term customers:
  // 1. Overdue first (urgent)
  // 2. Urgent repurchase (opportunities)
  // 3. Due soon
  // 4. Then by daysUntilNextPurchase
  termCustomers.sort((a, b) => {
    const priority = {
      bloqueado_atraso: 1,
      urgente_recompra: 2,
      aguardando_boleto: 3,
      liberado_recompra: 4,
    };
    if (priority[a.eligibility] !== priority[b.eligibility]) {
      return priority[a.eligibility] - priority[b.eligibility];
    }
    return a.daysUntilNextPurchase - b.daysUntilNextPurchase;
  });

  const metrics: TermMetrics = {
    totalOpenDebt,
    totalHistoricalVolume,
    openOrdersCount,
    overdueOrdersCount,
    overdueDebtAmount,
    dueSoonOrdersCount,
    readyForRepurchaseCount,
    averageTermDays: totalTermDaysCount > 0 ? Math.round(sumTermDays / totalTermDaysCount) : 28,
  };

  return { termCustomers, metrics };
};
