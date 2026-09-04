import React, { useState, useEffect } from 'react';
import { useFinancials, CATEGORIES, vibrate } from '../context/FinancialContext';
import { 
  X, Coffee, Car, ShoppingBag, Film, FileText, Home, Heart, Book, 
  Repeat, Zap, DollarSign, Landmark, ArrowRightLeft, Wallet, Briefcase, 
  Building2, TrendingUp, Coins, Gift, Sparkles 
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
  investment: TrendingUp,
  crypto: Coins,
  rental: Home,
  gifts: Gift,
  other_income: DollarSign
};

export const AddTransactionModal = ({ isOpen, onClose, onOpenImportScreenshot }) => {
  const { wallets, activeWalletId, activeWallet, addTransaction } = useFinancials();

  const [type, setType] = useState('expense'); // 'expense' | 'income' | 'transfer'
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [whereSpent, setWhereSpent] = useState('');
  const [note, setNote] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');

  const currentCurrency = (type === 'transfer' 
    ? wallets.find(w => w.id === fromWalletId)?.currency 
    : wallets.find(w => w.id === selectedWalletId)?.currency) || activeWallet?.currency || 'INR';

  const currencySymbol = currentCurrency === 'INR' ? '₹' : currentCurrency === 'EUR' ? '€' : currentCurrency === 'GBP' ? '£' : currentCurrency === 'JPY' ? '¥' : '$';

  useEffect(() => {
    if (isOpen) {
      const defaultWallet = activeWalletId === 'all' ? (wallets[0]?.id || '') : activeWalletId;
      setSelectedWalletId(defaultWallet);
      setFromWalletId(wallets[0]?.id || '');
      setToWalletId(wallets[1]?.id || wallets[0]?.id || '');
      setAmount('');
      setSelectedCategory(null);
      setWhereSpent('');
      setNote('');
    }
  }, [isOpen, activeWalletId, wallets]);

  if (!isOpen) return null;

  const handleSave = () => {
    vibrate();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    addTransaction({
      amount: val,
      type,
      categoryId: selectedCategory,
      walletId: selectedWalletId,
      fromWalletId,
      toWalletId,
      whereSpent: whereSpent.trim(),
      note: note.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-[#1C1C1E] w-full max-h-[85vh] rounded-t-[2.5rem] shadow-2xl pointer-events-auto flex flex-col relative animate-spring-up text-white border-t border-gray-800">
        
        {/* Sticky Header with Title, Type Segment & Close X Button */}
        <div className="px-6 pt-5 pb-3 bg-[#1C1C1E] rounded-t-[2.5rem] border-b border-gray-800 flex flex-col gap-3 relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white">Log Transaction</h3>
            <div className="flex items-center gap-2">
              {onOpenImportScreenshot && (
                <button
                  type="button"
                  onClick={() => { vibrate('light'); onOpenImportScreenshot(); }}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 active:scale-95 shadow-sm"
                  title="Scan screenshot or paste bank SMS"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan / SMS</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex bg-[#2C2C2E] rounded-xl p-1 shadow-inner relative">
            <div 
              className={`absolute top-1 bottom-1 w-[31%] bg-emerald-500 rounded-lg shadow-sm transition-transform duration-300 ${
                type === 'expense' ? 'translate-x-[2%]' : (type === 'income' ? 'translate-x-[108%]' : 'translate-x-[214%]')
              }`}
            />
            <button 
              onClick={() => { vibrate(); setType('expense'); setSelectedCategory(null); }} 
              className={`flex-1 py-2 text-xs font-bold z-10 transition-colors ${type === 'expense' ? 'text-white' : 'text-gray-400'}`}
            >
              Expense
            </button>
            <button 
              onClick={() => { vibrate(); setType('income'); setSelectedCategory(null); }} 
              className={`flex-1 py-2 text-xs font-bold z-10 transition-colors ${type === 'income' ? 'text-white' : 'text-gray-400'}`}
            >
              Income
            </button>
            <button 
              onClick={() => { vibrate(); setType('transfer'); setSelectedCategory(null); }} 
              className={`flex-1 py-2 text-xs font-bold z-10 transition-colors ${type === 'transfer' ? 'text-white' : 'text-gray-400'}`}
            >
              Transfer
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          
          {/* Amount Display Input */}
          <div className="p-5 text-center bg-[#2C2C2E]/60 rounded-2xl border border-gray-800">
            <p className="text-gray-400 font-bold mb-1 uppercase tracking-widest text-[10px]">Enter Amount</p>
            <div className="flex items-center justify-center text-4xl font-extrabold text-white">
              <span className="text-gray-500 mr-1 text-3xl">{currencySymbol}</span>
              <input 
                type="text" 
                inputMode="decimal" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
                placeholder="0.00" 
                className="bg-transparent w-full max-w-[180px] outline-none text-center placeholder-gray-600 font-mono" 
              />
            </div>
          </div>

          {/* Wallet Selector */}
          {type !== 'transfer' ? (
            <div className="bg-[#2C2C2E]/60 p-3.5 rounded-2xl border border-gray-800">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                Select Wallet
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {wallets.map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => { vibrate(); setSelectedWalletId(w.id); }}
                    className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      selectedWalletId === w.id
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold'
                        : 'border-gray-800 bg-[#1C1C1E] text-gray-300'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>{w.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#2C2C2E]/60 p-3.5 rounded-2xl border border-gray-800 flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">From Account</label>
                <select 
                  value={fromWalletId} 
                  onChange={e => setFromWalletId(e.target.value)} 
                  className="w-full bg-[#1C1C1E] border border-gray-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none"
                >
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 mt-4">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">To Account</label>
                <select 
                  value={toWalletId} 
                  onChange={e => setToWalletId(e.target.value)} 
                  className="w-full bg-[#1C1C1E] border border-gray-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none"
                >
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Category Grid Picker */}
          {type !== 'transfer' && (
            <div className="bg-[#2C2C2E]/60 p-3.5 rounded-2xl border border-gray-800">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block">
                {type === 'income' ? 'Income Source Category' : 'Expense Category'}
              </label>
              <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                {Object.values(CATEGORIES).filter(c => c.type === type).map((cat) => {
                  const CatIcon = ICON_MAP[cat.id] || Wallet;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { vibrate(); setSelectedCategory(cat.id); }}
                      className="flex flex-col items-center gap-1.5 outline-none active:scale-95 transition-transform"
                    >
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                        isSelected
                          ? `${cat.bg} text-white shadow-lg scale-110 ring-2 ring-white/40`
                          : 'bg-[#1C1C1E] text-gray-400 border border-gray-800'
                      }`}>
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold text-center ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Simple where spent prompt */}
          {type !== 'transfer' && (
            <div className="bg-[#2C2C2E]/60 p-3 rounded-2xl border border-gray-800">
              <input 
                type="text" 
                value={whereSpent} 
                onChange={(e) => setWhereSpent(e.target.value)} 
                placeholder={type === 'income' ? 'Where did you receive it from? (optional)' : 'Where did you spend it? (optional)'} 
                className="w-full text-xs font-medium text-white bg-transparent outline-none placeholder-gray-500" 
              />
            </div>
          )}

          {/* Note Input */}
          <div className="bg-[#2C2C2E]/60 p-3 rounded-2xl border border-gray-800">
            <input 
              type="text" 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="Write a note (optional)..." 
              className="w-full text-xs font-medium text-white bg-transparent outline-none placeholder-gray-500" 
            />
          </div>

          {/* Save Button */}
          <div className="pt-2 pb-6">
            <button 
              onClick={handleSave} 
              disabled={!amount || (type !== 'transfer' && !selectedCategory) || (type === 'transfer' && fromWalletId === toWalletId)} 
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 shadow-lg active:scale-98 transition-all"
            >
              Save {type === 'transfer' ? 'Transfer' : 'Transaction'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
