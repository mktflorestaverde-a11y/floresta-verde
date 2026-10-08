import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Filter,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { CRMUserAccount, UserRole } from '../../types/crm';
import { CRMAuthUser, crmStorage } from '../../services/crmStorage';

interface UserManagementViewProps {
  currentUser: CRMAuthUser | null;
  onRefreshData?: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  onRefreshData,
}) => {
  const isMaster = crmStorage.isUserMaster(currentUser);

  const [users, setUsers] = useState<CRMUserAccount[]>(() => crmStorage.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CRMUserAccount | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<CRMUserAccount | null>(null);
  const [userToDelete, setUserToDelete] = useState<CRMUserAccount | null>(null);
  const [newlyCreatedCreds, setNewlyCreatedCreds] = useState<{
    username: string;
    password?: string;
    name: string;
    roleLabel: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for Create User
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState<UserRole>('comercial');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Form states for Reset Password
  const [newResetPassword, setNewResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const reloadUsers = () => {
    setUsers(crmStorage.getUsers());
    if (onRefreshData) onRefreshData();
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage(null);
    }, 4500);
  };

  const roleMeta: Record<UserRole, { label: string; badgeClass: string; desc: string }> = {
    master: {
      label: 'Master • Administrador Geral',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
      desc: 'Acesso irrestrito a todo o CRM, criação de novos usuários e parametrizações.',
    },
    diretor: {
      label: 'Diretoria Executiva',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      desc: 'Visão completa de relatórios, faturamento, histórico e funis estratégicos.',
    },
    comercial: {
      label: 'Equipe Comercial',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-200',
      desc: 'Gestão de clientes, pedidos, pipelines de atacado B2B e jornada B2C.',
    },
    vendedor: {
      label: 'Vendedor / Representante',
      badgeClass: 'bg-teal-100 text-teal-900 border-teal-200',
      desc: 'Atendimento direto, cadastro de clientes e inserção de novos pedidos.',
    },
    financeiro: {
      label: 'Financeiro & Boletos',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
      desc: 'Controle de vendas a prazo, vencimento de boletos e liquidação de títulos.',
    },
  };

  // Helper to generate a friendly secure password
  const generateStrongPassword = () => {
    const prefixes = ['FV', 'Aroma', 'Verde', 'Floresta', 'Essencia'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const symbols = ['!', '@', '#', '$'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    return `${prefix}${randomNum}${symbol}`;
  };

  const handleOpenCreateModal = () => {
    setFormName('');
    setFormUsername('');
    const randomPass = generateStrongPassword();
    setFormPassword(randomPass);
    setShowPassword(true);
    setFormRole('comercial');
    setFormEmail('');
    setFormPhone('');
    setFormNotes('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Auto-generate username from name if not manually modified
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!formUsername || formUsername === formName.toUpperCase().replace(/[^A-Z0-9]/g, '')) {
      const simplified = val
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      setFormUsername(simplified);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Informe o nome completo do usuário.');
      return;
    }
    if (!formUsername.trim()) {
      setFormError('Informe um usuário de login válido.');
      return;
    }
    if (!formPassword.trim() || formPassword.trim().length < 4) {
      setFormError('A senha deve ter no mínimo 4 caracteres.');
      return;
    }

    const res = crmStorage.addUser({
      name: formName.trim(),
      username: formUsername.trim().toUpperCase(),
      password: formPassword.trim(),
      role: formRole,
      roleLabel: roleMeta[formRole].label,
      isMaster: formRole === 'master',
      status: 'ativo',
      email: formEmail.trim() || undefined,
      phone: formPhone.trim() || undefined,
      notes: formNotes.trim() || undefined,
      createdBy: currentUser?.name || 'Master',
    });

    if (res.success && res.user) {
      setIsCreateModalOpen(false);
      reloadUsers();
      setNewlyCreatedCreds({
        username: res.user.username,
        password: formPassword.trim(),
        name: res.user.name,
        roleLabel: res.user.roleLabel,
      });
      showNotification('success', `Acesso do usuário "${res.user.name}" gerado com sucesso!`);
    } else {
      setFormError(res.message || 'Erro ao criar usuário.');
    }
  };

  const handleToggleStatus = (user: CRMUserAccount) => {
    if (user.username.toUpperCase() === 'CESARDIRETOR') {
      showNotification('error', 'O usuário Master principal não pode ser inativado.');
      return;
    }

    const newStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
    const res = crmStorage.updateUser(user.id, { status: newStatus });
    if (res.success) {
      reloadUsers();
      showNotification(
        'success',
        `Usuário "${user.name}" foi ${newStatus === 'ativo' ? 'ativado' : 'bloqueado'} com sucesso.`
      );
    } else {
      showNotification('error', res.message || 'Erro ao alterar status.');
    }
  };

  const handleDeleteUser = (user: CRMUserAccount) => {
    if (user.username.toUpperCase() === 'CESARDIRETOR') {
      showNotification('error', 'O usuário Master raiz (CESARDIRETOR) é protegido e não pode ser excluído.');
      return;
    }
    setUserToDelete(user);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const target = userToDelete;
    const res = crmStorage.deleteUser(target.id);
    if (res.success) {
      setUserToDelete(null);
      if (editingUser?.id === target.id) {
        setEditingUser(null);
      }
      reloadUsers();
      showNotification('success', `Acesso do usuário "${target.name}" (@${target.username}) foi excluído com sucesso.`);
    } else {
      showNotification('error', res.message || 'Erro ao excluir usuário.');
    }
  };

  const handleOpenResetPassword = (user: CRMUserAccount) => {
    setPasswordResetUser(user);
    const pass = generateStrongPassword();
    setNewResetPassword(pass);
    setShowResetPassword(true);
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    if (!newResetPassword.trim() || newResetPassword.trim().length < 4) {
      alert('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }

    const res = crmStorage.updateUser(passwordResetUser.id, {
      password: newResetPassword.trim(),
    });

    if (res.success) {
      const updatedUser = passwordResetUser;
      const pass = newResetPassword.trim();
      setPasswordResetUser(null);
      reloadUsers();
      setNewlyCreatedCreds({
        username: updatedUser.username,
        password: pass,
        name: updatedUser.name,
        roleLabel: updatedUser.roleLabel,
      });
      showNotification('success', `Senha do usuário "${updatedUser.name}" redefinida com sucesso!`);
    } else {
      showNotification('error', res.message || 'Erro ao redefinir senha.');
    }
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = crmStorage.updateUser(editingUser.id, {
      name: editingUser.name,
      role: editingUser.role,
      roleLabel: roleMeta[editingUser.role].label,
      isMaster: editingUser.role === 'master',
      status: editingUser.status,
      email: editingUser.email,
      phone: editingUser.phone,
      notes: editingUser.notes,
    });

    if (res.success) {
      setEditingUser(null);
      reloadUsers();
      showNotification('success', 'Cadastro atualizado com sucesso.');
    } else {
      alert(res.message || 'Erro ao atualizar dados.');
    }
  };

  const copyCredsToClipboard = (username: string, password?: string, name?: string) => {
    const appUrl = window.location.origin;
    const text = `🌿 *ACESSO AO CRM FLORESTA VERDE*\n\nOlá, ${name || 'Colaborador(a)'}!\nSeu acesso foi liberado pela Diretoria Master.\n\n🔗 *Link do Sistema:* ${appUrl}\n👤 *Usuário:* ${username}\n🔑 *Senha:* ${password || '(Senha mantida)'}\n\n_Guarde seus dados com segurança e confidencialidade._`;

    navigator.clipboard.writeText(text);
    setCopiedId(username);
    setTimeout(() => setCopiedId(null), 3000);
    showNotification('success', 'Dados de acesso copiados para a área de transferência! Pronto para colar no WhatsApp ou E-mail.');
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.roleLabel || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const activeCount = users.filter((u) => u.status === 'ativo').length;
  const inactiveCount = users.filter((u) => u.status === 'inativo').length;
  const masterCount = users.filter((u) => u.isMaster || u.role === 'master').length;

  // Non-master security block
  if (!isMaster) {
    return (
      <div className="px-4 md:px-8 py-10 max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-3xl border border-[#ded8c9] p-8 md:p-12 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-5">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2d3a1f]">
            Acesso Restrito ao Master
          </h2>
          <p className="text-sm text-[#66735e] mt-2 max-w-md">
            A criação e gestão de acessos de novos usuários é restrita ao perfil Master (<strong>CESARDIRETOR</strong>).
          </p>
          <div className="mt-6 p-4 rounded-xl bg-[#faf9f6] border border-[#e6e1d4] text-xs text-[#526343] text-left max-w-md w-full">
            <p className="font-semibold text-[#2d3a1f] mb-1">
              Perfil autenticado atualmente:
            </p>
            <p>• Nome: {currentUser?.name || 'Não identificado'}</p>
            <p>• Usuário: {currentUser?.username || '-'}</p>
            <p>• Função: {currentUser?.role || '-'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-medium flex items-center justify-between shadow-xs transition-all ${
            actionMessage.type === 'success'
              ? 'bg-[#eaf4e0] border-[#c0dda8] text-[#224419]'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs p-1 opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header / Top Control Panel */}
      <div className="bg-white rounded-3xl border border-[#ded8c9] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#344322] text-[#d4e4c3] text-xs font-semibold tracking-wide border border-[#485d2f]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#a8d386]" />
              <span>Painel Master Exclusivo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1e291b] tracking-tight">
              Gerador de Novos Acessos & Usuários
            </h1>
            <p className="text-xs sm:text-sm text-[#66735e] max-w-2xl leading-relaxed">
              Crie credenciais de acesso seguras para novos colaboradores, defina permissões por cargo, ative/inative acessos e compartilhe logins com 1 clique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="py-3 px-5 rounded-2xl bg-[#485b2e] hover:bg-[#3b4b25] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Gerar Novo Acesso</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#f0ede4]">
          <div className="p-3.5 rounded-2xl bg-[#faf9f6] border border-[#eee9dc]">
            <span className="text-[11px] font-semibold text-[#768568] block">Total Cadastrado</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#1f2b18]">{users.length}</span>
              <span className="text-[11px] text-[#768568]">usuários</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#f0f7ec] border border-[#d5e8ce]">
            <span className="text-[11px] font-semibold text-[#326129] block">Acessos Ativos</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#234c1b]">{activeCount}</span>
              <span className="text-[11px] text-[#326129]">liberados</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[11px] font-semibold text-amber-800 block">Inativos / Bloqueados</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-amber-900">{inactiveCount}</span>
              <span className="text-[11px] text-amber-800">suspensos</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80">
            <span className="text-[11px] font-semibold text-purple-800 block">Perfil Master</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-purple-900">{masterCount}</span>
              <span className="text-[11px] text-purple-800">administrador</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#ded8c9] p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f8e71]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, usuário, e-mail ou cargo..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-[#1c2918] placeholder:text-[#99a68d] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs font-medium text-[#2d3a20] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
          >
            <option value="all">Todos os Cargos</option>
            <option value="master">Master</option>
            <option value="diretor">Diretoria</option>
            <option value="comercial">Comercial</option>
            <option value="vendedor">Vendedor</option>
            <option value="financeiro">Financeiro</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs font-medium text-[#2d3a20] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Apenas Ativos</option>
            <option value="inativo">Apenas Inativos</option>
          </select>

          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-[#586c42] hover:text-[#2d3a20] underline px-2 py-1"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Users List Grid / Table */}
      <div className="bg-white rounded-3xl border border-[#ded8c9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f5ed] border-b border-[#e7e2d5] text-[11px] font-semibold text-[#5d6e4b] uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Usuário / Colaborador</th>
                <th className="py-3.5 px-4">Login de Acesso</th>
                <th className="py-3.5 px-4">Cargo & Permissões</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Último Acesso</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Ações do Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee9dc] text-xs text-[#2b3a20]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#738465]">
                    <UserX className="w-8 h-8 mx-auto mb-2 text-[#a3b296]" />
                    <p className="font-semibold text-sm">Nenhum usuário encontrado</p>
                    <p className="text-xs mt-1">Tente ajustar a busca ou limpe os filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const meta = roleMeta[user.role] || roleMeta.comercial;
                  const isRootMaster = user.username.toUpperCase() === 'CESARDIRETOR';
                  const initials = user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#faf9f4] transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              user.isMaster
                                ? 'bg-[#344322] text-[#d6e7c6] ring-2 ring-[#536d37]'
                                : 'bg-[#e7eee0] text-[#334621]'
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-[#1c2918]">
                                {user.name}
                              </span>
                              {user.isMaster && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[9px] font-bold border border-purple-200"
                                  title="Usuário Master com permissões totais"
                                >
                                  <Shield className="w-2.5 h-2.5" />
                                  Master
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#6f7e63] block">
                              {user.email || 'Sem e-mail cadastrado'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f4f2ea] border border-[#e4decfa6] font-mono font-semibold text-[11px] text-[#2c3d1f]">
                          <span>@{user.username}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.badgeClass}`}
                        >
                          {user.roleLabel || meta.label}
                        </span>
                      </td>

                      {/* Status & Toggle */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              user.status === 'ativo' ? 'bg-emerald-500' : 'bg-red-400'
                            }`}
                          />
                          <span
                            className={`font-semibold text-xs ${
                              user.status === 'ativo' ? 'text-emerald-800' : 'text-red-700'
                            }`}
                          >
                            {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>

                          {!isRootMaster && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              className="ml-1 text-[10px] font-medium text-[#5c6e49] hover:text-[#2d3b1e] underline"
                              title={
                                user.status === 'ativo'
                                  ? 'Bloquear acesso deste usuário'
                                  : 'Reativar acesso deste usuário'
                              }
                            >
                              {user.status === 'ativo' ? 'Bloquear' : 'Ativar'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-4 text-[#66755a] text-[11px]">
                        {user.lastLoginAt ? (
                          <span>
                            {new Date(user.lastLoginAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-[#a0af93]">Nunca logou</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Copy Creds Button */}
                          <button
                            type="button"
                            onClick={() =>
                              copyCredsToClipboard(
                                user.username,
                                user.password || '(Mesma senha)',
                                user.name
                              )
                            }
                            className="p-1.5 rounded-lg text-[#556942] hover:text-[#28381b] hover:bg-[#edf3e5] transition-colors"
                            title="Copiar dados de acesso para WhatsApp / E-mail"
                          >
                            {copiedId === user.username ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Reset Password Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(user)}
                            className="p-1.5 rounded-lg text-[#556942] hover:text-[#28381b] hover:bg-[#edf3e5] transition-colors"
                            title="Redefinir Senha do Usuário"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit User Button */}
                          <button
                            type="button"
                            onClick={() => setEditingUser(user)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg text-[#3f512b] hover:bg-[#edf3e5] border border-[#d6dfce] transition-colors"
                            title="Editar informações do usuário"
                          >
                            Editar
                          </button>

                          {/* Delete User Button (disabled for root master) */}
                          {!isRootMaster ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-red-600 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                              title={`Excluir acesso de ${user.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          ) : (
                            <span
                              className="px-2 py-1 text-[11px] font-semibold text-[#8ea47b] bg-[#eef4ea] border border-[#d8e5d0] rounded-lg inline-flex items-center gap-1 cursor-not-allowed"
                              title="Master principal não pode ser excluído"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-[#526f39]" />
                              <span>Protegido</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: GERAR NOVO ACESSO (CREATE USER) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#ded8c9] shadow-2xl max-w-lg w-full overflow-hidden my-8 animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#344322] px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#4b5f33] flex items-center justify-center text-[#d7e7c7]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white leading-tight">
                    Gerar Novo Acesso de Usuário
                  </h3>
                  <p className="text-[11px] text-[#cad8bb]">
                    Exclusivo do Master Floresta Verde
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#cad8bb] hover:text-white p-1 rounded-lg hover:bg-[#43552d] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#2f3d1f] mb-1">
                  Nome Completo do Colaborador *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Mariana Costa"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs sm:text-sm text-[#1e291b] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
                />
              </div>

              {/* Username (Auto/Custom) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#2f3d1f]">
                    Nome de Usuário (Login) *
                  </label>
                  <span className="text-[10px] text-[#718260]">
                    Será usado no momento do login
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#718260] font-mono text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) =>
                      setFormUsername(e.target.value.toUpperCase().replace(/\s+/g, ''))
                    }
                    placeholder="MARIANACOSTA"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs sm:text-sm font-mono font-semibold text-[#1e291b] uppercase focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
                  />
                </div>
              </div>

              {/* Password & Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#2f3d1f]">
                    Senha de Acesso Provisória *
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPassword(generateStrongPassword())}
                    className="text-[11px] font-semibold text-[#485b2e] hover:text-[#32431c] flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Gerar Senha Forte</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Digite ou gere uma senha"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs sm:text-sm font-mono text-[#1e291b] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#718260] hover:text-[#2d3a20]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#2f3d1f] mb-1">
                  Cargo & Nível de Permissão *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs sm:text-sm text-[#1e291b] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
                >
                  <option value="comercial">Equipe Comercial (Clientes, Funis B2B/B2C, Recompras)</option>
                  <option value="vendedor">Vendedor / Representante (Prospecção e Pedidos)</option>
                  <option value="financeiro">Financeiro (Vendas a Prazo, Boletos e Cobrança)</option>
                  <option value="diretor">Diretoria Executiva (Métricas completas e Relatórios)</option>
                  <option value="master">Master (Acesso irrestrito + Gestão de Usuários)</option>
                </select>
                <p className="mt-1 text-[11px] text-[#6d7e5d]">
                  {roleMeta[formRole]?.desc}
                </p>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2f3d1f] mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="mariana@florestaverde.com.br"
                    className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1e291b] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2f3d1f] mb-1">
                    Telefone / WhatsApp (opcional)
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1e291b] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#2f3d1f] mb-1">
                  Observações Internas (opcional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Atendimento regional São Paulo, carteira de clientes de difusores..."
                  className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1e291b] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-[#eee9dc] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#ded8c9] text-xs font-semibold text-[#485938] hover:bg-[#faf9f6] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#485b2e] hover:bg-[#3b4b25] text-white text-xs font-semibold tracking-wide shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar & Liberar Acesso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREDENCIAIS GERADAS COM SUCESSO (SHARE CARD) */}
      {newlyCreatedCreds && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#ded8c9] shadow-2xl max-w-md w-full overflow-hidden p-6 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold font-serif text-center text-[#1c2918]">
              Acesso Gerado com Sucesso!
            </h3>
            <p className="text-xs text-center text-[#687a55] mt-1">
              Copie as credenciais abaixo e envie para o novo colaborador pelo WhatsApp ou E-mail.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-[#faf9f6] border border-[#ded8c9] space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6d7e5d]">Colaborador:</span>
                <span className="font-bold text-[#1f2d16]">{newlyCreatedCreds.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6d7e5d]">Cargo:</span>
                <span className="font-semibold text-[#3d512a]">{newlyCreatedCreds.roleLabel}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-[#ede9dc]">
                <span className="text-[#6d7e5d]">Usuário:</span>
                <span className="font-mono font-bold text-sm text-[#1f2d16]">
                  @{newlyCreatedCreds.username}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6d7e5d]">Senha Provisória:</span>
                <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded-md border border-[#dfd9cb] text-[#2c3d1f]">
                  {newlyCreatedCreds.password}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 py-1 px-2.5 rounded-lg mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Acesso gravado automaticamente no Firebase Firestore</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() =>
                  copyCredsToClipboard(
                    newlyCreatedCreds.username,
                    newlyCreatedCreds.password,
                    newlyCreatedCreds.name
                  )
                }
                className="w-full py-3 px-4 rounded-xl bg-[#485b2e] hover:bg-[#3b4b25] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Dados Prontos para Enviar</span>
              </button>

              <button
                type="button"
                onClick={() => setNewlyCreatedCreds(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#faf9f6] text-[#4d5e38] text-xs font-semibold border border-[#ded8c9] transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REDEFINIR SENHA DO USUÁRIO */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#ded8c9] shadow-2xl max-w-md w-full overflow-hidden p-6 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee9dc]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#485b2e]" />
                <h3 className="font-serif font-bold text-base text-[#1e291b]">
                  Redefinir Senha do Usuário
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordResetUser(null)}
                className="text-[#7d8c6f] hover:text-[#2d3a1f]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="mt-4 space-y-4">
              <p className="text-xs text-[#5e6f4d]">
                Defina uma nova senha para <strong>{passwordResetUser.name}</strong> (@{passwordResetUser.username}).
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#2f3d1f]">
                    Nova Senha *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewResetPassword(generateStrongPassword())}
                    className="text-[11px] font-semibold text-[#485b2e] hover:text-[#32431c] flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Gerar Senha</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs sm:text-sm font-mono text-[#1e291b] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#718260] hover:text-[#2d3a20]"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-4 py-2 rounded-xl border border-[#ded8c9] text-xs font-semibold text-[#4b5c37] hover:bg-[#faf9f6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#485b2e] hover:bg-[#394a24] text-white text-xs font-semibold shadow-xs"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DADOS DO USUÁRIO */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#ded8c9] shadow-2xl max-w-lg w-full overflow-hidden p-6 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee9dc]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1e291b]">
                  Editar Cadastro do Usuário
                </h3>
                <p className="text-[11px] text-[#70805f]">
                  Usuário: @{editingUser.username}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-[#7d8c6f] hover:text-[#2d3a1f]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#2f3d1f] mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1e291b] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2f3d1f] mb-1">
                  Cargo / Permissão
                </label>
                <select
                  value={editingUser.role}
                  disabled={editingUser.username.toUpperCase() === 'CESARDIRETOR'}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value as UserRole })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1e291b] focus:outline-none focus:ring-2 focus:ring-[#485b2e] disabled:opacity-60"
                >
                  <option value="comercial">Equipe Comercial</option>
                  <option value="vendedor">Vendedor / Representante</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="diretor">Diretoria</option>
                  <option value="master">Master</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2f3d1f] mb-1">
                  Status do Acesso
                </label>
                <select
                  value={editingUser.status}
                  disabled={editingUser.username.toUpperCase() === 'CESARDIRETOR'}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      status: e.target.value as 'ativo' | 'inativo',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1e291b] focus:outline-none focus:ring-2 focus:ring-[#485b2e] disabled:opacity-60"
                >
                  <option value="ativo">Ativo (Acesso Liberado)</option>
                  <option value="inativo">Inativo (Bloqueado)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2f3d1f] mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1e291b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2f3d1f] mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1e291b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2f3d1f] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={editingUser.notes || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1e291b]"
                />
              </div>

              <div className="pt-3 border-t border-[#eee9dc] flex flex-wrap items-center justify-between gap-2">
                {editingUser.username.toUpperCase() !== 'CESARDIRETOR' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const u = editingUser;
                      setEditingUser(null);
                      handleDeleteUser(u);
                    }}
                    className="px-3 py-2 rounded-xl text-red-600 hover:text-white hover:bg-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Excluir este usuário do sistema"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Usuário</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-[#7d8c6d] italic flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#546e3d]" />
                    Master Raiz Protegido
                  </span>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl border border-[#ded8c9] text-xs font-semibold text-[#4b5c37] hover:bg-[#faf9f6]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#485b2e] hover:bg-[#394a24] text-white text-xs font-semibold shadow-xs"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE USUÁRIO */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-100 shadow-2xl max-w-md w-full overflow-hidden p-6 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-4 border-b border-red-100">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1e291b]">
                  Excluir Acesso de Usuário
                </h3>
                <p className="text-xs text-red-700 font-semibold">
                  Confirmação de exclusão permanente
                </p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-[#faf9f5] border border-[#eae5d8] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#718260] font-medium">Nome:</span>
                <span className="font-bold text-[#1f2d18]">{userToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#718260] font-medium">Login:</span>
                <span className="font-mono font-bold text-[#354823]">@{userToDelete.username}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#718260] font-medium">Cargo:</span>
                <span className="font-semibold text-[#546e3d]">
                  {userToDelete.roleLabel || userToDelete.role}
                </span>
              </div>
              {userToDelete.email && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#718260] font-medium">E-mail:</span>
                  <span className="text-[#495b36]">{userToDelete.email}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 mb-6">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Tem certeza que deseja <strong>excluir definitivamente</strong> este usuário? Ele perderá imediatamente o acesso ao CRM Floresta Verde. Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-[#ded8c9] text-xs font-semibold text-[#4d5e38] hover:bg-[#f6f5ef] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
