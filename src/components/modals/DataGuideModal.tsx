import React from 'react';
import {
  Code,
  Database,
  ExternalLink,
  Globe,
  HelpCircle,
  Layers,
  RotateCcw,
  Server,
  ShoppingCart,
  Webhook,
  X,
} from 'lucide-react';

interface DataGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetDemo: () => void;
}

export const DataGuideModal: React.FC<DataGuideModalProps> = ({
  isOpen,
  onClose,
  onResetDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-[#ded8c9] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#f8f6f0] border-b border-[#eae5d8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#edf3e6] flex items-center justify-center">
              <Database className="w-5 h-5 text-[#465b2d]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1c2918]">
                Arquitetura de Dados & Integrações
              </h2>
              <p className="text-xs text-[#738268]">
                Manual técnico de dados de demonstração, persistência e conexões de e-commerce.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#738268] hover:text-[#1c2918] hover:bg-[#ede8dc] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs md:text-sm text-[#2d3a22]">
          {/* Section 1 */}
          <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ece8de] space-y-2">
            <h3 className="font-bold text-sm text-[#1c2918] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#465b2d] text-white flex items-center justify-center text-xs">
                1
              </span>
              Onde estão os dados de demonstração?
            </h3>
            <p className="text-xs leading-relaxed text-[#4f5f43]">
              Os dados de demonstração iniciais estão centralizados no arquivo:
              <br />
              <code className="text-[#3b4c25] bg-[#edf2e6] px-2 py-0.5 rounded font-mono text-[11px] font-semibold mt-1 inline-block">
                src/services/crmStorage.ts
              </code>
            </p>
            <p className="text-xs leading-relaxed text-[#4f5f43]">
              Eles incluem os clientes e métricas de referência (como <b>Casa Aroma</b>, <b>Cheiro do Lar</b>, <b>Essência & Cia</b>, <b>Aroma da Casa</b> e <b>Viver Bem Decor</b>), com pedidos em datas calculadas e proporções idênticas às da imagem.
            </p>
            <p className="text-xs leading-relaxed text-[#4f5f43]">
              <b>Persistência ativa:</b> Ao abrir o sistema, esses dados são gravados no <b>localStorage</b> do seu navegador. Todas as inserções, edições e exclusões que você fizer são salvas imediatamente e persistem ao recarregar a tela.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ece8de] space-y-2">
            <h3 className="font-bold text-sm text-[#1c2918] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#465b2d] text-white flex items-center justify-center text-xs">
                2
              </span>
              Como substituí-los por dados reais de produção?
            </h3>
            <ul className="list-disc list-inside text-xs leading-relaxed text-[#4f5f43] space-y-1.5 pl-1">
              <li>
                <b>Pela interface atual:</b> Você pode cadastrar os clientes e pedidos reais da Floresta Verde clicando em <b>"+ Novo Cliente"</b> e <b>"+ Pedido"</b>. Na aba <i>Relatórios</i>, é possível exportar o backup em JSON a qualquer momento.
              </li>
              <li>
                <b>Conexão com Banco de Dados:</b> O módulo <code className="font-mono text-[11px] bg-[#edf2e6] px-1 py-0.5 rounded">crmStorage.ts</code> foi construído com a mesma assinatura assíncrona de uma API (CRUD completo). Para conectar com PostgreSQL, Cloud SQL ou Firestore, basta trocar os métodos <code className="font-mono text-[11px]">getCustomers()</code> e <code className="font-mono text-[11px]">getOrders()</code> por chamadas <code className="font-mono text-[11px]">fetch('/api/customers')</code> e <code className="font-mono text-[11px]">fetch('/api/orders')</code>.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ece8de] space-y-3">
            <h3 className="font-bold text-sm text-[#1c2918] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#465b2d] text-white flex items-center justify-center text-xs">
                3
              </span>
              Quais integrações alimentam as etapas "Visitantes" e "Carrinho" (Funil B2C)?
            </h3>
            <p className="text-xs leading-relaxed text-[#4f5f43]">
              Para cumprir a regra de negócio da Floresta Verde: <i>"Visitas e carrinhos só podem ser contabilizados quando esses eventos tiverem sido registrados ou integrados. Não invente esses números na operação real."</i>, as seguintes conexões são necessárias:
            </p>

            <div className="space-y-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-[#ded8c9]">
                <div className="flex items-center gap-2 font-bold text-[#2d3a20]">
                  <Globe className="w-4 h-4 text-[#495f2e]" />
                  <span>Etapa: Visitantes Únicos</span>
                </div>
                <p className="text-[11px] text-[#6d7c64] mt-1 leading-relaxed">
                  <b>Integração recomendada:</b> Google Analytics 4 (via GA4 Data API) ou Shopify Analytics API.
                  <br />
                  <b>Métrica extraída:</b> <code className="font-mono text-[11px]">activeUsers</code> ou <code className="font-mono text-[11px]">sessions</code> no intervalo de datas selecionado (7d, 30d, 90d, 12m).
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#ded8c9]">
                <div className="flex items-center gap-2 font-bold text-[#2d3a20]">
                  <ShoppingCart className="w-4 h-4 text-[#495f2e]" />
                  <span>Etapa: Adicionaram ao Carrinho</span>
                </div>
                <p className="text-[11px] text-[#6d7c64] mt-1 leading-relaxed">
                  <b>Integração recomendada:</b> Webhooks de e-commerce da sua loja (Nuvemshop, Shopify, WooCommerce ou VTEX).
                  <br />
                  <b>Eventos escutados:</b> <code className="font-mono text-[11px]">cart/create</code>, <code className="font-mono text-[11px]">checkouts/create</code> ou evento de pixel <code className="font-mono text-[11px]">add_to_cart</code>.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#ded8c9]">
                <div className="flex items-center gap-2 font-bold text-[#2d3a20]">
                  <Webhook className="w-4 h-4 text-[#495f2e]" />
                  <span>Etapa: 1ª Compra e Recompra</span>
                </div>
                <p className="text-[11px] text-[#6d7c64] mt-1 leading-relaxed">
                  <b>Eventos escutados:</b> <code className="font-mono text-[11px]">orders/paid</code>. O CRM verifica automaticamente se o CPF/E-mail do comprador já realizou compra anterior; se sim, computa na <b>Recompra</b> e atualiza o <b>Intervalo Médio</b> imediatamente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8f6f0] border-t border-[#eae5d8] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja restaurar os dados de demonstração originais da Floresta Verde?')) {
                onResetDemo();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8b3232] hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar dados de demonstração</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#495d2f] text-white text-xs font-semibold hover:bg-[#3c4e25] transition-colors"
          >
            Entendido, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
