import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  FlaskConical,
  RefreshCw,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { api } from '../lib/api.ts';

interface AutomatedTestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomatedTestRunnerModal: React.FC<AutomatedTestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<{
    summary: { total: number; passed: number; failed: number; allPassed: boolean };
    results: { name: string; passed: boolean; details: string }[];
  } | null>(null);

  if (!isOpen) return null;

  const runTests = async () => {
    setRunning(true);
    try {
      const data = await api.runSystemTests();
      setReport(data);
    } catch (e: any) {
      alert('Error running automated test suite: ' + e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-indigo-950 text-white flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Automated Verification Test Suite
                </h3>
                <span className="text-[10px] font-bold bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded">
                  SECTION 14 COMPLIANCE
                </span>
              </div>
              <p className="text-xs text-indigo-300">
                End-to-end integration assertions against active database & security policies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-indigo-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-200/80 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-xs text-indigo-950">
                Run Automated Architecture Validations
              </h4>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Executes 15 core verification tests: roles, Razorpay HMAC sha256 signature, atomic pickup slots, stock decrements, and one-time handover tokens.
              </p>
            </div>
            <button
              onClick={runTests}
              disabled={running}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-2 shrink-0 transition-all active:scale-95"
            >
              {running ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run All Tests</span>
                </>
              )}
            </button>
          </div>

          {/* Results Display */}
          {report ? (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tests</span>
                  <span className="font-black text-slate-900 text-lg">{report.summary.total}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Passed</span>
                  <span className="font-black text-emerald-700 text-lg">{report.summary.passed}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Failed</span>
                  <span className={`font-black text-lg ${report.summary.failed > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {report.summary.failed}
                  </span>
                </div>
              </div>

              {report.summary.allPassed && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All 15 verification test suites passed successfully! 100% compliant.</span>
                </div>
              )}

              {/* Detailed Itemized Assertions */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {report.results.map((res, idx) => (
                  <div key={idx} className="p-3.5 flex items-start gap-3 text-xs bg-white">
                    {res.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{res.name}</span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            res.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {res.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{res.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Click "Run All Tests" to trigger automated server validation.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
