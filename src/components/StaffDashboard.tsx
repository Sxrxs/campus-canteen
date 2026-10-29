import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  Search,
  Check,
  X,
  ShieldCheck,
  RefreshCw,
  UtensilsCrossed,
  FileText,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { useNotifications } from '../context/NotificationContext.tsx';
import type { Order, MenuItem, OrderStatus } from '../types/canteen.ts';

interface StaffDashboardProps {
  onOpenVerificationModal: () => void;
  onViewInvoice: (order: Order) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onOpenVerificationModal,
  onViewInvoice,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Kitchen capacity exceeded for current slot');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { playChime } = useNotifications();

  const loadData = async () => {
    try {
      const [ordRes, menuRes] = await Promise.all([api.getOrders(), api.getMenu()]);
      setOrders(ordRes);
      setMenuItems(menuRes.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    prepMinutes?: number
  ) => {
    setUpdatingId(orderId);
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus, note, prepMinutes);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (soundEnabled && newStatus === 'ready') {
        playChime();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingOrder) return;
    try {
      await handleUpdateStatus(rejectingOrder.id, 'rejected', rejectReason);
      setRejectingOrder(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleItemAvailability = async (item: MenuItem) => {
    try {
      const updated = await api.updateMenuItem(item.id, {
        isAvailable: !item.isAvailable,
      });
      setMenuItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (e) {
      console.error(e);
    }
  };

  // Status groupings
  const placedCount = orders.filter((o) => o.orderStatus === 'placed').length;
  const acceptedCount = orders.filter((o) => o.orderStatus === 'accepted').length;
  const preparingCount = orders.filter((o) => o.orderStatus === 'preparing').length;
  const readyCount = orders.filter((o) => o.orderStatus === 'ready').length;
  const activeCount = placedCount + acceptedCount + preparingCount + readyCount;

  // Filtered list
  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'active') {
      return !['collected', 'cancelled', 'rejected'].includes(o.orderStatus);
    }
    if (filterStatus === 'all') return true;
    return o.orderStatus === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Kitchen Metrics & Controls Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Kitchen Order Display (KDS)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE COUNTER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time queue sequencing, slot prioritization & preparation timer
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Handover Verification CTA */}
          <button
            onClick={onOpenVerificationModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify & Handover Food</span>
          </button>

          {/* Sound Notification Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-orange-400'
                : 'bg-slate-800/40 border-slate-700 text-slate-500'
            }`}
            title="Toggle kitchen audio alert for incoming orders"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Refresh order queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Queue Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setFilterStatus('placed')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'placed'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-slate-900 border-slate-200/80 hover:border-blue-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
            1. New Orders
          </span>
          <span className="text-2xl sm:text-3xl font-black mt-1 block">
            {placedCount}
          </span>
          <span className="text-[10px] opacity-70">Awaiting kitchen accept</span>
        </div>

        <div
          onClick={() => setFilterStatus('accepted')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'accepted'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-slate-900 border-slate-200/80 hover:border-indigo-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
            2. Queued Tickets
          </span>
          <span className="text-2xl sm:text-3xl font-black mt-1 block">
            {acceptedCount}
          </span>
          <span className="text-[10px] opacity-70">Ready to fire</span>
        </div>

        <div
          onClick={() => setFilterStatus('preparing')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'preparing'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md'
              : 'bg-white text-slate-900 border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
            3. Cooking Now
          </span>
          <span className="text-2xl sm:text-3xl font-black mt-1 block">
            {preparingCount}
          </span>
          <span className="text-[10px] opacity-70">On grill / tandoor</span>
        </div>

        <div
          onClick={() => setFilterStatus('ready')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'ready'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-slate-900 border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
            4. Ready for Handover
          </span>
          <span className="text-2xl sm:text-3xl font-black mt-1 block">
            {readyCount}
          </span>
          <span className="text-[10px] opacity-70">Awaiting student collection</span>
        </div>
      </div>

      {/* Fast Item Availability 86 Toggle Bar (Kitchen Rush Control) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-bold text-slate-900">
              Kitchen 86 / Quick Stock Toggle (Rush Hour Protection)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Click to toggle sold out status in real-time
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleToggleItemAvailability(item)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                item.isAvailable && item.stockQuantity > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100 line-through'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${item.isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'active'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Active Queue ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('placed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'placed'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            New ({placedCount})
          </button>
          <button
            onClick={() => setFilterStatus('accepted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'accepted'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Queued ({acceptedCount})
          </button>
          <button
            onClick={() => setFilterStatus('preparing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'preparing'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cooking ({preparingCount})
          </button>
          <button
            onClick={() => setFilterStatus('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'ready'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ready ({readyCount})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-base">Kitchen Queue is Clear!</h3>
          <p className="text-xs text-slate-500 mt-1">
            No orders match current filter. Incoming tickets will appear here with live notifications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isPlaced = order.orderStatus === 'placed';
            const isAccepted = order.orderStatus === 'accepted';
            const isPreparing = order.orderStatus === 'preparing';
            const isReady = order.orderStatus === 'ready';

            // Calculate elapsed minutes since order creation
            const elapsedMinutes = Math.max(
              0,
              Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
            );

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border-2 transition-all p-5 flex flex-col justify-between shadow-xs ${
                  isReady
                    ? 'border-emerald-400 bg-emerald-50/20 shadow-md'
                    : isPreparing
                    ? 'border-amber-400 bg-amber-50/15'
                    : isPlaced
                    ? 'border-blue-400 bg-blue-50/15 animate-pulse'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Ticket Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className="font-mono font-black text-xs text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded">
                          {order.collectionToken}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">
                        {order.studentName} ({order.studentCollegeId || 'STD'})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 block">
                        Slot: {order.slotLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Elapsed: {elapsedMinutes}m ago
                      </span>
                    </div>
                  </div>

                  {/* Payment Status & Instructions */}
                  <div className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">
                      Payment:
                    </span>
                    <span
                      className={`font-bold capitalize px-2 py-0.5 rounded ${
                        order.paymentStatus === 'captured'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.paymentStatus === 'cash_on_pickup'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {order.paymentStatus.replace('_', ' ')}
                    </span>
                  </div>

                  {order.specialInstructions && (
                    <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <strong>Kitchen Note:</strong> {order.specialInstructions}
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2 py-2 border-t border-slate-100">
                    {order.items.map((it) => (
                      <div
                        key={it.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-base text-slate-900">
                              {it.quantity}×
                            </span>
                            <span className="font-bold text-xs text-slate-800">
                              {it.itemNameSnapshot}
                            </span>
                          </div>
                          {it.customization && (
                            <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
                              Note: {it.customization}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Kitchen Action Buttons */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {isPlaced && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'accepted', 'Accepted by kitchen', 10)}
                        className="py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-xs"
                      >
                        Accept Ticket
                      </button>
                      <button
                        onClick={() => setRejectingOrder(order)}
                        className="py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {isAccepted && (
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'preparing', 'Started cooking on grill/tandoor')}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Start Cooking (Preparing)</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'ready', 'Order ready on counter for pickup')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Ready for Pickup 🔔</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={onOpenVerificationModal}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Verify Handover (Code: {order.collectionToken})</span>
                    </button>
                  )}

                  {order.orderStatus === 'collected' && (
                    <div className="py-2 text-center text-xs font-bold text-slate-500 bg-slate-100 rounded-xl">
                      Collected at {new Date(order.collectedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Order Prompt Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Reject Order {rejectingOrder.orderNumber}?
            </h3>
            <p className="text-xs text-slate-500">
              A rejection automatically refunds the student and notifies them with your reason.
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Sold out / kitchen rush limit"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRejectingOrder(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
