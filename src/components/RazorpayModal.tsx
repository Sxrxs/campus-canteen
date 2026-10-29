import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Smartphone,
  CreditCard,
  Building,
  AlertCircle,
  QrCode,
  Lock,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import type { Order } from '../types/canteen.ts';

interface RazorpayModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (updatedOrder: Order) => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [upiId, setUpiId] = useState('aarav@okhdfcbank');
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'qr'>('upi');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isFailed, setIsFailed] = useState(false);

  if (!isOpen || !order) return null;

  const handlePay = async (simulateFailure = false) => {
    setLoading(true);
    setStatusMessage(simulateFailure ? 'Testing payment rejection...' : 'Authorizing payment with bank gateway...');
    setIsFailed(false);

    try {
      // 1. Get backend Razorpay order
      const rzpOrder = await api.createRazorpayOrder(order.id);

      // In development test mode, wait 1s for realistic feel
      await new Promise((r) => setTimeout(r, 900));

      if (simulateFailure) {
        setIsFailed(true);
        setStatusMessage('Payment failed: Bank simulator rejected transaction (insufficient funds/timeout).');
        setLoading(false);
        return;
      }

      // 2. Complete payment via backend signature verification
      const verifyRes = await api.verifyRazorpayPayment({
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        razorpayPaymentId: `pay_${Date.now()}_test`,
        simulatedSuccess: true,
        methodDetails: activeTab === 'upi' ? `UPI (${upiId})` : activeTab === 'card' ? 'Debit Card' : 'Static UPI QR',
      });

      setStatusMessage('Payment verified successfully!');
      setTimeout(() => {
        onPaymentSuccess(verifyRes.order);
      }, 500);
    } catch (err: any) {
      setIsFailed(true);
      setStatusMessage(err.message || 'Payment verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Razorpay Gateway Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-lg text-white shadow-md">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm tracking-tight text-white">Razorpay Checkout</h3>
                <span className="text-[10px] font-bold bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded">
                  SANDBOX
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Order {order.orderNumber} • ₹{order.totalAmount}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Development Environment Badge */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Development Sandbox:</strong> Verified INR transactions using test signature validation.
          </span>
        </div>

        {/* Payment Channels Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('upi')}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'upi' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>UPI Apps</span>
          </button>
          <button
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'card' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Card</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'qr' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4">
          {activeTab === 'upi' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                Enter your VPA / UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="mobile@upi or user@okhdfcbank"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 font-medium"
              />

              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                <span className="font-semibold">Quick Test UPIs:</span>
                <button
                  type="button"
                  onClick={() => setUpiId('aarav@okaxis')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  GPay
                </button>
                <button
                  type="button"
                  onClick={() => setUpiId('student@ybl')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  PhonePe
                </button>
                <button
                  type="button"
                  onClick={() => setUpiId('canteen@paytm')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Paytm
                </button>
              </div>
            </div>
          )}

          {activeTab === 'card' && (
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Card Number</label>
                <input
                  type="text"
                  defaultValue="4111 •••• •••• 1111 (Razorpay Test Card)"
                  disabled
                  className="w-full p-2.5 bg-slate-100 rounded-xl border border-slate-200 font-mono text-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry</label>
                  <input
                    type="text"
                    defaultValue="12/28"
                    disabled
                    className="w-full p-2.5 bg-slate-100 rounded-xl border border-slate-200 font-mono text-slate-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CVV</label>
                  <input
                    type="password"
                    defaultValue="123"
                    disabled
                    className="w-full p-2.5 bg-slate-100 rounded-xl border border-slate-200 font-mono text-slate-600"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="text-center py-2 space-y-2">
              <div className="w-36 h-36 bg-slate-900 mx-auto rounded-2xl flex items-center justify-center p-3">
                <QrCode className="w-28 h-28 text-white" />
              </div>
              <p className="text-xs font-bold text-slate-800">Scan using any UPI App</p>
              <p className="text-[11px] text-slate-500">BHIM, Google Pay, PhonePe, Paytm, Cred</p>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                isFailed
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}
            >
              {isFailed ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => handlePay(false)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing ₹{order.totalAmount}...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay ₹{order.totalAmount} Now</span>
              </>
            )}
          </button>

          {/* Developer Sandbox Controls (Simulate failure testing) */}
          <div className="pt-2 flex items-center justify-between text-[11px]">
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePay(true)}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Simulate Payment Failure
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 font-semibold"
            >
              Cancel Payment
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>PCI-DSS Compliant • 256-bit Bank Grade Encryption</span>
          </p>
        </div>
      </div>
    </div>
  );
};
