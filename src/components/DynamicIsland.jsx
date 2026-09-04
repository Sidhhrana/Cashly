import React, { useState, useEffect } from 'react';
import { useFinancials, formatCurrency, vibrate } from '../context/FinancialContext';
import { Wallet, Zap, CheckCircle2, ChevronDown } from 'lucide-react';

export const DynamicIsland = ({ onOpenQuickLog }) => {
  const { totalBalance, activeWallet, monthTransactions } = useFinancials();
  const [isExpanded, setIsExpanded] = useState(false);
  const [eventNotification, setEventNotification] = useState(null);

  // Trigger live Dynamic Island liquid drop-down animation on new transaction
  useEffect(() => {
    if (monthTransactions.length > 0) {
      const latest = monthTransactions[0];
      const txTime = new Date(latest.date).getTime();
      if (Date.now() - txTime < 5000) {
        setEventNotification(latest);
        const timer = setTimeout(() => {
          setEventNotification(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [monthTransactions]);

  const toggleExpand = () => {
    vibrate();
    setIsExpanded(prev => !prev);
  };

  return (
    <div className="absolute top-[22px] left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-500 ease-out">
      
      {/* 1. Live Event State: Liquid Blob Drops Down Below Status Bar */}
      {eventNotification ? (
        <div 
          onClick={toggleExpand}
          className="w-[325px] h-[68px] rounded-[30px] bg-black/95 text-white border border-emerald-500/50 shadow-[0_14px_35px_rgba(0,0,0,0.9)] flex items-center justify-between px-4 cursor-pointer transform translate-y-9 transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.2) backdrop-blur-2xl ring-2 ring-emerald-500/30"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              eventNotification.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              <CheckCircle2 className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white line-clamp-1">
                {eventNotification.whereSpent?.trim() || eventNotification.note?.trim() || (eventNotification.type === 'income' ? 'Income Received' : 'Expense Recorded')}
              </p>
              <p className="text-[10px] font-semibold text-gray-400">
                {eventNotification.type === 'income' ? 'Income Logged' : 'Expense Recorded'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-base font-extrabold font-mono ${
              eventNotification.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {eventNotification.type === 'income' ? '+' : '-'}{formatCurrency(eventNotification.amount, activeWallet.currency)}
            </span>
          </div>
        </div>
      ) : isExpanded ? (
        
        /* 2. Expanded State: Liquid Blob Drops Down Smoothly */
        <div 
          onClick={toggleExpand}
          className="w-[320px] h-[70px] rounded-[32px] bg-black/95 text-white border border-white/20 shadow-[0_14px_35px_rgba(0,0,0,0.95)] flex items-center justify-between px-4 cursor-pointer transform translate-y-9 transition-all duration-400 cubic-bezier(0.175, 0.885, 0.32, 1.2) backdrop-blur-2xl ring-1 ring-white/10"
        >
          {/* Active Wallet Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Account</p>
              <p className="text-xs font-extrabold text-white truncate max-w-[85px]">{activeWallet.name}</p>
            </div>
          </div>

          <div className="w-px h-6 bg-white/15" />

          {/* Quick Balance */}
          <div className="text-center">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Net Worth</p>
            <p className="text-xs font-extrabold text-emerald-400 font-mono">
              {formatCurrency(totalBalance, activeWallet.currency)}
            </p>
          </div>

          <div className="w-px h-6 bg-white/15" />

          {/* Quick Log Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              vibrate();
              setIsExpanded(false);
              onOpenQuickLog();
            }}
            className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform"
            title="Instant Quick Log"
          >
            <Zap className="w-4 h-4 fill-white" />
          </button>
        </div>

      ) : (

        /* 3. Idle State: Clean Compact Notch Pill (120px x 32px) positioned lower at top-[22px] */
        <div 
          onClick={toggleExpand}
          className="w-[120px] h-[32px] rounded-[18px] bg-black border border-white/10 shadow-md flex items-center justify-between px-3 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 group"
          title="Tap to Drop Down Liquid Island"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />

          <span className="text-[9px] font-extrabold text-white tracking-widest uppercase font-mono group-hover:text-emerald-400 transition-colors">
            CASHLY
          </span>

          <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
        </div>

      )}

    </div>
  );
};
