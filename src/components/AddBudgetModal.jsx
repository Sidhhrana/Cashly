import React, { useState } from 'react';
import { useFinancials, CATEGORIES, vibrate } from '../context/FinancialContext';

export const AddBudgetModal = ({ isOpen, onClose }) => {
  const { addBudget, wallets, activeWalletId } = useFinancials();
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [walletId, setWalletId] = useState(activeWalletId === 'all' ? (wallets[0]?.id || 'all') : activeWalletId);

  if (!isOpen) return null;

  const handleSubmit = () => {
    vibrate();
    if (!amount) return;
    addBudget({ categoryId, limit: parseFloat(amount), walletId });
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      <div className="bg-[#1C1C1E] w-full rounded-t-[2.5rem] p-6 pb-safe pointer-events-auto animate-spring-up border-t border-gray-800 text-white space-y-4 max-h-[85%] overflow-y-auto">
        <h2 className="text-xl font-bold text-center">Set Category Budget Target</h2>
        
        <input 
          type="text" 
          inputMode="decimal" 
          value={amount} 
          onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
          placeholder="Monthly Limit Target (₹)" 
          className="w-full bg-[#2C2C2E] text-white rounded-2xl px-4 py-3.5 font-bold border border-gray-700 outline-none text-sm font-mono" 
          autoFocus
        />

        <div className="grid grid-cols-3 gap-2 bg-[#2C2C2E] p-3 rounded-2xl border border-gray-800">
          {Object.values(CATEGORIES).filter(c => c.type === 'expense').map(cat => (
            <button 
              key={cat.id} 
              onClick={() => { vibrate(); setCategoryId(cat.id); }} 
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all ${
                categoryId === cat.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500 font-bold' : 'text-gray-400 border border-transparent hover:bg-gray-800'
              }`}
            >
              <span className="text-[10px] font-bold truncate">{cat.name}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={!amount} 
          className="w-full py-3.5 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-400 active:scale-98 transition-all disabled:opacity-50 text-sm"
        >
          Save Budget Target
        </button>
      </div>
    </div>
  );
};
