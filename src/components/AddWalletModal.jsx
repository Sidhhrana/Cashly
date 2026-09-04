import React, { useState } from 'react';
import { useFinancials, WALLET_COLORS, vibrate } from '../context/FinancialContext';

export const AddWalletModal = ({ isOpen, onClose }) => {
  const { addWallet } = useFinancials();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [selectedColor, setSelectedColor] = useState('emerald');

  if (!isOpen) return null;

  const handleSubmit = () => {
    vibrate('success');
    if (!name) return;
    addWallet({ name, currency, color: selectedColor, iconString: 'Wallet' });
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity" onClick={onClose} />
      <div className="bg-[#1C1C1E] w-full rounded-t-[2.5rem] p-6 pb-12 pointer-events-auto animate-spring-up border-t border-gray-800 text-white space-y-4 relative z-[101] shadow-2xl">
        <div className="flex justify-between items-center pb-2 border-b border-gray-800">
          <h2 className="text-lg font-extrabold">Add New Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-bold text-sm">✕</button>
        </div>
        
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Wallet Name (e.g. Savings, Chase Card, Crypto Vault)" 
          className="w-full bg-[#2C2C2E] text-white rounded-2xl px-4 py-3.5 font-bold border border-gray-700 outline-none text-sm" 
        />

        <select 
          value={currency} 
          onChange={e => setCurrency(e.target.value)} 
          className="w-full bg-[#2C2C2E] text-white rounded-2xl px-4 py-3.5 font-bold border border-gray-700 outline-none text-sm"
        >
          <option value="INR">INR (₹)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="JPY">JPY (¥)</option>
        </select>

        {/* Color Palette Theme Picker */}
        <div className="bg-[#2C2C2E]/60 p-3.5 rounded-2xl border border-gray-800 space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Select Card Color Theme
          </label>
          <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 no-scrollbar">
            {Object.entries(WALLET_COLORS).map(([colorKey, colorObj]) => (
              <button
                key={colorKey}
                type="button"
                onClick={() => { vibrate('light'); setSelectedColor(colorKey); }}
                className={`w-9 h-9 flex-shrink-0 rounded-full ${colorObj.bg} transition-all duration-300 transform flex items-center justify-center ${
                  selectedColor === colorKey ? 'scale-110 ring-4 ring-white/40 shadow-lg' : 'opacity-70 hover:opacity-100'
                }`}
                title={colorObj.name}
              >
                {selectedColor === colorKey && (
                  <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={!name} 
          className="w-full py-3.5 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-400 active:scale-98 transition-all disabled:opacity-50 text-sm shadow-lg shadow-emerald-500/20"
        >
          Create Wallet
        </button>
      </div>
    </div>
  );
};
