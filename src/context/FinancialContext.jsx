import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from '../firebase';

const FinancialContext = createContext(null);

export const EX_RATES = { USD: 1, EUR: 1.08, GBP: 1.25, JPY: 0.0066, INR: 0.012 };

export const WALLET_COLORS = {
  emerald: { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500', gradient: 'from-emerald-900/95 via-teal-950/95 to-black', border: 'border-emerald-500/60', text: 'text-emerald-400', glow: 'bg-emerald-500/20', ring: 'ring-emerald-500/30' },
  indigo: { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-500', gradient: 'from-indigo-900/95 via-purple-950/95 to-black', border: 'border-indigo-500/60', text: 'text-indigo-400', glow: 'bg-indigo-500/20', ring: 'ring-indigo-500/30' },
  purple: { id: 'purple', name: 'Purple', bg: 'bg-purple-500', gradient: 'from-purple-900/95 via-fuchsia-950/95 to-black', border: 'border-purple-500/60', text: 'text-purple-400', glow: 'bg-purple-500/20', ring: 'ring-purple-500/30' },
  amber: { id: 'amber', name: 'Amber', bg: 'bg-amber-500', gradient: 'from-amber-900/95 via-orange-950/95 to-black', border: 'border-amber-500/60', text: 'text-amber-400', glow: 'bg-amber-500/20', ring: 'ring-amber-500/30' },
  rose: { id: 'rose', name: 'Rose', bg: 'bg-rose-500', gradient: 'from-rose-900/95 via-pink-950/95 to-black', border: 'border-rose-500/60', text: 'text-rose-400', glow: 'bg-rose-500/20', ring: 'ring-rose-500/30' },
  sky: { id: 'sky', name: 'Sky Blue', bg: 'bg-sky-500', gradient: 'from-sky-900/95 via-blue-950/95 to-black', border: 'border-sky-500/60', text: 'text-sky-400', glow: 'bg-sky-500/20', ring: 'ring-sky-500/30' },
  teal: { id: 'teal', name: 'Teal', bg: 'bg-teal-500', gradient: 'from-teal-900/95 via-emerald-950/95 to-black', border: 'border-teal-500/60', text: 'text-teal-400', glow: 'bg-teal-500/20', ring: 'ring-teal-500/30' },
};

export const CATEGORIES = {
  // Expenses
  food: { id: 'food', name: 'Food & Drink', bg: 'bg-orange-500', color: '#f97316', type: 'expense' },
  transport: { id: 'transport', name: 'Transport', bg: 'bg-blue-500', color: '#3b82f6', type: 'expense' },
  shopping: { id: 'shopping', name: 'Shopping', bg: 'bg-purple-500', color: '#a855f7', type: 'expense' },
  entertainment: { id: 'entertainment', name: 'Entertainment', bg: 'bg-pink-500', color: '#ec4899', type: 'expense' },
  bills: { id: 'bills', name: 'Bills', bg: 'bg-rose-500', color: '#f43f5e', type: 'expense' },
  home: { id: 'home', name: 'Home', bg: 'bg-indigo-500', color: '#6366f1', type: 'expense' },
  health: { id: 'health', name: 'Health', bg: 'bg-red-500', color: '#ef4444', type: 'expense' },
  education: { id: 'education', name: 'Education', bg: 'bg-cyan-500', color: '#06b6d4', type: 'expense' },
  subscriptions: { id: 'subscriptions', name: 'Subscriptions', bg: 'bg-violet-500', color: '#8b5cf6', type: 'expense' },
  utilities: { id: 'utilities', name: 'Utilities', bg: 'bg-yellow-500', color: '#eab308', type: 'expense' },
  
  // Income Sources
  salary: { id: 'salary', name: 'Salary', bg: 'bg-emerald-500', color: '#10b981', type: 'income' },
  freelance: { id: 'freelance', name: 'Freelance', bg: 'bg-teal-500', color: '#14b8a6', type: 'income' },
  business: { id: 'business', name: 'Business', bg: 'bg-indigo-600', color: '#4f46e5', type: 'income' },
  investment: { id: 'investment', name: 'Investments', bg: 'bg-emerald-600', color: '#059669', type: 'income' },
  crypto: { id: 'crypto', name: 'Crypto & Forex', bg: 'bg-amber-500', color: '#f59e0b', type: 'income' },
  rental: { id: 'rental', name: 'Rental Income', bg: 'bg-sky-500', color: '#0ea5e9', type: 'income' },
  gifts: { id: 'gifts', name: 'Gifts & Bonus', bg: 'bg-pink-500', color: '#ec4899', type: 'income' },
  other_income: { id: 'other_income', name: 'Other Income', bg: 'bg-gray-600', color: '#4b5563', type: 'income' },
};

const DEFAULT_WALLETS = [
  { id: 'w1', name: 'Main Wallet', currency: 'INR', balance: 0, color: 'emerald', iconString: 'Wallet' },
  { id: 'w2', name: 'Savings Vault', currency: 'INR', balance: 0, color: 'indigo', iconString: 'Landmark' },
];

const safeGet = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};

// Micro-Haptic Tactile Engine Simulation (iOS Taptic Engine)
export const vibrate = (type = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(22);
      else if (type === 'success') navigator.vibrate([15, 30, 20]);
      else if (type === 'warning') navigator.vibrate([40, 50, 40]);
      else navigator.vibrate(15);
    } catch (e) {}
  }
};

export const formatCurrency = (amount, currencyCode = 'INR') => {
  try {
    const targetCurr = currencyCode || 'INR';
    const locale = targetCurr === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency: targetCurr, 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    }).format(amount || 0);
  } catch (e) {
    const targetCurr = currencyCode || 'INR';
    return `${targetCurr === 'INR' ? '₹' : '$'}${parseFloat(amount || 0).toFixed(2)}`;
  }
};

export const FinancialProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [wallets, setWallets] = useState(() => safeGet('cashly_v3_wallets', DEFAULT_WALLETS));
  const [transactions, setTransactions] = useState(() => safeGet('cashly_v3_transactions', []));
  const [budgets, setBudgets] = useState(() => safeGet('cashly_v3_budgets', []));
  const [goals, setGoals] = useState(() => safeGet('cashly_v3_goals', []));
  const [bills, setBills] = useState(() => safeGet('cashly_v3_bills', []));
  const [preferences, setPreferences] = useState(() => {
    const saved = safeGet('cashly_v3_prefs', null);
    if (!saved) {
      return { baseCurrency: 'INR', isDarkMode: true };
    }
    return {
      baseCurrency: saved.baseCurrency === 'USD' ? 'INR' : (saved.baseCurrency || 'INR'),
      isDarkMode: saved.isDarkMode !== undefined ? saved.isDarkMode : true
    };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(() => safeGet('cashly_v3_last_synced', null));

  const [weeklyBudgetConfig, setWeeklyBudgetConfigState] = useState(() => safeGet('cashly_v3_weekly_budget', {
    targetWeeklyBudget: null,
    targetMonthlyBudget: null,
    customWeeklyTargets: {}
  }));

  const [budgetWarning, setBudgetWarning] = useState(null);
  const [activeWalletId, setActiveWalletId] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    if (lastSyncedTime) safeSet('cashly_v3_last_synced', lastSyncedTime);
  }, [lastSyncedTime]);

  // Listen to Firebase Authentication & handle mobile redirect result
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    getRedirectResult(auth).catch(err => {
      console.log("Redirect check result:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Per-User Cloud Sync: Reset state when account changes & attach user doc listener
  useEffect(() => {
    if (!db) return;

    if (!user) {
      setWallets(safeGet('cashly_v3_wallets', DEFAULT_WALLETS));
      setTransactions(safeGet('cashly_v3_transactions', []));
      setBudgets(safeGet('cashly_v3_budgets', []));
      setGoals(safeGet('cashly_v3_goals', []));
      setBills(safeGet('cashly_v3_bills', []));
      return;
    }

    const localWallets = safeGet('cashly_v3_wallets', DEFAULT_WALLETS);
    const localTransactions = safeGet('cashly_v3_transactions', []);
    const localBudgets = safeGet('cashly_v3_budgets', []);
    const localGoals = safeGet('cashly_v3_goals', []);
    const localBills = safeGet('cashly_v3_bills', []);
    const localWeekly = safeGet('cashly_v3_weekly_budget', { targetMonthlyBudget: null, customWeeklyTargets: {} });
    const localPrefs = safeGet('cashly_v3_prefs', { baseCurrency: 'INR', isDarkMode: true });

    const userDocRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const hasRemoteTransactions = Array.isArray(data.transactions) && data.transactions.length > 0;
        
        // If local transactions exist and remote doc is empty, migrates local data to Firestore to avoid data loss on first login
        if (!hasRemoteTransactions && localTransactions.length > 0) {
          const now = new Date().toISOString();
          setDoc(userDocRef, {
            wallets: localWallets,
            transactions: localTransactions,
            budgets: localBudgets,
            goals: localGoals,
            bills: localBills,
            weeklyBudgetConfig: localWeekly,
            preferences: localPrefs,
            lastUpdated: now
          }, { merge: true }).then(() => {
            setLastSyncedTime(now);
          }).catch(err => console.error("Cloud migration error:", err));

          setWallets(localWallets);
          setTransactions(localTransactions);
          setBudgets(localBudgets);
          setGoals(localGoals);
          setBills(localBills);
          setWeeklyBudgetConfigState(localWeekly);
        } else {
          if (data.wallets) setWallets(data.wallets);
          if (data.transactions) setTransactions(data.transactions);
          if (data.budgets) setBudgets(data.budgets);
          if (data.goals) setGoals(data.goals);
          if (data.bills) setBills(data.bills);
          if (data.weeklyBudgetConfig) setWeeklyBudgetConfigState(data.weeklyBudgetConfig);
          if (data.preferences) setPreferences(data.preferences);
          if (data.lastUpdated) setLastSyncedTime(data.lastUpdated);
        }
      } else {
        // Document doesn't exist yet on Firestore
        if (localTransactions.length > 0 || localWallets.length > 0) {
          const now = new Date().toISOString();
          setDoc(userDocRef, {
            wallets: localWallets,
            transactions: localTransactions,
            budgets: localBudgets,
            goals: localGoals,
            bills: localBills,
            weeklyBudgetConfig: localWeekly,
            preferences: localPrefs,
            lastUpdated: now
          }).then(() => {
            setLastSyncedTime(now);
          }).catch(err => console.error("Initial doc migration error:", err));
        }
      }
    }, err => console.error("Firestore sync error:", err));

    return () => unsub();
  }, [user]);

  // Debounced Batch Save to Firestore
  const scheduleCloudSync = (updatedState) => {
    if (!user || !db) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        const userDocRef = doc(db, 'users', user.uid);
        const now = new Date().toISOString();
        await setDoc(userDocRef, {
          wallets: updatedState.wallets || wallets,
          transactions: updatedState.transactions || transactions,
          budgets: updatedState.budgets || budgets,
          goals: updatedState.goals || goals,
          bills: updatedState.bills || bills,
          weeklyBudgetConfig: updatedState.weeklyBudgetConfig || weeklyBudgetConfig,
          preferences: updatedState.preferences || preferences,
          lastUpdated: now
        }, { merge: true });
        setLastSyncedTime(now);
      } catch (err) {
        console.error("Cloud Sync Error:", err);
      } finally {
        setIsSyncing(false);
      }
    }, 1200);
  };

  // Sync state to local storage as fallback
  useEffect(() => safeSet('cashly_v3_wallets', wallets), [wallets]);
  useEffect(() => safeSet('cashly_v3_transactions', transactions), [transactions]);
  useEffect(() => safeSet('cashly_v3_budgets', budgets), [budgets]);
  useEffect(() => safeSet('cashly_v3_goals', goals), [goals]);
  useEffect(() => safeSet('cashly_v3_bills', bills), [bills]);
  useEffect(() => safeSet('cashly_v3_weekly_budget', weeklyBudgetConfig), [weeklyBudgetConfig]);
  useEffect(() => safeSet('cashly_v3_prefs', preferences), [preferences]);

  // Google Login
  const loginWithGoogle = async () => {
    vibrate('medium');
    if (!auth) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.log("Popup blocked/failed, trying redirect:", err);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr) {
        console.error("Google Auth error:", redirectErr);
        alert("Google Sign-In failed. Please check Firebase Authorized Domains in your Firebase Console.");
      }
    }
  };

  const logout = async () => {
    vibrate('medium');
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Wipe All Data (Danger Zone Action)
  const wipeAllData = async () => {
    vibrate('warning');
    localStorage.removeItem('cashly_v3_wallets');
    localStorage.removeItem('cashly_v3_transactions');
    localStorage.removeItem('cashly_v3_budgets');
    localStorage.removeItem('cashly_v3_goals');
    localStorage.removeItem('cashly_v3_bills');
    localStorage.removeItem('cashly_v3_weekly_budget');

    if (user && db) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await deleteDoc(userDocRef);
      } catch (err) {
        console.error("Firestore wipe error:", err);
      }
    }

    setWallets(DEFAULT_WALLETS);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setBills([]);
    setWeeklyBudgetConfigState({ targetMonthlyBudget: null, customWeeklyTargets: {} });
    setActiveWalletId('all');

    alert("All financial ledger data has been completely wiped.");
  };

  const rawActive = activeWalletId === 'all'
    ? { id: 'all', name: 'All Wallets', currency: preferences?.baseCurrency || 'INR', color: 'emerald' }
    : wallets.find(w => w.id === activeWalletId) || wallets[0] || { name: 'Main Wallet', currency: 'INR', color: 'emerald' };

  const activeWallet = {
    ...rawActive,
    currency: rawActive?.currency || 'INR'
  };

  const cycleWallet = () => {
    vibrate('light');
    if (wallets.length === 0) return;
    const sequence = ['all', ...wallets.map(w => w.id)];
    const nextIdx = (sequence.indexOf(activeWalletId) + 1) % sequence.length;
    setActiveWalletId(sequence[nextIdx]);
  };

  // Filter transactions for active wallet
  const viewTransactions = useMemo(() => {
    return transactions.filter(t => 
      activeWalletId === 'all' || 
      (t.type === 'transfer' ? (t.fromWalletId === activeWalletId || t.toWalletId === activeWalletId) : t.walletId === activeWalletId)
    );
  }, [transactions, activeWalletId]);

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    return viewTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth.getMonth() && tDate.getFullYear() === currentMonth.getFullYear();
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [viewTransactions, currentMonth]);

  // Calculate Balance, Income & Expense
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let inc = 0, exp = 0, bal = 0;
    const baseRate = EX_RATES[preferences?.baseCurrency || 'INR'] || 1;

    const convert = (amt, wId) => {
      if (activeWalletId === 'all') {
        const wCurrency = wallets.find(w => w.id === wId)?.currency || 'INR';
        return (amt * (EX_RATES[wCurrency] || 1)) / baseRate;
      }
      return amt;
    };

    viewTransactions.forEach(t => {
      let amt = t.type !== 'transfer' ? convert(t.amount, t.walletId) : 0;
      if (t.type === 'income') bal += amt;
      if (t.type === 'expense') bal -= amt;
      if (t.type === 'transfer' && activeWalletId !== 'all') {
        if (t.fromWalletId === activeWalletId) bal -= t.amount;
        if (t.toWalletId === activeWalletId) bal += (t.amountConverted || t.amount);
      }
    });

    monthTransactions.forEach(t => {
      let amt = t.type !== 'transfer' ? convert(t.amount, t.walletId) : 0;
      if (t.type === 'income') inc += amt;
      if (t.type === 'expense') exp += amt;
      if (t.type === 'transfer' && activeWalletId !== 'all') {
        if (t.fromWalletId === activeWalletId) exp += t.amount;
        if (t.toWalletId === activeWalletId) inc += (t.amountConverted || t.amount);
      }
    });

    return { totalIncome: inc, totalExpense: exp, balance: bal };
  }, [viewTransactions, monthTransactions, activeWalletId, wallets, preferences?.baseCurrency]);

  // Update Weekly Budget Configuration
  const updateWeeklyBudgetConfig = (newConfig) => {
    vibrate('light');
    setWeeklyBudgetConfigState(prev => {
      const updated = typeof newConfig === 'function' ? newConfig(prev) : { ...prev, ...newConfig };
      scheduleCloudSync({ weeklyBudgetConfig: updated });
      return updated;
    });
  };

  // Add Transaction with Budget Warning Trigger & Success Haptics
  const addTransaction = (data) => {
    const newTx = {
      id: data.id || `t-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: data.date || new Date().toISOString(),
      ...data,
      amount: parseFloat(data.amount)
    };

    const updatedTxList = [newTx, ...transactions];
    setTransactions(updatedTxList);
    scheduleCloudSync({ transactions: updatedTxList });

    vibrate('success');

    // Check Budget Limit Threshold Warning
    if (data.type === 'expense' && data.categoryId) {
      const targetBudget = budgets.find(b => b.categoryId === data.categoryId);
      if (targetBudget && targetBudget.limit > 0) {
        let currentTotal = updatedTxList
          .filter(t => t.type === 'expense' && t.categoryId === data.categoryId)
          .reduce((acc, t) => acc + Number(t.amount), 0);

        const pct = Math.round((currentTotal / targetBudget.limit) * 100);
        if (pct >= 80) {
          vibrate('warning');
          setBudgetWarning({
            categoryId: data.categoryId,
            categoryName: CATEGORIES[data.categoryId]?.name || 'Category',
            currentTotal,
            limit: targetBudget.limit,
            percentage: pct
          });
        }
      }
    }

    confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
  };

  // Batch Add Transactions (e.g. from screenshot OCR parser)
  const addBatchTransactions = (items) => {
    if (!items || items.length === 0) return;
    vibrate('success');
    const newItems = items.map((data, idx) => ({
      id: data.id || `t-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      date: data.date || new Date().toISOString(),
      ...data,
      amount: parseFloat(data.amount)
    }));
    const updatedTxList = [...newItems, ...transactions];
    setTransactions(updatedTxList);
    scheduleCloudSync({ transactions: updatedTxList });
    confetti({ particleCount: 55, spread: 75, origin: { y: 0.75 } });
  };

  // Delete Transaction
  const deleteTransaction = (id) => {
    vibrate('medium');
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    scheduleCloudSync({ transactions: updated });
  };

  // Add Wallet
  const addWallet = (data) => {
    vibrate('success');
    const newW = {
      id: `w-${Date.now()}`,
      name: data.name,
      currency: data.currency || 'INR',
      color: data.color || 'emerald',
      iconString: data.iconString || 'Wallet',
      balance: 0
    };
    const updated = [...wallets, newW];
    setWallets(updated);
    scheduleCloudSync({ wallets: updated });
  };

  // Update Wallet
  const updateWallet = (id, data) => {
    vibrate('success');
    const updated = wallets.map(w => w.id === id ? { ...w, ...data, currency: data.currency || w.currency || 'INR' } : w);
    setWallets(updated);
    scheduleCloudSync({ wallets: updated });
  };

  // Delete Wallet
  const deleteWallet = (id) => {
    if (wallets.length <= 1) return;
    vibrate('medium');
    const updated = wallets.filter(w => w.id !== id);
    setWallets(updated);
    scheduleCloudSync({ wallets: updated });
    if (activeWalletId === id) setActiveWalletId('all');
  };

  // Add Budget
  const addBudget = (data) => {
    vibrate('success');
    const newB = {
      id: `b-${Date.now()}`,
      ...data,
      limit: parseFloat(data.limit)
    };
    const updated = [...budgets, newB];
    setBudgets(updated);
    scheduleCloudSync({ budgets: updated });
  };

  // Add Goal / Savings Jar
  const addGoal = (data) => {
    vibrate('success');
    const newG = {
      id: `g-${Date.now()}`,
      ...data,
      targetAmount: parseFloat(data.targetAmount),
      currentAmount: 0
    };
    const updated = [...goals, newG];
    setGoals(updated);
    scheduleCloudSync({ goals: updated });
  };

  // Fund Goal
  const fundGoal = (id, newAmount) => {
    vibrate('success');
    const updated = goals.map(g => g.id === id ? { ...g, currentAmount: newAmount } : g);
    setGoals(updated);
    scheduleCloudSync({ goals: updated });
  };

  // Add Bill
  const addBill = (data) => {
    vibrate('success');
    const newBill = {
      id: `bill-${Date.now()}`,
      ...data,
      amount: parseFloat(data.amount)
    };
    const updated = [...bills, newBill];
    setBills(updated);
    scheduleCloudSync({ bills: updated });
  };

  // Update Preference
  const updatePreference = (key, value) => {
    vibrate('light');
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // CSV Export
  const exportCSV = () => {
    vibrate('medium');
    const headers = ["Date", "Type", "Category", "Where Spent", "Amount", "Currency", "Note"];
    const rows = monthTransactions.map(t => {
      const catName = CATEGORIES[t.categoryId]?.name || (t.type === 'transfer' ? 'Transfer' : 'General');
      const wallet = wallets.find(w => w.id === t.walletId);
      const curr = wallet ? wallet.currency : (preferences?.baseCurrency || 'INR');
      return [
        new Date(t.date).toLocaleDateString(),
        t.type,
        catName,
        `"${(t.whereSpent || '').replace(/"/g, '""')}"`,
        t.amount,
        curr,
        `"${(t.note || '').replace(/"/g, '""')}"`
      ].join(",");
    });
    
    const csvString = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    link.setAttribute("download", `Cashly_Export_${monthName.replace(/ /g, '_')}.csv`);
    link.click();
  };

  // Full Backup JSON Export
  const exportFullBackupJSON = () => {
    vibrate('medium');
    const backupData = {
      wallets,
      transactions,
      budgets,
      goals,
      bills,
      weeklyBudgetConfig,
      preferences,
      metadata: {
        version: '3.0.0',
        exportedAt: new Date().toISOString(),
        totalRecords: transactions.length,
        netWorth: balance,
        baseCurrency: preferences?.baseCurrency || 'INR'
      }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Cashly_Backup_INR_${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return backupData;
  };

  // Full Backup JSON Import with Smart Merge
  const importFullBackupJSON = async (rawBackupData, mode = 'merge') => {
    try {
      const data = typeof rawBackupData === 'string' ? JSON.parse(rawBackupData) : rawBackupData;
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid backup file structure');
      }

      const incomingTransactions = Array.isArray(data.transactions) ? data.transactions : [];
      const incomingWallets = Array.isArray(data.wallets) ? data.wallets : [];
      const incomingBudgets = Array.isArray(data.budgets) ? data.budgets : [];
      const incomingGoals = Array.isArray(data.goals) ? data.goals : [];
      const incomingBills = Array.isArray(data.bills) ? data.bills : [];
      const incomingWeeklyConfig = data.weeklyBudgetConfig || null;
      const incomingPrefs = data.preferences || null;

      let mergedWallets = [];
      let mergedTransactions = [];
      let mergedBudgets = [];
      let mergedGoals = [];
      let mergedBills = [];
      let mergedWeeklyConfig = weeklyBudgetConfig;
      let importedTxCount = 0;
      let importedWalletCount = 0;

      if (mode === 'replace') {
        mergedWallets = (incomingWallets.length > 0 ? incomingWallets : DEFAULT_WALLETS).map(w => ({
          ...w,
          currency: w.currency || 'INR'
        }));
        mergedTransactions = incomingTransactions;
        mergedBudgets = incomingBudgets;
        mergedGoals = incomingGoals;
        mergedBills = incomingBills;
        mergedWeeklyConfig = incomingWeeklyConfig || { targetMonthlyBudget: null, customWeeklyTargets: {} };
        if (incomingPrefs) {
          setPreferences(incomingPrefs);
          safeSet('cashly_v3_prefs', incomingPrefs);
        }
        importedTxCount = mergedTransactions.length;
        importedWalletCount = mergedWallets.length;
      } else {
        // Smart Merge Mode
        // 1. Wallets merge: keeps existing wallets, adds new wallets from backup that don't exist by ID
        const existingWalletIds = new Set(wallets.map(w => String(w.id)));
        const newWalletsToAdd = incomingWallets
          .filter(w => !existingWalletIds.has(String(w.id)))
          .map(w => ({ ...w, currency: w.currency || 'INR' }));
        mergedWallets = [...wallets, ...newWalletsToAdd];
        importedWalletCount = newWalletsToAdd.length;

        // 2. Transactions merge: deduplicates by id or matching date+amount+whereSpent
        const existingTxIds = new Set(transactions.map(t => String(t.id)).filter(Boolean));
        const makeKey = (t) => `${t.date || ''}_${Number(t.amount || 0).toFixed(2)}_${(t.whereSpent || '').trim().toLowerCase()}`;
        const existingTxKeys = new Set(transactions.map(makeKey));

        const newTxToAdd = [];
        for (const t of incomingTransactions) {
          const key = makeKey(t);
          if ((t.id && existingTxIds.has(String(t.id))) || existingTxKeys.has(key)) {
            continue; // Deduplicate
          }
          newTxToAdd.push(t);
          if (t.id) existingTxIds.add(String(t.id));
          existingTxKeys.add(key);
        }
        mergedTransactions = [...newTxToAdd, ...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        importedTxCount = newTxToAdd.length;

        // 3. Budgets merge
        const existingBudgetCatIds = new Set(budgets.map(b => b.categoryId || b.id));
        const newBudgetsToAdd = incomingBudgets.filter(b => !existingBudgetCatIds.has(b.categoryId || b.id));
        mergedBudgets = [...budgets, ...newBudgetsToAdd];

        // 4. Goals merge
        const existingGoalIds = new Set(goals.map(g => g.id));
        const newGoalsToAdd = incomingGoals.filter(g => !existingGoalIds.has(g.id));
        mergedGoals = [...goals, ...newGoalsToAdd];

        // 5. Bills merge
        const existingBillIds = new Set(bills.map(b => b.id));
        const newBillsToAdd = incomingBills.filter(b => !existingBillIds.has(b.id));
        mergedBills = [...bills, ...newBillsToAdd];

        // 6. WeeklyBudgetConfig merge
        if (incomingWeeklyConfig) {
          mergedWeeklyConfig = {
            targetMonthlyBudget: incomingWeeklyConfig.targetMonthlyBudget ?? weeklyBudgetConfig.targetMonthlyBudget,
            customWeeklyTargets: {
              ...(weeklyBudgetConfig.customWeeklyTargets || {}),
              ...(incomingWeeklyConfig.customWeeklyTargets || {})
            }
          };
        }
      }

      // Update state
      setWallets(mergedWallets);
      setTransactions(mergedTransactions);
      setBudgets(mergedBudgets);
      setGoals(mergedGoals);
      setBills(mergedBills);
      setWeeklyBudgetConfigState(mergedWeeklyConfig);

      // Persist all to localStorage
      safeSet('cashly_v3_wallets', mergedWallets);
      safeSet('cashly_v3_transactions', mergedTransactions);
      safeSet('cashly_v3_budgets', mergedBudgets);
      safeSet('cashly_v3_goals', mergedGoals);
      safeSet('cashly_v3_bills', mergedBills);
      safeSet('cashly_v3_weekly_budget', mergedWeeklyConfig);

      // If user is logged in and db exists: immediately triggers cloud sync with Firestore
      if (user && db) {
        setIsSyncing(true);
        const userDocRef = doc(db, 'users', user.uid);
        const syncTimestamp = new Date().toISOString();
        await setDoc(userDocRef, {
          wallets: mergedWallets,
          transactions: mergedTransactions,
          budgets: mergedBudgets,
          goals: mergedGoals,
          bills: mergedBills,
          weeklyBudgetConfig: mergedWeeklyConfig,
          preferences: incomingPrefs && mode === 'replace' ? incomingPrefs : preferences,
          lastUpdated: syncTimestamp
        }, { merge: true });
        setLastSyncedTime(syncTimestamp);
        setIsSyncing(false);
      }

      vibrate('success');
      return {
        success: true,
        importedCounts: {
          transactions: importedTxCount,
          wallets: importedWalletCount
        }
      };
    } catch (err) {
      console.error("Backup import error:", err);
      vibrate('warning');
      setIsSyncing(false);
      return {
        success: false,
        error: err.message || 'Failed to import backup'
      };
    }
  };

  // Immediate Cloud Sync Manual Trigger
  const syncWithCloud = async () => {
    if (!user || !db) {
      return { success: false, error: 'User not logged in or database unavailable' };
    }

    setIsSyncing(true);
    vibrate('light');
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const now = new Date().toISOString();

      await setDoc(userDocRef, {
        wallets,
        transactions,
        budgets,
        goals,
        bills,
        weeklyBudgetConfig,
        preferences,
        lastUpdated: now
      }, { merge: true });

      setLastSyncedTime(now);
      vibrate('success');
      return { success: true, timestamp: now };
    } catch (err) {
      console.error("Manual cloud sync failed:", err);
      vibrate('warning');
      return { success: false, error: err.message };
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <FinancialContext.Provider value={{
      user,
      authLoading,
      loginWithGoogle,
      logout,
      wipeAllData,
      wallets,
      transactions,
      budgets,
      goals,
      bills,
      preferences,
      budgetWarning,
      setBudgetWarning,
      activeWalletId,
      setActiveWalletId,
      activeWallet,
      cycleWallet,
      currentMonth,
      setCurrentMonth,
      monthTransactions,
      totalIncome,
      totalExpense,
      balance,
      totalBalance: balance,
      weeklyBudgetConfig,
      updateWeeklyBudgetConfig,
      addTransaction,
      addBatchTransactions,
      deleteTransaction,
      addWallet,
      updateWallet,
      deleteWallet,
      addBudget,
      addGoal,
      fundGoal,
      addBill,
      updatePreference,
      exportCSV,
      exportFullBackupJSON,
      importFullBackupJSON,
      syncWithCloud,
      lastSyncedTime,
      isSyncing
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancials = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancials must be used within a FinancialProvider');
  }
  return context;
};
