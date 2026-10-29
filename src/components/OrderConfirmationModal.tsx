import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  QrCode,
  ArrowRight,
  ShoppingBag,
  Share2,
  Receipt,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import type { Order } from '../types/canteen.ts';

interface OrderConfirmationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (order: Order) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  isOpen,
  onClose,
  onTrackOrder,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (order) {
      // Generate clean QR code encoding ONLY token and orderNumber (NO PII or secrets!)
      const qrPayload = JSON.stringify({
        token: order.collectionToken,
        orderNumber: order.orderNumber,
        canteen: 'CampusBite',
      });

      QRCode.toDataURL(qrPayload, {
        width: 200,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [order]);

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Success Header */}
        <div className="p-6 text-center bg-linear-to-b from-emerald-500 to-emerald-600 text-white relative">
          <div className="w-16 h-16 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-700/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
            Order Confirmed & Scheduled
          </span>
          <h2 className="text-2xl font-black mt-2 tracking-tight">
            Order {order.orderNumber}
          </h2>
          <p className="text-emerald-100 text-xs mt-1">
            Slot: {order.slotLabel}
          </p>
        </div>

        {/* Collection Token & QR Card */}
        <div className="p-6 text-center space-y-4">
          <div className="p-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Counter Collection Token
            </p>
            <span className="text-3xl font-black font-mono tracking-widest text-orange-600 my-1 select-all">
              {order.collectionToken}
            </span>
            <p className="text-[11px] text-slate-400">
              Show this token or scan QR at the pickup counter
            </p>

            {/* QR Code image */}
            {qrDataUrl && (
              <div className="mt-3 p-2 bg-white rounded-xl shadow-xs border border-slate-200 inline-block">
                <img
                  src={qrDataUrl}
                  alt={`QR code for order ${order.orderNumber}`}
                  className="w-36 h-36 mx-auto"
                />
              </div>
            )}
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-2 gap-2 text-left text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Estimated Ready</span>
              <span className="font-extrabold text-slate-800 text-sm">
                {new Date(order.estimatedReadyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Status</span>
              <span className="font-extrabold text-emerald-700 text-sm capitalize">
                {order.paymentStatus === 'captured' ? 'Paid Online' : order.paymentStatus.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Items breakdown list preview */}
          <div className="text-left text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
              Items Ordered ({order.items.reduce((s, it) => s + it.quantity, 0)})
            </span>
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between text-slate-700">
                <span className="truncate pr-2">{it.quantity}× {it.itemNameSnapshot}</span>
                <span className="font-semibold shrink-0">₹{it.lineTotal}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900">
              <span>Total Paid</span>
              <span className="text-orange-600">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-2">
          <button
            onClick={() => {
              onClose();
              onTrackOrder(order);
            }}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>Track Order & Live Kitchen Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
