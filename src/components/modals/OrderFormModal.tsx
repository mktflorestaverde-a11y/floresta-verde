import React, { useState, useEffect } from 'react';
import { CalendarClock, Package, ShoppingBag, X } from 'lucide-react';
import { Customer, Order, OrderStatus, BoletoTermStatus } from '../../types/crm';
import { formatISODate, parseISODate } from '../../utils/crmCalculations';

interface OrderFormModalProps {
  orderToEdit?: Order | null;
  defaultCustomer?: Customer | null;
  customers: Customer[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: Omit<Order, 'id'>) => void;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  orderToEdit,
  defaultCustomer,
  customers,
  isOpen,
  onClose,
  onSave,
}) => {
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(formatISODate(new Date()));
  const [totalAmount, setTotalAmount] = useState('');
  const [status, setStatus] = useState<OrderStatus>('pago');
  const [itemsSummary, setItemsSummary] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Boleto bancário (28 dias)');
  const [notes, setNotes] = useState('');

  // Term / Boleto fields
  const [isTermPayment, setIsTermPayment] = useState(true);
  const [termDays, setTermDays] = useState(28);
  const [termDueDate, setTermDueDate] = useState('');
  const [termStatus, setTermStatus] = useState<BoletoTermStatus>('em_dia');
  const [boletoBarcode, setBoletoBarcode] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper to calculate due date from order date + termDays
  const calculateDefaultDueDate = (orderDateStr: string, days: number): string => {
    try {
      const d = parseISODate(orderDateStr);
      d.setDate(d.getDate() + days);
      return formatISODate(d);
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (orderToEdit) {
      setCustomerId(orderToEdit.customerId);
      setDate(orderToEdit.date);
      setTotalAmount(String(orderToEdit.totalAmount));
      setStatus(orderToEdit.status);
      setItemsSummary(orderToEdit.itemsSummary);
      setPaymentMethod(orderToEdit.paymentMethod || 'Pix');
      setNotes(orderToEdit.notes || '');

      const isTerm = orderToEdit.isTermPayment ||
        (orderToEdit.paymentMethod || '').toLowerCase().includes('boleto') ||
        (orderToEdit.paymentMethod || '').toLowerCase().includes('prazo');

      setIsTermPayment(isTerm);
      const days = orderToEdit.termDays || 28;
      setTermDays(days);
      setTermDueDate(orderToEdit.termDueDate || calculateDefaultDueDate(orderToEdit.date, days));
      setTermStatus(orderToEdit.termStatus || (orderToEdit.status === 'pago' ? 'pago' : 'em_dia'));
      setBoletoBarcode(orderToEdit.boletoBarcode || '');
    } else {
      const initialCustId = defaultCustomer ? defaultCustomer.id : customers[0]?.id || '';
      setCustomerId(initialCustId);
      const today = formatISODate(new Date());
      setDate(today);
      setTotalAmount('');

      // If customer is B2B, default to Boleto 28d
      const custObj = customers.find((c) => c.id === initialCustId);
      const isB2B = custObj?.segment === 'b2b';

      if (isB2B) {
        setIsTermPayment(true);
        setStatus('pendente');
        setPaymentMethod('Boleto bancário (28 dias)');
        setTermDays(28);
        setTermDueDate(calculateDefaultDueDate(today, 28));
        setTermStatus('em_dia');
      } else {
        setIsTermPayment(false);
        setStatus('pago');
        setPaymentMethod('Pix');
        setTermDays(30);
        setTermDueDate(calculateDefaultDueDate(today, 30));
        setTermStatus('pago');
      }

      setItemsSummary('');
      setNotes('');
      setBoletoBarcode('');
    }
    setErrors({});
  }, [orderToEdit, defaultCustomer, customers, isOpen]);

  // When order date or termDays change, auto update due date if not custom
  const handleTermDaysChange = (days: number) => {
    setTermDays(days);
    setTermDueDate(calculateDefaultDueDate(date, days));
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (isTermPayment) {
      setTermDueDate(calculateDefaultDueDate(newDate, termDays));
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    const isTerm = method.toLowerCase().includes('boleto') || method.toLowerCase().includes('prazo');
    setIsTermPayment(isTerm);
    if (isTerm) {
      setStatus('pendente');
      setTermStatus('em_dia');
    }
  };

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customerId = 'Selecione um cliente';
    if (!date) errs.date = 'Data é obrigatória';
    const amountNum = parseFloat(totalAmount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      errs.totalAmount = 'Informe um valor válido maior que zero';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedCust = customers.find((c) => c.id === customerId);
    if (!selectedCust) return;

    const amountNum = parseFloat(totalAmount.replace(',', '.'));

    onSave({
      customerId,
      customerName: selectedCust.tradeName || selectedCust.name,
      customerSegment: selectedCust.segment,
      date,
      totalAmount: amountNum,
      status: isTermPayment && termStatus !== 'pago' ? 'pendente' : status,
      itemsSummary: itemsSummary.trim() || 'Produtos Floresta Verde',
      paymentMethod,
      notes: notes.trim() || undefined,
      isTermPayment,
      termDays: isTermPayment ? termDays : undefined,
      termDueDate: isTermPayment ? termDueDate : undefined,
      termStatus: isTermPayment ? termStatus : undefined,
      boletoBarcode: isTermPayment ? boletoBarcode.trim() || undefined : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-[#ded8c9] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-[#f8f6f0] border-b border-[#eae5d8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#edf3e6] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#465b2d]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1c2918]">
                {orderToEdit ? 'Editar Pedido' : 'Registrar Novo Pedido'}
              </h2>
              <p className="text-xs text-[#6e7e60]">
                Preencha os dados da venda e condições de faturamento/boleto.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7c8b6e] hover:bg-[#ede9dc] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
              Cliente *
            </label>
            <select
              value={customerId}
              onChange={(e) => {
                const cid = e.target.value;
                setCustomerId(cid);
                const c = customers.find((item) => item.id === cid);
                if (c?.segment === 'b2b') {
                  setIsTermPayment(true);
                  setPaymentMethod('Boleto bancário (28 dias)');
                }
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918] focus:bg-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName || c.name} ({c.segment.toUpperCase()})
                </option>
              ))}
            </select>
            {errors.customerId && (
              <span className="text-[11px] text-[#b91c1c] mt-0.5 block">{errors.customerId}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                Data do Pedido *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white"
              />
              {errors.date && (
                <span className="text-[11px] text-[#b91c1c] mt-0.5 block">{errors.date}</span>
              )}
            </div>

            {/* Total Amount in BRL */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                Valor Total (R$) *
              </label>
              <input
                type="text"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="Ex: 4850.00"
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] font-semibold tabular-nums focus:bg-white"
              />
              {errors.totalAmount && (
                <span className="text-[11px] text-[#b91c1c] mt-0.5 block">{errors.totalAmount}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918]"
              >
                <option value="Boleto bancário (28 dias)">Boleto bancário (28 dias)</option>
                <option value="Boleto bancário (14 dias)">Boleto bancário (14 dias)</option>
                <option value="Boleto bancário (30 dias)">Boleto bancário (30 dias)</option>
                <option value="Boleto bancário (30/60 dias)">Boleto bancário (30/60 dias)</option>
                <option value="Faturamento a prazo">Faturamento a prazo</option>
                <option value="Pix">Pix (À Vista)</option>
                <option value="Cartão de crédito">Cartão de crédito</option>
                <option value="Transferência TED">Transferência TED</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                Status Geral
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918]"
              >
                <option value="pendente">Pendente / A Vencer</option>
                <option value="pago">Pago / Quitado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Venda a Prazo / Boleto Box */}
          <div className="p-3.5 rounded-2xl bg-[#edf3e5]/70 border border-[#cadbbb] space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-[#2d3b20]">
                <input
                  type="checkbox"
                  checked={isTermPayment}
                  onChange={(e) => setIsTermPayment(e.target.checked)}
                  className="rounded border-[#a4c090] text-[#485b2e] focus:ring-[#485b2e] h-4 w-4"
                />
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-[#4a5f2a]" />
                  <span>Venda a Prazo / Faturada no Boleto</span>
                </span>
              </label>
              {isTermPayment && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#485b2e] text-white">
                  A Prazo
                </span>
              )}
            </div>

            {isTermPayment && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-[#324520] mb-1">
                    Prazo Concedido
                  </label>
                  <select
                    value={termDays}
                    onChange={(e) => handleTermDaysChange(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#cadbbb] text-xs text-[#1c2918]"
                  >
                    <option value={14}>14 dias</option>
                    <option value={21}>21 dias</option>
                    <option value={28}>28 dias</option>
                    <option value={30}>30 dias</option>
                    <option value={45}>45 dias</option>
                    <option value={60}>60 dias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#324520] mb-1">
                    Vencimento do Boleto
                  </label>
                  <input
                    type="date"
                    value={termDueDate}
                    onChange={(e) => setTermDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#cadbbb] text-xs text-[#1c2918]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#324520] mb-1">
                    Status do Boleto
                  </label>
                  <select
                    value={termStatus}
                    onChange={(e) => {
                      const s = e.target.value as BoletoTermStatus;
                      setTermStatus(s);
                      if (s === 'pago') setStatus('pago');
                      else setStatus('pendente');
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#cadbbb] text-xs text-[#1c2918]"
                  >
                    <option value="em_dia">Em dia (A vencer)</option>
                    <option value="pago">Quitado / Pago</option>
                    <option value="vencido">Vencido / Atrasado</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Items Summary */}
          <div>
            <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
              Itens / Resumo dos Produtos
            </label>
            <input
              type="text"
              value={itemsSummary}
              onChange={(e) => setItemsSummary(e.target.value)}
              placeholder="Ex: 50x Difusores Capim-Limão 250ml, 30x Velas Lavanda"
              className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
              Observações do Pedido (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes de faturamento, NF ou dados para envio do boleto..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#eae5d8] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#ded8c9] text-xs font-semibold text-[#5a6a4d] hover:bg-[#f6f4ee] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#495d2f] text-white text-xs font-semibold hover:bg-[#3c4e25] transition-all shadow-xs cursor-pointer"
            >
              {orderToEdit ? 'Atualizar Pedido' : 'Concluir Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
