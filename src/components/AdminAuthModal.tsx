import React, { useState } from 'react';
import { Shield, ShieldAlert, KeyRound, Lock, Eye, EyeOff, X, CheckCircle, Info } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminAuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, unlockAdmin, authModalReason, isDefaultPin } = useAdminAuth();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter your Admin PIN or passcode.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await unlockAdmin(pin.trim());
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Incorrect Admin PIN. Please try again.');
    } else {
      setPin('');
    }
  };

  const handleQuickDigit = (digit: string) => {
    setError(null);
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="modal-admin-auth"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-5 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shadow-inner">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Administrator Authorization
              </h3>
              <p className="text-xs text-slate-300">
                Confirm your identity to modify printer fleet data
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Reason explanation */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Admin Protected Action:</span>
              <p className="text-amber-800 leading-relaxed">{authModalReason}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  Admin Passcode / PIN
                </label>
                {isDefaultPin && (
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Default PIN: <strong className="font-mono">2026</strong>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  id="input-admin-pin"
                  type={showPin ? 'text' : 'password'}
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter 4-digit PIN..."
                  className="w-full pl-3.5 pr-10 py-2.5 text-center text-lg tracking-widest font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 text-slate-900 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                  {error}
                </p>
              )}
            </div>

            {/* Quick keypad for touch/fast entry */}
            <div className="pt-1">
              <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleQuickDigit(digit)}
                    className="py-2 text-sm font-semibold font-mono rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80 active:scale-95 transition-all shadow-2xs"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border border-slate-200/80 active:scale-95 transition-all"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDigit('0')}
                  className="py-2 text-sm font-semibold font-mono rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80 active:scale-95 transition-all shadow-2xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 border border-slate-200/80 active:scale-95 transition-all"
                >
                  ⌫
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeAuthModal}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel (Keep Read-Only)
              </button>
              <button
                id="btn-confirm-admin-unlock"
                type="submit"
                disabled={isSubmitting || !pin.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Verifying...' : 'Unlock Admin Mode'}</span>
              </button>
            </div>
          </form>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            Admin privileges remain active in this browser session until locked.
          </p>
        </div>
      </div>
    </div>
  );
};
