import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  QrCode,
  ShieldCheck,
  Search,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import type { Order } from '../types/canteen.ts';

interface PickupVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: () => void;
  readyOrders?: Order[];
}

export const PickupVerificationModal: React.FC<PickupVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerificationComplete,
  readyOrders = [],
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    order?: Order;
  } | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (tokenToUse?: string) => {
    const code = (tokenToUse || tokenInput).trim();
    if (!code) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await api.verifyCollection(code);
      setResult(res);
      if (res.success) {
        setTokenInput('');
        onVerificationComplete();
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Verification failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white">
                Counter Pickup Verification
              </h3>
              <p className="text-xs text-emerald-100">
                Authorized staff handover validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Enter Student Collection Code / Scan QR
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="e.g. CB-782 or #CB-1042"
                className="flex-1 p-3 text-sm font-mono font-bold tracking-wider rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-slate-50 uppercase"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerify();
                }}
              />
              <button
                type="button"
                disabled={loading || !tokenInput.trim()}
                onClick={() => handleVerify()}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {loading ? 'Verifying...' : 'Validate'}
              </button>
            </div>
          </div>

          {/* Quick Scanner Helper for Ready Orders in Queue */}
          {readyOrders.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Quick Scan Simulation (Orders currently ready for pickup)
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {readyOrders.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => {
                      setTokenInput(ord.collectionToken);
                      handleVerify(ord.collectionToken);
                    }}
                    className="w-full p-2 bg-white hover:bg-emerald-50 rounded-xl border border-slate-200 text-left flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{ord.orderNumber}</span>
                      <span className="text-slate-500 ml-1.5">({ord.studentName})</span>
                    </div>
                    <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {ord.collectionToken}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Verification Result Message */}
          {result && (
            <div
              className={`p-4 rounded-2xl border text-xs ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-extrabold text-sm">
                    {result.success ? 'Handover Confirmed!' : 'Collection Rejected'}
                  </h4>
                  <p className="mt-1 leading-relaxed">{result.message}</p>

                  {result.order && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Order: {result.order.orderNumber}</span>
                        <span>Token: {result.order.collectionToken}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Student: {result.order.studentName} ({result.order.studentCollegeId})
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Items: {result.order.items.map((it) => `${it.quantity}× ${it.itemNameSnapshot}`).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            One-time tokens prevent duplicate food collections
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
