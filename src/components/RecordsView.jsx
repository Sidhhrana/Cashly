import React, { useState, useMemo } from 'react';
import { useFinancials, CATEGORIES, EX_RATES, formatCurrency, vibrate } from '../context/FinancialContext';
import { 
  Coffee, Car, ShoppingBag, Film, FileText, Home, Heart, Book, 
  Repeat, Zap, DollarSign, Landmark, ArrowRightLeft, Rocket, Tag,
  Search, X, RotateCcw, Store, Briefcase, Building2, Coins, Gift
} from 'lucide-react';

const ICON_MAP = {
  food: Coffee,
  transport: Car,
  shopping: ShoppingBag,
  entertainment: Film,
  bills: FileText,
  home: Home,
  health: Heart,
  education: Book,
  subscriptions: Repeat,
  utilities: Zap,
  salary: DollarSign,
  freelance: Briefcase,
  business: Building2,
  investment: Landmark,
  crypto: Coins,
  rental: Home,
  gifts: Gift,
  other_income: DollarSign
};

const formatDateHeader = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
};

export const RecordsView = ({ onOpenAdd, onOpenImportScreenshot }) => {
  const { monthTransactions, wallets, activeWalletId, activeWallet, deleteTransaction } = useFinancials();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const isFiltered = searchQuery.trim() !== '' || selectedCategoryFilter !== 'all';

  const handleResetFilters = () => {
    vibrate('light');
    setSearchQuery('');
    setSelectedCategoryFilter('all');
  };

  // Filter monthTransactions by search query and category
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return monthTransactions.filter((tx) => {
      // Category filter
      if (selectedCategoryFilter !== 'all') {
        if (tx.categoryId !== selectedCategoryFilter) {
          return false;
        }
      }

      // Search query filter (matching whereSpent, note, category name, or amount)
      if (query) {
        const categoryName = CATEGORIES[tx.categoryId]?.name?.toLowerCase() || (tx.type === 'transfer' ? 'transfer' : '');
        const whereSpent = (tx.whereSpent || '').toLowerCase();
        const note = (tx.note || '').toLowerCase();
        const amountStr = tx.amount != null ? tx.amount.toString() : '';
        const matchesSearch = whereSpent.includes(query) || note.includes(query) || categoryName.includes(query) || amountStr.includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [monthTransactions, selectedCategoryFilter, searchQuery]);

  // Total sum of filtered transactions
  const filteredTotalSum = useMemo(() => {
    const baseRate = EX_RATES[activeWallet.currency] || 1;
    return filteredTransactions.reduce((acc, t) => {
      let amt = Number(t.amount) || 0;
      if (activeWalletId === 'all' && t.type !== 'transfer') {
        const w = wallets.find(w => w.id === t.walletId);
        amt = (amt * (EX_RATES[w?.currency] || 1)) / baseRate;
      }
      return acc + amt;
    }, 0);
  }, [filteredTransactions, activeWalletId, wallets, activeWallet.currency]);

  // Grouped transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = {};
    const baseRate = EX_RATES[activeWallet.currency] || 1;

    filteredTransactions.forEach(t => {
      const dateKey = new Date(t.date).toDateString();
      if (!groups[dateKey]) groups[dateKey] = { date: t.date, items: [], total: 0 };
      groups[dateKey].items.push(t);

      let amount = Number(t.amount) || 0;
      if (activeWalletId === 'all' && t.type !== 'transfer') {
        const w = wallets.find(w => w.id === t.walletId);
        amount = (amount * (EX_RATES[w?.currency] || 1)) / baseRate;
        groups[dateKey].total += t.type === 'expense' ? -amount : amount;
      } else if (activeWalletId !== 'all') {
        if (t.type === 'transfer') {
          if (t.fromWalletId === activeWalletId) groups[dateKey].total -= t.amount;
          if (t.toWalletId === activeWalletId) groups[dateKey].total += (t.amountConverted || t.amount);
        } else {
          groups[dateKey].total += t.type === 'expense' ? -amount : amount;
        }
      }
    });

    return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredTransactions, activeWalletId, wallets, activeWallet.currency]);

  return (
    <div className="px-4 py-4 space-y-4">
      
      {/* 1. Search & Category Filter Header */}
      <div className="space-y-3 bg-[#1C1C1E] p-3.5 rounded-3xl border border-gray-800/80 shadow-md">
        {/* Search Input & Scan Action */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search merchant, place, note..."
              className="w-full pl-9.5 pr-8 py-2.5 bg-[#2C2C2E]/70 border border-gray-700/60 rounded-2xl text-xs font-medium text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { vibrate('light'); setSearchQuery(''); }}
                className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills (All + all CATEGORIES) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => { vibrate('light'); setSelectedCategoryFilter('all'); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              selectedCategoryFilter === 'all'
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                : 'bg-[#2C2C2E]/60 text-gray-400 border-gray-800 hover:text-white'
            }`}
          >
            All
          </button>
          {Object.values(CATEGORIES).map(cat => {
            const CatIcon = ICON_MAP[cat.id] || Tag;
            const isSelected = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  vibrate('light');
                  setSelectedCategoryFilter(isSelected ? 'all' : cat.id);
                }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isSelected
                    ? `${cat.bg} text-white border-white/30 shadow-md font-bold scale-102`
                    : 'bg-[#2C2C2E]/60 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                }`}
              >
                <CatIcon className="w-3 h-3" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Result Summary Pill when filter active */}
      {isFiltered && (
        <div className="flex items-center justify-between bg-[#1C1C1E] border border-emerald-500/30 px-3.5 py-2.5 rounded-2xl animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-gray-200 truncate">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'} • {formatCurrency(filteredTotalSum, activeWallet.currency)}
            </span>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 rounded-xl transition-colors active:scale-95 flex-shrink-0 ml-2"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* 3. Clean Timeline Activity List / Clean Empty State */}
      {monthTransactions.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16 px-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg ring-8 ring-emerald-500/20">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white mb-1">No activity logged yet</h3>
            <p className="text-xs font-medium text-gray-400 max-w-xs mx-auto">Your financial journey starts with a single step. Add an expense or income.</p>
          </div>
          <div className="flex items-center justify-center">
            <button 
              onClick={() => { vibrate(); onOpenAdd(); }} 
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Add First Entry
            </button>
          </div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center space-y-3 py-12 px-6 bg-[#1C1C1E] rounded-3xl border border-gray-800">
          <div className="w-12 h-12 rounded-2xl bg-[#2C2C2E] flex items-center justify-center text-gray-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">No transactions found</h3>
            <p className="text-xs text-gray-400 mt-0.5">No entries match your search query or category filter.</p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-[#2C2C2E] hover:bg-gray-700 text-emerald-400 font-bold text-xs rounded-xl border border-gray-700 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedTransactions.map((group, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 40}ms` }}>
              <div className="flex justify-between items-center px-2 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {formatDateHeader(group.date)}
                </span>
                <span className="text-xs font-bold text-gray-400 font-mono">
                  {group.total > 0 ? '+' : ''}{formatCurrency(group.total, activeWallet.currency)}
                </span>
              </div>

              <div className="bg-[#1C1C1E] rounded-3xl shadow-sm border border-gray-800/60 overflow-hidden divide-y divide-gray-800/40">
                {group.items.map((tx) => {
                  const isTransfer = tx.type === 'transfer';
                  const category = isTransfer ? null : (CATEGORIES[tx.categoryId] || { name: 'General', bg: 'bg-emerald-500' });
                  const CatIcon = category ? (ICON_MAP[tx.categoryId] || Tag) : ArrowRightLeft;

                  let displayAmount = tx.amount;
                  let isPositive = tx.type === 'income';
                  if (isTransfer) {
                    if (activeWalletId === 'all') {
                      displayAmount = tx.amount;
                      isPositive = false;
                    } else {
                      isPositive = tx.toWalletId === activeWalletId;
                      displayAmount = isPositive ? (tx.amountConverted || tx.amount) : tx.amount;
                    }
                  }

                  // Merchant display / fallback:
                  // Backwards compatibility: if tx.whereSpent is undefined/empty, fall back gracefully to tx.note or category name.
                  const merchantDisplay = tx.whereSpent?.trim() || (!isTransfer && tx.note?.trim() ? tx.note.trim() : null);

                  return (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-4 hover:bg-gray-800/40 cursor-pointer transition-colors group"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (window.confirm('Delete this transaction?')) deleteTransaction(tx.id);
                      }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-2">
                        {isTransfer ? (
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-300 bg-gray-800 group-hover:scale-105 transition-transform flex-shrink-0">
                            <ArrowRightLeft className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm ${category.bg} group-hover:scale-105 transition-transform flex-shrink-0`}>
                            <CatIcon className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-white text-[15px] truncate">
                              {isTransfer ? 'Transfer' : category.name}
                            </p>
                            {merchantDisplay && !isTransfer && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <Store className="w-2.5 h-2.5 flex-shrink-0 text-emerald-400" />
                                <span className="max-w-[120px] truncate">{merchantDisplay}</span>
                              </span>
                            )}
                          </div>

                          {activeWalletId === 'all' && (
                            <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                              {wallets.find(w => w.id === tx.walletId)?.name || 'Account'}
                            </p>
                          )}
                          {tx.note && tx.note.trim() !== merchantDisplay && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{tx.note}</p>
                          )}
                        </div>
                      </div>

                      <span className={`font-semibold text-[15px] font-mono flex-shrink-0 ${
                        isTransfer ? (isPositive ? 'text-emerald-500' : 'text-white') : (tx.type === 'income' ? 'text-emerald-500' : 'text-white')
                      }`}>
                        {isPositive ? '+' : '-'}{formatCurrency(displayAmount, activeWalletId === 'all' ? wallets.find(w => w.id === (isTransfer ? tx.fromWalletId : tx.walletId))?.currency : activeWallet.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
