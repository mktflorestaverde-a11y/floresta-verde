import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronRight,
  Database,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  Key,
  Layers,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { crmStorage } from '../../services/crmStorage';
import { lojaIntegradaApi } from '../../services/lojaIntegradaClient';
import { Customer } from '../../types/crm';

interface LojaIntegradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: { added: number; updated: number; total: number }) => void;
}

export const LojaIntegradaModal: React.FC<LojaIntegradaModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'api' | 'csv' | 'settings'>('api');

  // API Credentials state
  const [chaveApi, setChaveApi] = useState('');
  const [chaveAplicacao, setChaveAplicacao] = useState('');
  const [rememberCreds, setRememberCreds] = useState(true);

  // Status & Loading states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    totalCount?: number;
  } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>('');
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    added: number;
    updated: number;
    total: number;
    message: string;
  } | null>(null);

  // CSV Import state
  const [csvContent, setCsvContent] = useState('');
  const [csvParsedPreview, setCsvParsedPreview] = useState<Array<any>>([]);
  const [csvFileName, setCsvFileName] = useState('');

  // Load saved credentials on modal open
  useEffect(() => {
    if (isOpen) {
      const saved = crmStorage.getLojaIntegradaCredentials();
      if (saved.chaveApi) setChaveApi(saved.chaveApi);
      if (saved.chaveAplicacao) setChaveAplicacao(saved.chaveAplicacao);
      setTestResult(null);
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCredentials = () => {
    if (rememberCreds) {
      crmStorage.saveLojaIntegradaCredentials({
        chaveApi: chaveApi.trim(),
        chaveAplicacao: chaveAplicacao.trim(),
      });
    }
  };

  const handleTestConnection = async () => {
    if (!chaveApi.trim() || !chaveAplicacao.trim()) {
      setTestResult({
        tested: true,
        success: false,
        message: 'Por favor, informe a Chave de API e a Chave de Aplicação.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    handleSaveCredentials();

    try {
      const result = await lojaIntegradaApi.testConnection(chaveApi.trim(), chaveAplicacao.trim());
      setTestResult({
        tested: true,
        success: result.success,
        message: result.message,
        totalCount: result.totalCount,
      });
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err.message || 'Erro ao conectar com a Loja Integrada.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncApi = async () => {
    if (!chaveApi.trim() || !chaveAplicacao.trim()) {
      setTestResult({
        tested: true,
        success: false,
        message: 'Preencha as credenciais da Loja Integrada antes de sincronizar.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncProgress('Conectando à API da Loja Integrada...');
    setSyncResult(null);
    handleSaveCredentials();

    try {
      setSyncProgress('Baixando dados cadastrais dos clientes B2C...');
      const res = await lojaIntegradaApi.fetchClients(chaveApi.trim(), chaveAplicacao.trim(), {
        fetchAll: true,
      });

      if (!res.success) {
        throw new Error(res.message || 'Não foi possível baixar os clientes da Loja Integrada.');
      }

      setSyncProgress(`Processando e salvando ${res.clients.length} clientes na base B2C...`);
      const importStats = crmStorage.importB2CCustomers(res.clients, {
        overwriteExisting: true,
      });

      // Update last sync in storage
      crmStorage.saveLojaIntegradaCredentials({
        chaveApi: chaveApi.trim(),
        chaveAplicacao: chaveAplicacao.trim(),
        lastSyncAt: new Date().toISOString(),
        totalSynced: (crmStorage.getLojaIntegradaCredentials().totalSynced || 0) + importStats.added,
      });

      setSyncResult({
        success: true,
        added: importStats.added,
        updated: importStats.updated,
        total: importStats.total,
        message: `Sincronização concluída com sucesso! ${importStats.added} novo(s) cliente(s) inserido(s) e ${importStats.updated} atualizado(s).`,
      });

      onImportComplete(importStats);
    } catch (err: any) {
      setSyncResult({
        success: false,
        added: 0,
        updated: 0,
        total: 0,
        message: err.message || 'Falha durante o download dos clientes.',
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress('');
    }
  };

  const handleLoadSampleData = async () => {
    setIsSyncing(true);
    setSyncProgress('Carregando amostra de teste com 6 clientes reais da Loja Integrada...');
    try {
      const res = await lojaIntegradaApi.fetchSampleClients();
      if (!res.success) throw new Error(res.message);

      const importStats = crmStorage.importB2CCustomers(res.clients, {
        overwriteExisting: true,
      });

      setSyncResult({
        success: true,
        added: importStats.added,
        updated: importStats.updated,
        total: importStats.total,
        message: `Amostra importada com sucesso! ${importStats.added} cliente(s) adicionados ao funil B2C.`,
      });

      onImportComplete(importStats);
    } catch (err: any) {
      setSyncResult({
        success: false,
        added: 0,
        updated: 0,
        total: 0,
        message: err.message || 'Falha ao carregar amostras.',
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      const parsed = lojaIntegradaApi.parseCsvExport(text);
      setCsvParsedPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleImportCsv = () => {
    if (csvParsedPreview.length === 0) return;

    setIsSyncing(true);
    setSyncProgress(`Importando ${csvParsedPreview.length} clientes da planilha...`);

    try {
      const importStats = crmStorage.importB2CCustomers(csvParsedPreview, {
        overwriteExisting: true,
      });

      setSyncResult({
        success: true,
        added: importStats.added,
        updated: importStats.updated,
        total: importStats.total,
        message: `Planilha importada com sucesso! ${importStats.added} novo(s) cliente(s) cadastrado(s) e ${importStats.updated} atualizado(s).`,
      });

      onImportComplete(importStats);
    } catch (err: any) {
      setSyncResult({
        success: false,
        added: 0,
        updated: 0,
        total: 0,
        message: err.message || 'Erro ao processar planilha.',
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-[#ded8c9] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Loja Integrada Branding */}
        <div className="p-6 bg-[#f4f7f2] border-b border-[#e2ebd9] flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#2e5e2e] text-white flex items-center justify-center shadow-md">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2e5e2e] bg-[#e1efe0] px-2 py-0.5 rounded-full border border-[#c4e0c1]">
                  Integração E-commerce Oficial
                </span>
                <span className="text-[10px] font-semibold text-[#5a6a4d]">
                  API v1 REST
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#1c2918] mt-0.5">
                Importar Clientes B2C da Loja Integrada
              </h2>
              <p className="text-xs text-[#637357]">
                Baixe e sincronize automaticamente toda a sua base de consumidores finais para o CRM Floresta Verde.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#738268] hover:text-[#1c2918] hover:bg-[#ede8dc] transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-[#eae5d8] bg-[#faf9f5] gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'api'
                ? 'border-[#2e5e2e] text-[#2e5e2e] bg-white shadow-2xs'
                : 'border-transparent text-[#6b7b60] hover:text-[#1c2918]'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Direta Loja Integrada</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'csv'
                ? 'border-[#2e5e2e] text-[#2e5e2e] bg-white shadow-2xs'
                : 'border-transparent text-[#6b7b60] hover:text-[#1c2918]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Planilha / Exportação CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'settings'
                ? 'border-[#2e5e2e] text-[#2e5e2e] bg-white shadow-2xs'
                : 'border-transparent text-[#6b7b60] hover:text-[#1c2918]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Regras B2C & Ciclo (30 dias)</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: API DIRETA */}
          {activeTab === 'api' && (
            <div className="space-y-5">
              {/* Step by step callout */}
              <div className="p-4 rounded-2xl bg-[#edf4ec] border border-[#d2e5d0] text-xs text-[#2b4c2b] space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-[#1f3a1f]">
                  <HelpCircle className="w-4 h-4 text-[#2e5e2e]" />
                  <span>Como obter suas chaves no painel da Loja Integrada:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[#3b593b] pl-1">
                  <li>
                    Acesse seu painel em <strong>app.lojaintegrada.com.br</strong>
                  </li>
                  <li>
                    Vá em <strong>Configurações &gt; Chave para API</strong> no menu lateral
                  </li>
                  <li>
                    Copie a <strong>Chave de API</strong> e a <strong>Chave da Aplicação</strong> e cole nos campos abaixo:
                  </li>
                </ol>
              </div>

              {/* API Credentials Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1c2918] mb-1.5 flex items-center justify-between">
                    <span>Chave da API (chave_api)</span>
                    <span className="text-[10px] text-[#2e5e2e] font-semibold">Obrigatório</span>
                  </label>
                  <input
                    type="password"
                    value={chaveApi}
                    onChange={(e) => setChaveApi(e.target.value)}
                    placeholder="Ex: 8a4b6c8d0e1f2g3h..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs md:text-sm text-[#1c2918] focus:bg-white focus:ring-2 focus:ring-[#2e5e2e] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c2918] mb-1.5 flex items-center justify-between">
                    <span>Chave da Aplicação (chave_aplicacao)</span>
                    <span className="text-[10px] text-[#2e5e2e] font-semibold">Obrigatório</span>
                  </label>
                  <input
                    type="password"
                    value={chaveAplicacao}
                    onChange={(e) => setChaveAplicacao(e.target.value)}
                    placeholder="Ex: 99a88b77-66c5-44d3..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs md:text-sm text-[#1c2918] focus:bg-white focus:ring-2 focus:ring-[#2e5e2e] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberCreds"
                  checked={rememberCreds}
                  onChange={(e) => setRememberCreds(e.target.checked)}
                  className="rounded border-[#cbd5e1] text-[#2e5e2e] focus:ring-[#2e5e2e]"
                />
                <label htmlFor="rememberCreds" className="text-xs text-[#526346] cursor-pointer">
                  Salvar chaves no navegador para sincronizações periódicas
                </label>
              </div>

              {/* Actions row: Test button & Download button */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || isSyncing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#2e5e2e] text-[#2e5e2e] hover:bg-[#edf5ec] text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando Chaves...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Testar Conexão</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSyncApi}
                  disabled={isTesting || isSyncing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2e5e2e] hover:bg-[#234823] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Baixando Clientes...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>Baixar e Importar Clientes B2C</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  disabled={isTesting || isSyncing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#f0eee6] hover:bg-[#e4e0d4] text-[#4d5c41] text-xs font-semibold transition-all ml-auto"
                  title="Testar fluxo com 6 clientes de exemplo reais"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Simular com Dados Exemplo</span>
                </button>
              </div>

              {/* Progress Bar / Indicator */}
              {isSyncing && (
                <div className="p-4 rounded-2xl bg-[#f0f7ef] border border-[#cbe3cb] space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1f3a1f]">
                    <span>{syncProgress}</span>
                    <Loader2 className="w-4 h-4 animate-spin text-[#2e5e2e]" />
                  </div>
                  <div className="w-full bg-[#d6ebd5] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#2e5e2e] h-full w-3/4 animate-pulse rounded-full" />
                  </div>
                </div>
              )}

              {/* Test Connection Result Box */}
              {testResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                    testResult.success
                      ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]'
                      : 'bg-[#fff5f5] border-[#fecaca] text-[#991b1b]'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-[#dc2626] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold text-sm">
                      {testResult.success ? 'Conexão Estabelecida!' : 'Falha na Validação'}
                    </p>
                    <p>{testResult.message}</p>
                    {testResult.totalCount !== undefined && (
                      <p className="font-medium text-[#047857]">
                        Base detectada na Loja Integrada: <strong>{testResult.totalCount} clientes</strong> cadastrados.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Sync Finished Result Box */}
              {syncResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                    syncResult.success
                      ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]'
                      : 'bg-[#fff5f5] border-[#fecaca] text-[#991b1b]'
                  }`}
                >
                  {syncResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-[#dc2626] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold text-sm">
                      {syncResult.success ? 'Importação Concluída!' : 'Erro na Importação'}
                    </p>
                    <p>{syncResult.message}</p>
                    {syncResult.success && (
                      <div className="flex items-center gap-4 pt-1 font-semibold">
                        <span>Novos no CRM: +{syncResult.added}</span>
                        <span>Atualizados: {syncResult.updated}</span>
                        <span>Total Processado: {syncResult.total}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CSV / PLANILHA */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <p className="text-xs text-[#526346]">
                Se você já possui o arquivo <strong>CSV ou planilha de clientes exportada da Loja Integrada</strong>, pode carregá-lo diretamente abaixo:
              </p>

              <div className="border-2 border-dashed border-[#ded8c9] rounded-2xl p-6 text-center bg-[#faf9f6] hover:bg-[#f6f3eb] transition-colors relative">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#edf4ec] text-[#2e5e2e] flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1c2918]">
                      {csvFileName ? `Arquivo: ${csvFileName}` : 'Clique para selecionar o arquivo CSV da Loja Integrada'}
                    </p>
                    <p className="text-[11px] text-[#718268]">
                      Suporta colunas Nome, E-mail, Celular/Telefone, CPF e Data de Criação
                    </p>
                  </div>
                </div>
              </div>

              {csvParsedPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1c2918]">
                      Prévia dos Registros ({csvParsedPreview.length} identificados):
                    </span>
                    <button
                      type="button"
                      onClick={handleImportCsv}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2e5e2e] text-white text-xs font-bold hover:bg-[#234823] transition-all shadow-xs"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>Confirmar Importação no B2C</span>
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-[#ded8c9] rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#f0ece2] text-[#4d5c41] font-semibold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Nome</th>
                          <th className="py-2 px-3">E-mail</th>
                          <th className="py-2 px-3">Telefone</th>
                          <th className="py-2 px-3">CPF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eee9db]">
                        {csvParsedPreview.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#fcfbf9]">
                            <td className="py-2 px-3 font-medium text-[#1c2918]">{row.name}</td>
                            <td className="py-2 px-3 text-[#526346]">{row.email}</td>
                            <td className="py-2 px-3 text-[#526346]">{row.phone || '-'}</td>
                            <td className="py-2 px-3 font-mono text-[#526346]">{row.document || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvParsedPreview.length > 5 && (
                    <p className="text-[11px] text-[#718268] text-right">
                      ... e mais {csvParsedPreview.length - 5} cliente(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REGRAS B2C & CICLO */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ded8c9] space-y-3">
                <h4 className="font-bold text-sm text-[#1c2918] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#2e5e2e]" />
                  <span>Como o CRM Floresta Verde organiza os clientes da Loja Integrada</span>
                </h4>
                <p className="text-xs text-[#526346] leading-relaxed">
                  Todos os clientes baixados da Loja Integrada são automaticamente direcionados para a <strong>Divisão B2C • Consumidor Final</strong>, sem misturar com sua base de Atacado / Revendedores B2B:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-[#e5dfd0]">
                    <span className="text-[10px] font-bold uppercase text-[#2e5e2e] block">Ciclo de Recompra</span>
                    <span className="font-bold text-base text-[#1c2918]">30 Dias</span>
                    <p className="text-[11px] text-[#718268] mt-1">
                      Tempo médio estimado para um consumidor recomprar refil de difusor, spray ou sabonete.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#e5dfd0]">
                    <span className="text-[10px] font-bold uppercase text-[#2e5e2e] block">Etapa do Funil</span>
                    <span className="font-bold text-base text-[#1c2918]">1ª Compra / Recompra</span>
                    <p className="text-[11px] text-[#718268] mt-1">
                      Clientes com 1 pedido vão para 1ª Compra. Clientes recorrentes vão para Recompra Ativa.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#e5dfd0]">
                    <span className="text-[10px] font-bold uppercase text-[#2e5e2e] block">Antiduplicação</span>
                    <span className="font-bold text-base text-[#1c2918]">CPF & E-mail</span>
                    <p className="text-[11px] text-[#718268] mt-1">
                      Evita cadastros duplicados ao sincronizar periodicamente a loja.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-[#faf9f5] border-t border-[#eae5d8] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#6b7b60]">
            <Database className="w-3.5 h-3.5 text-[#2e5e2e]" />
            <span>Sincronização com Firestore Ativa</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-[#ded8c9] text-xs font-semibold text-[#5a6a4d] hover:bg-[#f0ece2] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
