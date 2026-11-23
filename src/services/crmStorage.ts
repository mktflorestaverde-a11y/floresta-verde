import {
  Customer,
  CycleSettings,
  EcommerceMetrics,
  Order,
  OrderStatus,
  CRMUserAccount,
  UserRole,
} from '../types/crm';
import { formatISODate } from '../utils/crmCalculations';
import {
  saveCustomerToFirestore,
  saveCustomersBatchToFirestore,
  deleteCustomerFromFirestore,
  saveOrderToFirestore,
  saveOrdersBatchToFirestore,
  deleteOrderFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveSettingsToFirestore,
} from './firestoreSync';

// Storage Keys
const CUSTOMERS_KEY = 'floresta_verde_crm_customers_v1';
const REAL_CUSTOMERS_KEY = 'floresta_verde_crm_real_customers_v1';
const ORDERS_KEY = 'floresta_verde_crm_orders_v1';
const REAL_ORDERS_KEY = 'floresta_verde_crm_real_orders_v1';
const SETTINGS_KEY = 'floresta_verde_crm_settings_v1';
const ECOMMERCE_KEY = 'floresta_verde_crm_ecommerce_v1';
const REAL_ECOMMERCE_KEY = 'floresta_verde_crm_real_ecommerce_v1';
const CUSTOM_LOGO_KEY = 'floresta_verde_custom_logo_v1';
const LANDING_MEDIA_KEY = 'floresta_verde_landing_media_v1';

export interface LandingMediaSettings {
  treeBgUrl?: string | null;
  productDiffusersUrl?: string | null;
  productSpraysUrl?: string | null;
  productOilsUrl?: string | null;
  productCandlesUrl?: string | null;
  productAmenitiesUrl?: string | null;
  productDisplaysUrl?: string | null;
  logoWidth?: number; // Largura manual da logo (px)
  logoHeight?: number; // Altura manual da logo (px)
  titleFontSize?: number; // Tamanho manual da fonte do título "Floresta Verde" (px)
  subtitleFontSize?: number; // Tamanho manual da fonte do subtítulo (px)
  headerTitleText?: string; // Texto personalizado do título do cabeçalho
  headerSubtitleText?: string; // Texto personalizado do subtítulo do cabeçalho
  bannerBrightness?: number; // Claridade da imagem do banner (50 a 100%, padrão 85%)
  bannerOverlayOpacity?: number; // Opacidade da película de contraste (10 a 80%, padrão 40%)
  showFloatingProducts?: boolean; // Miniaturas dos produtos passando com as folhas (padrão true)
}
const DEMO_MODE_KEY = 'floresta_verde_demo_mode_v2';
const AUTH_SESSION_KEY = 'floresta_verde_auth_user_v1';
const USERS_KEY = 'floresta_verde_crm_users_v1';

export const CRM_DATA_CHANGE_EVENT = 'floresta_verde_crm_changed';

export interface CRMAuthUser {
  id?: string;
  username: string;
  name: string;
  role: string;
  userRole?: UserRole;
  isMaster: boolean;
  email?: string;
}

export {
  INITIAL_USERS,
  DEFAULT_CYCLE_SETTINGS,
  DEFAULT_ECOMMERCE_METRICS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
} from '../data/initialData';
import {
  INITIAL_USERS,
  DEFAULT_CYCLE_SETTINGS,
  DEFAULT_ECOMMERCE_METRICS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
} from '../data/initialData';

/**
 * Storage helpers
 */
export const crmStorage = {
  isDemoMode(): boolean {
    try {
      const val = localStorage.getItem(DEMO_MODE_KEY);
      if (val === null) return true; // Default to demo initially
      return val === 'true';
    } catch {
      return true;
    }
  },

  setDemoMode(enabled: boolean): void {
    try {
      localStorage.setItem(DEMO_MODE_KEY, enabled ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));
    } catch (e) {
      console.error('Falha ao alternar modo demo:', e);
    }
  },

  getCustomers(): Customer[] {
    const isDemo = this.isDemoMode();
    const key = isDemo ? CUSTOMERS_KEY : REAL_CUSTOMERS_KEY;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        if (isDemo) {
          this.saveCustomers(INITIAL_CUSTOMERS);
          return INITIAL_CUSTOMERS;
        } else {
          // Real mode starts with empty customer list unless added
          return [];
        }
      }
      return JSON.parse(raw);
    } catch {
      return isDemo ? INITIAL_CUSTOMERS : [];
    }
  },

  saveCustomers(customers: Customer[]): void {
    const isDemo = this.isDemoMode();
    const key = isDemo ? CUSTOMERS_KEY : REAL_CUSTOMERS_KEY;
    localStorage.setItem(key, JSON.stringify(customers));
    window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));
  },

  addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      createdAt: formatISODate(new Date()),
    };
    customers.unshift(newCustomer);
    this.saveCustomers(customers);
    if (!this.isDemoMode()) {
      saveCustomerToFirestore(newCustomer).catch((e) => console.warn('[Firestore] Sync customer error:', e));
    }
    return newCustomer;
  },

  updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    customers[idx] = { ...customers[idx], ...updates };
    this.saveCustomers(customers);
    if (!this.isDemoMode()) {
      saveCustomerToFirestore(customers[idx]).catch((e) => console.warn('[Firestore] Sync customer error:', e));
    }
    return customers[idx];
  },

  batchUpsertCustomers(toInsert: Customer[], toUpdate: Customer[]): { insertedCount: number; updatedCount: number } {
    const customers = this.getCustomers();
    const updateMap = new Map<string, Customer>();
    toUpdate.forEach((c) => updateMap.set(c.id, c));

    // Atualiza os existentes
    const mergedCustomers = customers.map((c) => {
      if (updateMap.has(c.id)) {
        return updateMap.get(c.id)!;
      }
      return c;
    });

    // Adiciona os novos no topo
    const finalList = [...toInsert, ...mergedCustomers];
    this.saveCustomers(finalList);

    if (!this.isDemoMode()) {
      const allToSync = [...toInsert, ...toUpdate];
      saveCustomersBatchToFirestore(allToSync).catch((e) =>
        console.warn('[Firestore] Erro ao sincronizar lote de importação:', e)
      );
    }

    return {
      insertedCount: toInsert.length,
      updatedCount: toUpdate.length,
    };
  },

  deleteCustomer(id: string): boolean {
    const customers = this.getCustomers();
    const filtered = customers.filter((c) => c.id !== id);
    if (filtered.length === customers.length) return false;
    this.saveCustomers(filtered);
    if (!this.isDemoMode()) {
      deleteCustomerFromFirestore(id).catch((e) => console.warn('[Firestore] Delete customer error:', e));
    }

    // Also remove or unlink orders
    const orders = this.getOrders().filter((o) => o.customerId !== id);
    this.saveOrders(orders);
    return true;
  },

  getOrders(): Order[] {
    const isDemo = this.isDemoMode();
    const key = isDemo ? ORDERS_KEY : REAL_ORDERS_KEY;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        if (isDemo) {
          this.saveOrders(INITIAL_ORDERS);
          return INITIAL_ORDERS;
        } else {
          return [];
        }
      }
      return JSON.parse(raw);
    } catch {
      return isDemo ? INITIAL_ORDERS : [];
    }
  },

  saveOrders(orders: Order[]): void {
    const isDemo = this.isDemoMode();
    const key = isDemo ? ORDERS_KEY : REAL_ORDERS_KEY;
    localStorage.setItem(key, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));
  },

  addOrder(order: Omit<Order, 'id'>): Order {
    const orders = this.getOrders();
    const newOrder: Order = {
      ...order,
      id: `ord-${Date.now()}`,
    };
    orders.unshift(newOrder);
    this.saveOrders(orders);
    if (!this.isDemoMode()) {
      saveOrderToFirestore(newOrder).catch((e) => console.warn('[Firestore] Sync order error:', e));
    }

    // Update customer funnel stage if needed
    const customers = this.getCustomers();
    const custIdx = customers.findIndex((c) => c.id === order.customerId);
    if (custIdx !== -1 && order.status === 'pago') {
      const custOrders = orders.filter(
        (o) => o.customerId === order.customerId && o.status === 'pago'
      );
      if (custOrders.length >= 2) {
        customers[custIdx].funnelStage = 'recompra';
      } else if (custOrders.length === 1) {
        customers[custIdx].funnelStage = 'primeira_compra';
      }
      this.saveCustomers(customers);
      if (!this.isDemoMode()) {
        saveCustomerToFirestore(customers[custIdx]).catch((e) => console.warn('[Firestore] Sync customer error:', e));
      }
    }

    return newOrder;
  },

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    orders[idx] = { ...orders[idx], ...updates };
    this.saveOrders(orders);
    if (!this.isDemoMode()) {
      saveOrderToFirestore(orders[idx]).catch((e) => console.warn('[Firestore] Sync order error:', e));
    }
    return orders[idx];
  },

  deleteOrder(id: string): boolean {
    const orders = this.getOrders();
    const filtered = orders.filter((o) => o.id !== id);
    if (filtered.length === orders.length) return false;
    this.saveOrders(filtered);
    if (!this.isDemoMode()) {
      deleteOrderFromFirestore(id).catch((e) => console.warn('[Firestore] Delete order error:', e));
    }
    return true;
  },

  batchInsertOrders(
    ordersToInsert: Order[],
    newCustomersToInsert: Customer[] = [],
    autoUpdateCustomerStages: boolean = true
  ): { insertedOrdersCount: number; newCustomersCount: number } {
    let currentCustomers = this.getCustomers();

    // 1. Inserir novos clientes criados pela importação (caso não existissem ainda)
    if (newCustomersToInsert.length > 0) {
      currentCustomers = [...newCustomersToInsert, ...currentCustomers];
      this.saveCustomers(currentCustomers);
      if (!this.isDemoMode()) {
        saveCustomersBatchToFirestore(newCustomersToInsert).catch((e) =>
          console.warn('[Firestore] Erro ao sincronizar novos clientes gerados por pedidos:', e)
        );
      }
    }

    // 2. Inserir novos pedidos
    const currentOrders = this.getOrders();
    const finalOrders = [...ordersToInsert, ...currentOrders];
    this.saveOrders(finalOrders);

    if (!this.isDemoMode()) {
      saveOrdersBatchToFirestore(ordersToInsert).catch((e) =>
        console.warn('[Firestore] Erro ao sincronizar lote de pedidos no Firestore:', e)
      );
    }

    // 3. Atualizar funil de clientes que agora possuem compras
    if (autoUpdateCustomerStages) {
      const customersToUpdate: Customer[] = [];
      const updatedCustomers = currentCustomers.map((c) => {
        const custPaidOrders = finalOrders.filter(
          (o) => o.customerId === c.id && o.status === 'pago'
        );
        if (custPaidOrders.length >= 2 && c.funnelStage !== 'recompra') {
          const upd = { ...c, funnelStage: 'recompra' as const };
          customersToUpdate.push(upd);
          return upd;
        } else if (
          custPaidOrders.length === 1 &&
          (c.funnelStage === 'novos_contatos' || c.funnelStage === 'qualificados' || c.funnelStage === 'proposta')
        ) {
          const upd = { ...c, funnelStage: 'primeira_compra' as const };
          customersToUpdate.push(upd);
          return upd;
        }
        return c;
      });

      if (customersToUpdate.length > 0) {
        this.saveCustomers(updatedCustomers);
        if (!this.isDemoMode()) {
          saveCustomersBatchToFirestore(customersToUpdate).catch((e) =>
            console.warn('[Firestore] Erro ao sincronizar estágio dos clientes após importação de pedidos:', e)
          );
        }
      }
    }

    return {
      insertedOrdersCount: ordersToInsert.length,
      newCustomersCount: newCustomersToInsert.length,
    };
  },

  getSettings(): CycleSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        this.saveSettings(DEFAULT_CYCLE_SETTINGS);
        return DEFAULT_CYCLE_SETTINGS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CYCLE_SETTINGS;
    }
  },

  saveSettings(settings: CycleSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));
    saveSettingsToFirestore(settings).catch((e) => console.warn('[Firestore] Sync settings error:', e));
  },

  getEcommerceMetrics(): EcommerceMetrics {
    const isDemo = this.isDemoMode();
    const key = isDemo ? ECOMMERCE_KEY : REAL_ECOMMERCE_KEY;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        const initial = isDemo
          ? DEFAULT_ECOMMERCE_METRICS
          : { b2cVisitorsCount: 0, b2cCartCount: 0, lastSyncedAt: new Date().toISOString() };
        this.saveEcommerceMetrics(initial);
        return initial;
      }
      return JSON.parse(raw);
    } catch {
      return isDemo
        ? DEFAULT_ECOMMERCE_METRICS
        : { b2cVisitorsCount: 0, b2cCartCount: 0, lastSyncedAt: new Date().toISOString() };
    }
  },

  saveEcommerceMetrics(metrics: EcommerceMetrics): void {
    const isDemo = this.isDemoMode();
    const key = isDemo ? ECOMMERCE_KEY : REAL_ECOMMERCE_KEY;
    localStorage.setItem(key, JSON.stringify(metrics));
    window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));
  },

  getCustomLogo(): string | null {
    try {
      return localStorage.getItem(CUSTOM_LOGO_KEY);
    } catch {
      return null;
    }
  },

  saveCustomLogo(logoDataUrl: string): void {
    try {
      localStorage.setItem(CUSTOM_LOGO_KEY, logoDataUrl);
      window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));
    } catch (e) {
      console.error('Falha ao salvar logo:', e);
    }
  },

  removeCustomLogo(): void {
    try {
      localStorage.removeItem(CUSTOM_LOGO_KEY);
      window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));
    } catch (e) {
      console.error('Falha ao remover logo:', e);
    }
  },

  getLandingMedia(): LandingMediaSettings {
    try {
      const raw = localStorage.getItem(LANDING_MEDIA_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
      return {};
    } catch {
      return {};
    }
  },

  saveLandingMedia(media: Partial<LandingMediaSettings>): void {
    try {
      const current = this.getLandingMedia();
      const updated = { ...current, ...media };
      localStorage.setItem(LANDING_MEDIA_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT, { detail: updated }));
    } catch (e) {
      console.warn('Falha ao salvar mídias no localStorage, aplicando em memória:', e);
      window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT, { detail: media }));
    }
  },

  removeLandingMedia(): void {
    try {
      localStorage.removeItem(LANDING_MEDIA_KEY);
      window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));
    } catch (e) {
      console.error('Falha ao resetar mídias da landing page:', e);
    }
  },

  // Loja Integrada Credentials & Sync Storage
  getLojaIntegradaCredentials(): {
    chaveApi: string;
    chaveAplicacao: string;
    lastSyncAt?: string;
    totalSynced?: number;
    autoSyncDaily?: boolean;
  } {
    try {
      const raw = localStorage.getItem('floresta_verde_loja_integrada_creds_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Falha ao ler credenciais Loja Integrada:', e);
    }
    return { chaveApi: '', chaveAplicacao: '', totalSynced: 0 };
  },

  saveLojaIntegradaCredentials(creds: {
    chaveApi: string;
    chaveAplicacao: string;
    lastSyncAt?: string;
    totalSynced?: number;
    autoSyncDaily?: boolean;
  }): void {
    try {
      localStorage.setItem('floresta_verde_loja_integrada_creds_v1', JSON.stringify(creds));
    } catch (e) {
      console.error('Falha ao salvar credenciais Loja Integrada:', e);
    }
  },

  /**
   * Import B2C Customers from Loja Integrada (or CSV) with deduplication by CPF/CNPJ or email
   */
  importB2CCustomers(
    incomingCustomers: Array<Omit<Customer, 'id' | 'createdAt'> & { id?: string; createdAt?: string }>,
    options?: { overwriteExisting?: boolean }
  ): { added: number; updated: number; total: number } {
    const isDemo = this.isDemoMode();
    const existing = this.getCustomers();
    let added = 0;
    let updated = 0;

    const cleanDoc = (doc?: string) => (doc ? doc.replace(/\D/g, '') : '');
    const cleanMail = (mail?: string) => (mail ? mail.trim().toLowerCase() : '');

    for (const inc of incomingCustomers) {
      const incDoc = cleanDoc(inc.document);
      const incMail = cleanMail(inc.email);

      // Search if customer already exists by doc or email
      const existingIdx = existing.findIndex((c) => {
        if (incDoc && cleanDoc(c.document) && cleanDoc(c.document) === incDoc) return true;
        if (incMail && cleanMail(c.email) && cleanMail(c.email) === incMail) return true;
        return false;
      });

      if (existingIdx !== -1) {
        if (options?.overwriteExisting !== false) {
          existing[existingIdx] = {
            ...existing[existingIdx],
            ...inc,
            id: existing[existingIdx].id, // preserve ID
            createdAt: existing[existingIdx].createdAt, // preserve original date
            segment: 'b2c',
          };
          updated++;
          if (!isDemo) {
            saveCustomerToFirestore(existing[existingIdx]).catch((e) =>
              console.warn('[Firestore] Sync imported customer error:', e)
            );
          }
        }
      } else {
        const newCustomer: Customer = {
          ...inc,
          id: inc.id || `cust-li-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          createdAt: inc.createdAt || formatISODate(new Date()),
          segment: 'b2c',
        };
        existing.unshift(newCustomer);
        added++;
        if (!isDemo) {
          saveCustomerToFirestore(newCustomer).catch((e) =>
            console.warn('[Firestore] Sync imported customer error:', e)
          );
        }
      }
    }

    this.saveCustomers(existing);
    return { added, updated, total: added + updated };
  },

  resetToDemo(): void {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_CYCLE_SETTINGS));
    localStorage.setItem(ECOMMERCE_KEY, JSON.stringify(DEFAULT_ECOMMERCE_METRICS));
    window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));
  },

  // Authentication & User Management Helpers
  getUsers(): CRMUserAccount[] {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) {
        this.saveUsers(INITIAL_USERS);
        return INITIAL_USERS;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveUsers(INITIAL_USERS);
        return INITIAL_USERS;
      }
      return parsed;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: CRMUserAccount[]): void {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));
    } catch (e) {
      console.error('Falha ao salvar usuários:', e);
    }
  },

  addUser(userData: {
    username: string;
    password?: string;
    name: string;
    role: UserRole;
    roleLabel: string;
    isMaster?: boolean;
    status?: 'ativo' | 'inativo';
    email?: string;
    phone?: string;
    notes?: string;
    createdBy?: string;
  }): { success: boolean; message?: string; user?: CRMUserAccount } {
    const users = this.getUsers();
    const cleanUsername = userData.username.trim().toUpperCase().replace(/\s+/g, '');

    if (!cleanUsername) {
      return { success: false, message: 'O nome de usuário é obrigatório.' };
    }
    if (cleanUsername.length < 3) {
      return { success: false, message: 'O nome de usuário deve ter no mínimo 3 caracteres.' };
    }
    if (users.some((u) => u.username.toUpperCase() === cleanUsername)) {
      return { success: false, message: `O usuário "${cleanUsername}" já existe no sistema. Escolha outro nome de usuário.` };
    }
    if (!userData.password || userData.password.trim().length < 4) {
      return { success: false, message: 'A senha de acesso deve conter pelo menos 4 caracteres.' };
    }
    if (!userData.name.trim()) {
      return { success: false, message: 'O nome completo do usuário é obrigatório.' };
    }

    const isMaster = userData.isMaster || userData.role === 'master';

    const newUser: CRMUserAccount = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      password: userData.password.trim(),
      name: userData.name.trim(),
      role: userData.role,
      roleLabel: userData.roleLabel,
      isMaster,
      status: userData.status || 'ativo',
      email: userData.email?.trim() || undefined,
      phone: userData.phone?.trim() || undefined,
      notes: userData.notes?.trim() || undefined,
      createdAt: formatISODate(new Date()),
      createdBy: userData.createdBy || 'Master',
    };

    users.push(newUser);
    this.saveUsers(users);
    saveUserToFirestore(newUser).catch((e) => console.warn('[Firestore] Sync user error:', e));
    return { success: true, user: newUser };
  },

  updateUser(id: string, updates: Partial<CRMUserAccount>): { success: boolean; message?: string; user?: CRMUserAccount } {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    // Protection: Root Master CESARDIRETOR cannot be demoted or deactivated
    if (users[idx].username.toUpperCase() === 'CESARDIRETOR') {
      if (updates.status === 'inativo') {
        return { success: false, message: 'O usuário Master principal não pode ser inativado.' };
      }
      if (updates.isMaster === false || (updates.role && updates.role !== 'master')) {
        return { success: false, message: 'O perfil do Master raiz não pode ser rebaixado.' };
      }
    }

    if (updates.username) {
      const cleanUsername = updates.username.trim().toUpperCase().replace(/\s+/g, '');
      const existing = users.find((u) => u.id !== id && u.username.toUpperCase() === cleanUsername);
      if (existing) {
        return { success: false, message: `Já existe um usuário com o login "${cleanUsername}".` };
      }
      updates.username = cleanUsername;
    }

    users[idx] = {
      ...users[idx],
      ...updates,
    };

    this.saveUsers(users);
    saveUserToFirestore(users[idx]).catch((e) => console.warn('[Firestore] Sync user error:', e));
    return { success: true, user: users[idx] };
  },

  deleteUser(id: string): { success: boolean; message?: string } {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (target.username.toUpperCase() === 'CESARDIRETOR') {
      return { success: false, message: 'O usuário Master principal (CESARDIRETOR) não pode ser excluído.' };
    }

    const filtered = users.filter((u) => u.id !== id);
    this.saveUsers(filtered);
    deleteUserFromFirestore(id).catch((e) => console.warn('[Firestore] Delete user error:', e));
    return { success: true };
  },

  isUserMaster(user: CRMAuthUser | null): boolean {
    if (!user) return false;
    return !!user.isMaster || user.username.toUpperCase() === 'CESARDIRETOR' || (user.userRole === 'master') || user.role.toLowerCase().includes('master');
  },

  getAuthUser(): CRMAuthUser | null {
    try {
      const raw = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  login(usernameInput: string, passwordInput: string, remember: boolean = true): { success: boolean; message?: string; user?: CRMAuthUser } {
    const trimmedUser = usernameInput.trim().toUpperCase().replace(/\s+/g, '');
    const trimmedPass = passwordInput.trim();

    const users = this.getUsers();
    const foundUser = users.find((u) => u.username.toUpperCase() === trimmedUser);

    if (foundUser) {
      if (foundUser.password !== trimmedPass) {
        return {
          success: false,
          message: 'Senha incorreta. Verifique a senha digitada ou solicite a redefinição ao Master.',
        };
      }

      if (foundUser.status === 'inativo') {
        return {
          success: false,
          message: 'Este acesso foi desativado pelo usuário Master. Solicite a liberação à Diretoria.',
        };
      }

      // Update last login timestamp in background
      this.updateUser(foundUser.id, { lastLoginAt: new Date().toISOString() });

      const authUser: CRMAuthUser = {
        id: foundUser.id,
        username: foundUser.username,
        name: foundUser.name,
        role: foundUser.roleLabel || foundUser.role,
        userRole: foundUser.role,
        isMaster: foundUser.isMaster || foundUser.username.toUpperCase() === 'CESARDIRETOR',
        email: foundUser.email,
      };

      try {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(authUser));
        if (remember) {
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(authUser));
        }
      } catch (e) {
        console.warn('Storage error on login', e);
      }
      return { success: true, user: authUser };
    }

    return {
      success: false,
      message: 'Usuário não encontrado. Verifique o usuário informado ou solicite a criação do seu acesso ao Master.',
    };
  },

  markBoletoAsPaid(orderId: string): void {
    const orders = this.getOrders();
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'pago' as OrderStatus,
          termStatus: 'pago' as const,
          boletoPaidDate: new Date().toISOString().split('T')[0],
        };
      }
      return o;
    });
    this.saveOrders(updated);
  },

  logout(): void {
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {
      console.warn('Storage error on logout', e);
    }
  },

  exportData(): string {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      mode: this.isDemoMode() ? 'demo' : 'real',
      customers: this.getCustomers(),
      orders: this.getOrders(),
      settings: this.getSettings(),
      ecommerce: this.getEcommerceMetrics(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.customers || !parsed.orders) {
        throw new Error('Formato de arquivo inválido');
      }
      this.saveCustomers(parsed.customers);
      this.saveOrders(parsed.orders);
      if (parsed.settings) this.saveSettings(parsed.settings);
      if (parsed.ecommerce) this.saveEcommerceMetrics(parsed.ecommerce);
      return true;
    } catch (e) {
      console.error('Falha ao importar dados:', e);
      return false;
    }
  },
};
