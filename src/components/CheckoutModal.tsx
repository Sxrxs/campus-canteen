import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Flame,
  User,
  Mail,
  Building,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import type { PickupSlot, PaymentMethod, CanteenSettings, Order } from '../types/canteen.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order, paymentMethod: PaymentMethod) => void;
  settings: CanteenSettings | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  settings,
}) => {
  const { cart, subtotal, taxAmount, feeAmount, totalAmount, specialInstructions, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Slot & Prep Time, 2: Review & Summary, 3: Payment Method
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay_upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);

  // Fetch live slots and calculate preparation time
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setStep(1);

      // Load slots
      api.getPickupSlots()
        .then((data) => {
          setSlots(data);
          // Auto select first available slot with spots
          const available = data.find((s) => s.active && s.reservedCount < s.capacity);
          if (available) {
            setSelectedSlotId(available.id);
          }
        })
        .catch((err) => console.error(err));

      // Calculate estimate
      if (cart.length > 0) {
        api.calculatePrepEstimate(cart.map((ci) => ({ id: ci.menuItem.id, quantity: ci.quantity })))
          .then((res) => setEstimatedMinutes(res.estimatedMinutes))
          .catch(() => setEstimatedMinutes(10));
      }
    }
  }, [isOpen, cart]);

  if (!isOpen) return null;

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const handleCreateOrder = async () => {
    if (!selectedSlotId) {
      setError('Please choose an available pickup time slot.');
      return;
    }
    if (!user) {
      setError('Please sign in to place an order.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        items: cart.map((ci) => ({
          menuItemId: ci.menuItem.id,
          quantity: ci.quantity,
          customization: ci.customization,
        })),
        pickupSlotId: selectedSlotId,
        paymentMethod,
        specialInstructions,
      };

      const order = await api.createOrder(payload);
      clearCart();
      onOrderCreated(order, paymentMethod);
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Slot may have just reached capacity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header with Steps */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-100/60 px-2.5 py-0.5 rounded-full">
                Step {step} of 3
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {step === 1 && 'Select Scheduled Pickup Slot'}
                {step === 2 && 'Review Tray & Final Breakdown'}
                {step === 3 && 'Choose Payment Method'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 1 && 'Guaranteed queue-free pickup interval'}
              {step === 2 && 'Verified prices & statutory college GST'}
              {step === 3 && 'Instant online UPI or Cash Counter'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* STEP 1: PICKUP SLOTS & ESTIMATION */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Estimated prep callout */}
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Estimated Kitchen Prep Time</h4>
                    <p className="text-[11px] text-slate-600">Calculated based on active kitchen load & dishes</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-orange-700">~{estimatedMinutes} mins</span>
                  <p className="text-[10px] text-slate-500 font-medium">Fast service</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    Available 15-Minute Pickup Slots for Today
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Cap: 12 orders/interval
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                  {slots.map((slot) => {
                    const remaining = Math.max(0, slot.capacity - slot.reservedCount);
                    const isFull = remaining === 0 || !slot.active;
                    const isSelected = selectedSlotId === slot.id;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-orange-600 bg-orange-50/80 ring-2 ring-orange-500/20'
                            : isFull
                            ? 'border-slate-200 bg-slate-100/70 opacity-60 cursor-not-allowed'
                            : 'border-slate-200 hover:border-orange-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-orange-900' : 'text-slate-800'}`}>
                            {slot.startTime}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">to {slot.endTime}</p>

                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          {isFull ? (
                            <span className="font-bold text-red-600 uppercase">Slot Full</span>
                          ) : (
                            <span className={`font-semibold ${remaining <= 3 ? 'text-amber-600 font-bold' : 'text-emerald-700'}`}>
                              {remaining} spots left
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Student details display */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-bold text-slate-800">{user?.fullName}</span>
                    <span className="text-slate-500 ml-1">({user?.collegeId})</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">{user?.collegeEmail}</span>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW ITEMS & TOTALS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="font-bold text-slate-800">
                    Pickup Slot: {selectedSlot?.startTime} - {selectedSlot?.endTime}
                  </span>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-orange-600 hover:underline font-bold"
                >
                  Change Slot
                </button>
              </div>

              {/* Order Items Snapshot Review */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                <div className="p-3 bg-slate-50 text-xs font-bold text-slate-600 flex justify-between">
                  <span>Selected Dish</span>
                  <span>Line Total</span>
                </div>
                {cart.map((ci) => (
                  <div key={ci.menuItem.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{ci.menuItem.name}</span>
                      <span className="text-slate-500 ml-2 font-mono">× {ci.quantity}</span>
                      {ci.customization && (
                        <p className="text-[10px] text-amber-700 italic">"{ci.customization}"</p>
                      )}
                    </div>
                    <span className="font-black text-slate-900">
                      ₹{ci.menuItem.price * ci.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>5% Canteen GST</span>
                  <span className="font-semibold text-slate-900">₹{taxAmount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Packaging & Campus Green Fee</span>
                  <span className="font-semibold text-slate-900">₹{feeAmount}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm sm:text-base font-black text-slate-900">
                  <span>Total Payable Amount</span>
                  <span className="text-orange-600">₹{totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                Select your preferred payment channel for order amount <strong className="text-slate-900">₹{totalAmount}</strong>:
              </p>

              {/* Razorpay UPI */}
              <label
                className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'razorpay_upi'
                    ? 'border-orange-600 bg-orange-50/70 ring-2 ring-orange-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay_upi"
                  checked={paymentMethod === 'razorpay_upi'}
                  onChange={() => setPaymentMethod('razorpay_upi')}
                  className="mt-1 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Razorpay Instant UPI (Google Pay / PhonePe / Paytm)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Fastest checkout without queueing at billing counters.
                  </p>
                </div>
              </label>

              {/* Razorpay Card / Netbanking */}
              <label
                className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'razorpay_card'
                    ? 'border-orange-600 bg-orange-50/70 ring-2 ring-orange-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay_card"
                  checked={paymentMethod === 'razorpay_card'}
                  onChange={() => setPaymentMethod('razorpay_card')}
                  className="mt-1 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Debit / Credit Card & Netbanking
                    </span>
                    <CreditCard className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Visa, MasterCard, RuPay, and All Major Indian Banks.
                  </p>
                </div>
              </label>

              {/* Cash at Counter */}
              {settings?.allowCashCounter && (
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'cash_counter'
                      ? 'border-orange-600 bg-orange-50/70 ring-2 ring-orange-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_counter"
                    checked={paymentMethod === 'cash_counter'}
                    onChange={() => setPaymentMethod('cash_counter')}
                    className="mt-1 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Pay Cash at Counter (On Pickup)
                      </span>
                      <Banknote className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pay directly to counter cashier before collecting your tray.
                    </p>
                  </div>
                </label>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Payments encrypted via 256-bit SSL. Razorpay test sandbox active for zero-risk campus testing.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !selectedSlotId) {
                  setError('Please select a pickup slot first.');
                  return;
                }
                setError(null);
                setStep((s) => (s + 1) as any);
              }}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleCreateOrder}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white text-xs font-black rounded-xl shadow-md shadow-orange-600/25 flex items-center gap-2 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Reserving Slot & Securing Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Pay ₹{totalAmount}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
