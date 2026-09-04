import React, { useState } from 'react';
import { FinancialProvider, useFinancials, formatCurrency, vibrate } from './context/FinancialContext';
import { RecordsView } from './components/RecordsView';
import { WeeklyBudgetView } from './components/WeeklyBudgetView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { FloatingLiquidNavbar } from './components/FloatingLiquidNavbar';
import { DynamicIsland } from './components/DynamicIsland';
import { WalletCarousel } from './components/WalletCarousel';

import { AddTransactionModal } from './components/AddTransactionModal';
import { AddWalletModal } from './components/AddWalletModal';
import { EditWalletModal } from './components/EditWalletModal';
import { AddBudgetModal } from './components/AddBudgetModal';
import { AddGoalModal } from './components/AddGoalModal';
import { FundGoalModal } from './components/FundGoalModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AddBillModal } from './components/AddBillModal';
import { BudgetWarningModal } from './components/BudgetWarningModal';
import { ScreenshotImportModal } from './components/ScreenshotImportModal';
import { DataBackupModal } from './components/DataBackupModal';

import { 
  Bell, ChevronLeft, ChevronRight, TrendingUp, TrendingDown 
} from 'lucide-react';

function MainAppContent() {
  const { 
    activeWallet, 
    currentMonth, 
    setCurrentMonth, 
    totalIncome, 
    totalExpense, 
    bills,
    budgetWarning,
    setBudgetWarning
  } = useFinancials();

  const [currentTab, setCurrentTab] = useState('transactions'); // 'transactions' | 'analytics' | 'planning' | 'settings'

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isImportScreenshotOpen, setIsImportScreenshotOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [fundingGoal, setFundingGoal] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const isAnyModalOpen = isAddTxOpen || isImportScreenshotOpen || isAddWalletOpen || !!editingWallet || isAddBudgetOpen || isAddGoalOpen || !!fundingGoal || isNotifOpen || isAddBillOpen || !!budgetWarning || isBackupModalOpen;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center font-sans overflow-hidden p-0 sm:p-4 touch-none">
      {/* Perfectly Centered & Locked Device Frame Container */}
      <div className="relative w-full max-w-[420px] h-full sm:h-[840px] sm:max-h-[840px] sm:rounded-[44px] sm:border-[8px] border-gray-800 bg-black overflow-hidden flex flex-col shadow-2xl">
        
        {/* Pixel-Precise Dropping Liquid Island at top inside device frame */}
        <DynamicIsland onOpenQuickLog={() => setIsAddTxOpen(true)} />

        {/* Top Hero Header Banner */}
        <div className="bg-[#000000] pt-14 pb-3 rounded-b-[2.5rem] shadow-sm z-10 flex-shrink-0 transition-all duration-500 relative overflow-hidden backdrop-blur-xl border-b border-white/10">
          
          {/* Top Bar with Brand & Notification Bell */}
          <div className="flex justify-between items-center px-6 mb-1 relative z-10">
            <span className="font-extrabold text-sm tracking-wide text-white">
              {currentTab === 'settings' 
                ? 'Settings' 
                : currentTab === 'weekly' 
                  ? 'Weekly Budget' 
                  : currentTab === 'analytics' 
                    ? 'Analytics' 
                    : 'Cashly'}
            </span>

            {/* Notification Bell */}
            {currentTab !== 'settings' && (
              <button 
                onClick={() => { vibrate(); setIsNotifOpen(true); }} 
                className="p-2 hover:bg-white/15 rounded-full transition-colors relative active:scale-90 backdrop-blur-md"
              >
                <Bell className="w-5 h-5 text-white" />
                {bills.length > 0 && (
                  <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-transparent animate-pulse" />
                )}
              </button>
            )}
          </div>

          {/* Swipeable Apple Wallet Carousel (Net Worth + Individual Wallets) */}
          {currentTab !== 'settings' && (
            <WalletCarousel onAddWallet={() => setIsAddWalletOpen(true)} />
          )}

          {/* Income & Expenses Sub-Header Pill */}
          {currentTab === 'transactions' && (
            <div className="flex justify-between items-center bg-[#1C1C1E]/80 rounded-2xl p-3 mx-6 mt-2 backdrop-blur-md border border-white/10 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
                  <TrendingDown className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-white/70 text-[9px] font-semibold uppercase">Income</p>
                  <p className="font-bold text-xs text-emerald-400 tabular-nums">{formatCurrency(totalIncome, activeWallet.currency)}</p>
                </div>
              </div>

              <div className="w-px h-5 bg-white/20" />

              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <p className="text-white/70 text-[9px] font-semibold uppercase">Expenses</p>
                  <p className="font-bold text-xs text-white tabular-nums">{formatCurrency(totalExpense, activeWallet.currency)}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-inner">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Month Selector Bar */}
        {currentTab !== 'settings' && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-black border-b border-gray-800/60 flex-shrink-0 z-0 text-xs">
            <button 
              onClick={() => { vibrate(); setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)); }} 
              className="p-1 hover:bg-gray-800 rounded-full transition-colors active:scale-90"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <span className="font-bold text-gray-300">
              {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentMonth)}
            </span>
            <button 
              onClick={() => { vibrate(); setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)); }} 
              className="p-1 hover:bg-gray-800 rounded-full transition-colors active:scale-90"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        {/* Tab View Body with Overscroll Lock */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-32 no-scrollbar relative z-0 touch-pan-y">
          {currentTab === 'transactions' && (
            <RecordsView 
              onOpenAdd={() => setIsAddTxOpen(true)} 
            />
          )}
          {currentTab === 'weekly' && (
            <WeeklyBudgetView />
          )}
          {currentTab === 'analytics' && (
            <AnalyticsView />
          )}
          {currentTab === 'settings' && (
            <SettingsView 
              onAddWallet={() => { vibrate(); setIsAddWalletOpen(true); }}
              onEditWallet={(w) => { vibrate(); setEditingWallet(w); }}
              onOpenBackup={() => { vibrate(); setIsBackupModalOpen(true); }}
            />
          )}
        </div>

        {/* Floating Liquid Glass Island Navbar Anchor - Completely Hides & Disables Pointer Events when ANY modal is open */}
        {!isAnyModalOpen && (
          <div className="absolute bottom-5 inset-x-0 flex justify-center z-40 pointer-events-none transition-all duration-300 animate-fade-in">
            <FloatingLiquidNavbar 
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              onOpenAddTx={() => setIsAddTxOpen(true)}
              hasNotifications={bills.length > 0}
            />
          </div>
        )}

        {/* Top-Level Modal Sheets & Proactive Warning Popup */}
        <AddTransactionModal 
          isOpen={isAddTxOpen} 
          onClose={() => setIsAddTxOpen(false)} 
          onOpenImportScreenshot={() => { setIsAddTxOpen(false); setIsImportScreenshotOpen(true); }}
        />
        <ScreenshotImportModal 
          isOpen={isImportScreenshotOpen} 
          onClose={() => setIsImportScreenshotOpen(false)} 
        />
        <DataBackupModal 
          isOpen={isBackupModalOpen} 
          onClose={() => setIsBackupModalOpen(false)} 
        />
        <AddWalletModal isOpen={isAddWalletOpen} onClose={() => setIsAddWalletOpen(false)} />
        <EditWalletModal wallet={editingWallet} onClose={() => setEditingWallet(null)} />
        <AddBudgetModal isOpen={isAddBudgetOpen} onClose={() => setIsAddBudgetOpen(false)} />
        <AddGoalModal isOpen={isAddGoalOpen} onClose={() => setIsAddGoalOpen(false)} />
        <FundGoalModal goal={fundingGoal} onClose={() => setFundingGoal(null)} />
        <NotificationsModal 
          isOpen={isNotifOpen} 
          onClose={() => setIsNotifOpen(false)} 
          onAddBill={() => { setIsNotifOpen(false); setIsAddBillOpen(true); }} 
        />
        <AddBillModal isOpen={isAddBillOpen} onClose={() => setIsAddBillOpen(false)} />
        
        {/* Proactive Budget Warning Popup */}
        <BudgetWarningModal warning={budgetWarning} onClose={() => setBudgetWarning(null)} />

      </div>
    </div>
  );
}

export default function App() {
  return (
    <FinancialProvider>
      <MainAppContent />
    </FinancialProvider>
  );
}
