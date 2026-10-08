import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from './firebase';
import { Customer, Order, CRMUserAccount, CycleSettings } from '../types/crm';
import {
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_USERS,
  DEFAULT_CYCLE_SETTINGS,
  CRM_DATA_CHANGE_EVENT,
} from '../data/initialData';

export interface FirebaseConnectionStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  realCustomersCount: number;
  realOrdersCount: number;
  usersCount: number;
}

let connectionStatus: FirebaseConnectionStatus = {
  isConnected: false,
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
  realCustomersCount: 0,
  realOrdersCount: 0,
  usersCount: 0,
};

const listeners: ((status: FirebaseConnectionStatus) => void)[] = [];

export function subscribeToFirebaseStatus(callback: (status: FirebaseConnectionStatus) => void) {
  listeners.push(callback);
  callback(connectionStatus);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyStatus(updates: Partial<FirebaseConnectionStatus>) {
  connectionStatus = { ...connectionStatus, ...updates };
  listeners.forEach((cb) => {
    try {
      cb(connectionStatus);
    } catch (e) {
      console.error('Error in status callback:', e);
    }
  });
}

// Identification of Demo IDs to ensure Firebase ONLY contains real data
const DEMO_CUSTOMER_IDS = new Set(INITIAL_CUSTOMERS.map((c) => c.id));
const DEMO_ORDER_IDS = new Set(INITIAL_ORDERS.map((o) => o.id));

export const ROOT_MASTER_USER: CRMUserAccount = {
  id: 'usr-master-1',
  username: 'cesarDiretor',
  password: '123456',
  name: 'Cesar Diretor',
  role: 'master',
  roleLabel: 'Master • Diretoria Executiva',
  isMaster: true,
  status: 'ativo',
  email: 'diretoria@florestaverde.com.br',
  phone: '(11) 98765-4321',
  createdAt: '2026-01-01',
  notes: 'Acesso Master oficial de autenticação da Floresta Verde com permissão total.',
};

// ----------------------------------------------------------------------------
// Firestore Database Operations with Hardened Error Handling
// ----------------------------------------------------------------------------

export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  // Prevent demo customers from ever entering Firestore
  if (DEMO_CUSTOMER_IDS.has(customer.id)) return;

  const path = `customers/${customer.id}`;
  try {
    const cleanCustomer = JSON.parse(JSON.stringify(customer));
    await setDoc(doc(db, 'customers', customer.id), cleanCustomer, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomerFromFirestore(id: string): Promise<void> {
  const path = `customers/${id}`;
  try {
    await deleteDoc(doc(db, 'customers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveOrderToFirestore(order: Order): Promise<void> {
  // Prevent demo orders from ever entering Firestore
  if (DEMO_ORDER_IDS.has(order.id)) return;

  const path = `orders/${order.id}`;
  try {
    const cleanOrder = JSON.parse(JSON.stringify(order));
    await setDoc(doc(db, 'orders', order.id), cleanOrder, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteOrderFromFirestore(id: string): Promise<void> {
  const path = `orders/${id}`;
  try {
    await deleteDoc(doc(db, 'orders', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveUserToFirestore(user: CRMUserAccount): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const cleanUser = JSON.parse(JSON.stringify(user));
    await setDoc(doc(db, 'users', user.id), cleanUser, { merge: true });
    console.log(`[Firebase] Novo acesso gerado no Firebase Firestore: ${user.username} (${user.id})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserFromFirestore(id: string): Promise<void> {
  const path = `users/${id}`;
  try {
    await deleteDoc(doc(db, 'users', id));
    console.log(`[Firebase] Acesso removido do Firebase Firestore: ${id}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSettingsToFirestore(settings: CycleSettings): Promise<void> {
  const path = 'settings/general';
  try {
    await setDoc(doc(db, 'settings', 'general'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------------------------------------------------------------------
// Purge Demo Data from Firebase (keeping only real database)
// ----------------------------------------------------------------------------
async function purgeDemoDataFromFirestore(): Promise<void> {
  try {
    // 1. Check and remove any demo customers from Firestore
    const customersSnap = await getDocs(collection(db, 'customers'));
    const demoCustomerDocs = customersSnap.docs.filter((d) => {
      const id = d.id;
      return DEMO_CUSTOMER_IDS.has(id) || (id.startsWith('cust-') && parseInt(id.replace('cust-', ''), 10) <= 20);
    });

    if (demoCustomerDocs.length > 0) {
      console.log(`[Firebase] Removendo ${demoCustomerDocs.length} registros demo da coleção customers...`);
      for (const d of demoCustomerDocs) {
        await deleteDoc(doc(db, 'customers', d.id));
      }
      console.log('[Firebase] Coleção customers limpa: base demo excluída do Firestore.');
    }

    // 2. Check and remove any demo orders from Firestore
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const demoOrderDocs = ordersSnap.docs.filter((d) => {
      const id = d.id;
      return DEMO_ORDER_IDS.has(id) || id.startsWith('ord-10') || id.startsWith('ord-11');
    });

    if (demoOrderDocs.length > 0) {
      console.log(`[Firebase] Removendo ${demoOrderDocs.length} pedidos demo da coleção orders...`);
      for (const d of demoOrderDocs) {
        await deleteDoc(doc(db, 'orders', d.id));
      }
      console.log('[Firebase] Coleção orders limpa: base demo excluída do Firestore.');
    }
  } catch (err) {
    console.warn('[Firebase] Aviso ao limpar base demo do Firestore:', err);
  }
}

// ----------------------------------------------------------------------------
// Ensure Master User (cesarDiretor / 123456) in Firestore
// ----------------------------------------------------------------------------
async function ensureMasterUserInFirestore(): Promise<void> {
  try {
    // Check if master user exists or needs updating in Firestore
    await setDoc(doc(db, 'users', ROOT_MASTER_USER.id), ROOT_MASTER_USER, { merge: true });
    console.log('[Firebase] Usuário Master (cesarDiretor) verificado e ativo no Firestore.');
  } catch (err) {
    console.error('[Firebase] Erro ao assegurar usuário master no Firestore:', err);
  }
}

// ----------------------------------------------------------------------------
// Initial Seed and Real-Time Synchronization
// ----------------------------------------------------------------------------

let isInitialized = false;

export async function initFirestoreDatabase(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  notifyStatus({ isSyncing: true, error: null });

  try {
    // 1. Test connection to server
    await testFirestoreConnection();
    notifyStatus({ isConnected: true });

    // 2. Ensure Master User exists in Firestore
    await ensureMasterUserInFirestore();

    // 3. Purge Demo Data from Firestore (Strictly Real Database only!)
    await purgeDemoDataFromFirestore();

    // 4. Set up real-time onSnapshot listeners with error callbacks
    // Customers (Real Database only)
    onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        const realCustomers: Customer[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Customer;
          if (!DEMO_CUSTOMER_IDS.has(data.id)) {
            realCustomers.push(data);
          }
        });

        localStorage.setItem('floresta_verde_crm_real_customers_v1', JSON.stringify(realCustomers));
        window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));

        notifyStatus({
          realCustomersCount: realCustomers.length,
          lastSyncedAt: new Date().toLocaleTimeString('pt-BR'),
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'customers');
      }
    );

    // Orders (Real Database only)
    onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const realOrders: Order[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Order;
          if (!DEMO_ORDER_IDS.has(data.id)) {
            realOrders.push(data);
          }
        });

        localStorage.setItem('floresta_verde_crm_real_orders_v1', JSON.stringify(realOrders));
        window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));

        notifyStatus({
          realOrdersCount: realOrders.length,
          lastSyncedAt: new Date().toLocaleTimeString('pt-BR'),
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'orders');
      }
    );

    // Users (All real system accesses synchronized from Firebase)
    onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const remoteUsers: CRMUserAccount[] = [];
        snapshot.forEach((d) => remoteUsers.push(d.data() as CRMUserAccount));

        // Guarantee master user is always present
        const hasMaster = remoteUsers.some(
          (u) => u.username.toUpperCase() === 'CESARDIRETOR'
        );
        if (!hasMaster) {
          remoteUsers.unshift(ROOT_MASTER_USER);
        }

        if (remoteUsers.length > 0) {
          localStorage.setItem('floresta_verde_crm_users_v1', JSON.stringify(remoteUsers));
          window.dispatchEvent(new CustomEvent(CRM_DATA_CHANGE_EVENT));
        }

        notifyStatus({
          usersCount: remoteUsers.length,
          lastSyncedAt: new Date().toLocaleTimeString('pt-BR'),
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      }
    );

    notifyStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncedAt: new Date().toLocaleTimeString('pt-BR'),
    });
  } catch (err: any) {
    console.error('[Firestore] Erro ao sincronizar banco:', err);
    notifyStatus({
      isConnected: false,
      isSyncing: false,
      error: err.message || 'Erro de conexão com o Firestore',
    });
  }
}
