import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Utensils } from 'lucide-react';
import type { Order } from '../types/canteen.ts';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Actions header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Official Canteen Tax Invoice
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 text-xs">
          {/* Canteen Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-black text-xl">
                <Utensils className="w-5 h-5 text-orange-600" />
                <span>Campus<span className="text-orange-600">Bite</span></span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Central Campus Food Court & Dining Services
              </p>
              <p className="text-[10px] text-slate-400">
                GSTIN: 27AABCC1234D1Z8 • FSSAI Lic: 11521000000492
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-base text-slate-900 block">
                {order.orderNumber}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                {order.paymentStatus === 'captured' ? 'PAID / INVOICE ISSUED' : order.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Student & Slot Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Billed To Student</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{order.studentName}</p>
              <p className="text-[11px] text-slate-600">{order.studentEmail}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {order.studentCollegeId || 'CAMPUS-STUDENT'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pickup Details</span>
              <p className="font-bold text-slate-900 mt-0.5">{order.slotLabel}</p>
              <p className="text-[11px] text-slate-600">Counter Token: <strong className="text-orange-600 font-mono text-sm">{order.collectionToken}</strong></p>
              <p className="text-[10px] text-slate-500">Payment: {order.paymentMethod.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 font-bold text-slate-900">
                      {it.itemNameSnapshot}
                      {it.customization && (
                        <span className="text-[10px] text-slate-500 font-normal block">
                          Note: {it.customization}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-center text-slate-700">{it.quantity}</td>
                    <td className="py-2.5 text-right text-slate-700">₹{it.unitPriceSnapshot}</td>
                    <td className="py-2.5 text-right font-black text-slate-900">₹{it.lineTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Taxes & Totals */}
          <div className="border-t border-slate-200 pt-3 space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>CGST (2.5%) + SGST (2.5%)</span>
              <span className="font-semibold text-slate-900">₹{order.taxAmount}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Eco-Packaging / Platform Service Charge</span>
              <span className="font-semibold text-slate-900">₹{order.feeAmount}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
              <span>Total Invoice Amount (INR)</span>
              <span className="text-orange-600">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
            <p>This is a computer-generated receipt for campus canteen services.</p>
            <p>Thank you for dining at CampusBite! Please recycle packaging responsibly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
