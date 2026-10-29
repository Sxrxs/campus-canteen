import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  UtensilsCrossed,
  ShieldAlert,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Download,
  CheckCircle2,
  Flame,
  PauseCircle,
  PlayCircle,
  FileText,
  Search,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import type {
  AnalyticsSummary,
  CanteenSettings,
  MenuItem,
  Category,
  PickupSlot,
  AuditLog,
  Order,
  DietaryLabel,
} from '../types/canteen.ts';

interface AdminDashboardProps {
  settings: CanteenSettings | null;
  onRefreshSettings: () => void;
  onViewInvoice: (order: Order) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  onRefreshSettings,
  onViewInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'slots' | 'orders' | 'logs'>('overview');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState<{
    name: string;
    categoryId: string;
    price: number;
    description: string;
    imageUrl: string;
    dietaryLabels: DietaryLabel[];
    allergenInformation: string;
    preparationTimeMinutes: number;
    stockQuantity: number;
  }>({
    name: '',
    categoryId: '',
    price: 90,
    description: '',
    imageUrl: '',
    dietaryLabels: ['veg'],
    allergenInformation: '',
    preparationTimeMinutes: 8,
    stockQuantity: 50,
  });

  // Refund Modal State
  const [refundingOrder, setRefundingOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('Order cancelled upon student request');

  const loadAllData = async () => {
    try {
      const [analyticsRes, menuRes, slotsRes, ordersRes, logsRes] = await Promise.all([
        api.getAnalytics(),
        api.getMenu(),
        api.getPickupSlots(),
        api.getOrders(),
        api.getAuditLogs(),
      ]);
      setAnalytics(analyticsRes);
      setMenuItems(menuRes.items);
      setCategories(menuRes.categories);
      setSlots(slotsRes);
      setOrders(ordersRes);
      setAuditLogs(logsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleToggleEmergencyPause = async () => {
    if (!settings) return;
    try {
      await api.updateSettings({ emergencyPause: !settings.emergencyPause });
      onRefreshSettings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRushMode = async () => {
    if (!settings) return;
    try {
      await api.updateSettings({
        rushMode: !settings.rushMode,
        rushMultiplier: !settings.rushMode ? 1.3 : 1.0,
      });
      onRefreshSettings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCashCounter = async () => {
    if (!settings) return;
    try {
      await api.updateSettings({ allowCashCounter: !settings.allowCashCounter });
      onRefreshSettings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveMenuItem = async () => {
    try {
      if (editingItem) {
        await api.updateMenuItem(editingItem.id, menuForm);
      } else {
        await api.createMenuItem(menuForm);
      }
      setIsMenuModalOpen(false);
      setEditingItem(null);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to save menu item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteMenuItem(id);
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcessRefund = async () => {
    if (!refundingOrder) return;
    try {
      await api.processRefund(refundingOrder.id, refundingOrder.totalAmount, refundReason);
      setRefundingOrder(null);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Refund failed');
    }
  };

  const handleExportCSV = () => {
    window.open('/api/analytics/export-csv', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Master Emergency Controls */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white">
              ADMIN CONTROL PANEL
            </span>
            <span className="text-xs text-slate-400">CampusBite Engine v2.4</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">
            Canteen Operations & Financial Analytics
          </h2>
          <p className="text-xs text-slate-400 max-w-lg mt-0.5">
            Manage menus, slot capacities, rush-hour throttles, statutory GST refunds, and operational audits.
          </p>
        </div>

        {/* Emergency Operational Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleToggleEmergencyPause}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md ${
              settings?.emergencyPause
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {settings?.emergencyPause ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4 text-red-400" />}
            <span>{settings?.emergencyPause ? 'RESUME ORDERS (PAUSED)' : 'PAUSE NEW ORDERS'}</span>
          </button>

          <button
            onClick={handleToggleRushMode}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md ${
              settings?.rushMode
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Flame className={`w-4 h-4 ${settings?.rushMode ? 'text-slate-950 animate-bounce' : 'text-amber-400'}`} />
            <span>{settings?.rushMode ? 'RUSH MODE ACTIVE (1.3×)' : 'ENABLE RUSH MODE'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-orange-600/25 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Analytics & Demand Overview
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'menu'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Menu & Prices ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab('slots')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'slots'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pickup Slots & Capacities ({slots.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Orders & Refunds ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'logs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: ANALYTICS & DEMAND OVERVIEW */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Key Financial KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                Total Gross Sales
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
                ₹{analytics.totalGrossRevenue}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Across {analytics.totalOrders} total orders</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                Net Captured Revenue
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block">
                ₹{analytics.netRevenue}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">After ₹{analytics.totalRefunds} refunds deducted</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                Average Order Value (AOV)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-orange-600 mt-1 block">
                ₹{analytics.averageOrderValue}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Per student meal tray</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                Slot Utilization
              </span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1 block">
                {analytics.slotUtilizationPercent}%
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Capacity distribution health</p>
            </div>
          </div>

          {/* Operational Speed & Rush Rates */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block">Avg Preparation Time</span>
              <span className="text-xl font-black text-slate-800 mt-0.5 block">
                ~{analytics.averagePrepTimeMinutes} minutes
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block">Avg Pickup Wait Time</span>
              <span className="text-xl font-black text-slate-800 mt-0.5 block">
                ~{analytics.averagePickupWaitMinutes} minutes
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block">Cancellation Rate</span>
              <span className="text-xl font-black text-slate-800 mt-0.5 block">
                {analytics.cancellationRate}%
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block">Rejection Rate</span>
              <span className="text-xl font-black text-slate-800 mt-0.5 block">
                {analytics.rejectionRate}%
              </span>
            </div>
          </div>

          {/* Peak-Hour Demand & Best Sellers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak-Hour Orders by Hour Bar Chart */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    Peak-Hour Demand & Order Volume (8 AM - 7 PM)
                  </h3>
                  <p className="text-xs text-slate-500">Distribution across meal shifts</p>
                </div>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">
                  Peak at 12 PM - 02 PM
                </span>
              </div>

              <div className="space-y-2 pt-2">
                {analytics.hourlyOrders.map((h) => {
                  const maxCount = Math.max(1, ...analytics.hourlyOrders.map((o) => o.count));
                  const percent = Math.min(100, Math.round((h.count / maxCount) * 100));

                  return (
                    <div key={h.hour} className="flex items-center gap-3 text-xs">
                      <span className="w-12 text-slate-500 font-mono text-[11px] shrink-0">
                        {h.hour}
                      </span>
                      <div className="flex-1 bg-slate-100 h-5 rounded-md overflow-hidden relative">
                        <div
                          className="bg-orange-500 h-full rounded-md transition-all duration-500"
                          style={{ width: `${Math.max(4, percent)}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-black text-slate-800 shrink-0">
                        {h.count} {h.count === 1 ? 'ord' : 'ords'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Best Selling Dishes */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    Best-Selling Canteen Menu Items
                  </h3>
                  <p className="text-xs text-slate-500">Ranked by volume ordered & gross INR</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {analytics.bestSellers.map((item, idx) => (
                  <div key={item.name} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-[11px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-900">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 block">₹{item.revenue}</span>
                      <span className="text-[10px] text-slate-400">{item.count} portions sold</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MENU & PRICES MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base">Canteen Food Catalog</h3>
            <button
              onClick={() => {
                setEditingItem(null);
                setMenuForm({
                  name: '',
                  categoryId: categories[0]?.id || 'cat_combos',
                  price: 90,
                  description: '',
                  imageUrl: '',
                  dietaryLabels: ['veg'],
                  allergenInformation: 'Contains Dairy, Gluten',
                  preparationTimeMinutes: 8,
                  stockQuantity: 50,
                });
                setIsMenuModalOpen(true);
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase">
                <tr>
                  <th className="p-3.5">Dish</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Dietary</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5">Prep Mins</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{item.description}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-black text-slate-900">₹{item.price}</td>
                    <td className="p-3.5">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {item.dietaryLabels.join(', ')}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{item.stockQuantity}</td>
                    <td className="p-3.5 text-slate-600">{item.preparationTimeMinutes}m</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isAvailable && item.stockQuantity > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.isAvailable && item.stockQuantity > 0 ? 'Active' : 'Sold Out'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setMenuForm({
                            name: item.name,
                            categoryId: item.categoryId,
                            price: item.price,
                            description: item.description,
                            imageUrl: item.imageUrl,
                            dietaryLabels: item.dietaryLabels,
                            allergenInformation: item.allergenInformation || '',
                            preparationTimeMinutes: item.preparationTimeMinutes,
                            stockQuantity: item.stockQuantity,
                          });
                          setIsMenuModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        title="Edit Dish"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PICKUP SLOTS & CAPACITIES */}
      {activeTab === 'slots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base">Pickup Slots Capacity Controls</h3>
              <p className="text-xs text-slate-500">Configure intervals and prevent rush overcrowding</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.map((slot) => {
              const remaining = Math.max(0, slot.capacity - slot.reservedCount);

              return (
                <div
                  key={slot.id}
                  className={`p-4 rounded-2xl border bg-white shadow-xs space-y-3 ${
                    remaining === 0 ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm text-slate-900 block">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <span className="text-[10px] text-slate-400">Date: {slot.date}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        slot.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {slot.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Capacity:</span>
                    <input
                      type="number"
                      value={slot.capacity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          api.updatePickupSlot(slot.id, { capacity: val }).then(() => loadAllData());
                        }
                      }}
                      className="w-16 p-1 text-right font-black border border-slate-200 rounded-lg text-xs"
                      min={1}
                      max={50}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Active Bookings:</span>
                    <span className="font-bold text-slate-800">{slot.reservedCount} orders</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Remaining Spots:</span>
                    <span className={`font-black ${remaining === 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {remaining} spots left
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      api.updatePickupSlot(slot.id, { active: !slot.active }).then(() => loadAllData());
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      slot.active
                        ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {slot.active ? 'Deactivate Slot' : 'Activate Slot'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ALL ORDERS & REFUNDS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base">Complete Order Log & Financial Handshake</h3>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase">
                <tr>
                  <th className="p-3.5">Order No</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Pickup Slot</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Order Status</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-black text-slate-900">{o.orderNumber}</td>
                    <td className="p-3.5 font-medium text-slate-800">{o.studentName}</td>
                    <td className="p-3.5 text-slate-600">{o.slotLabel}</td>
                    <td className="p-3.5 font-black text-slate-900">₹{o.totalAmount}</td>
                    <td className="p-3.5">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.paymentStatus === 'captured'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.paymentStatus === 'refunded'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => onViewInvoice(o)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs font-semibold"
                        title="View Invoice"
                      >
                        Invoice
                      </button>
                      {o.paymentStatus === 'captured' && (
                        <button
                          onClick={() => setRefundingOrder(o)}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-bold"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <h3 className="font-black text-slate-900 text-base">Security & Financial Audit Trail</h3>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{log.actorName}</td>
                    <td className="p-3.5 font-mono text-[11px] font-bold text-orange-600">{log.action}</td>
                    <td className="p-3.5 text-slate-500">{log.entityType}</td>
                    <td className="p-3.5 text-slate-700 max-w-sm truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-slate-900 text-base">
              {editingItem ? 'Edit Canteen Dish' : 'Add New Canteen Dish'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  placeholder="e.g. Paneer Tikka Kathi Roll"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Portions</label>
                  <input
                    type="number"
                    value={menuForm.stockQuantity}
                    onChange={(e) => setMenuForm({ ...menuForm, stockQuantity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={menuForm.categoryId}
                  onChange={(e) => setMenuForm({ ...menuForm, categoryId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 h-16 resize-none"
                  placeholder="Ingredients, preparation style..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dietary Type</label>
                  <select
                    value={menuForm.dietaryLabels[0] || 'veg'}
                    onChange={(e) => setMenuForm({ ...menuForm, dietaryLabels: [e.target.value as any] })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="beverage">Beverage</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prep Minutes</label>
                  <input
                    type="number"
                    value={menuForm.preparationTimeMinutes}
                    onChange={(e) => setMenuForm({ ...menuForm, preparationTimeMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Allergen Notice</label>
                <input
                  type="text"
                  value={menuForm.allergenInformation}
                  onChange={(e) => setMenuForm({ ...menuForm, allergenInformation: e.target.value })}
                  placeholder="e.g. Contains Dairy, Gluten, Nuts"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={menuForm.imageUrl}
                  onChange={(e) => setMenuForm({ ...menuForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMenuItem}
                className="px-5 py-2 bg-orange-600 text-white font-black text-xs rounded-xl hover:bg-orange-700 shadow-xs"
              >
                Save Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Refund Modal */}
      {refundingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Issue Refund for {refundingOrder.orderNumber}?
            </h3>
            <p className="text-xs text-slate-500">
              Amount to refund: <strong className="text-slate-900">₹{refundingOrder.totalAmount}</strong>. This triggers an audit log and notifies the student.
            </p>
            <input
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Reason for refund"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRefundingOrder(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                className="px-4 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
