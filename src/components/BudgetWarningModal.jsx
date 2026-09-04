import React from 'react';
import { CATEGORIES, formatCurrency, vibrate } from '../context/FinancialContext';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

export const BudgetWarningModal = ({ warning, onClose }) => {
  if (!warning) return null;

  const category = CATEGORIES[warning.categoryId] || { name: warning.categoryName || 'Category', color: '#f59e0b' };
  const isExceeded = warning.percentage >= 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="bg-[#1C1C1E] w-full max-w-sm rounded-[2rem] border border-amber-500/40 p-6 shadow-2xl relative text-white space-y-4 animate-spring-up overflow-hidden">
        
        {/* Ambient Glow Background Accent */}
        <div className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-30 ${
          isExceeded ? 'bg-rose-500' : 'bg-amber-500'
        }`} />

        {/* Top Header with Aesthetic Close (X) Button */}
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${
              isExceeded ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isExceeded ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6 animate-bounce" />}
            </div>
            <div>
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                isExceeded ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {isExceeded ? 'Budget Exceeded' : 'Budget Warning'}
              </span>
              <h3 className="font-extrabold text-base text-white mt-0.5">{category.name}</h3>
            </div>
          </div>

          {/* Aesthetically Placed Close X Button */}
          <button
            onClick={() => { vibrate(); onClose(); }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-90 border border-white/10"
            title="Dismiss Warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="relative z-10 space-y-3 pt-1">
          <p className="text-xs font-medium text-gray-300 leading-relaxed">
            {isExceeded ? (
              <>You have exceeded your monthly budget for <strong className="text-white">{category.name}</strong>!</>
            ) : (
              <>You have reached <strong className="text-amber-400">{warning.percentage}%</strong> of your monthly limit for <strong className="text-white">{category.name}</strong>.</>
            )}
          </p>

          {/* Progress Meter Bar */}
          <div className="space-y-1.5 bg-[#2C2C2E]/70 p-3.5 rounded-2xl border border-gray-800">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-400 font-bold">Spent: {formatCurrency(warning.currentTotal)}</span>
              <span className="text-gray-400 font-bold">Limit: {formatCurrency(warning.limit)}</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isExceeded ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]' : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                }`}
                style={{ width: `${Math.min(100, warning.percentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Understand Button */}
        <div className="relative z-10 pt-1">
          <button
            onClick={() => { vibrate(); onClose(); }}
            className={`w-full py-3 rounded-2xl font-bold text-xs text-white shadow-lg active:scale-95 transition-all ${
              isExceeded 
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30' 
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
            }`}
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
