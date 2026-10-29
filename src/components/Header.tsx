import React, { useState } from 'react';
import {
  Utensils,
  ShoppingBag,
  Bell,
  Clock,
  ShieldCheck,
  ChefHat,
  LayoutDashboard,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Flame,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import type { CanteenSettings } from '../types/canteen.ts';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  settings: CanteenSettings | null;
  onOpenTestRunner: () => void;
  onOpenVerificationModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  settings,
  onOpenTestRunner,
  onOpenVerificationModal,
}) => {
  const { user, quickSwitchRole, isStudent, isStaff, isAdmin } = useAuth();
  const { totalItemCount, subtotal, setIsCartOpen } = useCart();
  const { unreadCount, setIsDrawerOpen, isDrawerOpen } = useNotifications();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const getStatusBadge = () => {
    if (!settings) return null;
    if (!settings.isOpen) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          Canteen Closed ({settings.openingTime} - {settings.closingTime})
        </span>
      );
    }
    if (settings.emergencyPause) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          Orders Paused (Rush)
        </span>
      );
    }
    if (settings.rushMode) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <Flame className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
          Peak Lunch Rush Mode (Active)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        Canteen Open & Accepting Orders
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Rush / Announcement ticker if set */}
      {settings?.announcementBanner && (
        <div className="bg-gradient-to-r from-pink-600 via-violet-600 to-orange-500 text-white text-xs py-1.5 px-4 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 shrink-0 animate-spin" />
            <span>{settings.announcementBanner}</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-sm shrink-0 ml-2">
            Campus Daily Special
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('menu')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-pink-600 via-violet-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-pink-500/25">
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Campus<span className="text-pink-600">CRAVE</span>
                </span>
                <span className="hidden md:inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded-sm bg-slate-900 text-pink-400">
                  DIGITAL CANTEEN
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                Skip queues • Scheduled pickup slots • Instant UPI checkout
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="hidden lg:flex items-center">
            {getStatusBadge()}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Automated System Tests Button */}
            <button
              onClick={onOpenTestRunner}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
              title="Run 15 Automated System Requirements Tests"
            >
              <FlaskConical className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Run System Tests</span>
            </button>

            {/* Staff Quick Verify Counter Button */}
            {(isStaff || isAdmin) && (
              <button
                onClick={onOpenVerificationModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Verify Collection</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-600/25 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {totalItemCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-pink-600 font-extrabold text-xs">
                  {totalItemCount}
                </span>
              )}
              {subtotal > 0 && (
                <span className="hidden md:inline font-semibold text-pink-100 border-l border-pink-500/60 pl-2">
                  ₹{subtotal}
                </span>
              )}
            </button>

            {/* Role Switcher & User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 transition-all text-left"
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={user?.fullName || 'User'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-2 ring-orange-500/30"
                />
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{user?.fullName}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
                    {user?.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                    <p className="text-[11px] text-slate-500">{user?.collegeEmail}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-600">
                      <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 font-mono">
                        {user?.collegeId || 'CAMPUS-USER'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
                      Quick Demo Role Switch
                    </p>
                    <button
                      onClick={() => {
                        quickSwitchRole('student');
                        setRoleMenuOpen(false);
                        onTabChange('menu');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isStudent ? 'bg-orange-50 text-orange-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-orange-600" />
                        <span>Student (Aarav Sharma)</span>
                      </div>
                      {isStudent && <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />}
                    </button>

                    <button
                      onClick={() => {
                        quickSwitchRole('staff');
                        setRoleMenuOpen(false);
                        onTabChange('staff-kds');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isStaff ? 'bg-orange-50 text-orange-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-emerald-600" />
                        <span>Canteen Staff (Chef Rajesh)</span>
                      </div>
                      {isStaff && <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />}
                    </button>

                    <button
                      onClick={() => {
                        quickSwitchRole('admin');
                        setRoleMenuOpen(false);
                        onTabChange('admin-analytics');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isAdmin ? 'bg-orange-50 text-orange-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                        <span>Administrator (Dean/Director)</span>
                      </div>
                      {isAdmin && <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 pt-1 border-t border-slate-100 no-scrollbar">
          <button
            onClick={() => onTabChange('menu')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              currentTab === 'menu'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Browse Canteen Menu
          </button>

          <button
            onClick={() => onTabChange('orders')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              currentTab === 'orders'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            My Orders & Tracking
          </button>

          {(isStaff || isAdmin) && (
            <button
              onClick={() => onTabChange('staff-kds')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                currentTab === 'staff-kds'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              Kitchen Order Queue (KDS)
            </button>
          )}

          {isAdmin && (
            <>
              <button
                onClick={() => onTabChange('admin-analytics')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  currentTab === 'admin-analytics'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-orange-400" />
                Admin Dashboard & Analytics
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
