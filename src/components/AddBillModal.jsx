import React, { useState } from 'react';
import { useFinancials, vibrate } from '../context/FinancialContext';

export const AddBillModal = ({ isOpen, onClose }) => {
  const { addBill } = useFinancials();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('1');

  if (!isOpen) return null;

  const handleSubmit = () => {
    vibrate();
    if (!name || !amount) return;
    addBill({ name, amount: parseFloat(amount), dueDate: parseInt(dueDate) });
    setName('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      <div className="bg-[#1C1C1E] w-full rounded-t-[2.5rem] p-6 pb-safe pointer-events-auto animate-spring-up border-t border-gray-800 text-white space-y-4">
        <h2 className="text-xl font-bold text-center">Add Recurring Monthly Bill</h2>
        
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Bill Name (e.g. Netflix, Wifi, Rent)" 
          className="w-full bg-[#2C2C2E] text-white rounded-2xl px-4 py-3.5 font-bold border border-gray-700 outline-none text-sm" 
          autoFocus
        />

        <input 
          type="text" 
          inputMode="decimal" 
          value={amount} 
          onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
          placeholder="Bill Amount (₹)" 
          className="w-full bg-[#2C2C2E] text-white rounded-2xl px-4 py-3.5 font-bold border border-gray-700 outline-none text-sm font-mono" 
        />

        <div>
          <label className="text-xs text-gray-400 font-bold mb-1 block">Due Day of Month (1-31)</label>
          <input 
            type="number" 
            min="1" 
            max="31" 
            value={dueDate} 
            onChange={e => setDueDate(e.target.value)} 
            className="w-full bg-[#2C2C2E] text-white rounded-2xl px-4 py-3.5 font-bold border border-gray-700 outline-none text-sm" 
          />
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={!name || !amount} 
          className="w-full py-3.5 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-400 active:scale-98 transition-all disabled:opacity-50 text-sm"
        >
          Save Recurring Bill
        </button>
      </div>
    </div>
  );
};
