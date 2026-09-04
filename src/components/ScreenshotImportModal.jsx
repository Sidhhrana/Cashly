import React, { useState, useEffect, useRef } from 'react';
import { useFinancials, CATEGORIES, vibrate } from '../context/FinancialContext';
import { 
  recognizeTransactionScreenshot, 
  parseDirectTextOrSms 
} from '../utils/transactionOcrParser';
import confetti from 'canvas-confetti';
import { 
  X, UploadCloud, Image as ImageIcon, FileText, Sparkles, 
  Check, CheckSquare, Square, AlertCircle, Scan, RefreshCw, 
  ChevronDown, Store, Wallet, Calendar, ArrowDownLeft, ArrowUpRight,
  Coffee, Car, ShoppingBag, Film, Home, Heart, Book, Repeat, Zap,
  DollarSign, Briefcase, Building2, TrendingUp, Coins, Gift, Tag
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

export const ScreenshotImportModal = ({ isOpen, onClose }) => {
  const { wallets, activeWalletId, addBatchTransactions } = useFinancials();

  // Mode: 'screenshot' | 'text'
  const [activeTab, setActiveTab] = useState('screenshot');

  // File & Preview state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [pastedText, setPastedText] = useState('');

  // Processing & Progress state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('Analyzing image...');
  const [errorMessage, setErrorMessage] = useState(null);

  // Review Sheet State: Array of parsed transactions
  const [parsedTransactions, setParsedTransactions] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Default wallet to assign
  const defaultWalletId = activeWalletId === 'all' ? (wallets[0]?.id || '') : activeWalletId;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedImage(null);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setPastedText('');
      setIsProcessing(false);
      setProgressPercent(0);
      setErrorMessage(null);
      setParsedTransactions([]);
      setIsDragging(false);
    }
  }, [isOpen]);

  // Global Clipboard Paste Listener (Cmd+V / Ctrl+V anywhere while modal is open)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      // If user is typing inside an input or textarea, let default paste behavior happen
      const targetTag = e.target?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleImageSelected(file);
          }
          return;
        } else if (item.type === 'text/plain') {
          // If plain text pasted and not inside text input, populate SMS text tab
          item.getAsString((text) => {
            if (text && text.trim().length > 10) {
              setActiveTab('text');
              setPastedText(text);
              handleParseText(text);
            }
          });
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Image File Selection & OCR Processing
  const handleImageSelected = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    vibrate('light');
    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setErrorMessage(null);
    setParsedTransactions([]);
    setIsProcessing(true);
    setProgressPercent(10);
    setScanStatusText('Enhancing image contrast...');

    try {
      const { transactions, rawText } = await recognizeTransactionScreenshot(file, (pct) => {
        setProgressPercent(pct);
        if (pct < 30) setScanStatusText('Pre-processing canvas & contrast...');
        else if (pct < 70) setScanStatusText(`Scanning receipt text (${pct}%)...`);
        else if (pct < 95) setScanStatusText(`Detecting merchants & amounts (${pct}%)...`);
        else setScanStatusText('Finalizing transactions...');
      });

      if (!transactions || transactions.length === 0) {
        setErrorMessage(
          'No clear transactions detected. The image might be blurry or does not contain recognizable amounts. You can try pasting the bank SMS or text directly.'
        );
        setIsProcessing(false);
        return;
      }

      // Initialize with selected: true and target wallet
      const prepared = transactions.map((t, idx) => ({
        ...t,
        tempId: t.id || `temp-${idx}-${Date.now()}`,
        selected: true,
        walletId: defaultWalletId,
        date: t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0]
      }));

      vibrate('medium');
      setParsedTransactions(prepared);
      setIsProcessing(false);
    } catch (err) {
      console.error('OCR Recognition Error:', err);
      setErrorMessage('Failed to read image. Please ensure the screenshot is clear or paste text directly.');
      setIsProcessing(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleImageSelected(files[0]);
    }
  };

  // Direct Text / Bank SMS Parsing
  const handleParseText = (textToParse = pastedText) => {
    vibrate('light');
    setErrorMessage(null);
    if (!textToParse || !textToParse.trim()) {
      setErrorMessage('Please paste some transaction text or SMS message first.');
      return;
    }

    const results = parseDirectTextOrSms(textToParse);
    if (!results || results.length === 0) {
      setErrorMessage('Could not extract transactions from the pasted text. Make sure it contains amounts like "$45.20" or "Rs 350".');
      return;
    }

    const prepared = results.map((t, idx) => ({
      ...t,
      tempId: t.id || `temp-${idx}-${Date.now()}`,
      selected: true,
      walletId: defaultWalletId,
      date: t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0]
    }));

    vibrate('medium');
    setParsedTransactions(prepared);
  };

  // Row update handlers
  const updateTransactionRow = (index, field, value) => {
    setParsedTransactions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleSelectRow = (index) => {
    vibrate('light');
    setParsedTransactions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const toggleSelectAll = () => {
    vibrate('light');
    const anyUnselected = parsedTransactions.some(t => !t.selected);
    setParsedTransactions(prev => prev.map(t => ({ ...t, selected: anyUnselected })));
  };

  const removeRow = (index) => {
    vibrate('light');
    setParsedTransactions(prev => prev.filter((_, i) => i !== index));
  };

  // Confirm and Auto-Add all selected transactions
  const handleAutoAddAll = () => {
    const selectedItems = parsedTransactions.filter(t => t.selected);
    if (selectedItems.length === 0) {
      alert('Please select at least one transaction to add.');
      return;
    }

    vibrate('success');

    const formatted = selectedItems.map(item => {
      let isoDate = new Date().toISOString();
      if (item.date) {
        if (item.date.includes('T')) {
          isoDate = new Date(item.date).toISOString();
        } else {
          const [y, m, d] = item.date.split('-').map(Number);
          if (y && m && d) {
            isoDate = new Date(y, m - 1, d, 12, 0, 0).toISOString();
          } else {
            isoDate = new Date(item.date).toISOString();
          }
        }
      }

      return {
        amount: parseFloat(item.amount) || 0,
        type: item.type || 'expense',
        categoryId: item.categoryId || (item.type === 'income' ? 'other_income' : 'shopping'),
        walletId: item.walletId || defaultWalletId,
        whereSpent: (item.whereSpent || '').trim() || 'Transaction',
        note: (item.note || item.whereSpent || '').trim(),
        date: isoDate
      };
    });

    // Add in batch via FinancialContext
    addBatchTransactions(formatted);

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 65,
        spread: 75,
        origin: { y: 0.75 }
      });
    } catch (e) {}

    onClose();
  };

  const selectedCount = parsedTransactions.filter(t => t.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity" 
        onClick={onClose} 
      />

      {/* Main Liquid Glass Bottom Sheet */}
      <div className="bg-[#1C1C1E] w-full max-h-[92vh] rounded-t-[2.5rem] shadow-2xl pointer-events-auto flex flex-col relative animate-spring-up text-white border-t border-gray-800 overflow-hidden">
        
        {/* Sticky Header */}
        <div className="px-6 pt-5 pb-3 bg-[#1C1C1E] rounded-t-[2.5rem] border-b border-gray-800 flex flex-col gap-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white leading-none">Smart Import</h3>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Scan screenshot or paste bank SMS</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Pills */}
          {parsedTransactions.length === 0 && !isProcessing && (
            <div className="flex bg-[#2C2C2E] rounded-xl p-1 shadow-inner relative">
              <button 
                onClick={() => { vibrate('light'); setActiveTab('screenshot'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'screenshot' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Screenshot OCR</span>
              </button>

              <button 
                onClick={() => { vibrate('light'); setActiveTab('text'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'text' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Text / SMS</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4 no-scrollbar">

          {/* ========================================================================= */}
          {/* STATE 1: REVIEW & CONFIRMATION SHEET (WHEN TRANSACTIONS WERE DETECTED)     */}
          {/* ========================================================================= */}
          {parsedTransactions.length > 0 ? (
            <div className="space-y-4 animate-fade-in">
              {/* Review Header Banner */}
              <div className="flex items-center justify-between bg-[#2C2C2E]/70 p-3 rounded-2xl border border-gray-700/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">
                    {parsedTransactions.length} transaction{parsedTransactions.length > 1 ? 's' : ''} detected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                  >
                    {selectedCount === parsedTransactions.length ? 'Deselect All' : 'Select All'}
                  </button>

                  <button
                    onClick={() => {
                      vibrate('light');
                      setParsedTransactions([]);
                      setSelectedImage(null);
                      setImagePreviewUrl(null);
                    }}
                    className="text-[11px] font-bold text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>New Scan</span>
                  </button>
                </div>
              </div>

              {/* Editable Cards List */}
              <div className="space-y-3">
                {parsedTransactions.map((item, idx) => {
                  const cat = CATEGORIES[item.categoryId] || { name: 'Other', bg: 'bg-gray-600', color: '#666' };
                  const CatIcon = ICON_MAP[item.categoryId] || Tag;

                  return (
                    <div 
                      key={item.tempId || idx}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                        item.selected 
                          ? 'bg-[#252528] border-emerald-500/40 shadow-md' 
                          : 'bg-[#1C1C1E] border-gray-800/80 opacity-60'
                      }`}
                    >
                      {/* Top Row: Checkbox, Merchant Input, Type Toggle & Delete */}
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <button
                          onClick={() => toggleSelectRow(idx)}
                          className={`p-1 rounded-lg transition-colors ${
                            item.selected ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400'
                          }`}
                        >
                          {item.selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </button>

                        {/* Merchant / Place Input */}
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={item.whereSpent || ''}
                            onChange={(e) => updateTransactionRow(idx, 'whereSpent', e.target.value)}
                            placeholder="Merchant / Place"
                            className="w-full bg-[#1C1C1E] border border-gray-700/60 rounded-xl px-3 py-1.5 text-xs font-bold text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>

                        {/* Type Toggle (Expense vs Income) */}
                        <button
                          onClick={() => {
                            vibrate('light');
                            const newType = item.type === 'expense' ? 'income' : 'expense';
                            updateTransactionRow(idx, 'type', newType);
                            // Auto adjust default category if mismatched
                            if (newType === 'income' && item.categoryId === 'food') {
                              updateTransactionRow(idx, 'categoryId', 'salary');
                            }
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                            item.type === 'income' 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          }`}
                          title="Toggle Income / Expense"
                        >
                          {item.type === 'income' ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>Income</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3" />
                              <span>Expense</span>
                            </>
                          )}
                        </button>

                        {/* Delete Row Button */}
                        <button
                          onClick={() => removeRow(idx)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 transition-colors"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Bottom Row: Amount, Category Selector, Wallet Selector & Date */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-gray-800/60 text-xs">
                        
                        {/* 1. Amount Input */}
                        <div>
                          <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Amount</label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) => updateTransactionRow(idx, 'amount', e.target.value)}
                              className={`w-full bg-[#1C1C1E] border border-gray-700/60 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold outline-none focus:border-emerald-500 ${
                                item.type === 'income' ? 'text-emerald-400' : 'text-white'
                              }`}
                            />
                          </div>
                        </div>

                        {/* 2. Category Selector */}
                        <div>
                          <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Category</label>
                          <div className="relative">
                            <select
                              value={item.categoryId}
                              onChange={(e) => updateTransactionRow(idx, 'categoryId', e.target.value)}
                              className="w-full bg-[#1C1C1E] border border-gray-700/60 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-emerald-500 appearance-none pr-6 cursor-pointer"
                            >
                              {Object.values(CATEGORIES).map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
                          </div>
                        </div>

                        {/* 3. Wallet Selector */}
                        <div>
                          <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Target Account</label>
                          <div className="relative">
                            <select
                              value={item.walletId}
                              onChange={(e) => updateTransactionRow(idx, 'walletId', e.target.value)}
                              className="w-full bg-[#1C1C1E] border border-gray-700/60 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-emerald-500 appearance-none pr-6 cursor-pointer"
                            >
                              {wallets.map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.name} ({w.currency})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
                          </div>
                        </div>

                        {/* 4. Date Input */}
                        <div>
                          <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Date</label>
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => updateTransactionRow(idx, 'date', e.target.value)}
                            className="w-full bg-[#1C1C1E] border border-gray-700/60 rounded-xl px-2 py-1.5 text-xs font-semibold text-white outline-none focus:border-emerald-500 cursor-pointer"
                          />
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 pb-4 space-y-2">
                <button
                  onClick={handleAutoAddAll}
                  disabled={selectedCount === 0}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] ${
                    selectedCount > 0
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-emerald-500/25'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Auto Add All ({selectedCount})</span>
                </button>
              </div>
            </div>
          ) : isProcessing ? (

            /* ========================================================================= */
            /* STATE 2: SCANNING RADAR / LASER BEAM ANIMATED OCR STATE                  */
            /* ========================================================================= */
            <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6 animate-fade-in text-center">
              
              {/* Animated Radar Scanning Box */}
              <div className="relative w-56 h-64 rounded-3xl overflow-hidden border-2 border-emerald-500/50 bg-[#121214] shadow-2xl flex items-center justify-center">
                {imagePreviewUrl ? (
                  <img 
                    src={imagePreviewUrl} 
                    alt="Scanning target" 
                    className="w-full h-full object-cover opacity-50 blur-[0.5px]" 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-emerald-400/60">
                    <Scan className="w-12 h-12 animate-pulse" />
                  </div>
                )}

                {/* Laser Beam Animation Line */}
                <div 
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-laser-scan"
                />

                {/* Radar Grid Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0,transparent_70%)] pointer-events-none" />
              </div>

              {/* Progress Bar & Status Text */}
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-300">{scanStatusText}</span>
                  <span className="text-emerald-400 font-mono">{progressPercent}%</span>
                </div>

                <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-[0_0_10px_#10b981]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="text-[11px] text-gray-500 font-medium">
                  Tesseract AI is running locally in your browser.
                </p>
              </div>

            </div>
          ) : (

            /* ========================================================================= */
            /* STATE 3: UPLOAD OR PASTE INPUT MODES                                      */
            /* ========================================================================= */
            <div className="space-y-4">
              
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Notice</p>
                    <p className="text-[11px] text-rose-300/90 mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {activeTab === 'screenshot' ? (
                /* Tab A: Screenshot Upload & Drag Zone */
                <div className="space-y-3">
                  
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]' 
                        : 'border-gray-700/80 bg-[#252528]/50 hover:bg-[#252528] hover:border-gray-600'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleImageSelected(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
                      <UploadCloud className="w-7 h-7 stroke-[2.2]" />
                    </div>

                    <h4 className="text-sm font-black text-white mb-1">
                      Upload Transaction Screenshot
                    </h4>
                    <p className="text-xs text-gray-400 max-w-xs mb-3">
                      Drop your Apple Pay, Google Pay, or bank statement image here, or browse files.
                    </p>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold border border-gray-700 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Supports PNG, JPG, JPEG, WEBP</span>
                    </div>
                  </div>

                  {/* Clipboard Hint Card */}
                  <div className="p-3.5 rounded-2xl bg-[#2C2C2E]/60 border border-gray-800 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 font-mono text-[10px] font-bold border border-gray-700">
                        Cmd + V / Ctrl + V
                      </span>
                      <span>Paste screenshot directly from clipboard</span>
                    </div>
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>

                </div>
              ) : (
                /* Tab B: Paste Text / Bank SMS */
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                      <span>Paste Bank SMS or Raw Text</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Zero-latency instant parse</span>
                    </label>
                    <textarea
                      rows={5}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={`Paste transaction SMS messages here, for example:\n\n"Paid Rs 350 to Starbucks on 04-Sep"\n"Your card was charged $15.99 at Netflix"\n"Sent $45.20 to Target on 2026-09-01"`}
                      className="w-full bg-[#252528] border border-gray-700/80 rounded-2xl p-3.5 text-xs text-white placeholder-gray-500 font-mono outline-none focus:border-emerald-500 transition-colors resize-none shadow-inner"
                    />
                  </div>

                  <button
                    onClick={() => handleParseText()}
                    disabled={!pastedText.trim()}
                    className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      pastedText.trim()
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Extract Transactions</span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
