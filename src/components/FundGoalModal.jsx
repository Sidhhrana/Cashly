import React, { useState } from 'react';
import { useFinancials, formatCurrency, vibrate } from '../context/FinancialContext';

export const FundGoalModal = ({ goal, onClose }) => {
  const { fundGoal, activeWallet } = useFinancials();
  const [amount, setAmount] = useState('');

  if (!goal) return null;

  const handleSubmit = () => {
    vibrate();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    fundGoal(goal.id, goal.currentAmount + val);
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      <div className="bg-[#1C1C1E] w-full rounded-t-[2.5rem] p-6 pb-safe pointer-events-auto animate-spring-up border-t border-gray-800 text-white space-y-4 text-center">
        
        <div>
          <span className="text-4xl block mb-1">{goal.icon || '🎯'}</span>
          <h2 className="text-xl font-bold">Fund {goal.name}</h2>
          <p className="text-xs text-gray-400 mt-1">
            {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount), activeWallet.currency)} left to reach goal!
          </p>
        </div>

        <div className="flex items-center justify-center text-4xl font-extrabold text-white bg-[#2C2C2E] p-5 rounded-3xl border border-gray-700">
          <span className="text-gray-500 mr-2 text-2xl">₹</span>
          <input 
            type="text" 
            inputMode="decimal" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
            placeholder="0.00" 
            className="bg-transparent w-full max-w-[150px] outline-none text-center font-mono" 
            autoFocus 
          />
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={!amount} 
          className="w-full py-3.5 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-400 active:scale-98 transition-all disabled:opacity-50 text-sm"
        >
          Deposit Funds
        </button>
      </div>
    </div>
  );
};
