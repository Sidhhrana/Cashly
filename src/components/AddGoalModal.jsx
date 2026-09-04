import React, { useState } from 'react';
import { useFinancials, vibrate } from '../context/FinancialContext';

export const AddGoalModal = ({ isOpen, onClose }) => {
  const { addGoal } = useFinancials();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState('🏖️');
  const [color, setColor] = useState('from-emerald-400 to-teal-600');

  if (!isOpen) return null;

  const handleSubmit = () => {
    vibrate();
    if (!name || !target) return;
    addGoal({ name, targetAmount: parseFloat(target), icon, color });
    setName('');
    setTarget('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      <div className="bg-[#1C1C1E] w-full rounded-t-[2.5rem] p-6 pb-safe pointer-events-auto animate-spring-up border-t border-gray-800 text-white space-y-4">
        <h2 className="text-xl font-bold text-center">New Savings Jar</h2>
        
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="What are you saving for? (e.g. MacBook, Trip)" 
          className="w-full bg-[#2C2C2E] text-white rounded-2xl px-4 py-3.5 font-bold border border-gray-700 outline-none text-sm" 
          autoFocus
        />

        <input 
          type="text" 
          inputMode="decimal" 
          value={target} 
          onChange={e => setTarget(e.target.value.replace(/[^0-9.]/g, ''))} 
          placeholder="Target Amount (₹)" 
          className="w-full bg-[#2C2C2E] text-white rounded-2xl px-4 py-3.5 font-bold border border-gray-700 outline-none text-sm font-mono" 
        />

        <div className="flex gap-2 justify-center py-1">
          {['🏖️', '💻', '🚗', '🎓', '🏠', '🎮'].map(e => (
            <button 
              key={e} 
              type="button"
              onClick={() => { vibrate(); setIcon(e); }} 
              className={`text-2xl p-2 rounded-xl border transition-all ${
                icon === e ? 'border-emerald-500 bg-emerald-500/20 scale-110' : 'border-transparent hover:bg-gray-800'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={!name || !target} 
          className="w-full py-3.5 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-400 active:scale-98 transition-all disabled:opacity-50 text-sm"
        >
          Create Savings Jar
        </button>
      </div>
    </div>
  );
};
