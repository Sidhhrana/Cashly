import React, { useState, useRef } from 'react';
import { useFinancials, WALLET_COLORS, vibrate } from '../context/FinancialContext';
import { 
  User, Wallet, Plus, Trash2, Globe, Home, Bell, Download, 
  HelpCircle, Info, ChevronRight, LogOut, Cloud, AlertTriangle, ShieldAlert, Edit3,
  Upload, RefreshCw, Database, FileSpreadsheet 
} from 'lucide-react';

export const SettingsView = ({ onAddWallet, onEditWallet, onOpenBackup }) => {
  const { 
    user,
    loginWithGoogle,
    logout,
    wipeAllData,
    wallets, 
    preferences, 
    updatePreference, 
    deleteWallet, 
    exportCSV,
    exportFullBackupJSON,
    syncWithCloud,
    lastSyncedTime,
    isSyncing 
  } = useFinancials();

  const [activeModal, setActiveModal] = useState(null);
  const [walletToDelete, setWalletToDelete] = useState(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  const formatRelativeSyncTime = (isoString) => {
    if (!isoString) return 'Just now';
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const SectionTitle = ({ children, danger }) => (
    <h3 className={`text-[11px] font-bold uppercase tracking-widest px-4 mb-2 mt-7 first:mt-0 ${
      danger ? 'text-rose-400 font-extrabold' : 'text-gray-400'
    }`}>
      {children}
    </h3>
  );

  const Row = ({ icon: Icon, color, label, value, onClick, danger }) => (
    <div 
      onClick={() => { vibrate('medium'); onClick(); }} 
      className={`flex items-center justify-between p-4 cursor-pointer group transition-colors ${
        danger ? 'hover:bg-rose-500/10' : 'hover:bg-gray-800/40'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${color} shadow-sm group-hover:scale-105 transition-transform`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className={`font-bold text-[15px] ${danger ? 'text-rose-400' : 'text-white'}`}>{label}</p>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[13px] font-bold text-gray-400">{value}</span>}
        <ChevronRight className={`w-5 h-5 ${danger ? 'text-rose-500' : 'text-gray-500'}`} />
      </div>
    </div>
  );

  return (
    <div className="px-4 py-6 animate-fade-in pb-32">
      
      {/* Google User Profile or Login Card */}
      {user ? (
        <div className="bg-[#1C1C1E] rounded-3xl p-5 shadow-sm border border-emerald-500/30 mb-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {user.displayName ? user.displayName.charAt(0) : 'U'}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-white truncate">
                    {user.displayName || 'Google Account'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    {isSyncing ? 'Syncing...' : 'Synced'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium truncate">{user.email}</p>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                  Last synced: <span className="text-gray-300 font-semibold">{formatRelativeSyncTime(lastSyncedTime)}</span>
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-90 flex-shrink-0"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Prominent "Sync with Account" / "Sync Now" Button */}
          <button
            onClick={() => { vibrate('medium'); syncWithCloud(); }}
            disabled={isSyncing}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 shadow-inner"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing with Google Cloud...' : 'Sync with Account (Sync Now)'}</span>
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#1c133a] via-[#140b2f] to-black rounded-3xl p-5 text-white border border-purple-500/30 shadow-xl space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center shadow-inner">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">Cloud Account Sync</h3>
              <p className="text-xs text-purple-200/70">Sign in to enable automatic cloud backup</p>
            </div>
          </div>

          {/* Official Google Sign-In Button */}
          <button
            onClick={loginWithGoogle}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs shadow-lg flex items-center justify-center gap-3 transition-all active:scale-98"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      )}

      {/* My Accounts */}
      <SectionTitle>My Accounts</SectionTitle>
      <div className="bg-[#1C1C1E] rounded-3xl shadow-sm border border-gray-800/60 overflow-hidden divide-y divide-gray-800/40">
        {wallets.map((w) => {
          const theme = WALLET_COLORS[w.color || 'emerald'] || WALLET_COLORS.emerald;
          return (
            <div 
              key={w.id} 
              onClick={() => { vibrate('medium'); onEditWallet(w); }}
              className="flex items-center justify-between p-4 hover:bg-gray-800/40 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl ${theme.glow} ${theme.text} flex items-center justify-center border ${theme.border} group-hover:scale-105 transition-transform`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-[15px]">{w.name}</p>
                    <span className={`w-2 h-2 rounded-full ${theme.bg}`} />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{w.currency} Account • Tap to Edit Color</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); vibrate('light'); onEditWallet(w); }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-90"
                  title="Edit Wallet Color & Details"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {wallets.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); vibrate('medium'); setWalletToDelete(w.id); }} 
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors active:scale-90"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div 
          onClick={onAddWallet} 
          className="flex items-center gap-4 p-4 hover:bg-gray-800/40 cursor-pointer text-emerald-400 transition-colors group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-900/30 border border-emerald-800/50 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <p className="font-bold text-[15px]">Add New Account</p>
        </div>
      </div>

      {/* Preferences */}
      <SectionTitle>Preferences</SectionTitle>
      <div className="bg-[#1C1C1E] rounded-3xl shadow-sm border border-gray-800/60 overflow-hidden divide-y divide-gray-800/40">
        <Row icon={Globe} color="bg-orange-500" label="Currency" value={preferences.baseCurrency} onClick={() => setActiveModal('Currency')} />
        
        <div 
          className="flex items-center justify-between p-4 hover:bg-gray-800/40 transition-colors cursor-pointer" 
          onClick={() => { vibrate('light'); updatePreference('isDarkMode', !preferences.isDarkMode); }}
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white bg-indigo-500 shadow-sm">
              <Home className="w-4 h-4" />
            </div>
            <p className="font-bold text-white text-[15px]">Dark Theme</p>
          </div>
          <button className={`w-[52px] h-7 rounded-full transition-colors relative pointer-events-none ${preferences.isDarkMode ? 'bg-emerald-500' : 'bg-gray-700'}`}>
            <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${preferences.isDarkMode ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        <Row icon={Bell} color="bg-rose-500" label="Notifications & Reminders" onClick={() => setActiveModal('Notifications')} />
      </div>

      {/* Tools & Export */}
      <SectionTitle>Data & Options</SectionTitle>
      <div className="bg-[#1C1C1E] rounded-3xl shadow-sm border border-gray-800/60 overflow-hidden divide-y divide-gray-800/40">
        <Row 
          icon={Download} 
          color="bg-emerald-500" 
          label="Export Full Backup (JSON)" 
          onClick={exportFullBackupJSON} 
        />
        <Row 
          icon={Database} 
          color="bg-indigo-500" 
          label="Backup & Restore Ledger" 
          onClick={onOpenBackup} 
        />
        <Row 
          icon={FileSpreadsheet} 
          color="bg-teal-500" 
          label="Export Ledger CSV" 
          onClick={exportCSV} 
        />
        <Row icon={HelpCircle} color="bg-blue-500" label="Help & Support" onClick={() => setActiveModal('Help')} />
        <Row icon={Info} color="bg-gray-700" label="About Cashly" onClick={() => setActiveModal('About')} />
      </div>

      {/* Danger Zone */}
      <SectionTitle danger>Danger Zone</SectionTitle>
      <div className="bg-[#1C1C1E] rounded-3xl shadow-sm border border-rose-500/30 overflow-hidden">
        <Row 
          icon={AlertTriangle} 
          color="bg-rose-600" 
          label="Wipe All Data & Reset" 
          danger 
          onClick={() => setShowWipeConfirm(true)} 
        />
      </div>

      {/* Delete Wallet Dialog */}
      {walletToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setWalletToDelete(null)}>
          <div className="bg-[#1C1C1E] rounded-3xl w-full max-w-xs border border-gray-800 text-center p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-white">Delete Account?</h3>
            <p className="text-xs text-gray-400">This action will remove the selected wallet account.</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setWalletToDelete(null)} className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-gray-800 text-gray-300">Cancel</button>
              <button 
                onClick={() => { vibrate('medium'); deleteWallet(walletToDelete); setWalletToDelete(null); }} 
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe All Data Confirmation Dialog */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in" onClick={() => setShowWipeConfirm(false)}>
          <div className="bg-[#1C1C1E] rounded-[2rem] w-full max-w-xs border border-rose-500/50 text-center p-6 space-y-4 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-lg text-white">Wipe All Data?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              This will permanently delete all transactions, wallets, budgets, and savings goals from this device and your cloud account.
            </p>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setShowWipeConfirm(false)} 
                className="flex-1 py-3 rounded-2xl font-bold text-xs bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={() => { 
                  vibrate('warning'); 
                  setShowWipeConfirm(false); 
                  wipeAllData(); 
                }} 
                className="flex-1 py-3 rounded-2xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                Wipe Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Modal Sheets */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setActiveModal(null)}>
          <div className="bg-[#1C1C1E] rounded-3xl w-full max-w-sm border border-gray-800 p-6 space-y-4 text-white" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-base">{activeModal}</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {activeModal === 'Currency' && (
              <div className="space-y-2">
                {['INR', 'USD', 'EUR', 'GBP', 'JPY'].map(c => (
                  <button 
                    key={c} 
                    onClick={() => { vibrate('light'); updatePreference('baseCurrency', c); setActiveModal(null); }} 
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                      preferences.baseCurrency === c ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold' : 'border-gray-800 text-gray-300'
                    }`}
                  >
                    <span>{c}</span>
                    {preferences.baseCurrency === c && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>}
                  </button>
                ))}
              </div>
            )}

            {activeModal === 'Notifications' && (
              <div className="space-y-3 text-center py-2">
                <Bell className="w-10 h-10 text-rose-400 mx-auto opacity-70" />
                <p className="font-bold text-sm">Bill Reminders Active</p>
                <p className="text-xs text-gray-400">Upcoming bill notifications are enabled automatically based on your recurring bills.</p>
              </div>
            )}

            {activeModal === 'Help' && (
              <div className="text-center py-4 space-y-2">
                <HelpCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                <p className="font-bold text-sm">Need Assistance?</p>
                <p className="text-xs text-gray-400">Reach out at <a href="mailto:support@cashly.app" className="text-emerald-400 underline">support@cashly.app</a></p>
              </div>
            )}

            {activeModal === 'About' && (
              <div className="text-center py-4 space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 font-black text-xl shadow-inner">
                  C
                </div>
                <p className="font-extrabold text-base">Cashly 2.0</p>
                <p className="text-xs text-gray-400">Version 4.0.0 (Clean Minimal Edition)<br/><span className="text-emerald-400 font-bold mt-1 block">Your wealth, simplified.</span></p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
