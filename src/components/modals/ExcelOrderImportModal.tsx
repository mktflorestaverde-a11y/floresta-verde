import React, { useState, useRef, useId } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  X,
  FileCheck2,
  Building2,
  Package,
  Calendar,
  CreditCard,
  UserCheck,
  UserPlus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Customer, CustomerSegment, Order } from '../../types/crm';
import { parseExcelFile } from '../../utils/excelImporter';
import {
  detectOrderColumnMapping,
  processOrdersExcelData,
  buildOrdersAndCustomersFromImport,
  downloadSampleOrdersTemplate,
  OrderColumnMapping,
  OrdersImportPreviewResult,
} from '../../utils/excelOrdersImporter';
import { formatBRL, formatDateBR } from '../../utils/crmCalculations';

interface ExcelOrderImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCustomers: Customer[];
  onImportComplete: (ordersToInsert: Order[], newCustomersToInsert: Customer[]) => void;
}

export const ExcelOrderImportModal: React.FC<ExcelOrderImportModalProps> = ({
  isOpen,
  onClose,
  existingCustomers,
  onImportComplete,
}) => {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [targetSegment, setTargetSegment] = useState<CustomerSegment>('b2b');

  const [mapping, setMapping] = useState<OrderColumnMapping>({
    customerCol: '',
    dateCol: '',
    totalCol: '',
    itemsCol: '',
    statusCol: '',
    paymentMethodCol: '',
    orderNumberCol: '',
    dueDateCol: '',
  });

  const [preview, setPreview] = useState<OrdersImportPreviewResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    ordersCount: number;
    newCustomersCount: number;
    totalAmount: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setPreview(null);
    setRawHeaders([]);
    setRawRows([]);
    setFileName('');
    setErrorMsg(null);
    setSuccessInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        throw new Error('Por favor envie um arquivo de planilha no formato Excel (.xlsx, .xls) ou .csv.');
      }

      const { headers, rawRows: rows } = await parseExcelFile(file);

      if (rows.length === 0) {
        throw new Error('A planilha está vazia. Verifique os dados e tente novamente.');
      }

      const detected = detectOrderColumnMapping(headers);
      setRawHeaders(headers);
      setRawRows(rows);
      setFileName(file.name);
      setMapping(detected);

      // Processa com mapeamento detectado
      const result = processOrdersExcelData(file.name, headers, rows, detected, existingCustomers);
      setPreview(result);
    } catch (err: any) {
      console.error('Erro ao ler planilha de pedidos:', err);
      setErrorMsg(err.message || 'Falha ao processar o arquivo. Verifique o formato e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemapChange = (field: keyof OrderColumnMapping, value: string) => {
    const updated = { ...mapping, [field]: value };
    setMapping(updated);
    if (rawHeaders.length > 0 && rawRows.length > 0) {
      const result = processOrdersExcelData(fileName, rawHeaders, rawRows, updated, existingCustomers);
      setPreview(result);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || preview.validRows === 0) return;

    setIsSaving(true);
    try {
      const { ordersToInsert, newCustomersToInsert } = buildOrdersAndCustomersFromImport(
        preview.rows,
        targetSegment
      );

      onImportComplete(ordersToInsert, newCustomersToInsert);

      setSuccessInfo({
        ordersCount: ordersToInsert.length,
        newCustomersCount: newCustomersToInsert.length,
        totalAmount: ordersToInsert.reduce((sum, o) => sum + o.totalAmount, 0),
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar pedidos importados.');
    } finally {
      setIsSaving(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="excel-order-import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-[#faf9f5] border border-[#d6cfbe] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#eae5d8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#edf3e6] border border-[#cbdaba] flex items-center justify-center text-[#2d6a4f]">
              <Package className="w-5 h-5 text-[#2d6a4f]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5b6e49]">
                  Importação em Lote
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]/60">
                  Preenchimento de Histórico
                </span>
              </div>
              <h2 id="excel-order-import-modal-title" className="text-lg font-bold text-[#1f2d17]">
                Importar Histórico de Pedidos via Excel
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#738268] hover:bg-[#ede8dc] hover:text-[#1f2d17] transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Success Card */}
          {successInfo ? (
            <div className="bg-white rounded-2xl p-8 border border-[#c8e6c9] shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#e8f5e9] text-[#2e7d32] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1f2d17]">
                  Histórico de Pedidos Importado com Sucesso!
                </h3>
                <p className="text-sm text-[#5a6a4f] mt-1 max-w-lg mx-auto">
                  Os pedidos foram vinculados aos clientes correspondentes e todos os indicadores de recompras, ticket médio e recência foram atualizados em tempo real.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-2">
                <div className="bg-[#faf9f5] border border-[#eae5d8] rounded-2xl p-4">
                  <span className="text-xs text-[#738268]">Pedidos Registrados</span>
                  <div className="text-2xl font-bold text-[#1f2d17] mt-0.5">
                    {successInfo.ordersCount}
                  </div>
                </div>
                <div className="bg-[#faf9f5] border border-[#eae5d8] rounded-2xl p-4">
                  <span className="text-xs text-[#738268]">Novos Clientes Gerados</span>
                  <div className="text-2xl font-bold text-[#2d6a4f] mt-0.5">
                    {successInfo.newCustomersCount}
                  </div>
                </div>
                <div className="bg-[#faf9f5] border border-[#eae5d8] rounded-2xl p-4">
                  <span className="text-xs text-[#738268]">Faturamento Total</span>
                  <div className="text-xl font-bold text-[#1f2d17] mt-0.5 truncate">
                    {formatBRL(successInfo.totalAmount)}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-[#ded8c9] bg-white text-xs font-semibold text-[#3b4e26] hover:bg-[#faf9f5]"
                >
                  Importar Outro Arquivo
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#3b4e26] text-white text-xs font-semibold hover:bg-[#2e3e1d] shadow-sm"
                >
                  Ver Pedidos no CRM
                </button>
              </div>
            </div>
          ) : !preview ? (
            /* Upload Step */
            <div className="space-y-5">
              {/* Guidance Box */}
              <div className="bg-[#edf3e6]/60 border border-[#cbdaba]/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#2c3d1b]">
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-[#243516]">
                    <FileSpreadsheet className="w-4 h-4 text-[#2d6a4f]" />
                    Como funciona a importação de pedidos anteriores:
                  </p>
                  <p className="text-[#495b38]">
                    O sistema lê as vendas passadas da sua planilha e cruza automaticamente com os clientes já cadastrados (por nome, fantasia, e-mail ou telefone). Caso algum cliente ainda não exista, o CRM o cria automaticamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleOrdersTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#2d6a4f]/40 text-[#2d6a4f] font-bold text-xs hover:bg-[#edf3e6] transition-colors shrink-0 shadow-2xs"
                  title="Baixar planilha modelo do Excel preenchida de exemplo"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Planilha Modelo (.xlsx)</span>
                </button>
              </div>

              {/* Segment Selector for imported orders */}
              <div className="bg-white rounded-2xl p-4 border border-[#eae5d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[#1f2d17] block">
                    Segmentação dos Pedidos Deste Arquivo:
                  </span>
                  <span className="text-[11px] text-[#6b7d5a]">
                    Defina se as compras são do atacado lojista ou do consumidor final.
                  </span>
                </div>
                <div className="inline-flex p-1 bg-[#ede8dc] rounded-2xl border border-[#ded8c9]">
                  <button
                    type="button"
                    onClick={() => setTargetSegment('b2b')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      targetSegment === 'b2b'
                        ? 'bg-[#3b4e26] text-white shadow-xs'
                        : 'text-[#546641] hover:text-[#1c2918]'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>B2B • Atacado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetSegment('b2c')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      targetSegment === 'b2c'
                        ? 'bg-[#3b4e26] text-white shadow-xs'
                        : 'text-[#546641] hover:text-[#1c2918]'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>B2C • Consumidor</span>
                  </button>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-[#2d6a4f] bg-[#edf3e6]'
                    : 'border-[#ded8c9] bg-white hover:border-[#2d6a4f]/60 hover:bg-[#faf9f5]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id={fileInputId}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-2xl bg-[#f0eee6] text-[#2d6a4f] flex items-center justify-center">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-[#1f2d17]">
                    Clique aqui ou arraste sua planilha de pedidos
                  </p>
                  <p className="text-xs text-[#738268]">
                    Suporta arquivos Excel (.xlsx, .xls) ou valores separados por vírgula (.csv)
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f1efe9] text-[11px] font-medium text-[#5a6b47] mt-1">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Reconhecimento inteligente de colunas: Cliente, Data, Valor, Itens, Status, Forma de Pagamento</span>
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          ) : (
            /* Preview & Mapping Step */
            <div className="space-y-5">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl p-3.5 border border-[#eae5d8]">
                  <span className="text-[11px] text-[#738268] block">Arquivo</span>
                  <div className="text-sm font-bold text-[#1f2d17] truncate mt-0.5" title={fileName}>
                    {fileName}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-[#eae5d8]">
                  <span className="text-[11px] text-[#738268] block">Total de Pedidos</span>
                  <div className="text-lg font-bold text-[#1f2d17] mt-0.5">
                    {preview.validRows} <span className="text-xs font-normal text-[#738268]">válidos</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-[#eae5d8]">
                  <span className="text-[11px] text-[#738268] block">Clientes Vinculados</span>
                  <div className="text-lg font-bold text-[#2e7d32] mt-0.5 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    <span>{preview.matchedCustomersCount}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-[#eae5d8]">
                  <span className="text-[11px] text-[#738268] block">Faturamento em Lote</span>
                  <div className="text-lg font-bold text-[#1f2d17] mt-0.5 truncate text-[#2d6a4f]">
                    {formatBRL(preview.totalValueSum)}
                  </div>
                </div>
              </div>

              {/* Column Mapping Adjuster Accordion/Box */}
              <div className="bg-white rounded-2xl p-4 border border-[#eae5d8] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2d6a4f]" />
                    <span className="text-xs font-bold text-[#1f2d17]">
                      Mapeamento das Colunas da Planilha
                    </span>
                  </div>
                  <span className="text-[11px] text-[#738268]">
                    Altere caso alguma coluna tenha sido identificada com nome diferente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {/* Cliente */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#48593a] block mb-1">
                      Cliente / Razão / Fantasia *
                    </label>
                    <select
                      value={mapping.customerCol}
                      onChange={(e) => handleRemapChange('customerCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#faf9f5] border border-[#ded8c9] text-xs text-[#1f2d17]"
                    >
                      <option value="">(Selecione)</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Data do Pedido */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#48593a] block mb-1">
                      Data da Venda / Pedido *
                    </label>
                    <select
                      value={mapping.dateCol}
                      onChange={(e) => handleRemapChange('dateCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#faf9f5] border border-[#ded8c9] text-xs text-[#1f2d17]"
                    >
                      <option value="">(Selecione)</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Valor Total */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#48593a] block mb-1">
                      Valor Total (R$) *
                    </label>
                    <select
                      value={mapping.totalCol}
                      onChange={(e) => handleRemapChange('totalCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#faf9f5] border border-[#ded8c9] text-xs text-[#1f2d17]"
                    >
                      <option value="">(Selecione)</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Produtos / Itens */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#48593a] block mb-1">
                      Produtos / Itens Comprados
                    </label>
                    <select
                      value={mapping.itemsCol}
                      onChange={(e) => handleRemapChange('itemsCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#faf9f5] border border-[#ded8c9] text-xs text-[#1f2d17]"
                    >
                      <option value="">(Automático / Padrão)</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#48593a] block mb-1">
                      Status do Pedido
                    </label>
                    <select
                      value={mapping.statusCol}
                      onChange={(e) => handleRemapChange('statusCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#faf9f5] border border-[#ded8c9] text-xs text-[#1f2d17]"
                    >
                      <option value="">(Padrão: Pago)</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Forma de Pagamento */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#48593a] block mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={mapping.paymentMethodCol}
                      onChange={(e) => handleRemapChange('paymentMethodCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#faf9f5] border border-[#ded8c9] text-xs text-[#1f2d17]"
                    >
                      <option value="">(Opcional)</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vencimento Boleto */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#48593a] block mb-1">
                      Vencimento Boleto / Prazo
                    </label>
                    <select
                      value={mapping.dueDateCol}
                      onChange={(e) => handleRemapChange('dueDateCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#faf9f5] border border-[#ded8c9] text-xs text-[#1f2d17]"
                    >
                      <option value="">(Opcional)</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Número do Pedido */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#48593a] block mb-1">
                      Número / Código do Pedido
                    </label>
                    <select
                      value={mapping.orderNumberCol}
                      onChange={(e) => handleRemapChange('orderNumberCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#faf9f5] border border-[#ded8c9] text-xs text-[#1f2d17]"
                    >
                      <option value="">(Automático / Gerar ID)</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-white rounded-2xl border border-[#eae5d8] overflow-hidden">
                <div className="px-4 py-3 bg-[#faf9f5] border-b border-[#eae5d8] flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1f2d17]">
                    Pré-visualização dos Pedidos a Importar ({preview.rows.length})
                  </span>
                  <span className="text-[#738268]">
                    {preview.newCustomersCount > 0
                      ? `${preview.newCustomersCount} clientes serão criados caso não existam no CRM`
                      : 'Todos os clientes foram identificados com sucesso'}
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f5f2e9] text-[#556743] font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="px-3.5 py-2.5">Linha</th>
                        <th className="px-3.5 py-2.5">Vínculo com Cliente</th>
                        <th className="px-3.5 py-2.5">Data</th>
                        <th className="px-3.5 py-2.5">Valor (R$)</th>
                        <th className="px-3.5 py-2.5">Produtos / Itens</th>
                        <th className="px-3.5 py-2.5">Status</th>
                        <th className="px-3.5 py-2.5">Pagamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0ece2]">
                      {preview.rows.map((r) => (
                        <tr key={r.rowIndex} className="hover:bg-[#faf9f5] transition-colors">
                          <td className="px-3.5 py-2.5 text-[#88987d] font-mono text-[11px]">
                            #{r.rowIndex}
                          </td>
                          <td className="px-3.5 py-2.5">
                            {r.matchedCustomer ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]">
                                  <UserCheck className="w-3 h-3" />
                                  Vinculado
                                </span>
                                <div className="font-semibold text-[#1f2d17] text-xs">
                                  {r.matchedCustomer.tradeName || r.matchedCustomer.name}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
                                  <UserPlus className="w-3 h-3" />
                                  Criar Novo Cliente
                                </span>
                                <div className="font-semibold text-[#1f2d17] text-xs">
                                  {r.customerIdentifier}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-[#3b4e26] font-medium whitespace-nowrap">
                            {formatDateBR(r.orderDate)}
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-[#1f2d17] whitespace-nowrap">
                            {formatBRL(r.totalAmount)}
                          </td>
                          <td className="px-3.5 py-2.5 text-[#556743] max-w-xs truncate" title={r.itemsSummary}>
                            {r.itemsSummary}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === 'pago'
                                  ? 'bg-[#e8f5e9] text-[#2e7d32]'
                                  : r.status === 'pendente'
                                  ? 'bg-[#fef3c7] text-[#b45309]'
                                  : 'bg-[#fee2e2] text-[#b91c1c]'
                              }`}
                            >
                              {r.status === 'pago' ? 'Pago' : r.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-[#556743] text-[11px] whitespace-nowrap">
                            {r.paymentMethod}
                            {r.termDueDate && (
                              <span className="block text-[10px] text-[#88987d]">
                                Venc: {formatDateBR(r.termDueDate)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#eae5d8] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={preview ? handleReset : onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#ded8c9] text-xs font-semibold text-[#4a5c37] hover:bg-[#faf9f5] transition-colors"
          >
            {preview ? 'Escolher Outro Arquivo' : 'Cancelar'}
          </button>

          {preview && !successInfo && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isSaving || preview.validRows === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#3b4e26] text-white text-xs font-bold hover:bg-[#2d3d1d] transition-all shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sincronizando e atualizando histórico...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar e Importar {preview.validRows} Pedidos</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
