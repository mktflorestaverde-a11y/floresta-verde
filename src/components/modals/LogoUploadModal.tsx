import React, { useState, useRef } from 'react';
import {
  Camera,
  Check,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { crmStorage } from '../../services/crmStorage';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string | null;
  onLogoUpdated: (newLogoUrl: string | null) => void;
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  onLogoUpdated,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('O arquivo é muito grande. Escolha uma imagem de até 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setPreviewUrl(dataUrl);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao ler a imagem selecionada.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyLogo = () => {
    if (previewUrl) {
      crmStorage.saveCustomLogo(previewUrl);
      onLogoUpdated(previewUrl);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 700);
    }
  };

  const handleResetToDefault = () => {
    crmStorage.removeCustomLogo();
    setPreviewUrl(null);
    onLogoUpdated(null);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-[#ded8c9] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-[#f8f6f0] border-b border-[#eae5d8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#edf3e6] flex items-center justify-center">
              <Camera className="w-5 h-5 text-[#465b2d]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1c2918]">
                Personalizar Logo da Floresta Verde
              </h2>
              <p className="text-xs text-[#738268]">
                Insira o arquivo original da sua logomarca (PNG, JPG, SVG).
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#495d2f] bg-[#edf3e6]'
                : 'border-[#ded8c9] hover:border-[#495d2f] bg-[#faf9f6]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-[#edf3e6] text-[#465b2d] flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#1c2918]">
              Clique para selecionar ou arraste o arquivo da sua logo aqui
            </p>
            <p className="text-xs text-[#7a8870] mt-1">
              Aceita imagens PNG (fundo transparente recomendado), JPG ou SVG até 5MB
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#fee2e2] text-[#991b1b] text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Live Preview on Sidebar olive green background */}
          <div className="rounded-2xl p-4 bg-[#f8f6f0] border border-[#ece8de]">
            <span className="text-xs font-bold text-[#44552b] uppercase tracking-wider block mb-2">
              Pré-visualização no Menu Lateral
            </span>
            <div className="flex items-center justify-center p-6 bg-[#344322] rounded-xl border border-[#43552d]">
              {previewUrl ? (
                <div className="max-w-[150px] max-h-[160px] flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Pré-visualização da Logo"
                    className="max-h-[150px] w-auto object-contain drop-shadow-md"
                  />
                </div>
              ) : (
                <div className="text-center text-[#cad7b8] text-xs p-4">
                  <span>Utilizando vetor padrão da Floresta Verde</span>
                </div>
              )}
            </div>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#e8f5e9] text-[#2e7d32] text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Logo atualizada e salva com sucesso!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#f8f6f0] border-t border-[#eae5d8] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#667755] hover:text-[#991b1b] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar logo padrão</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#ded8c9] text-xs font-semibold text-[#5a6a4d] hover:bg-[#f6f4ee] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyLogo}
              disabled={!previewUrl}
              className="px-5 py-2 rounded-xl bg-[#495d2f] text-white text-xs font-semibold hover:bg-[#3c4e25] disabled:opacity-50 transition-all shadow-xs"
            >
              Salvar esta Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
