import React from 'react';
import { AlertTriangle, Trash2, X, Building2, ShoppingBag } from 'lucide-react';
import { Customer, CustomerWithMetrics, Order } from '../../types/crm';
import { formatBRL, formatDateBR } from '../../utils/crmCalculations';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  type: 'customer' | 'order';
  customer?: Customer | CustomerWithMetrics | null;
  order?: Order | null;
  linkedOrdersCount?: number;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  type,
  customer,
  order,
  linkedOrdersCount = 0,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#ded8c9] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Warning Accent */}
        <div className="p-6 bg-[#fff5f5] border-b border-[#fecaca] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] border border-[#fca5a5] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-[#dc2626]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#dc2626]">
                Confirmação de Exclusão
              </span>
              <h2 className="text-lg font-bold text-[#1c2918]">
                {type === 'customer' ? 'Excluir Cliente Definitivamente' : 'Excluir Pedido'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#738268] hover:text-[#1c2918] hover:bg-[#fee2e2] transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {type === 'customer' && customer && (
            <div>
              <p className="text-sm text-[#4a5840] mb-3">
                Tem certeza de que deseja excluir o cliente abaixo? Os dados cadastrais e as métricas de recompra serão removidos do sistema.
              </p>

              {/* Customer summary card */}
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#e5dfd0] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-base text-[#1c2918] truncate">
                    {customer.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      customer.segment === 'b2b'
                        ? 'bg-[#edf3e5] text-[#3e5326] border border-[#cbdaba]'
                        : 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]'
                    }`}
                  >
                    {customer.segment === 'b2b' ? (
                      <>
                        <Building2 className="w-3 h-3" />
                        B2B • Atacado
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3 h-3" />
                        B2C • Consumidor
                      </>
                    )}
                  </span>
                </div>

                {customer.tradeName && (
                  <p className="text-xs text-[#59694c]">
                    Nome Fantasia: <strong>{customer.tradeName}</strong>
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-[#637258] pt-1 border-t border-[#eee9db]">
                  <div>
                    <span className="text-[#8e9c85] block text-[10px]">Documento</span>
                    <span className="font-mono text-[#1c2918] font-medium">
                      {customer.document || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8e9c85] block text-[10px]">E-mail</span>
                    <span className="text-[#1c2918] font-medium truncate block">
                      {customer.email || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8e9c85] block text-[10px]">Telefone / WhatsApp</span>
                    <span className="text-[#1c2918] font-medium">
                      {customer.phone || customer.whatsapp || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8e9c85] block text-[10px]">Origem</span>
                    <span className="text-[#1c2918] font-medium truncate block">
                      {customer.channelOrigin || 'Direto'}
                    </span>
                  </div>
                </div>
              </div>

              {linkedOrdersCount > 0 && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#fff1f2] border border-[#fecdd3] text-xs text-[#9f1239] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#e11d48] shrink-0" />
                  <span>
                    <strong>Atenção:</strong> Este cliente possui <strong>{linkedOrdersCount} pedido(s)</strong> vinculados que também serão excluídos automaticamente.
                  </span>
                </div>
              )}
            </div>
          )}

          {type === 'order' && order && (
            <div>
              <p className="text-sm text-[#4a5840] mb-3">
                Tem certeza de que deseja excluir este pedido? Os indicadores de compras e ritmo de recompra serão recalculados.
              </p>

              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#e5dfd0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#66775b]">
                    #{order.id}
                  </span>
                  <span className="text-xs font-bold text-[#2d3f1d]">
                    {formatDateBR(order.date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#1c2918]">
                    {order.customerName}
                  </span>
                  <span className="text-base font-bold text-[#2d3f1d]">
                    {formatBRL(order.totalAmount)}
                  </span>
                </div>
                <p className="text-xs text-[#637258] pt-1 border-t border-[#eee9db]">
                  Itens: {order.itemsSummary}
                </p>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#f8f6f0] border border-[#eae5d8] text-xs text-[#67775f]">
            💡 <strong>Esta ação é irreversível.</strong> Os dados serão removidos tanto do armazenamento local quanto sincronizados com o banco Firestore.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-[#faf9f5] border-t border-[#eae5d8] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-[#ded8c9] text-xs font-semibold text-[#5a6a4d] hover:bg-[#f0ece2] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Excluindo...' : type === 'customer' ? 'Sim, Excluir Cliente' : 'Sim, Excluir Pedido'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
