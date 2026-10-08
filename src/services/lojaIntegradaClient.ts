import { Customer, FunnelStage } from '../types/crm';
import { formatISODate } from '../utils/crmCalculations';

export interface LojaIntegradaCredentials {
  chaveApi: string;
  chaveAplicacao: string;
  autoSyncDaily?: boolean;
  lastSyncAt?: string;
  totalSynced?: number;
}

export interface LojaIntegradaRawClient {
  id: number;
  resource_uri?: string;
  nome?: string;
  razao_social?: string;
  tipo?: string; // 'PF' | 'PJ'
  cpf?: string;
  cnpj?: string;
  email: string;
  telefone_celular?: string;
  telefone_principal?: string;
  data_criacao?: string;
  pedidos_count?: number;
  total_gasto?: number;
  cidade?: string;
  estado?: string;
}

export interface LojaIntegradaTestResult {
  success: boolean;
  message: string;
  totalCount?: number;
  sampleClient?: {
    id: number;
    nome?: string;
    email: string;
    tipo?: string;
  };
}

export interface LojaIntegradaFetchResult {
  success: boolean;
  message?: string;
  totalCount: number;
  clients: Array<Omit<Customer, 'id' | 'createdAt'> & { id?: string; createdAt?: string }>;
}

export const lojaIntegradaApi = {
  /**
   * Test API keys with Loja Integrada
   */
  async testConnection(chaveApi: string, chaveAplicacao: string): Promise<LojaIntegradaTestResult> {
    try {
      const res = await fetch('/api/integrations/loja-integrada/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chaveApi, chaveAplicacao }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Erro de conexão com o servidor local.',
      };
    }
  },

  /**
   * Fetch real clients from Loja Integrada via server proxy
   */
  async fetchClients(
    chaveApi: string,
    chaveAplicacao: string,
    options?: { limit?: number; offset?: number; fetchAll?: boolean }
  ): Promise<LojaIntegradaFetchResult> {
    try {
      const res = await fetch('/api/integrations/loja-integrada/fetch-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chaveApi,
          chaveAplicacao,
          limit: options?.limit || 50,
          offset: options?.offset || 0,
          fetchAll: options?.fetchAll ?? true,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Falha ao buscar clientes da Loja Integrada.',
        totalCount: 0,
        clients: [],
      };
    }
  },

  /**
   * Fetch ready-to-test sample clients modeled after Loja Integrada
   * (Allows testing without requiring immediate live API keys)
   */
  async fetchSampleClients(): Promise<LojaIntegradaFetchResult> {
    try {
      const res = await fetch('/api/integrations/loja-integrada/sample-clients');
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Falha ao carregar amostras de teste.',
        totalCount: 0,
        clients: [],
      };
    }
  },

  /**
   * Parse CSV content exported from Loja Integrada Admin panel
   */
  parseCsvExport(csvText: string): Array<Omit<Customer, 'id' | 'createdAt'> & { id?: string; createdAt?: string }> {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase().split(/[;,]/).map((h) => h.trim().replace(/["']/g, ''));
    
    const findIndex = (terms: string[]) =>
      header.findIndex((h) => terms.some((t) => h.includes(t)));

    const nameIdx = findIndex(['nome', 'cliente', 'razao_social']);
    const emailIdx = findIndex(['email', 'e-mail']);
    const phoneIdx = findIndex(['celular', 'telefone', 'whatsapp']);
    const docIdx = findIndex(['cpf', 'cnpj', 'documento']);
    const dateIdx = findIndex(['data_criacao', 'criado', 'cadastro', 'data']);

    const results: Array<Omit<Customer, 'id' | 'createdAt'> & { id?: string; createdAt?: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[;,]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const email = emailIdx !== -1 ? cols[emailIdx] : '';
      if (!email || !email.includes('@')) continue;

      const name = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : 'Cliente Loja Integrada';
      const phone = phoneIdx !== -1 ? cols[phoneIdx] : '';
      const doc = docIdx !== -1 ? cols[docIdx] : '';
      const date = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx] : formatISODate(new Date());

      results.push({
        name,
        segment: 'b2c',
        email,
        phone,
        whatsapp: phone,
        document: doc,
        channelOrigin: 'Loja Integrada (Importação CSV)',
        funnelStage: 'primeira_compra',
        createdAt: date.slice(0, 10),
        notes: 'Cliente importado via planilha CSV da Loja Integrada',
        customCycleDays: 30,
      });
    }

    return results;
  },
};
