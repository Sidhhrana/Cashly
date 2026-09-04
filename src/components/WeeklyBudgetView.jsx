import React, { useState, useMemo } from 'react';
import { 
  useFinancials, 
  CATEGORIES, 
  EX_RATES, 
  formatCurrency, 
  vibrate 
} from '../context/FinancialContext';
import confetti from 'canvas-confetti';
import { 
  CalendarDays, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Sliders, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Coins, 
  Wallet,
  Coffee, 
  Car, 
  ShoppingBag, 
  Film, 
  FileText, 
  Home, 
  Heart, 
  Book, 
  Repeat, 
  Zap, 
  Landmark, 
  X, 
  Check
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
  freelance: DollarSign,
  business: Landmark,
  investment: Landmark,
  gifts: DollarSign,
  other_income: DollarSign
};

export const WeeklyBudgetView = () => {
  const {
    monthTransactions,
    currentMonth,
    activeWallet,
    wallets,
    activeWalletId,
    weeklyBudgetConfig,
    updateWeeklyBudgetConfig,
    totalExpense,
    totalIncome,
    balance,
    budgets
  } = useFinancials();

  // State for Target Budget Modal & Accordions
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState('');
  const [configMode, setConfigMode] = useState('weekly'); // 'weekly' (default) | 'monthly'
  const [expandedWeeks, setExpandedWeeks] = useState({}); // { [weekId]: boolean }

  // Sum of Category Budgets (fallback source)
  const budgetsSum = useMemo(() => {
    return (budgets || []).reduce((acc, b) => acc + (Number(b.limit) || 0), 0);
  }, [budgets]);

  // Target Weekly Budget (Primary first-class user setting)
  const targetWeeklyBudget = useMemo(() => {
    const configuredWeekly = weeklyBudgetConfig?.targetWeeklyBudget;
    if (configuredWeekly !== null && configuredWeekly !== undefined && Number(configuredWeekly) > 0) {
      return Number(configuredWeekly);
    }
    const configuredMonthly = weeklyBudgetConfig?.targetMonthlyBudget;
    if (configuredMonthly !== null && configuredMonthly !== undefined && Number(configuredMonthly) > 0) {
      return Math.round(Number(configuredMonthly) / 4);
    }
    if (budgetsSum > 0) return Math.round(budgetsSum / 4);
    if (totalIncome > 0) return Math.round(totalIncome / 4);
    return 2500; // default ₹2,500 / week
  }, [weeklyBudgetConfig, budgetsSum, totalIncome]);

  // Target Monthly Budget (calculated from weekly or explicit monthly)
  const targetMonthlyBudget = useMemo(() => {
    const configuredMonthly = weeklyBudgetConfig?.targetMonthlyBudget;
    if (configuredMonthly !== null && configuredMonthly !== undefined && Number(configuredMonthly) > 0) {
      return Number(configuredMonthly);
    }
    return targetWeeklyBudget * 4;
  }, [weeklyBudgetConfig, targetWeeklyBudget]);

  // Helper to get normalized expense amount for active wallet view
  const getExpenseAmount = (t) => {
    const baseRate = EX_RATES[activeWallet?.currency] || 1;
    if (t.type === 'expense') {
      if (activeWalletId === 'all') {
        const w = wallets.find(wal => wal.id === t.walletId);
        return ((Number(t.amount) || 0) * (EX_RATES[w?.currency] || 1)) / baseRate;
      }
      return Number(t.amount) || 0;
    }
    if (t.type === 'transfer' && activeWalletId !== 'all' && t.fromWalletId === activeWalletId) {
      return Number(t.amount) || 0;
    }
    return 0;
  };

  // Dynamic Week Breakdown & Calculations
  const {
    weeks,
    daysInMonth,
    currentDayNumber,
    isCurrentMonth,
    isPastMonth,
    isFutureMonth
  } = useMemo(() => {
    const today = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInM = new Date(year, month + 1, 0).getDate();

    const isCurr = today.getFullYear() === year && today.getMonth() === month;
    const isPast = today.getFullYear() > year || (today.getFullYear() === year && today.getMonth() > month);
    const isFut = today.getFullYear() < year || (today.getFullYear() === year && today.getMonth() < month);
    const currDay = isCurr ? today.getDate() : (isPast ? daysInM : 1);

    // Dynamic Calendar Weeks Breakdown
    // Week 1: 1st-7th, Week 2: 8th-14th, Week 3: 15th-21st, Week 4: 22nd-28th, Week 5: 29th-end of month
    const rawWeeks = [
      { id: 'w1', number: 1, startDay: 1, endDay: 7 },
      { id: 'w2', number: 2, startDay: 8, endDay: 14 },
      { id: 'w3', number: 3, startDay: 15, endDay: 21 },
      { id: 'w4', number: 4, startDay: 22, endDay: 28 },
    ];

    if (daysInM > 28) {
      rawWeeks.push({ id: 'w5', number: 5, startDay: 29, endDay: daysInM });
    }

    const monthShort = currentMonth.toLocaleString('default', { month: 'short' });

    const calculatedWeeks = rawWeeks.map(rw => {
      const dayCount = rw.endDay - rw.startDay + 1;
      
      // Weekly target baseline (proportional to day count so daily pace $/day is balanced)
      const customTarget = weeklyBudgetConfig?.customWeeklyTargets?.[rw.id];
      const target = customTarget && Number(customTarget) > 0 
        ? Number(customTarget)
        : (targetMonthlyBudget / daysInM) * dayCount;

      // Filter month transactions for this week
      const weekTransactions = monthTransactions.filter(t => {
        const d = new Date(t.date).getDate();
        return d >= rw.startDay && d <= rw.endDay && (t.type === 'expense' || (t.type === 'transfer' && activeWalletId !== 'all' && t.fromWalletId === activeWalletId));
      });

      const spent = weekTransactions.reduce((sum, t) => sum + getExpenseAmount(t), 0);

      // Classify week
      let classification = 'upcoming'; // 'completed' | 'current' | 'upcoming'
      if (isPast) {
        classification = 'completed';
      } else if (isFut) {
        classification = 'upcoming';
      } else {
        if (currDay > rw.endDay) {
          classification = 'completed';
        } else if (currDay >= rw.startDay && currDay <= rw.endDay) {
          classification = 'current';
        } else {
          classification = 'upcoming';
        }
      }

      const percentage = target > 0 ? (spent / target) * 100 : 0;
      const remainingInWeek = Math.max(0, target - spent);
      const overInWeek = spent > target ? spent - target : 0;

      return {
        ...rw,
        dayCount,
        label: `Week ${rw.number}`,
        dateRangeLabel: `${monthShort} ${rw.startDay} – ${monthShort} ${rw.endDay}`,
        target,
        spent,
        transactions: weekTransactions,
        classification,
        percentage,
        remainingInWeek,
        overInWeek,
        isOver: spent > target
      };
    });

    return {
      weeks: calculatedWeeks,
      daysInMonth: daysInM,
      currentDayNumber: currDay,
      isCurrentMonth: isCurr,
      isPastMonth: isPast,
      isFutureMonth: isFut
    };
  }, [currentMonth, monthTransactions, weeklyBudgetConfig, targetMonthlyBudget, activeWallet, wallets, activeWalletId]);

  // Remaining Weeks (Current + Upcoming)
  const remainingWeeksCount = useMemo(() => {
    if (isPastMonth) return 0;
    if (isFutureMonth) return weeks.length;
    return weeks.filter(w => w.classification === 'current' || w.classification === 'upcoming').length;
  }, [weeks, isPastMonth, isFutureMonth]);

  // Remaining Days in the Month
  const remainingDaysCount = useMemo(() => {
    if (isPastMonth) return 0;
    if (isFutureMonth) return daysInMonth;
    const today = new Date();
    return Math.max(1, daysInMonth - today.getDate() + 1);
  }, [daysInMonth, isPastMonth, isFutureMonth]);

  // Money Left for Month
  const moneyLeft = useMemo(() => {
    return Math.max(0, targetMonthlyBudget - totalExpense);
  }, [targetMonthlyBudget, totalExpense]);

  // Safe Weekly Allowance = Money Left / remaining weeks
  const safeWeeklyAllowance = useMemo(() => {
    return remainingWeeksCount > 0 ? (moneyLeft / remainingWeeksCount) : 0;
  }, [moneyLeft, remainingWeeksCount]);

  // Safe Daily Burn Rate = Money Left / remaining days
  const safeDailyBurnRate = useMemo(() => {
    return remainingDaysCount > 0 ? (moneyLeft / remainingDaysCount) : 0;
  }, [moneyLeft, remainingDaysCount]);

  // Intelligent Status Engine
  const statusInfo = useMemo(() => {
    const isDeficit = totalExpense > targetMonthlyBudget;

    if (isDeficit) {
      const deficitAmount = totalExpense - targetMonthlyBudget;
      return {
        type: 'deficit',
        colorTheme: 'rose',
        badge: "Over Budget!",
        containerClass: 'bg-rose-950/30 border-rose-500/40 shadow-rose-500/10 text-rose-300',
        badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        icon: AlertTriangle,
        headline: isPastMonth ? "Ended Over Budget" : "Budget Exceeded!",
        message: isPastMonth
          ? `Finished month ${formatCurrency(deficitAmount, activeWallet.currency)} over budget target.`
          : `Budget exceeded by ${formatCurrency(deficitAmount, activeWallet.currency)}. Pacing adjustment required.`
      };
    }

    if (isPastMonth) {
      return {
        type: 'surplus',
        colorTheme: 'emerald',
        badge: "Under Budget",
        containerClass: 'bg-emerald-950/30 border-emerald-500/40 shadow-emerald-500/10 text-emerald-300',
        badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: ShieldCheck,
        headline: "Month Completed",
        message: `You completed this month with ${formatCurrency(moneyLeft, activeWallet.currency)} unspent surplus.`
      };
    }

    if (isFutureMonth) {
      return {
        type: 'surplus',
        colorTheme: 'emerald',
        badge: "Planned",
        containerClass: 'bg-emerald-950/30 border-emerald-500/40 shadow-emerald-500/10 text-emerald-300',
        badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: ShieldCheck,
        headline: "Upcoming Month",
        message: `Planned target budget of ${formatCurrency(targetMonthlyBudget, activeWallet.currency)} ready for this month.`
      };
    }

    // Trajectory Pace Check for Current Month
    const expectedPaceTrajectory = (targetMonthlyBudget / daysInMonth) * currentDayNumber;
    const isPaceWarning = totalExpense > expectedPaceTrajectory || (totalExpense >= 0.85 * targetMonthlyBudget && remainingDaysCount > 5);

    if (isPaceWarning) {
      return {
        type: 'warning',
        colorTheme: 'amber',
        badge: "Need to Budget!",
        containerClass: 'bg-amber-950/30 border-amber-500/40 shadow-amber-500/10 text-amber-300',
        badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: AlertCircle,
        headline: "Pacing Warning",
        message: `Pace Alert! Keep daily spending under ${formatCurrency(safeDailyBurnRate, activeWallet.currency)}/day to stay on budget.`
      };
    }

    // Surplus Pace
    const surplus = Math.max(0, expectedPaceTrajectory - totalExpense);
    return {
      type: 'surplus',
      colorTheme: 'emerald',
      badge: "You're Good!",
      containerClass: 'bg-emerald-950/30 border-emerald-500/40 shadow-emerald-500/10 text-emerald-300',
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: ShieldCheck,
      headline: "Smooth Sailing",
      message: `Healthy spending pace! You have a surplus of ${formatCurrency(surplus, activeWallet.currency)} based on your monthly trajectory.`
    };
  }, [totalExpense, targetMonthlyBudget, daysInMonth, currentDayNumber, isCurrentMonth, isPastMonth, isFutureMonth, moneyLeft, remainingDaysCount, safeDailyBurnRate, activeWallet.currency]);

  // Open Config Modal with current target
  const handleOpenConfig = () => {
    vibrate('light');
    setConfigMode('weekly');
    setCustomTargetInput(targetWeeklyBudget.toString());
    setIsConfigOpen(true);
  };

  // Save Configured Budget
  const handleSaveBudget = (weeklyVal, monthlyVal) => {
    vibrate('medium');
    updateWeeklyBudgetConfig({
      targetWeeklyBudget: weeklyVal,
      targetMonthlyBudget: monthlyVal
    });
    setIsConfigOpen(false);
  };

  // Toggle week accordion
  const toggleWeekExpand = (wId) => {
    vibrate('light');
    setExpandedWeeks(prev => ({
      ...prev,
      [wId]: !prev[wId]
    }));
  };

  return (
    <div className="px-4 py-4 space-y-5 animate-fade-in relative pb-10">
      
      {/* Target Setting Header Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-card border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block">
              Weekly Budget Target
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-white tabular-nums">
                {formatCurrency(targetWeeklyBudget, activeWallet.currency)}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                / week (~{formatCurrency(targetMonthlyBudget, activeWallet.currency)}/mo)
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenConfig}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-semibold text-white border border-white/10 transition-all shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Edit Target</span>
        </button>
      </div>

      {/* Intelligent Status Engine Banner */}
      <div className={`p-4 rounded-3xl border shadow-lg backdrop-blur-xl transition-all duration-300 relative overflow-hidden ${statusInfo.containerClass}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${statusInfo.badgeBg}`}>
              <statusInfo.icon className="w-5 h-5" />
            </div>
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${statusInfo.badgeBg}`}>
                {statusInfo.badge}
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {statusInfo.headline}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-gray-400 block">Spent so far</span>
            <span className="text-xs font-bold text-white tabular-nums">
              {formatCurrency(totalExpense, activeWallet.currency)}
            </span>
          </div>
        </div>

        {/* Dynamic Contextual Message */}
        <p className="mt-3 text-xs leading-relaxed font-medium">
          {statusInfo.message}
        </p>

        {/* Spending Pacing Progress Bar */}
        <div className="mt-3 pt-2 border-t border-white/10">
          <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1 font-medium">
            <span>Budget Utilized: {Math.min(100, Math.round((totalExpense / (targetMonthlyBudget || 1)) * 100))}%</span>
            <span>Target: {formatCurrency(targetMonthlyBudget, activeWallet.currency)}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                totalExpense > targetMonthlyBudget 
                  ? 'bg-rose-500' 
                  : totalExpense >= 0.8 * targetMonthlyBudget 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (totalExpense / (targetMonthlyBudget || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hero Stat Cards: Money Left, Safe Weekly Allowance, Remaining Weeks */}
      <div className="grid grid-cols-3 gap-2.5">
        
        {/* Card 1: Money Left for Month */}
        <div className="p-3 rounded-2xl liquid-card border border-white/10 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Money Left</span>
            <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-3 h-3" />
            </div>
          </div>
          <div>
            <p className="text-sm sm:text-base font-extrabold text-white tabular-nums truncate">
              {formatCurrency(moneyLeft, activeWallet.currency)}
            </p>
            <p className="text-[9px] text-emerald-400 font-semibold mt-0.5">
              {((moneyLeft / (targetMonthlyBudget || 1)) * 100).toFixed(0)}% remaining
            </p>
          </div>
        </div>

        {/* Card 2: Safe Weekly Allowance */}
        <div className="p-3 rounded-2xl liquid-card border border-white/10 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
              {isPastMonth ? 'Avg / Week' : 'Safe / Week'}
            </span>
            <div className="w-5 h-5 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <CalendarDays className="w-3 h-3" />
            </div>
          </div>
          <div>
            <p className="text-sm sm:text-base font-extrabold text-teal-300 tabular-nums truncate">
              {isPastMonth 
                ? formatCurrency(totalExpense / (weeks.length || 4), activeWallet.currency)
                : formatCurrency(safeWeeklyAllowance, activeWallet.currency)
              }
            </p>
            <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
              {isPastMonth ? 'Avg spent / wk' : isFutureMonth ? 'Per week' : 'Per left week'}
            </p>
          </div>
        </div>

        {/* Card 3: Remaining Weeks & Burn Rate */}
        <div className="p-3 rounded-2xl liquid-card border border-white/10 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Weeks Left</span>
            <div className="w-5 h-5 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div>
            <p className="text-sm sm:text-base font-extrabold text-blue-300 tabular-nums truncate">
              {isPastMonth ? 'Completed' : `${remainingWeeksCount} ${remainingWeeksCount === 1 ? 'Week' : 'Weeks'}`}
            </p>
            <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
              {isPastMonth ? 'Month ended' : `${remainingDaysCount} days left`}
            </p>
          </div>
        </div>

      </div>

      {/* Week-by-Week Section Header */}
      <div className="flex items-center justify-between pt-1">
        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-emerald-400" />
          <span>Week-by-Week Breakdown</span>
        </h4>
        <span className="text-[10px] text-gray-500 font-medium">
          {weeks.length} calendar periods
        </span>
      </div>

      {/* Visual Week-by-Week Cards */}
      <div className="space-y-3">
        {weeks.map((week) => {
          const isCurrent = week.classification === 'current';
          const isCompleted = week.classification === 'completed';
          const isUpcoming = week.classification === 'upcoming';
          const isExpanded = !!expandedWeeks[week.id];

          // Fill meter bar color
          const meterColor = week.spent > week.target 
            ? 'bg-rose-500' 
            : week.percentage >= 80 
              ? 'bg-amber-400' 
              : 'bg-emerald-500';

          return (
            <div 
              key={week.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isCurrent
                  ? 'bg-[#1C1C1E] border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'liquid-card border-white/10'
              }`}
            >
              <div className="p-4">
                
                {/* Week Card Header: Title, Dates, and Status Pill */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">
                      {week.label}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      ({week.dateRangeLabel})
                    </span>
                  </div>

                  {/* Status Pill */}
                  {isCurrent && (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold tracking-wide">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                      </span>
                      <span>Active Week</span>
                    </div>
                  )}

                  {isCompleted && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      week.spent <= week.target
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                    }`}>
                      {week.spent <= week.target ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Over Target</span>
                        </>
                      )}
                    </div>
                  )}

                  {isUpcoming && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      <span>Upcoming</span>
                    </div>
                  )}
                </div>

                {/* Spending vs Target Metrics */}
                <div className="flex items-baseline justify-between mt-3">
                  <div>
                    <span className="text-lg font-black text-white tabular-nums">
                      {formatCurrency(week.spent, activeWallet.currency)}
                    </span>
                    <span className="text-xs text-gray-400 ml-1 font-medium">
                      of {formatCurrency(week.target, activeWallet.currency)}
                    </span>
                  </div>

                  <div>
                    {week.spent > week.target ? (
                      <span className="text-xs font-bold text-rose-400 tabular-nums">
                        +{formatCurrency(week.overInWeek, activeWallet.currency)} over
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(week.remainingInWeek, activeWallet.currency)} left
                      </span>
                    )}
                  </div>
                </div>

                {/* Animated Progress Fill Meter */}
                <div className="mt-2 w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${meterColor}`}
                    style={{ width: `${Math.min(100, week.percentage)}%` }}
                  />
                </div>

                {/* Card Footer: Transaction count & Expand Toggle */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                  <span className="text-[11px] text-gray-400 font-medium">
                    {week.transactions.length} {week.transactions.length === 1 ? 'transaction' : 'transactions'}
                  </span>

                  {week.transactions.length > 0 && (
                    <button
                      onClick={() => toggleWeekExpand(week.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Logs' : 'View Logs'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

              </div>

              {/* Expandable Transaction Drawer */}
              {isExpanded && week.transactions.length > 0 && (
                <div className="px-4 pb-3 pt-1 border-t border-white/10 bg-black/30 space-y-2 animate-fade-in">
                  {week.transactions.map((tx) => {
                    const categoryInfo = CATEGORIES[tx.categoryId] || { name: 'Expense', bg: 'bg-emerald-500' };
                    const IconComponent = ICON_MAP[tx.categoryId] || DollarSign;
                    const txAmt = getExpenseAmount(tx);

                    return (
                      <div 
                        key={tx.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg ${categoryInfo.bg} flex items-center justify-center text-white flex-shrink-0 shadow-inner`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 truncate">
                              <p className="text-xs font-semibold text-white truncate">
                                {tx.whereSpent?.trim() || tx.note || categoryInfo.name}
                              </p>
                              {tx.whereSpent?.trim() && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 flex-shrink-0">
                                  {categoryInfo.name}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 truncate">
                              {tx.whereSpent?.trim() && tx.note?.trim() && tx.note.trim() !== tx.whereSpent.trim() ? `${tx.note.trim()} • ` : ''}
                              {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-rose-400 tabular-nums ml-2 flex-shrink-0">
                          -{formatCurrency(txAmt, activeWallet.currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Interactive Target Budget Config Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1C1C1E] border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 animate-spring-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Set Budget Target</h3>
                  <p className="text-[11px] text-gray-400">Paces your spending smoothly across weeks</p>
                </div>
              </div>
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Switch Mode: Monthly vs Weekly */}
            <div className="p-1 rounded-xl bg-white/5 border border-white/10 flex items-center">
              <button
                onClick={() => {
                  vibrate('light');
                  setConfigMode('monthly');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  configMode === 'monthly'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly Target
              </button>
              <button
                onClick={() => {
                  vibrate('light');
                  setConfigMode('weekly');
                  // Pre-fill with weekly equivalent
                  const cur = parseFloat(customTargetInput) || targetMonthlyBudget;
                  setCustomTargetInput((cur / (weeks.length || 4)).toFixed(0));
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  configMode === 'weekly'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Weekly Target
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block">
                {configMode === 'monthly' ? 'Target Monthly Budget' : 'Target Weekly Budget'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                  {activeWallet.currency}
                </span>
                <input
                  type="number"
                  step="any"
                  value={customTargetInput}
                  onChange={(e) => setCustomTargetInput(e.target.value)}
                  placeholder="e.g. 1000"
                  autoFocus
                  className="w-full bg-black/50 border border-white/15 rounded-2xl pl-16 pr-4 py-3 text-lg font-black text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 tabular-nums"
                />
              </div>

              {/* Conversion Feedback */}
              <p className="text-[11px] text-gray-400 pt-0.5">
                {configMode === 'monthly' 
                  ? `Equals ~${formatCurrency((parseFloat(customTargetInput) || 0) / (weeks.length || 4), activeWallet.currency)} per week`
                  : `Equals ~${formatCurrency((parseFloat(customTargetInput) || 0) * (weeks.length || 4), activeWallet.currency)} for the month`
                }
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {configMode === 'weekly' ? 'Weekly Presets' : 'Monthly Presets'}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(configMode === 'weekly' 
                  ? [1000, 2000, 2500, 3500, 5000, 10000]
                  : [5000, 10000, 15000, 20000, 30000, 50000]
                ).map((presetAmt) => (
                  <button
                    key={presetAmt}
                    onClick={() => {
                      vibrate('light');
                      setCustomTargetInput(presetAmt.toString());
                    }}
                    className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all tabular-nums"
                  >
                    {formatCurrency(presetAmt, activeWallet.currency)}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Presets (Income / Category Budgets) */}
            {(totalIncome > 0 || budgetsSum > 0) && (
              <div className="flex gap-2 pt-1">
                {totalIncome > 0 && (
                  <button
                    onClick={() => {
                      vibrate('light');
                      if (configMode === 'weekly') {
                        setCustomTargetInput((totalIncome / (weeks.length || 4)).toFixed(0));
                      } else {
                        setCustomTargetInput(totalIncome.toFixed(0));
                      }
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 transition-all truncate"
                  >
                    Use Income ({formatCurrency(totalIncome, activeWallet.currency)})
                  </button>
                )}
                {budgetsSum > 0 && (
                  <button
                    onClick={() => {
                      vibrate('light');
                      if (configMode === 'weekly') {
                        setCustomTargetInput((budgetsSum / (weeks.length || 4)).toFixed(0));
                      } else {
                        setCustomTargetInput(budgetsSum.toFixed(0));
                      }
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-400 transition-all truncate"
                  >
                    Sum Budgets ({formatCurrency(budgetsSum, activeWallet.currency)})
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const inputVal = parseFloat(customTargetInput);
                  if (isNaN(inputVal) || inputVal <= 0) return;
                  const weeklyVal = configMode === 'weekly' 
                    ? Math.round(inputVal) 
                    : Math.round(inputVal / (weeks.length || 4));
                  const monthlyVal = configMode === 'weekly' 
                    ? Math.round(inputVal * (weeks.length || 4)) 
                    : Math.round(inputVal);
                  handleSaveBudget(weeklyVal, monthlyVal);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Target</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
