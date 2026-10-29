import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Header } from './components/Header.tsx';
import { MenuSection } from './components/MenuSection.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { RazorpayModal } from './components/RazorpayModal.tsx';
import { OrderConfirmationModal } from './components/OrderConfirmationModal.tsx';
import { OrderTrackerModal } from './components/OrderTrackerModal.tsx';
import { MyOrdersView } from './components/MyOrdersView.tsx';
import { StaffDashboard } from './components/StaffDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { PickupVerificationModal } from './components/PickupVerificationModal.tsx';
import { AutomatedTestRunnerModal } from './components/AutomatedTestRunnerModal.tsx';
import { InvoiceModal } from './components/InvoiceModal.tsx';
import { NotificationDrawer } from './components/NotificationDrawer.tsx';
import { api } from './lib/api.ts';
import type {
  CanteenSettings,
  Category,
  MenuItem,
  Order,
  PaymentMethod,
} from './types/canteen.ts';

function MainApp() {
  const { user, isStaff, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('menu');

  // Canteen Data
  const [settings, setSettings] = useState<CanteenSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Modals & Flow State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);

  const refreshSettings = () => {
    api.getSettings()
      .then((s) => setSettings(s))
      .catch((e) => console.error(e));
  };

  const loadData = async () => {
    try {
      const [sRes, mRes] = await Promise.all([api.getSettings(), api.getMenu()]);
      setSettings(sRes);
      setCategories(mRes.categories);
      setMenuItems(mRes.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, []);

  // When order is created in CheckoutModal
  const handleOrderCreated = (order: Order, paymentMethod: PaymentMethod) => {
    setIsCheckoutOpen(false);
    setActiveOrder(order);

    if (paymentMethod.startsWith('razorpay')) {
      // Trigger Razorpay sandbox checkout modal
      setIsRazorpayOpen(true);
    } else {
      // Cash at counter - direct confirmation
      setIsConfirmationOpen(true);
    }
  };

  // When payment succeeds in RazorpayModal
  const handlePaymentSuccess = (updatedOrder: Order) => {
    setIsRazorpayOpen(false);
    setActiveOrder(updatedOrder);
    setIsConfirmationOpen(true);
  };

  // Open live tracker for an order
  const handleTrackOrder = (order: Order) => {
    setActiveOrder(order);
    setIsTrackerOpen(true);
  };

  // Open invoice modal
  const handleViewInvoice = (order: Order) => {
    setActiveInvoiceOrder(order);
    setIsInvoiceOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Platform Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        settings={settings}
        onOpenTestRunner={() => setIsTestRunnerOpen(true)}
        onOpenVerificationModal={() => setIsVerificationOpen(true)}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Starting CampusBite Platform...</h3>
            <p className="text-xs text-slate-500 mt-1">Connecting to college canteen database and kitchen queue</p>
          </div>
        ) : (
          <>
            {currentTab === 'menu' && (
              <MenuSection
                categories={categories}
                items={menuItems}
                settings={settings}
              />
            )}

            {currentTab === 'orders' && (
              <MyOrdersView
                onTrackOrder={handleTrackOrder}
                onViewInvoice={handleViewInvoice}
                onExploreMenu={() => setCurrentTab('menu')}
              />
            )}

            {currentTab === 'staff-kds' && (
              <StaffDashboard
                onOpenVerificationModal={() => setIsVerificationOpen(true)}
                onViewInvoice={handleViewInvoice}
              />
            )}

            {currentTab === 'admin-analytics' && (
              <AdminDashboard
                settings={settings}
                onRefreshSettings={refreshSettings}
                onViewInvoice={handleViewInvoice}
              />
            )}
          </>
        )}
      </main>

      {/* Modals & Slide-out Drawers */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        settings={settings}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderCreated={handleOrderCreated}
        settings={settings}
      />

      <RazorpayModal
        order={activeOrder}
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <OrderConfirmationModal
        order={activeOrder}
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onTrackOrder={handleTrackOrder}
      />

      <OrderTrackerModal
        orderId={activeOrder?.id || null}
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        onViewInvoice={handleViewInvoice}
      />

      <InvoiceModal
        order={activeInvoiceOrder}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />

      <PickupVerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        onVerificationComplete={() => {
          loadData();
        }}
      />

      <AutomatedTestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />

      <NotificationDrawer />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">
            CampusBite — Digital College Canteen Platform
          </p>
          <p className="text-[11px] text-slate-400">
            Queue Reduction • Advance Pickup Slots • Razorpay UPI Gateway • Kitchen Display System (KDS)
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}
