import { CustomerWithMetrics, Order } from '../types/crm';

export interface WhatsAppSession {
  isConnected: boolean;
  phoneNumber: string;
  connectedAt: string;
  accountName: string;
  deviceInfo: string;
  profilePhoto?: string;
}

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  sender: 'me' | 'customer' | 'system';
  senderName?: string;
  text: string;
  timestamp: string; // ISO format or HH:MM
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'catalog_product' | 'commercial_quote' | 'boleto' | 'audio';
  metadata?: {
    productName?: string;
    productPrice?: number;
    productImage?: string;
    productDescription?: string;
    quoteTotal?: number;
    quoteItems?: Array<{ name: string; quantity: number; unitPrice: number }>;
    boletoDueDate?: string;
    boletoBarcode?: string;
    boletoAmount?: number;
    audioDurationSeconds?: number;
  };
}

export interface WhatsAppChat {
  id: string; // usually customer id or clean phone
  customerId?: string;
  customerName: string;
  tradeName?: string;
  phoneNumber: string;
  segment: 'b2b' | 'b2c';
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
  isOnline?: boolean;
  tags?: string[];
  contactPerson?: string;
  messages: WhatsAppMessage[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  wholesalePrice: number; // Atacado (B2B)
  retailPrice: number;    // Varejo (B2C)
  minWholesaleQty: number;
  description: string;
  scents: string[];
  volume: string;
  inStock: boolean;
  sku: string;
}

export interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  category: 'Apresentação' | 'Vendas & Atacado' | 'Financeiro' | 'Pós-Venda';
  text: string;
}

const WA_SESSION_KEY = 'floresta_verde_wa_session_v2';
const WA_CHATS_KEY = 'floresta_verde_wa_chats_v2';

export const FLORESTA_VERDE_CATALOG: CatalogProduct[] = [
  {
    id: 'prod-1',
    sku: 'DIF-BAMB-250',
    name: 'Difusor de Aromas Varetas Bambu Imperial 250ml',
    category: 'Difusores de Ambiente',
    wholesalePrice: 38.50,
    retailPrice: 79.90,
    minWholesaleQty: 12,
    description: 'Notas verdes refrescantes com toque aveludado de flor de laranjeira e bambu asiático. Campeão de vendas em boutiques e hotéis.',
    scents: ['Bambu Imperial', 'Chá Branco', 'Capim-Limão'],
    volume: '250ml com 6 varetas de fibra preta',
    inStock: true,
  },
  {
    id: 'prod-2',
    sku: 'ESS-LAV-30',
    name: 'Essência Pura Concentrada Lavanda Francesa 30ml',
    category: 'Essências Oleosas',
    wholesalePrice: 19.90,
    retailPrice: 42.00,
    minWholesaleQty: 20,
    description: 'Óleo aromático premium de alta fixação para difusores elétricos, ultrassônicos e cerâmicas aromáticas. Calmante e terapêutico.',
    scents: ['Lavanda Francesa', 'Eucalipto Glóbulos', 'Flor de Cerejeira'],
    volume: '30ml em vidro âmbar com conta-gotas',
    inStock: true,
  },
  {
    id: 'prod-3',
    sku: 'HSP-VAN-500',
    name: 'Home Spray Vanilla & Madeira Nobre 500ml',
    category: 'Home Sprays',
    wholesalePrice: 32.00,
    retailPrice: 68.00,
    minWholesaleQty: 15,
    description: 'Fragrância acolhedora com fundo ambarado e toque de fava de baunilha de Madagascar. Efeito instantâneo e sofisticado.',
    scents: ['Vanilla & Madeira Nobre', 'Figo Ambarado', 'Alecrim Silvestre'],
    volume: '500ml com gatilho spray borrifador',
    inStock: true,
  },
  {
    id: 'prod-4',
    sku: 'AGU-TEC-1000',
    name: 'Água Perfumada para Tecidos & Lençóis 1 Litro',
    category: 'Cuidados para Tecidos',
    wholesalePrice: 42.00,
    retailPrice: 89.90,
    minWholesaleQty: 10,
    description: 'Desenvolvido especialmente para hotelaria e residências de alto padrão. Não mancha e perfuma roupas de cama e cortinas.',
    scents: ['Algodão Egípcio', 'Flor de Laranjeira', 'Chá Branco & Verbena'],
    volume: '1000ml refil econômico',
    inStock: true,
  },
  {
    id: 'prod-5',
    sku: 'SAB-LIQ-350',
    name: 'Sabonete Líquido Hidratante com Extrato de Aloe Vera 350ml',
    category: 'Cosméticos Botânicos',
    wholesalePrice: 24.50,
    retailPrice: 52.00,
    minWholesaleQty: 16,
    description: 'Fórmula hidratante perolada com pH fisiológico e extratos botânicos. Frasco decorativo com válvula pump dourada.',
    scents: ['Alecrim & Capim-Santo', 'Pitanga Negra', 'Lavanda Real'],
    volume: '350ml frasco quadrado luxo',
    inStock: true,
  },
  {
    id: 'prod-6',
    sku: 'KIT-EXPO-24',
    name: 'Kit Display Balcão Atacado - 24 Difusores Sortidos',
    category: 'Kits para Lojas & Revenda',
    wholesalePrice: 799.00,
    retailPrice: 1680.00,
    minWholesaleQty: 1,
    description: 'Display em madeira reflorestada para ponto de venda + 24 difusores 250ml campeões de giro + 4 provadores grátis para clientes cheirarem.',
    scents: ['Sortido: 8 Bambu, 8 Lavanda, 8 Vanilla'],
    volume: 'Display completo montado',
    inStock: true,
  },
];

export const QUICK_REPLIES_LIBRARY: QuickReply[] = [
  {
    id: 'qr-1',
    shortcut: '/apresentacao',
    title: '🌿 Apresentação da Fábrica Floresta Verde',
    category: 'Apresentação',
    text: 'Olá! Sou da equipe comercial da Floresta Verde Aromas Botânicos. Trabalhamos com essências puras, difusores e home sprays de alta fixação desenvolvidos com matérias-primas nobres. Como posso te auxiliar hoje?',
  },
  {
    id: 'qr-2',
    shortcut: '/tabela_atacado',
    title: '📦 Condições de Atacado & Pedido Mínimo B2B',
    category: 'Vendas & Atacado',
    text: 'Nossa tabela de atacado é exclusiva para lojistas, hotéis e distribuidores:\n• Pedido mínimo: R$ 400,00 sortido\n• Margem de revenda: acima de 100%\n• Faturamento: Boleto faturado para 28 dias após aprovação cadastral\n• Frete grátis para compras acima de R$ 800,00.',
  },
  {
    id: 'qr-3',
    shortcut: '/recompra',
    title: '⏰ Lembrete de Ciclo de Reposição / Recompra',
    category: 'Vendas & Atacado',
    text: 'Olá! Notamos que seu ciclo habitual de reposição está chegando. Seus difusores e essências já estão no fim? Posso separar o seu pedido com as mesmas fragrâncias da última compra ou quer incluir os novos lançamentos?',
  },
  {
    id: 'qr-4',
    shortcut: '/pix',
    title: '💳 Chave Pix & Dados Bancários Oficiais',
    category: 'Financeiro',
    text: 'Segue a nossa Chave Pix Oficial para liquidação com 5% de desconto à vista:\n\n🔑 Chave Pix CNPJ: 12.345.678/0001-90\n🏢 Favorecido: Floresta Verde Aromas do Brasil Ltda\n🏦 Banco: Banco Itaú (341)\n\nApós o pagamento, basta anexar o comprovante por aqui para liberação imediata!',
  },
  {
    id: 'qr-5',
    shortcut: '/boleto',
    title: '📄 2ª Via & Lembrete Amigável de Boleto',
    category: 'Financeiro',
    text: 'Olá! Estamos disponibilizando a 2ª via e o código de barras do seu boleto faturado Floresta Verde com vencimento próximo. Caso já tenha realizado o pagamento, desconsidere esta mensagem. Estamos à disposição!',
  },
  {
    id: 'qr-6',
    shortcut: '/envio',
    title: '🚚 Prazo de Expedição & Rastreio de Mercadoria',
    category: 'Pós-Venda',
    text: 'Seu pedido já foi faturado e liberado para o setor de embalagem e expedição! Nosso prazo padrão de envio é de até 24 a 48h úteis. Assim que a transportadora coletar, enviaremos o código de rastreio direto por este WhatsApp.',
  },
];

export const whatsappStorage = {
  // Check if session exists
  getSession(): WhatsAppSession {
    try {
      const raw = localStorage.getItem(WA_SESSION_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading wa session', e);
    }
    // Default initial state: ready to connect
    return {
      isConnected: false,
      phoneNumber: '',
      connectedAt: '',
      accountName: 'Floresta Verde Atendimento Comercial',
      deviceInfo: 'Navegador Web / Computador',
    };
  },

  // Save session
  saveSession(session: WhatsAppSession): void {
    try {
      localStorage.setItem(WA_SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Error saving wa session', e);
    }
  },

  // Login via QR Code or Pairing Code
  login(phoneNumber: string = '5511988776655', accountName: string = 'Comercial Floresta Verde'): WhatsAppSession {
    const session: WhatsAppSession = {
      isConnected: true,
      phoneNumber,
      connectedAt: new Date().toISOString(),
      accountName,
      deviceInfo: 'Computador Windows (WhatsApp Web v2.24)',
    };
    this.saveSession(session);
    return session;
  },

  // Logout / Disconnect
  logout(): void {
    const session: WhatsAppSession = {
      isConnected: false,
      phoneNumber: '',
      connectedAt: '',
      accountName: 'Floresta Verde Atendimento Comercial',
      deviceInfo: 'Navegador Web / Computador',
    };
    this.saveSession(session);
  },

  // Get all chats, merged with customers and persistent message storage
  getChats(customers: CustomerWithMetrics[], orders: Order[]): WhatsAppChat[] {
    const existingRaw = localStorage.getItem(WA_CHATS_KEY);
    let storedChats: Record<string, WhatsAppMessage[]> = {};
    if (existingRaw) {
      try {
        storedChats = JSON.parse(existingRaw);
      } catch (e) {
        console.warn('Error parsing stored wa chats', e);
      }
    }

    const chats: WhatsAppChat[] = customers.map((c, idx) => {
      const rawPhone = c.whatsapp || c.phone || '11999990000';
      const cleanPhone = rawPhone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      const chatId = c.id;

      // Seed messages if not existing in storage
      let messages: WhatsAppMessage[] = storedChats[chatId];
      if (!messages || messages.length === 0) {
        messages = this.generateSeedMessages(c, orders);
        storedChats[chatId] = messages;
      }

      const lastMsg = messages[messages.length - 1];
      const unreadCount = idx === 0 ? 2 : idx === 2 ? 1 : 0;

      return {
        id: chatId,
        customerId: c.id,
        customerName: c.tradeName || c.name,
        tradeName: c.tradeName,
        phoneNumber: rawPhone,
        segment: c.segment,
        unreadCount,
        lastMessageText: lastMsg ? lastMsg.text : 'Conversa iniciada',
        lastMessageTime: lastMsg ? lastMsg.timestamp : '10:00',
        isOnline: idx % 2 === 0,
        contactPerson: c.contactPerson,
        tags: [
          c.segment === 'b2b' ? 'Atacado B2B' : 'Consumidor B2C',
          c.reactivationStatus === 'em_atraso' ? 'Recompra Atrasada' : 'Em Dia',
        ],
        messages,
      };
    });

    // Save updated back
    try {
      localStorage.setItem(WA_CHATS_KEY, JSON.stringify(storedChats));
    } catch (e) {
      console.warn('Storage save chats error', e);
    }

    return chats;
  },

  // Save single message to chat
  addMessage(chatId: string, message: Omit<WhatsAppMessage, 'id' | 'timestamp' | 'status'>): WhatsAppMessage {
    const existingRaw = localStorage.getItem(WA_CHATS_KEY);
    let storedChats: Record<string, WhatsAppMessage[]> = {};
    if (existingRaw) {
      try {
        storedChats = JSON.parse(existingRaw);
      } catch (e) {
        console.warn('Error parsing wa chats', e);
      }
    }

    const currentList = storedChats[chatId] || [];
    const fullMsg: WhatsAppMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
    };

    currentList.push(fullMsg);
    storedChats[chatId] = currentList;

    try {
      localStorage.setItem(WA_CHATS_KEY, JSON.stringify(storedChats));
    } catch (e) {
      console.warn('Storage save chats error', e);
    }

    return fullMsg;
  },

  // Seed realistic conversation per customer
  generateSeedMessages(c: CustomerWithMetrics, orders: Order[]): WhatsAppMessage[] {
    const clientName = c.contactPerson || c.tradeName || c.name;
    const isB2B = c.segment === 'b2b';
    const custOrders = orders.filter((o) => o.customerId === c.id);
    const hasTerm = custOrders.some((o) => o.isTermPayment);

    const nowTime = new Date();
    const time1 = '09:15';
    const time2 = '09:22';
    const time3 = '09:30';

    if (isB2B) {
      return [
        {
          id: `seed-1-${c.id}`,
          chatId: c.id,
          sender: 'customer',
          senderName: clientName,
          text: `Olá equipe Floresta Verde! Tudo bem? Aqui é ${clientName}. Gostaria de consultar a reposição dos difusores de Bambu e Lavanda para este mês. Vocês têm pronta-entrega?`,
          timestamp: time1,
          status: 'read',
        },
        {
          id: `seed-2-${c.id}`,
          chatId: c.id,
          sender: 'me',
          text: `Olá ${clientName}, tudo excelente por aqui! Sim, temos o lote fresco recém-envasado com estoque total dos difusores de 250ml e essências puras de Lavanda Francesa. Posso preparar a cotação no atacado com faturamento a prazo para 28 dias?`,
          timestamp: time2,
          status: 'read',
        },
        {
          id: `seed-3-${c.id}`,
          chatId: c.id,
          sender: 'customer',
          senderName: clientName,
          text: `Perfeito! Pode montar a proposta para 30 difusores e 20 essências. Se der para mandar o catálogo atualizado em anexo agradeço!`,
          timestamp: time3,
          status: 'read',
        },
      ];
    } else {
      return [
        {
          id: `seed-1-${c.id}`,
          chatId: c.id,
          sender: 'me',
          text: `Olá ${clientName}, tudo bem? Aqui é da Floresta Verde Aromas! Percebemos que você adorou a linha de Home Spray Vanilla. Acabamos de lançar o refil de 1L com valor super especial.`,
          timestamp: time1,
          status: 'read',
        },
        {
          id: `seed-2-${c.id}`,
          chatId: c.id,
          sender: 'customer',
          senderName: clientName,
          text: `Que ótima notícia! Estava mesmo precisando repor para aromatizar a sala. Vocês ainda têm o cupom de frete grátis?`,
          timestamp: time2,
          status: 'read',
        },
      ];
    }
  },
};
