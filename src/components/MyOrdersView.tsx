import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
  QrCode,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { useCart } from '../context/CartContext.tsx';
import type { Order, OrderStatus } from '../types/canteen.ts';

interface MyOrdersViewProps {
  onTrackOrder: (order: Order) => void;
  onViewInvoice: (order: Order) => void;
  onExploreMenu: () => void;
}

export const MyOrdersView: React.FC<MyOrdersViewProps> = ({
  onTrackOrder,
  onViewInvoice,
  onExploreMenu,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const { addToCart, setIsCartOpen } = useCart();

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter(
    (o) => !['collected', 'cancelled', 'rejected'].includes(o.orderStatus)
  );

  const pastOrders = orders.filter((o) =>
    ['collected', 'cancelled', 'rejected'].includes(o.orderStatus)
  );

  const currentList = activeTab === 'active' ? activeOrders : pastOrders;

  const handleReorder = (order: Order) => {
    api.getMenu().then((res) => {
      let addedCount = 0;
      for (const itemSnapshot of order.items) {
        const liveItem = res.items.find((i) => i.id === itemSnapshot.menuItemId);
        if (liveItem && liveItem.isAvailable && liveItem.stockQuantity > 0) {
          addToCart(liveItem, itemSnapshot.quantity, itemSnapshot.customization);
          addedCount++;
        }
      }
      setIsCartOpen(true);
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Order Placed</span>;
      case 'accepted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Kitchen Accepted</span>;
      case 'preparing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">Cooking Now 🍳</span>;
      case 'ready':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">Ready at Counter 🔔</span>;
      case 'collected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Collected ✅</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Cancelled ❌</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">Rejected ⚠️</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            My Canteen Orders
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track live preparation, pickup deadlines, receipts, and order histories
          </p>
        </div>

        {/* Active vs Past Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'active'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Active Orders ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'past'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Past History ({pastOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading your orders...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            No {activeTab} orders found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {activeTab === 'active'
              ? "You don't have any active food orders being prepared right now."
              : 'Your completed or historical meal orders will appear here.'}
          </p>
          <button
            onClick={onExploreMenu}
            className="mt-5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Order Food Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((order) => {
            const isReady = order.orderStatus === 'ready';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden p-5 ${
                  isReady
                    ? 'border-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Top Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-slate-900 text-base">
                      {order.orderNumber}
                    </span>
                    {getStatusBadge(order.orderStatus)}
                    <span className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      Slot: <strong className="text-slate-800">{order.slotLabel}</strong>
                    </span>
                  </div>
                </div>

                {/* Middle items summary */}
                <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Dishes Ordered ({order.items.reduce((s, it) => s + it.quantity, 0)})
                    </span>
                    <div className="text-xs text-slate-700 leading-relaxed font-medium">
                      {order.items.map((it, idx) => (
                        <span key={it.id}>
                          {it.quantity}× {it.itemNameSnapshot}
                          {idx < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>

                    {order.specialInstructions && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                        Instruction: {order.specialInstructions}
                      </p>
                    )}
                  </div>

                  {/* Token & Price Callout */}
                  <div className="flex items-center gap-4 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-center px-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Collection Code
                      </span>
                      <span className="font-mono font-black text-xl text-orange-600">
                        {order.collectionToken}
                      </span>
                    </div>

                    <div className="h-8 w-px bg-slate-200" />

                    <div className="text-right px-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Total Amount
                      </span>
                      <span className="font-black text-lg text-slate-900">
                        ₹{order.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewInvoice(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Receipt / Invoice</span>
                    </button>
                    <button
                      onClick={() => handleReorder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder Dishes</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onTrackOrder(order)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-all"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Live Tracking</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
