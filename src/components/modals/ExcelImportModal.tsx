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
  Phone,
  Mail,
  User,
  ArrowRight,
} from 'lucide-react';
import { Customer } from '../../types/crm';
import {
  parseExcelFile,
  detectColumnMapping,
  processExcelData,
  buildCustomersFromImport,
  downloadSampleExcelTemplate,
  ColumnMapping,
  ImportPreviewResult,
} from '../../utils/excelImporter';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCustomers: Customer[];
  onImportComplete: (toInsert: Customer[], toUpdate: Customer[]) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
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
  const [mapping, setMapping] = useState<ColumnMapping>({
    nameCol: '',
    tradeNameCol: '',
    phoneCol: '',
    emailCol: '',
  });

  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ inserted: number; updated: number } | null>(null);

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

      const detected = detectColumnMapping(headers);
      setRawHeaders(headers);
      setRawRows(rows);
      setFileName(file.name);
      setMapping(detected);

      // Processa com mapeamento detectado
      const result = processExcelData(file.name, headers, rows, detected, existingCustomers);
      setPreview(result);
    } catch (err: any) {
      console.error('Erro ao processar planilha:', err);
      setErrorMsg(err.message || 'Não foi possível ler o arquivo Excel. Verifique se o formato está correto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleMappingChange = (key: keyof ColumnMapping, column: string) => {
    const updated = { ...mapping, [key]: column };
    setMapping(updated);
    if (rawRows.length > 0) {
      const result = processExcelData(fileName, rawHeaders, rawRows, updated, existingCustomers);
      setPreview(result);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || preview.validRows === 0) return;

    setIsSaving(true);
    try {
      const { toInsert, toUpdate } = buildCustomersFromImport(preview.rows, 'b2b');
      onImportComplete(toInsert, toUpdate);
      setSuccessInfo({ inserted: toInsert.length, updated: toUpdate.length });
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao salvar os clientes importados.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#e5e1d8] flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#e5e1d8] bg-[#faf8f5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1b4332]/10 border border-[#1b4332]/20 flex items-center justify-center text-[#1b4332]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1b4332] font-serif tracking-tight">
                Importar Clientes via Planilha Excel
              </h2>
              <p className="text-xs text-neutral-500">
                Preenchimento automático direto para o Funil de Vendas B2B com atualização de contatos existentes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <span className="font-semibold">Atenção ao importar planilha: </span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Success Screen */}
          {successInfo ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#1b4332] font-serif">
                  Importação concluída com sucesso!
                </h3>
                <p className="text-xs text-neutral-600">
                  Os clientes já foram organizados no CRM e estão disponíveis na aba de Clientes e no Funil B2B.
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-xl bg-[#faf8f5] border border-[#e5e1d8] flex items-center justify-around text-center">
                <div>
                  <span className="block text-2xl font-bold text-[#1b4332] font-mono tabular-nums">
                    {successInfo.inserted}
                  </span>
                  <span className="text-[11px] text-neutral-500 uppercase font-semibold">Novos Clientes</span>
                </div>
                <div className="h-8 w-px bg-[#ded8c9]" />
                <div>
                  <span className="block text-2xl font-bold text-amber-700 font-mono tabular-nums">
                    {successInfo.updated}
                  </span>
                  <span className="text-[11px] text-neutral-500 uppercase font-semibold">Atualizados</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#2d6a4f] transition-colors shadow-sm"
                >
                  Ver Clientes no CRM
                </button>
              </div>
            </div>
          ) : !preview ? (
            /* Upload Screen */
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#2d6a4f] bg-emerald-50/50 scale-[0.99]'
                    : 'border-[#ded8c9] hover:border-[#2d6a4f] bg-[#faf8f5]/60 hover:bg-[#faf8f5]'
                }`}
              >
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-[#ded8c9] text-[#1b4332] flex items-center justify-center mx-auto mb-4">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <div className="space-y-1.5 max-w-sm mx-auto">
                  <p className="text-sm font-semibold text-neutral-800">
                    Clique para selecionar ou arraste o seu arquivo Excel
                  </p>
                  <p className="text-xs text-neutral-500">
                    Formatos suportados: <span className="font-mono text-neutral-700">.xlsx</span>,{' '}
                    <span className="font-mono text-neutral-700">.xls</span> ou{' '}
                    <span className="font-mono text-neutral-700">.csv</span>
                  </p>
                </div>

                <div className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#2d6a4f] transition-colors shadow-xs">
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processando arquivo...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      Escolher Planilha do Computador
                    </>
                  )}
                </div>
              </div>

              {/* Format guidance and Download Sample */}
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e5e1d8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#1b4332] flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-700" />
                    Colunas esperadas na sua planilha:
                  </h4>
                  <div className="text-xs text-neutral-600 flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-neutral-800">Nome</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-neutral-800">Nome Fantasia</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-neutral-800">Telefone</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-neutral-800">Email</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Não se preocupe se os títulos tiverem acentos ou maiúsculas, o sistema detecta automaticamente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={downloadSampleExcelTemplate}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#ded8c9] bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-[#1b4332] transition-colors shrink-0 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  Baixar Planilha Modelo (.xlsx)
                </button>
              </div>
            </div>
          ) : (
            /* Preview & Mapping Screen */
            <div className="space-y-5">
              {/* Top Banner Stats */}
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e5e1d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1b4332] font-mono truncate max-w-xs">
                      {preview.fileName}
                    </span>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-[11px] text-[#2d6a4f] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Trocar arquivo
                    </button>
                  </div>
                  <div className="text-xs text-neutral-600 flex items-center gap-2">
                    <span>
                      <strong className="font-mono tabular-nums text-neutral-900">{preview.validRows}</strong> linhas
                      válidas
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700">
                      <strong className="font-mono tabular-nums">{preview.insertCount}</strong> novos clientes
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-700">
                      <strong className="font-mono tabular-nums">{preview.updateCount}</strong> existentes a atualizar
                    </span>
                  </div>
                </div>

                <div className="text-xs text-neutral-500 bg-white px-3 py-1.5 rounded-lg border border-[#e5e1d8] shrink-0">
                  Destino: <strong className="text-[#1b4332]">Funil de Vendas B2B</strong>
                </div>
              </div>

              {/* Column Mapping Selector */}
              <div className="p-4 rounded-xl bg-white border border-[#e5e1d8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-700" />
                    Mapeamento de Colunas Detectado
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Ajuste se alguma coluna não corresponder ao título da sua planilha
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Nome */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-600 flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-400" />
                      Nome / Razão Social
                    </label>
                    <select
                      value={mapping.nameCol}
                      onChange={(e) => handleMappingChange('nameCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#ded8c9] bg-white text-xs font-medium text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-[#2d6a4f]"
                    >
                      <option value="">-- Não mapear --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nome Fantasia */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-600 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-neutral-400" />
                      Nome Fantasia
                    </label>
                    <select
                      value={mapping.tradeNameCol}
                      onChange={(e) => handleMappingChange('tradeNameCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#ded8c9] bg-white text-xs font-medium text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-[#2d6a4f]"
                    >
                      <option value="">-- Não mapear --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Telefone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      Telefone / Celular
                    </label>
                    <select
                      value={mapping.phoneCol}
                      onChange={(e) => handleMappingChange('phoneCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#ded8c9] bg-white text-xs font-medium text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-[#2d6a4f]"
                    >
                      <option value="">-- Não mapear --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-600 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-neutral-400" />
                      E-mail
                    </label>
                    <select
                      value={mapping.emailCol}
                      onChange={(e) => handleMappingChange('emailCol', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#ded8c9] bg-white text-xs font-medium text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-[#2d6a4f]"
                    >
                      <option value="">-- Não mapear --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Grid Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span className="font-semibold text-neutral-800">
                    Pré-visualização dos Registros ({preview.rows.length} linhas)
                  </span>
                  <span className="text-[11px] text-neutral-500">Mostrando dados que serão salvos no CRM</span>
                </div>

                <div className="border border-[#e5e1d8] rounded-xl overflow-hidden max-h-72 overflow-y-auto bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#faf8f5] text-[11px] font-semibold text-neutral-700 sticky top-0 border-b border-[#e5e1d8] z-10">
                      <tr>
                        <th className="py-2.5 px-3 font-mono">Linha</th>
                        <th className="py-2.5 px-3">Nome / Razão</th>
                        <th className="py-2.5 px-3">Nome Fantasia</th>
                        <th className="py-2.5 px-3">Telefone</th>
                        <th className="py-2.5 px-3">E-mail</th>
                        <th className="py-2.5 px-3 text-right">Ação no CRM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0ece1]">
                      {preview.rows.map((r, i) => (
                        <tr
                          key={i}
                          className={`hover:bg-[#faf8f5] transition-colors ${
                            !r.isValid ? 'bg-red-50/50 text-red-900' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-mono text-[11px] text-neutral-400 tabular-nums">
                            {r.rowIndex}
                          </td>
                          <td className="py-2 px-3 font-medium text-neutral-800 max-w-[160px] truncate">
                            {r.name || '—'}
                          </td>
                          <td className="py-2 px-3 text-neutral-600 max-w-[140px] truncate">
                            {r.tradeName || '—'}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-neutral-700 whitespace-nowrap">
                            {r.phone || '—'}
                          </td>
                          <td className="py-2 px-3 text-neutral-600 max-w-[160px] truncate">
                            {r.email || '—'}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            {r.action === 'update' ? (
                              <span className="text-[11px] font-medium text-amber-700">
                                Atualizar cadastro
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-emerald-700">
                                Novo cliente
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

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#e5e1d8] bg-[#faf8f5] flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-500">
            {preview && !successInfo && (
              <span>
                Total de <strong className="font-mono text-neutral-800">{preview.validRows}</strong> contatos prontos
                para o Funil B2B
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#ded8c9] bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs"
            >
              {successInfo ? 'Fechar' : 'Cancelar'}
            </button>

            {preview && !successInfo && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSaving || preview.validRows === 0}
                className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#2d6a4f] disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Gravando no CRM...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    Confirmar e Importar {preview.validRows} Clientes
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
