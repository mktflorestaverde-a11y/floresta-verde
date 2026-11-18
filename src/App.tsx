/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { OverviewView } from './components/views/OverviewView';
import { CustomersView } from './components/views/CustomersView';
import { FunnelsView } from './components/views/FunnelsView';
import { PrazoView } from './components/views/PrazoView';
import { OrdersView } from './components/views/OrdersView';
import { ReportsView } from './components/views/ReportsView';
import { UserManagementView } from './components/views/UserManagementView';
import { WhatsAppWebView } from './components/views/WhatsAppWebView';
import { LoginView } from './components/views/LoginView';
import { B2BLandingPage } from './components/landing/B2BLandingPage';
import { CustomerDetailModal } from './components/modals/CustomerDetailModal';
import { CustomerFormModal } from './components/modals/CustomerFormModal';
import { OrderFormModal } from './components/modals/OrderFormModal';
import { DataGuideModal } from './components/modals/DataGuideModal';
import { LogoUploadModal } from './components/modals/LogoUploadModal';
import { LandingMediaModal } from './components/modals/LandingMediaModal';
import { HostingerDeployModal } from './components/modals/HostingerDeployModal';
import { ExcelImportModal } from './components/modals/ExcelImportModal';
import { ExcelOrderImportModal } from './components/modals/ExcelOrderImportModal';
import { Sliders } from 'lucide-react';
import {
  B2BFunnelStage,
  Customer,
  CustomerWithMetrics,
  CycleSettings,
  EcommerceMetrics,
  FilterPeriod,
  Order,
  SegmentFilter,
} from './types/crm';
import {
  crmStorage,
  CRM_DATA_CHANGE_EVENT,
  CRMAuthUser,
} from './services/crmStorage';
import { initFirestoreDatabase } from './services/firestoreSync';
import {
  calculateB2BFunnelData,
  calculateB2CFunnelData,
  calculateCustomerMetrics,
  calculateOverviewMetrics,
  calculatePurchaseRhythm,
  calculateRecencyBreakdown,
  getReactivationCustomers,
} from './utils/crmCalculations';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<CRMAuthUser | null>(() => {
    return crmStorage.getAuthUser();
  });

  // Public View: 'landing' (B2B Conversion Landing Page as primary entry) or 'login' (Employee login)
  const [publicView, setPublicView] = useState<'landing' | 'login'>('landing');

  // Preview Landing Page for logged-in internal staff
  const [previewLandingPage, setPreviewLandingPage] = useState<boolean>(false);

  // Demo vs Real Mode state
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => crmStorage.isDemoMode());

  // Navigation & Primary Filter States
  const [activeTab, setActiveTab] = useState<ActiveTab>('visao_geral');
  const [period, setPeriod] = useState<FilterPeriod>('30d');
  const [segment, setSegment] = useState<SegmentFilter>('b2b');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Storage Data States
  const [customers, setCustomers] = useState<Customer[]>(() => crmStorage.getCustomers());
  const [orders, setOrders] = useState<Order[]>(() => crmStorage.getOrders());
  const [settings, setSettings] = useState<CycleSettings>(() => crmStorage.getSettings());
  const [ecommerce, setEcommerce] = useState<EcommerceMetrics>(() => crmStorage.getEcommerceMetrics());
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => crmStorage.getCustomLogo());

  // Modals & Drawers States
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithMetrics | null>(null);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [defaultCustomerForOrder, setDefaultCustomerForOrder] = useState<Customer | null>(null);
  const [isDataGuideOpen, setIsDataGuideOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isHostingerModalOpen, setIsHostingerModalOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isExcelOrderImportOpen, setIsExcelOrderImportOpen] = useState(false);

  // Sync state whenever storage changes
  const refreshFromStorage = useCallback(() => {
    setIsDemoMode(crmStorage.isDemoMode());
    setCustomers(crmStorage.getCustomers());
    setOrders(crmStorage.getOrders());
    setSettings(crmStorage.getSettings());
    setEcommerce(crmStorage.getEcommerceMetrics());
    setCustomLogoUrl(crmStorage.getCustomLogo());
  }, []);

  useEffect(() => {
    initFirestoreDatabase().catch((e) => console.error('[Firebase] Init error:', e));
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      refreshFromStorage();
    };

    window.addEventListener(CRM_DATA_CHANGE_EVENT, handleStorageChange);
    return () => window.removeEventListener(CRM_DATA_CHANGE_EVENT, handleStorageChange);
  }, [refreshFromStorage]);

  // Handle Demo Mode switch instantaneously ("NA HORA COM TODAS AS OPÇÕES REAIS")
  const handleToggleDemoMode = useCallback(() => {
    const newDemoState = !crmStorage.isDemoMode();
    crmStorage.setDemoMode(newDemoState);
    setIsDemoMode(newDemoState);
    refreshFromStorage();
  }, [refreshFromStorage]);

  const handleLogout = useCallback(() => {
    crmStorage.logout();
    setCurrentUser(null);
    setPublicView('landing');
    setPreviewLandingPage(false);
  }, []);

  const openBoletosCount = useMemo(() => {
    return orders.filter((o) => {
      const isTerm = o.isTermPayment ||
        (o.paymentMethod || '').toLowerCase().includes('boleto') ||
        (o.paymentMethod || '').toLowerCase().includes('prazo');
      const isPaid = o.status === 'pago' && o.termStatus !== 'vencido' && o.termStatus !== 'em_dia' && o.termStatus !== 'vence_hoje'
        ? o.termStatus === 'pago' || !o.termStatus
        : o.termStatus === 'pago';
      return isTerm && !isPaid && o.status !== 'cancelado';
    }).length;
  }, [orders]);

  // Derived Business Calculations
  const customersWithMetrics = useMemo(() => {
    const refDate = new Date();
    return customers.map((c) =>
      calculateCustomerMetrics(c, orders, settings, refDate)
    );
  }, [customers, orders, settings]);

  // Keep selectedCustomer updated if background changes occur
  useEffect(() => {
    if (selectedCustomer) {
      const updated = customersWithMetrics.find((c) => c.id === selectedCustomer.id);
      if (updated) setSelectedCustomer(updated);
    }
  }, [customersWithMetrics, selectedCustomer]);

  const overviewMetrics = useMemo(() => {
    return calculateOverviewMetrics(
      orders,
      customersWithMetrics,
      period,
      segment,
      new Date(),
      isDemoMode
    );
  }, [orders, customersWithMetrics, period, segment, isDemoMode]);

  const b2bFunnel = useMemo(() => {
    return calculateB2BFunnelData(customers, orders, isDemoMode);
  }, [customers, orders, isDemoMode]);

  const b2cFunnel = useMemo(() => {
    const b2cCusts = customers.filter((c) => c.segment === 'b2c');

    if (!isDemoMode) {
      // In REAL mode: use actual count of real purchases, do not invent numbers
      const firstCount = b2cCusts.filter((c) => {
        const o = orders.filter((ord) => ord.customerId === c.id && ord.status === 'pago');
        return o.length >= 1;
      }).length;

      const recompraCount = b2cCusts.filter((c) => {
        const o = orders.filter((ord) => ord.customerId === c.id && ord.status === 'pago');
        return o.length >= 2;
      }).length;

      return calculateB2CFunnelData(
        ecommerce.b2cVisitorsCount,
        ecommerce.b2cCartCount,
        firstCount,
        recompraCount,
        false
      );
    }

    // In DEMO mode: illustrative sales funnel
    const firstCount = Math.max(1030, b2cCusts.filter((c) => {
      const o = orders.filter((ord) => ord.customerId === c.id && ord.status === 'pago');
      return o.length >= 1;
    }).length * 120);

    const recompraCount = Math.max(360, b2cCusts.filter((c) => {
      const o = orders.filter((ord) => ord.customerId === c.id && ord.status === 'pago');
      return o.length >= 2;
    }).length * 80);

    return calculateB2CFunnelData(
      ecommerce.b2cVisitorsCount,
      ecommerce.b2cCartCount,
      firstCount,
      recompraCount,
      true
    );
  }, [ecommerce, customers, orders, isDemoMode]);

  const purchaseRhythm = useMemo(() => {
    return calculatePurchaseRhythm(orders, period, isDemoMode);
  }, [orders, period, isDemoMode]);

  const recencyBreakdown = useMemo(() => {
    return calculateRecencyBreakdown(customersWithMetrics, segment, isDemoMode);
  }, [customersWithMetrics, segment, isDemoMode]);

  const reactivationList = useMemo(() => {
    return getReactivationCustomers(customersWithMetrics, segment);
  }, [customersWithMetrics, segment]);

  // Handlers for Customer CRUD
  const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    if (customerToEdit) {
      crmStorage.updateCustomer(customerToEdit.id, customerData);
    } else {
      crmStorage.addCustomer(customerData);
    }
    refreshFromStorage();
  };

  const handleDeleteCustomer = (target: Customer | CustomerWithMetrics | string) => {
    const id = typeof target === 'string' ? target : target.id;
    if (confirm('Tem certeza de que deseja remover este cliente? Seus pedidos vinculados também serão excluídos.')) {
      crmStorage.deleteCustomer(id);
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
      refreshFromStorage();
    }
  };

  const handleUpdateCustomerStage = (id: string, stage: B2BFunnelStage) => {
    crmStorage.updateCustomer(id, { funnelStage: stage });
    refreshFromStorage();
  };

  // Handlers for Order CRUD
  const handleSaveOrder = (orderData: Omit<Order, 'id'>) => {
    if (orderToEdit) {
      crmStorage.updateOrder(orderToEdit.id, orderData);
    } else {
      crmStorage.addOrder(orderData);
    }
    refreshFromStorage();
  };

  const handleDeleteOrder = (target: Order | string) => {
    const id = typeof target === 'string' ? target : target.id;
    if (confirm('Tem certeza de que deseja excluir este pedido? Os indicadores de compras e recompra serão recalculados.')) {
      crmStorage.deleteOrder(id);
      refreshFromStorage();
    }
  };

  const handleUpdateEcommerceMetrics = (newMetrics: Partial<EcommerceMetrics>) => {
    crmStorage.saveEcommerceMetrics({
      ...ecommerce,
      ...newMetrics,
      lastSyncedAt: new Date().toISOString(),
    });
    refreshFromStorage();
  };

  const handleUpdateSettings = (newSettings: CycleSettings) => {
    crmStorage.saveSettings(newSettings);
    refreshFromStorage();
  };

  const handleResetDemo = () => {
    crmStorage.resetToDemo();
    refreshFromStorage();
  };

  const handleExportData = () => {
    const jsonStr = crmStorage.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floresta-verde-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr: string) => {
    const success = crmStorage.importData(jsonStr);
    if (success) {
      alert('Dados importados com sucesso!');
      refreshFromStorage();
    } else {
      alert('Falha ao importar o arquivo. Verifique se o formato JSON é válido.');
    }
  };

  // IF NOT AUTHENTICATED: Display B2B Conversion Landing Page by default, with employee login link
  // Public visitors CANNOT edit logo, upload photos, or change sizes
  if (!currentUser) {
    if (publicView === 'landing') {
      return (
        <B2BLandingPage
          onOpenEmployeeLogin={() => setPublicView('login')}
          customLogoUrl={customLogoUrl}
          isTeamMember={false}
        />
      );
    }

    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
        customLogoUrl={customLogoUrl}
        onBackToLanding={() => setPublicView('landing')}
      />
    );
  }

  // PREVIEW LANDING PAGE FOR LOGGED-IN STAFF (Exclusively team members who have permission to customize sizes & media)
  if (previewLandingPage) {
    return (
      <div className="relative min-h-screen">
        {/* Top Control Bar to return to CRM */}
        <div className="sticky top-0 z-50 bg-[#1e2e13] text-[#e0ead4] px-4 py-2.5 flex flex-wrap items-center justify-between text-xs border-b border-[#354f21] shadow-lg gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">Visualização da Equipe Interna:</span>
            <span className="text-[#bfd9b4]">
              Você está autenticado como colaborador e possui permissão para personalizar os tamanhos da logo, da escrita e fotos.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMediaModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#345c27] to-[#487a37] hover:from-[#2d5021] hover:to-[#3e6b2f] text-white font-bold transition-all border border-[#52873f] cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Ajuste manual da logo, da escrita do cabeçalho e imagens da landing page"
            >
              <Sliders className="w-3.5 h-3.5 text-[#b7f09f]" />
              <span>Ajustar Tamanho da Logo & Escritos</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewLandingPage(false)}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-[#edf3e5] text-[#243315] font-bold transition-all shadow-xs cursor-pointer"
            >
              ← Retornar ao CRM
            </button>
          </div>
        </div>

        <B2BLandingPage
          onOpenEmployeeLogin={() => setPreviewLandingPage(false)}
          customLogoUrl={customLogoUrl}
          onOpenLogoModal={() => setIsMediaModalOpen(true)}
          onOpenMediaModal={() => setIsMediaModalOpen(true)}
          isTeamMember={true}
        />

        <LandingMediaModal
          isOpen={isMediaModalOpen || isLogoModalOpen}
          onClose={() => {
            setIsMediaModalOpen(false);
            setIsLogoModalOpen(false);
          }}
          currentLogoUrl={customLogoUrl}
          onLogoUpdated={(url) => setCustomLogoUrl(url)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f4ee] flex flex-col antialiased text-[#1c2918]">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        customLogoUrl={customLogoUrl}
        onOpenLogoModal={() => setIsMediaModalOpen(true)}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        onViewLandingPage={() => setPreviewLandingPage(true)}
        onOpenMediaModal={() => setIsMediaModalOpen(true)}
        onOpenHostingerModal={() => setIsHostingerModalOpen(true)}
        counts={{
          customers: customers.length,
          orders: orders.length,
          prazoOpen: openBoletosCount,
        }}
      />

      {/* Main Content Area (Offset by sidebar width on large screens) */}
      <div className="lg:pl-68 flex flex-col flex-1 min-w-0 transition-all duration-200">
        {/* Top Header Bar */}
        <TopHeader
          activeTab={activeTab}
          period={period}
          onSelectPeriod={(p) => setPeriod(p)}
          segment={segment}
          onSelectSegment={(s) => setSegment(s)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenNewCustomer={() => {
            setCustomerToEdit(null);
            setIsCustomerFormOpen(true);
          }}
          onOpenNewOrder={() => {
            setOrderToEdit(null);
            setDefaultCustomerForOrder(null);
            setIsOrderFormOpen(true);
          }}
          onOpenDataGuide={() => setIsDataGuideOpen(true)}
          onOpenLogoModal={() => setIsLogoModalOpen(true)}
          onOpenHostingerModal={() => setIsHostingerModalOpen(true)}
          isDemoMode={isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSelectTab={(t) => setActiveTab(t)}
          onViewLandingPage={() => setPreviewLandingPage(true)}
        />

        {/* Viewport for Active Tab */}
        <main className="flex-1 px-4 md:px-8 py-2 max-w-7xl w-full mx-auto">
          {activeTab === 'visao_geral' && (
            <OverviewView
              metrics={overviewMetrics}
              period={period}
              segment={segment}
              b2bFunnel={b2bFunnel}
              b2cFunnel={b2cFunnel}
              purchaseRhythm={purchaseRhythm}
              recencyBreakdown={recencyBreakdown}
              reactivationList={reactivationList}
              onSelectCustomer={(c) => setSelectedCustomer(c)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenDataGuide={() => setIsDataGuideOpen(true)}
              isDemoMode={isDemoMode}
              onToggleDemoMode={handleToggleDemoMode}
            />
          )}

          {activeTab === 'clientes' && (
            <CustomersView
              customers={customersWithMetrics}
              currentSegment={segment}
              onSelectSegment={(s) => setSegment(s)}
              onSelectCustomer={(c) => setSelectedCustomer(c)}
              onEditCustomer={(c) => {
                setCustomerToEdit(c);
                setIsCustomerFormOpen(true);
              }}
              onDeleteCustomer={handleDeleteCustomer}
              onNewCustomer={() => {
                setCustomerToEdit(null);
                setIsCustomerFormOpen(true);
              }}
              onOpenExcelImport={() => setIsExcelImportOpen(true)}
              onNewOrderForCustomer={(c) => {
                setOrderToEdit(null);
                setDefaultCustomerForOrder(c);
                setIsOrderFormOpen(true);
              }}
            />
          )}

          {activeTab === 'funis' && (
            <FunnelsView
              customers={customersWithMetrics}
              orders={orders}
              ecommerce={ecommerce}
              onUpdateCustomerStage={handleUpdateCustomerStage}
              onSelectCustomer={(c) => setSelectedCustomer(c)}
              onUpdateEcommerceMetrics={handleUpdateEcommerceMetrics}
              onNewCustomer={() => {
                setCustomerToEdit(null);
                setIsCustomerFormOpen(true);
              }}
              onOpenDataGuide={() => setIsDataGuideOpen(true)}
              isDemoMode={isDemoMode}
            />
          )}

          {activeTab === 'prazo' && (
            <PrazoView
              customers={customers}
              orders={orders}
              settings={settings}
              onSelectCustomer={(c) => {
                const found = customersWithMetrics.find((item) => item.id === c.id);
                if (found) setSelectedCustomer(found);
              }}
              onNewOrderForCustomer={(c) => {
                setOrderToEdit(null);
                setDefaultCustomerForOrder(c);
                setIsOrderFormOpen(true);
              }}
              onMarkBoletoPaid={(orderId) => {
                crmStorage.markBoletoAsPaid(orderId);
                refreshFromStorage();
              }}
              onOpenDataGuide={() => setIsDataGuideOpen(true)}
              isDemoMode={isDemoMode}
            />
          )}

          {activeTab === 'pedidos' && (
            <OrdersView
              orders={orders}
              currentSegment={segment}
              onSelectSegment={(s) => setSegment(s)}
              onNewOrder={() => {
                setOrderToEdit(null);
                setDefaultCustomerForOrder(null);
                setIsOrderFormOpen(true);
              }}
              onEditOrder={(order) => {
                setOrderToEdit(order);
                setIsOrderFormOpen(true);
              }}
              onDeleteOrder={handleDeleteOrder}
              onSelectCustomerById={(cid) => {
                const found = customersWithMetrics.find((c) => c.id === cid);
                if (found) setSelectedCustomer(found);
              }}
              onOpenExcelOrderImport={() => setIsExcelOrderImportOpen(true)}
            />
          )}

          {activeTab === 'relatorios' && (
            <ReportsView
              metrics={overviewMetrics}
              customers={customersWithMetrics}
              orders={orders}
              settings={settings}
              period={period}
              customLogoUrl={customLogoUrl}
              onOpenLogoModal={() => setIsLogoModalOpen(true)}
              onUpdateSettings={handleUpdateSettings}
              onResetDemo={handleResetDemo}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onOpenDataGuide={() => setIsDataGuideOpen(true)}
              isDemoMode={isDemoMode}
              onToggleDemoMode={handleToggleDemoMode}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppWebView
              customers={customersWithMetrics}
              orders={orders}
              currentUser={currentUser}
              onSelectCustomer={(c) => setSelectedCustomer(c)}
            />
          )}

          {activeTab === 'usuarios' && (
            <UserManagementView
              currentUser={currentUser}
              onRefreshData={refreshFromStorage}
            />
          )}
        </main>
      </div>

      {/* Modal: Customer Detail Profile */}
      <CustomerDetailModal
        customer={selectedCustomer}
        orders={orders}
        onClose={() => setSelectedCustomer(null)}
        onEditCustomer={(c) => {
          setCustomerToEdit(c);
          setIsCustomerFormOpen(true);
        }}
        onDeleteCustomer={handleDeleteCustomer}
        onNewOrderForCustomer={(c) => {
          setOrderToEdit(null);
          setDefaultCustomerForOrder(c);
          setIsOrderFormOpen(true);
        }}
        onEditOrder={(ord) => {
          setOrderToEdit(ord);
          setIsOrderFormOpen(true);
        }}
        onDeleteOrder={handleDeleteOrder}
        onOpenExcelOrderImport={() => setIsExcelOrderImportOpen(true)}
      />

      {/* Modal: Create or Edit Customer */}
      <CustomerFormModal
        isOpen={isCustomerFormOpen}
        customerToEdit={customerToEdit}
        onClose={() => {
          setIsCustomerFormOpen(false);
          setCustomerToEdit(null);
        }}
        onSave={handleSaveCustomer}
      />

      {/* Modal: Create or Edit Order */}
      <OrderFormModal
        isOpen={isOrderFormOpen}
        orderToEdit={orderToEdit}
        defaultCustomer={defaultCustomerForOrder}
        customers={customers}
        onClose={() => {
          setIsOrderFormOpen(false);
          setOrderToEdit(null);
          setDefaultCustomerForOrder(null);
        }}
        onSave={handleSaveOrder}
      />

      {/* Modal: Technical Guide & Architecture */}
      <DataGuideModal
        isOpen={isDataGuideOpen}
        onClose={() => setIsDataGuideOpen(false)}
        onResetDemo={handleResetDemo}
      />

      {/* Modal: Upload and Personalize Logo & Landing Media */}
      <LandingMediaModal
        isOpen={isMediaModalOpen || isLogoModalOpen}
        onClose={() => {
          setIsMediaModalOpen(false);
          setIsLogoModalOpen(false);
        }}
        currentLogoUrl={customLogoUrl}
        onLogoUpdated={(url) => setCustomLogoUrl(url)}
      />

      {/* Modal: Deploy to Hostinger & Custom Domain */}
      <HostingerDeployModal
        isOpen={isHostingerModalOpen}
        onClose={() => setIsHostingerModalOpen(false)}
      />

      {/* Modal: Importar Planilha Excel de Clientes */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        existingCustomers={customers}
        onImportComplete={(toInsert, toUpdate) => {
          crmStorage.batchUpsertCustomers(toInsert, toUpdate);
          refreshFromStorage();
        }}
      />

      {/* Modal: Importar Planilha Excel de Histórico de Pedidos */}
      <ExcelOrderImportModal
        isOpen={isExcelOrderImportOpen}
        onClose={() => setIsExcelOrderImportOpen(false)}
        existingCustomers={customers}
        onImportComplete={(ordersToInsert, newCustomersToInsert) => {
          crmStorage.batchInsertOrders(ordersToInsert, newCustomersToInsert, true);
          refreshFromStorage();
        }}
      />
    </div>
  );
}
