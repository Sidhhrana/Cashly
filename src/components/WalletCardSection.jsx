import React from 'react';
import { useFinancials } from '../context/FinancialContext';
import { Edit2, Plus, ArrowUpRight, ArrowDownRight, Layers, Wallet, CreditCard } from 'lucide-react';

export const WalletCardSection = ({ onEditBalance, onOpenAddWallet }) => {
  const { 
    wallets, 
    totalBalance, 
    activeWalletId, 
    setActiveWalletId, 
    stats 
  } = useFinancials();

  return (
    <section className="space-y-5">
      
      {/* Hero Net Worth Card - Clean & Spacious */}
      <div className="bg-gradient-to-br from-[#1b0e3e] via-[#241352] to-[#0f0727] rounded-3xl p-6 sm:p-8 text-white border border-purple-500/20 shadow-xl space-y-6">
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/80">
            Total Money
          </span>
          <span className="text-xs font-medium text-purple-200/60 font-mono">
            {wallets.length} Accounts
          </span>
        </div>

        {/* Large Balance Display */}
        <div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-sans">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-purple-200/70 mt-1">
            Calculated live across all your linked wallets
          </p>
        </div>

        {/* Income vs Expenses Stats Pills */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-purple-200/70 block">Total Income</span>
              <span className="text-base font-bold text-emerald-400">
                +${stats.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-purple-200/70 block">Total Expenses</span>
              <span className="text-base font-bold text-rose-400">
                -${stats.spending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Account / Wallet Cards Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 dark:text-purple-300 uppercase tracking-wider">
            Your Accounts
          </h3>
          <button
            onClick={onOpenAddWallet}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Account
          </button>
        </div>

        {/* Horizontal Scrollable Clean Cards */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {/* All Accounts Filter Pill */}
          <button
            onClick={() => setActiveWalletId('all')}
            className={`p-4 rounded-2xl border text-left min-w-[140px] transition-all flex flex-col justify-between h-24 ${
              activeWalletId === 'all'
                ? 'bg-purple-600 text-white border-purple-500 shadow-purple-glow'
                : 'bg-white dark:bg-[#160d38] text-slate-800 dark:text-purple-200 border-slate-200/80 dark:border-purple-900/40 hover:bg-slate-50 dark:hover:bg-purple-900/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <Layers className="w-4 h-4 opacity-80" />
              <span className="text-[10px] font-bold opacity-70">ALL</span>
            </div>
            <div>
              <span className="text-xs font-bold block">All Accounts</span>
              <span className="text-sm font-extrabold">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </button>

          {/* Individual Wallet Cards */}
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              onClick={() => setActiveWalletId(wallet.id)}
              className={`p-4 rounded-2xl border text-left min-w-[170px] sm:min-w-[190px] transition-all cursor-pointer flex flex-col justify-between h-24 relative group ${
                activeWalletId === wallet.id
                  ? 'bg-purple-600 text-white border-purple-500 shadow-purple-glow scale-[1.02]'
                  : 'bg-white dark:bg-[#160d38] text-slate-800 dark:text-purple-100 border-slate-200/80 dark:border-purple-900/40 hover:bg-slate-50 dark:hover:bg-purple-900/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold line-clamp-1">{wallet.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditBalance(wallet);
                  }}
                  title="Edit Real Balance"
                  className="p-1 rounded-md hover:bg-white/20 text-current opacity-80 hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <span className="text-[11px] opacity-70 block font-mono">{wallet.accountNumber}</span>
                <span className="text-base font-extrabold tracking-tight">
                  ${(wallet.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};
