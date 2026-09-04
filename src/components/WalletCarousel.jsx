import React, { useRef, useEffect } from 'react';
import { useFinancials, EX_RATES, WALLET_COLORS, formatCurrency, vibrate } from '../context/FinancialContext';
import { Wallet, Layers } from 'lucide-react';

export const WalletCarousel = ({ onAddWallet }) => {
  const { 
    wallets, 
    activeWalletId, 
    setActiveWalletId, 
    preferences, 
    transactions 
  } = useFinancials();

  const scrollRef = useRef(null);
  const cardRefs = useRef({});
  const isProgrammaticScroll = useRef(false);

  // All cards: Total Money + Individual Wallets
  const allCards = [
    { id: 'all', name: 'Total Money', currency: preferences?.baseCurrency || 'INR', color: 'emerald', isNetWorth: true },
    ...wallets
  ];

  // Calculate specific wallet balance or Net Worth
  const getCardBalance = (card) => {
    const baseCurrency = preferences?.baseCurrency || 'INR';
    const baseRate = EX_RATES[baseCurrency] || 1;

    if (card.isNetWorth) {
      let net = 0;
      transactions.forEach(t => {
        const wCurrency = wallets.find(w => w.id === t.walletId)?.currency || 'INR';
        const converted = (t.amount * (EX_RATES[wCurrency] || 1)) / baseRate;
        if (t.type === 'income') net += converted;
        if (t.type === 'expense') net -= converted;
      });
      return net;
    }

    // Individual wallet balance
    let bal = 0;
    transactions.forEach(t => {
      if (t.type === 'transfer') {
        if (t.fromWalletId === card.id) bal -= t.amount;
        if (t.toWalletId === card.id) bal += (t.amountConverted || t.amount);
      } else if (t.walletId === card.id) {
        if (t.type === 'income') bal += t.amount;
        if (t.type === 'expense') bal -= t.amount;
      }
    });
    return bal;
  };

  // IntersectionObserver for 100% Rock-Solid Swipe Detection (including last card)
  useEffect(() => {
    if (!scrollRef.current) return;

    const observerOptions = {
      root: scrollRef.current,
      threshold: 0.65 // Card must be 65% in view to trigger selection
    };

    const observer = new IntersectionObserver((entries) => {
      if (isProgrammaticScroll.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cardId = entry.target.getAttribute('data-card-id');
          if (cardId && cardId !== activeWalletId) {
            vibrate('light');
            setActiveWalletId(cardId);
          }
        }
      });
    }, observerOptions);

    Object.values(cardRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [allCards.length, activeWalletId]);

  const handleSelectCard = (id) => {
    vibrate('light');
    setActiveWalletId(id);
  };

  // Programmatic scroll to active card when activeWalletId changes
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeIdx = allCards.findIndex(c => c.id === activeWalletId);
    if (activeIdx !== -1) {
      const container = scrollRef.current;
      const cardEl = cardRefs.current[activeWalletId];

      if (cardEl) {
        isProgrammaticScroll.current = true;
        cardEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });

        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 400);
      }
    }
  }, [activeWalletId]);

  return (
    <div className="w-full relative py-2 overflow-hidden">
      {/* Horizontal Swipeable Card Carousel */}
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar px-6 py-2 scroll-smooth touch-pan-x"
      >
        {allCards.map((card) => {
          const isActive = activeWalletId === card.id;
          const cardBal = getCardBalance(card);
          const theme = WALLET_COLORS[card.color || 'emerald'] || WALLET_COLORS.emerald;

          return (
            <div
              key={card.id}
              data-card-id={card.id}
              ref={(el) => (cardRefs.current[card.id] = el)}
              onClick={() => handleSelectCard(card.id)}
              className={`snap-center flex-shrink-0 w-[82%] sm:w-[300px] p-5 rounded-[2rem] cursor-pointer transition-all duration-300 relative overflow-hidden border ${
                isActive
                  ? `bg-gradient-to-br ${theme.gradient} ${theme.border} shadow-[0_10px_25px_rgba(0,0,0,0.5)] ring-1 ${theme.ring}`
                  : 'bg-[#1C1C1E]/80 hover:bg-[#1C1C1E] border-white/10 shadow-lg opacity-85'
              }`}
            >
              {/* Dynamic Theme Background Glow Accent */}
              {isActive && (
                <div className={`absolute -top-10 -right-10 w-28 h-28 ${theme.glow} rounded-full blur-2xl pointer-events-none`} />
              )}

              {/* Card Header */}
              <div className="flex justify-between items-center mb-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-inner ${
                    card.isNetWorth ? 'bg-emerald-500/20 text-emerald-400' : `${theme.glow} ${theme.text}`
                  }`}>
                    {card.isNetWorth ? <Layers className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                  </div>
                  <span className="font-extrabold text-xs tracking-wide text-white truncate max-w-[130px]">
                    {card.name}
                  </span>
                </div>

                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  isActive ? `${theme.glow} ${theme.text} ${theme.border}` : 'bg-white/10 text-gray-400 border-white/10'
                }`}>
                  {card.currency}
                </span>
              </div>

              {/* Balance Readout */}
              <div className="relative z-10 pt-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                  {card.isNetWorth ? 'Total Money' : 'Account Balance'}
                </p>
                <h2 className="text-2xl font-black text-white tabular-nums tracking-tight font-mono">
                  {formatCurrency(cardBal, card.currency)}
                </h2>
              </div>

            </div>
          );
        })}
      </div>

      {/* Pagination Dots with Dynamic Color Themes */}
      <div className="flex justify-center items-center gap-1.5 pt-2">
        {allCards.map((card) => {
          const isActive = activeWalletId === card.id;
          const theme = WALLET_COLORS[card.color || 'emerald'] || WALLET_COLORS.emerald;

          return (
            <button
              key={card.id}
              onClick={() => handleSelectCard(card.id)}
              className={`transition-all duration-300 rounded-full ${
                isActive 
                  ? `w-5 h-1.5 ${theme.bg} shadow-[0_0_8px_rgba(255,255,255,0.4)]` 
                  : 'w-1.5 h-1.5 bg-gray-700 hover:bg-gray-500'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
