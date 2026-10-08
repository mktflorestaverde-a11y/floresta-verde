import React, { useState, useEffect } from 'react';
import { Trash2, User, X } from 'lucide-react';
import { Customer, CustomerSegment, FunnelStage } from '../../types/crm';

interface CustomerFormModalProps {
  customerToEdit?: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: Omit<Customer, 'id' | 'createdAt'>) => void;
  onDelete?: (customer: Customer) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  customerToEdit,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [segment, setSegment] = useState<CustomerSegment>('b2b');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [document, setDocument] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [channelOrigin, setChannelOrigin] = useState('Prospecção ativa');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('novos_contatos');
  const [assignedTo, setAssignedTo] = useState('');
  const [customCycleDays, setCustomCycleDays] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setTradeName(customerToEdit.tradeName || '');
      setSegment(customerToEdit.segment);
      setEmail(customerToEdit.email);
      setPhone(customerToEdit.phone);
      setWhatsapp(customerToEdit.whatsapp || '');
      setDocument(customerToEdit.document || '');
      setContactPerson(customerToEdit.contactPerson || '');
      setChannelOrigin(customerToEdit.channelOrigin);
      setFunnelStage(customerToEdit.funnelStage);
      setAssignedTo(customerToEdit.assignedTo || '');
      setCustomCycleDays(customerToEdit.customCycleDays ? String(customerToEdit.customCycleDays) : '');
      setNotes(customerToEdit.notes || '');
    } else {
      setName('');
      setTradeName('');
      setSegment('b2b');
      setEmail('');
      setPhone('');
      setWhatsapp('');
      setDocument('');
      setContactPerson('');
      setChannelOrigin('Prospecção ativa');
      setFunnelStage('novos_contatos');
      setAssignedTo('');
      setCustomCycleDays('');
      setNotes('');
    }
    setErrors({});
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Nome ou Razão Social é obrigatório';
    if (!email.trim()) errs.email = 'E-mail é obrigatório';
    if (!phone.trim()) errs.phone = 'Telefone é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: name.trim(),
      tradeName: tradeName.trim() || undefined,
      segment,
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || undefined,
      document: document.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      channelOrigin: channelOrigin.trim(),
      funnelStage,
      assignedTo: assignedTo.trim() || undefined,
      customCycleDays: customCycleDays ? Number(customCycleDays) : undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#ded8c9] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#f8f6f0] border-b border-[#eae5d8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#edf3e6] flex items-center justify-center">
              <User className="w-5 h-5 text-[#465b2d]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1c2918]">
                {customerToEdit ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <p className="text-xs text-[#738268]">
                Cadastre informações comerciais e parâmetros de ciclo.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs md:text-sm">
          {/* Segment Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#2d3b20] mb-1.5">
              Segmento de Atuação *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSegment('b2b')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  segment === 'b2b'
                    ? 'bg-[#485b2e] text-white border-[#485b2e] shadow-xs'
                    : 'bg-[#faf9f6] text-[#4a5a3a] border-[#ded8c9] hover:bg-white'
                }`}
              >
                B2B • Atacado / Lojas
              </button>
              <button
                type="button"
                onClick={() => setSegment('b2c')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  segment === 'b2c'
                    ? 'bg-[#485b2e] text-white border-[#485b2e] shadow-xs'
                    : 'bg-[#faf9f6] text-[#4a5a3a] border-[#ded8c9] hover:bg-white'
                }`}
              >
                B2C • Consumidor Final
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                {segment === 'b2b' ? 'Razão Social *' : 'Nome Completo *'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={segment === 'b2b' ? 'Ex: Essências do Vale Ltda' : 'Ex: Camila Albuquerque'}
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white focus:ring-2 focus:ring-[#556b3c]"
              />
              {errors.name && <span className="text-[11px] text-[#b91c1c] mt-0.5 block">{errors.name}</span>}
            </div>

            {/* Trade Name */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                Nome Fantasia (opcional)
              </label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Ex: Aroma & Bem-Estar"
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document: CNPJ or CPF */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                {segment === 'b2b' ? 'CNPJ' : 'CPF'}
              </label>
              <input
                type="text"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder={segment === 'b2b' ? '00.000.000/0001-00' : '000.000.000-00'}
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                Nome do Responsável / Comprador
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Ex: Renata Silveira"
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white"
              />
              {errors.email && <span className="text-[11px] text-[#b91c1c] mt-0.5 block">{errors.email}</span>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">Telefone *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white"
              />
              {errors.phone && <span className="text-[11px] text-[#b91c1c] mt-0.5 block">{errors.phone}</span>}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="11987654321"
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Channel Origin */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">Origem do Contato</label>
              <select
                value={channelOrigin}
                onChange={(e) => setChannelOrigin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918]"
              >
                <option value="Prospecção ativa">Prospecção ativa</option>
                <option value="Indicação">Indicação</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Instagram">Instagram</option>
                <option value="Feira / Evento">Feira / Evento</option>
                <option value="WhatsApp comercial">WhatsApp comercial</option>
              </select>
            </div>

            {/* Funnel Stage */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">Etapa Atual</label>
              <select
                value={funnelStage}
                onChange={(e) => setFunnelStage(e.target.value as FunnelStage)}
                className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918]"
              >
                {segment === 'b2b' ? (
                  <>
                    <option value="novos_contatos">Novos contatos</option>
                    <option value="qualificados">Qualificados</option>
                    <option value="proposta">Proposta</option>
                    <option value="primeira_compra">1ª compra</option>
                    <option value="recompra">Recompra</option>
                    <option value="perdido">Perdido / Desqualificado</option>
                  </>
                ) : (
                  <>
                    <option value="visitantes">Visitante</option>
                    <option value="carrinho">Carrinho</option>
                    <option value="primeira_compra">1ª compra</option>
                    <option value="recompra">Recompra</option>
                  </>
                )}
              </select>
            </div>

            {/* Custom Cycle Days */}
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                Ciclo Individual (dias)
              </label>
              <input
                type="number"
                min="5"
                max="365"
                value={customCycleDays}
                onChange={(e) => setCustomCycleDays(e.target.value)}
                placeholder="Ex: 40 (opcional)"
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white"
              />
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
              Responsável pelo Atendimento
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Ex: Lucas Ribeiro"
              className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
              Observações & Notas
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferências de aromas, tamanhos de lote, dias ideais para entrega..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] focus:bg-white text-xs md:text-sm"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#eae5d8] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#ded8c9] text-xs font-semibold text-[#5a6a4d] hover:bg-[#f6f4ee] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#495d2f] text-white text-xs font-semibold hover:bg-[#3c4e25] transition-all shadow-xs"
            >
              {customerToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
