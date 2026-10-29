import React from 'react';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  AlertTriangle,
  Receipt,
  Sparkles,
  Info,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import type { CanteenSettings } from '../types/canteen.ts';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  settings: CanteenSettings | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  settings,
}) => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    taxAmount,
    feeAmount,
    totalAmount,
    totalItemCount,
    isCartOpen,
    setIsCartOpen,
    specialInstructions,
    setSpecialInstructions,
    hasUnavailableItems,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Your Canteen Tray</h3>
                <p className="text-xs text-slate-500">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1"
                >
                  Clear tray
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">Your tray is empty</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Add appetizing snacks, meals, and drinks from today's menu to place an advance order.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Explore Today's Menu
                </button>
              </div>
            ) : (
              <>
                {/* Out of stock warning banner if any item became unavailable */}
                {hasUnavailableItems && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-800 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <strong className="font-bold">Item Availability Warning:</strong>
                      <p className="mt-0.5">
                        Some items in your tray are now sold out. Please remove them before proceeding to checkout.
                      </p>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-slate-100">
                  {cart.map((ci) => {
                    const isSoldOut = !ci.menuItem.isAvailable || ci.menuItem.stockQuantity <= 0;
                    return (
                      <div key={ci.menuItem.id} className="py-3 flex items-start justify-between gap-3">
                        <img
                          src={ci.menuItem.imageUrl}
                          alt={ci.menuItem.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className={`text-xs sm:text-sm font-bold text-slate-900 truncate ${isSoldOut ? 'line-through text-slate-400' : ''}`}>
                              {ci.menuItem.name}
                            </h4>
                            <span className="text-xs sm:text-sm font-black text-slate-900 shrink-0">
                              ₹{ci.menuItem.price * ci.quantity}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500">₹{ci.menuItem.price} each</p>

                          {ci.customization && (
                            <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm mt-1 inline-block">
                              Note: {ci.customization}
                            </p>
                          )}

                          {isSoldOut ? (
                            <span className="text-[10px] font-bold text-red-600 uppercase mt-1 block">
                              Sold out — Please remove
                            </span>
                          ) : (
                            <div className="mt-2 flex items-center justify-between">
                              {/* Quantity Adjuster */}
                              <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5">
                                <button
                                  onClick={() => updateQuantity(ci.menuItem.id, -1)}
                                  className="w-6 h-6 rounded-md bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 text-xs shadow-xs"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-extrabold text-xs text-slate-900 px-1.5">
                                  {ci.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(ci.menuItem.id, 1)}
                                  className="w-6 h-6 rounded-md bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 text-xs shadow-xs"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(ci.menuItem.id)}
                                className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* General Special Cooking Instructions */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Special order instructions (optional):
                  </label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Extra napkins, pack curry separately..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 resize-none h-16"
                    maxLength={140}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer with Calculations and Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              {/* Transparent Bill Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-slate-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <span>GST (5%)</span>
                    <span title="Statutory Indian Food GST">
                      <Info className="w-3 h-3 text-slate-400" />
                    </span>
                  </span>
                  <span className="font-semibold text-slate-800">₹{taxAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Eco-Packaging & Platform Fee</span>
                  <span className="font-semibold text-slate-800">₹{feeAmount}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm sm:text-base font-black text-slate-900">
                  <span>To Pay</span>
                  <span className="text-pink-600">₹{totalAmount}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                disabled={hasUnavailableItems || subtotal === 0 || settings?.emergencyPause || !settings?.isOpen}
                className="w-full py-3.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-pink-600/25 transition-all active:scale-[0.99]"
              >
                <span>Proceed to Select Pickup Slot</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-slate-400">
                🔒 Verified server pricing • Anti-queue slot protection
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
