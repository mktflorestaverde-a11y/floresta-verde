import * as XLSX from 'xlsx';
import { Customer } from '../types/crm';
import { formatISODate } from './crmCalculations';

export interface ParsedExcelRow {
  rowIndex: number;
  raw: Record<string, any>;
  name: string;
  tradeName: string;
  phone: string;
  whatsapp: string;
  email: string;
  action: 'insert' | 'update';
  matchedExistingCustomer?: Customer;
  isValid: boolean;
  validationError?: string;
}

export interface ColumnMapping {
  nameCol: string;
  tradeNameCol: string;
  phoneCol: string;
  emailCol: string;
}

export interface ImportPreviewResult {
  fileName: string;
  totalRows: number;
  validRows: number;
  insertCount: number;
  updateCount: number;
  availableColumns: string[];
  detectedMapping: ColumnMapping;
  rows: ParsedExcelRow[];
}

/**
 * Normaliza um texto para comparação (sem acentos, minúsculas, sem espaços extras)
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Limpa e formata números de telefone/whatsapp brasileiros
 */
export function normalizePhone(rawPhone: string | number | null | undefined): { formatted: string; digits: string } {
  if (rawPhone === null || rawPhone === undefined) return { formatted: '', digits: '' };
  const str = String(rawPhone);
  const digits = str.replace(/\D/g, '');

  if (digits.length === 11) {
    // (DD) 9XXXX-XXXX
    return {
      digits,
      formatted: `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`,
    };
  } else if (digits.length === 10) {
    // (DD) XXXX-XXXX
    return {
      digits,
      formatted: `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`,
    };
  } else if (digits.length > 0) {
    return { digits, formatted: str.trim() };
  }
  return { formatted: '', digits: '' };
}

/**
 * Detecta automaticamente o mapeamento de colunas da planilha
 */
export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    nameCol: '',
    tradeNameCol: '',
    phoneCol: '',
    emailCol: '',
  };

  for (const h of headers) {
    const norm = normalizeText(h);

    // Nome Fantasia
    if (!mapping.tradeNameCol && (norm.includes('fantasia') || norm.includes('empresa') || norm.includes('comercial'))) {
      mapping.tradeNameCol = h;
      continue;
    }

    // Nome / Razão Social
    if (!mapping.nameCol && (norm.includes('nome') || norm.includes('razao') || norm.includes('cliente') || norm === 'titular')) {
      mapping.nameCol = h;
      continue;
    }

    // Telefone / Celular / WhatsApp
    if (!mapping.phoneCol && (norm.includes('tel') || norm.includes('cel') || norm.includes('whats') || norm.includes('fone') || norm.includes('contato'))) {
      mapping.phoneCol = h;
      continue;
    }

    // Email
    if (!mapping.emailCol && (norm.includes('mail') || norm.includes('correio'))) {
      mapping.emailCol = h;
      continue;
    }
  }

  // Fallbacks caso os nomes sejam literais
  if (!mapping.nameCol && headers.length > 0) mapping.nameCol = headers[0];
  if (!mapping.tradeNameCol && headers.length > 1) mapping.tradeNameCol = headers[1];
  if (!mapping.phoneCol && headers.length > 2) mapping.phoneCol = headers[2];
  if (!mapping.emailCol && headers.length > 3) mapping.emailCol = headers[3];

  return mapping;
}

/**
 * Lê o arquivo Excel (.xlsx, .xls ou .csv) e devolve as colunas e os dados brutos
 */
export async function parseExcelFile(file: File): Promise<{ headers: string[]; rawRows: Record<string, any>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('A planilha está vazia ou não contém abas.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
          raw: false, // Ler como strings para preservar zeros à esquerda em telefones
        });

        if (json.length === 0) {
          throw new Error('Nenhum dado encontrado na primeira aba da planilha.');
        }

        const headers = Object.keys(json[0] || {});
        resolve({ headers, rawRows: json });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Falha ao ler o arquivo selecionado.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Processa as linhas cruas da planilha mapeando para clientes do CRM e cruzando com existentes
 */
export function processExcelData(
  fileName: string,
  headers: string[],
  rawRows: Record<string, any>[],
  mapping: ColumnMapping,
  existingCustomers: Customer[]
): ImportPreviewResult {
  const rows: ParsedExcelRow[] = [];

  // Mapeamentos de busca rápida para existentes
  const byEmail = new Map<string, Customer>();
  const byPhoneDigits = new Map<string, Customer>();
  const byTradeName = new Map<string, Customer>();
  const byName = new Map<string, Customer>();

  for (const c of existingCustomers) {
    if (c.email) byEmail.set(normalizeText(c.email), c);
    const pDigits = (c.phone || c.whatsapp || '').replace(/\D/g, '');
    if (pDigits.length >= 8) byPhoneDigits.set(pDigits, c);
    if (c.tradeName) byTradeName.set(normalizeText(c.tradeName), c);
    if (c.name) byName.set(normalizeText(c.name), c);
  }

  let insertCount = 0;
  let updateCount = 0;

  rawRows.forEach((row, idx) => {
    const rawName = String(row[mapping.nameCol] || '').trim();
    const rawTradeName = String(row[mapping.tradeNameCol] || '').trim();
    const rawPhone = String(row[mapping.phoneCol] || '').trim();
    const rawEmail = String(row[mapping.emailCol] || '').trim();

    // Se a linha estiver totalmente em branco, ignorar
    if (!rawName && !rawTradeName && !rawPhone && !rawEmail) {
      return;
    }

    const name = rawName || rawTradeName || 'Cliente sem nome';
    const tradeName = rawTradeName || '';
    const email = rawEmail;
    const phoneObj = normalizePhone(rawPhone);
    const phone = phoneObj.formatted;
    const whatsapp = phoneObj.formatted;

    // Verificar se já existe
    let matched: Customer | undefined;
    if (email && byEmail.has(normalizeText(email))) {
      matched = byEmail.get(normalizeText(email));
    } else if (phoneObj.digits.length >= 8 && byPhoneDigits.has(phoneObj.digits)) {
      matched = byPhoneDigits.get(phoneObj.digits);
    } else if (tradeName && byTradeName.has(normalizeText(tradeName))) {
      matched = byTradeName.get(normalizeText(tradeName));
    } else if (name && byName.has(normalizeText(name))) {
      matched = byName.get(normalizeText(name));
    }

    const action: 'insert' | 'update' = matched ? 'update' : 'insert';
    if (action === 'insert') {
      insertCount++;
    } else {
      updateCount++;
    }

    const isValid = Boolean(name || tradeName || phone || email);
    const validationError = !isValid ? 'Linha sem dados suficientes para cadastro' : undefined;

    rows.push({
      rowIndex: idx + 2, // Excel 1-based, compensando cabeçalho na linha 1
      raw: row,
      name,
      tradeName,
      phone,
      whatsapp,
      email,
      action,
      matchedExistingCustomer: matched,
      isValid,
      validationError,
    });
  });

  return {
    fileName,
    totalRows: rows.length,
    validRows: rows.filter((r) => r.isValid).length,
    insertCount,
    updateCount,
    availableColumns: headers,
    detectedMapping: mapping,
    rows,
  };
}

/**
 * Cria os objetos Customer prontos para salvar no CRM
 */
export function buildCustomersFromImport(
  parsedRows: ParsedExcelRow[],
  targetSegment: 'b2b' | 'b2c' = 'b2b'
): { toInsert: Customer[]; toUpdate: Customer[] } {
  const toInsert: Customer[] = [];
  const toUpdate: Customer[] = [];
  const today = formatISODate(new Date());

  for (const r of parsedRows) {
    if (!r.isValid) continue;

    if (r.action === 'update' && r.matchedExistingCustomer) {
      const existing = r.matchedExistingCustomer;
      const updated: Customer = {
        ...existing,
        name: r.name || existing.name,
        tradeName: r.tradeName || existing.tradeName,
        phone: r.phone || existing.phone,
        whatsapp: r.whatsapp || existing.whatsapp || r.phone,
        email: r.email || existing.email,
        // Garantir canal de origem informativo se não tiver
        channelOrigin: existing.channelOrigin || 'Planilha Excel',
      };
      toUpdate.push(updated);
    } else {
      const newCust: Customer = {
        id: `cust-excel-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: r.name,
        tradeName: r.tradeName || undefined,
        segment: targetSegment,
        email: r.email || '',
        phone: r.phone || '',
        whatsapp: r.whatsapp || r.phone || '',
        channelOrigin: 'Planilha Excel',
        funnelStage: 'novos_contatos',
        assignedTo: 'Equipe Comercial',
        createdAt: today,
        notes: `Importado via planilha Excel em ${new Date().toLocaleDateString('pt-BR')}.`,
      };
      toInsert.push(newCust);
    }
  }

  return { toInsert, toUpdate };
}

/**
 * Gera e baixa uma planilha modelo do Excel (.xlsx) para o usuário usar como referência
 */
export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    {
      'Nome': 'Aromas & Bem Estar Ltda',
      'Nome Fantasia': 'AromaViva Emporio',
      'Telefone': '(11) 98765-4321',
      'Email': 'compras@aromaviva.com.br',
    },
    {
      'Nome': 'Boutique Essência da Mata ME',
      'Nome Fantasia': 'Mata Verde Cosméticos',
      'Telefone': '(21) 99887-1122',
      'Email': 'contato@mataverde.com.br',
    },
    {
      'Nome': 'Distribuidora Serra Verde Eireli',
      'Nome Fantasia': 'Serra Verde Distribuidora',
      'Telefone': '(31) 3344-5566',
      'Email': 'pedidos@serraverde.com.br',
    },
    {
      'Nome': 'Casa & Jardim Decorações Ltda',
      'Nome Fantasia': 'Espaço Casa Jardim',
      'Telefone': '(41) 98877-6655',
      'Email': 'gerencia@casajardim.com.br',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Ajustar largura visual das colunas
  worksheet['!cols'] = [
    { wch: 32 }, // Nome
    { wch: 28 }, // Nome Fantasia
    { wch: 20 }, // Telefone
    { wch: 32 }, // Email
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

  XLSX.writeFile(workbook, 'modelo_importacao_clientes_floresta_verde.xlsx');
}
