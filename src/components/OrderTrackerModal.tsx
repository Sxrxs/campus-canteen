import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  ChefHat,
  ShoppingBag,
  AlertCircle,
  QrCode,
  FileText,
  RotateCcw,
  Sparkles,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../lib/api.ts';
import type { Order, OrderStatus } from '../types/canteen.ts';

interface OrderTrackerModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onViewInvoice: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  orderId,
  isOpen,
  onClose,
  onViewInvoice,
  onOrderUpdated,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [reportingIssue, setReportingIssue] = useState(false);
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  useEffect(() => {
    if (orderId && isOpen) {
      const load = () => {
        api.getOrderById(orderId)
          .then((ord) => {
            setOrder(ord);
            if (onOrderUpdated) onOrderUpdated(ord);

            // Generate clean QR code
            QRCode.toDataURL(
              JSON.stringify({ token: ord.collectionToken, orderNumber: ord.orderNumber }),
              { width: 180, margin: 1 }
            ).then((url) => setQrUrl(url));
          })
          .catch((e) => console.error(e));
      };

      load();
      const interval = setInterval(load, 5000); // 5s live polling
      return () => clearInterval(interval);
    }
  }, [orderId, isOpen]);

  if (!isOpen || !order) return null;

  const steps: { status: OrderStatus; label: string; desc: string }[] = [
    { status: 'placed', label: 'Order Placed', desc: 'Received by CampusBite server' },
    {
      status: 'accepted',
      label: order.paymentStatus === 'captured' ? 'Payment Verified & Accepted' : 'Accepted by Kitchen',
      desc: 'Chef acknowledged order ticket',
    },
    { status: 'preparing', label: 'Cooking & Assembling', desc: 'Food on grill / tandoor' },
    { status: 'ready', label: 'Ready for Counter Pickup', desc: 'Keep collection token handy' },
    { status: 'collected', label: 'Collected & Completed', desc: 'Verified at counter' },
  ];

  const statusOrder: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'collected'];
  const currentIndex = statusOrder.indexOf(order.orderStatus);

  const isTerminalCancelled = order.orderStatus === 'cancelled';
  const isTerminalRejected = order.orderStatus === 'rejected';
  const canCancel = order.orderStatus === 'placed';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const updated = await api.updateOrderStatus(order.id, 'cancelled', cancelReason || 'Cancelled by student');
      setOrder(updated);
      setShowCancelPrompt(false);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-white animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Live Order Tracking
                </h3>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Slot: <strong className="text-orange-400">{order.slotLabel}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Cancelled or Rejected Banner */}
          {isTerminalCancelled && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Order Cancelled</h4>
                <p className="mt-0.5 text-slate-600 leading-relaxed">
                  Reason: {order.cancellationReason || 'Cancelled upon request.'}
                </p>
                {order.paymentStatus === 'refunded' && (
                  <p className="mt-1 font-bold text-emerald-700">
                    Refund processed back to your original payment method.
                  </p>
                )}
              </div>
            </div>
          )}

          {isTerminalRejected && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Order Rejected by Kitchen</h4>
                <p className="mt-0.5 text-slate-600">
                  Reason: {order.rejectionReason || 'Canteen capacity exceeded.'}
                </p>
                <p className="mt-1 font-bold text-emerald-700">
                  Refund has been initiated automatically.
                </p>
              </div>
            </div>
          )}

          {/* Stepper Progress Indicator */}
          {!isTerminalCancelled && !isTerminalRejected && (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {steps.map((step, idx) => {
                const isPassed = currentIndex >= idx;
                const isCurrent = currentIndex === idx;

                return (
                  <div key={step.status} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                        isPassed
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-200 text-slate-400'
                      } ${isCurrent ? 'animate-pulse' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-orange-600 font-extrabold text-sm'
                              : isPassed
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 animate-pulse">
                            ACTIVE STAGE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Counter Collection Token & QR */}
          {order.orderStatus !== 'cancelled' && order.orderStatus !== 'rejected' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/70 border-2 border-dashed border-orange-200 flex flex-col items-center text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800">
                Your Counter Collection Code
              </span>
              <span className="text-3xl font-black font-mono tracking-widest text-slate-900 my-1 select-all">
                {order.collectionToken}
              </span>
              <p className="text-[11px] text-slate-500">
                Show this code or QR directly at the counter
              </p>

              {qrUrl && (
                <div className="mt-3 p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                  <img src={qrUrl} alt="Collection QR Code" className="w-28 h-28 mx-auto" />
                </div>
              )}

              {order.orderStatus === 'ready' && (
                <div className="mt-3 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold animate-bounce flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>FOOD IS READY! Collect at Counter</span>
                </div>
              )}
            </div>
          )}

          {/* Items Summary */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">Items in this Order</span>
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between text-slate-800">
                <span>{it.quantity}× {it.itemNameSnapshot}</span>
                <span className="font-semibold">₹{it.lineTotal}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900">
              <span>Total Paid</span>
              <span className="text-orange-600">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Cancel Order Section (Policy: allowed only in placed state) */}
          {canCancel && (
            <div className="p-3 bg-red-50/60 rounded-xl border border-red-200/80">
              {showCancelPrompt ? (
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-red-900">Are you sure you want to cancel this order?</p>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation (optional)"
                    className="w-full p-2 bg-white rounded-lg border border-red-200 text-xs"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowCancelPrompt(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 text-xs"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700"
                    >
                      {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Need to change your order?</span>
                  <button
                    onClick={() => setShowCancelPrompt(true)}
                    className="font-bold text-red-600 hover:underline"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Report an Issue Modal / Section */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              onClick={() => onViewInvoice(order)}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold"
            >
              <FileText className="w-4 h-4" />
              <span>View Tax Receipt / Invoice</span>
            </button>

            <button
              onClick={() => {
                setReportingIssue(true);
                setTimeout(() => {
                  setIssueSubmitted(true);
                  setReportingIssue(false);
                }, 800);
              }}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-orange-600 font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{issueSubmitted ? 'Issue reported ✓' : 'Report Issue'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
