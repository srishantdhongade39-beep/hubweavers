import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext();

const INITIAL_PRICES = {
  nifty50: 23450,
  hdfcBank: 1720,
  reliance: 2890,
  sbiNifty: 195.40,
  tataMotors: 890,
  goldETF: 6240,
};

const INSTRUMENT_MAP = {
  nifty50: { name: 'Nifty 50 ETF', ticker: 'NIFTYBEES' },
  hdfcBank: { name: 'HDFC Bank', ticker: 'HDFCBANK' },
  reliance: { name: 'Reliance Industries', ticker: 'RELIANCE' },
  sbiNifty: { name: 'SBI Nifty Index Fund', ticker: 'SBINIFTY' },
  tataMotors: { name: 'Tata Motors', ticker: 'TATAMOTORS' },
  goldETF: { name: 'Gold ETF', ticker: 'GOLDBEES' },
};

const initialState = {
  user: { name: 'Arjun Mehta', email: 'arjun.mehta@email.com', level: 2, streak: 4, iqPoints: 2150 },
  portfolio: {
    virtualBalance: 100000,
    invested: 35450,
    currentValue: 39680,
    todayPnL: 320,
    trades: [
      { id: 1, date: '2024-02-15', time: '09:32', instrument: 'nifty50', type: 'BUY', qty: 2, price: 23100, total: 46200, pnl: 700, status: 'EXECUTED' },
      { id: 2, date: '2024-02-16', time: '10:15', instrument: 'hdfcBank', type: 'BUY', qty: 5, price: 1690, total: 8450, pnl: 150, status: 'EXECUTED' },
      { id: 3, date: '2024-02-18', time: '11:45', instrument: 'tataMotors', type: 'BUY', qty: 10, price: 870, total: 8700, pnl: 200, status: 'EXECUTED' },
      { id: 4, date: '2024-02-20', time: '14:22', instrument: 'reliance', type: 'BUY', qty: 3, price: 2850, total: 8550, pnl: 120, status: 'EXECUTED' },
      { id: 5, date: '2024-02-22', time: '09:55', instrument: 'nifty50', type: 'SELL', qty: 1, price: 23400, total: 23400, pnl: 300, status: 'EXECUTED' },
    ],
    positions: {
      nifty50: { qty: 1, avgPrice: 23100, value: 23450 },
      hdfcBank: { qty: 5, avgPrice: 1690, value: 8600 },
      tataMotors: { qty: 10, avgPrice: 870, value: 8900 },
      reliance: { qty: 3, avgPrice: 2850, value: 8670 },
    },
  },
  learning: {
    currentLevel: 2,
    lessonsCompleted: 6,
    totalLessons: 34,
    conceptsMastered: 12,
  },
  prices: { ...INITIAL_PRICES },
  settings: {
    financialGoal: 'Retirement Planning',
    riskAppetite: 'Moderate',
    emailReminders: true,
    marketAlerts: true,
    communityMentions: false,
  },
};

export function AppProvider({ children }) {
  const [state, setState] = useState(initialState);

  // Price update every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const newPrices = { ...prev.prices };
        Object.keys(newPrices).forEach(key => {
          const change = (Math.random() - 0.5) * 0.01;
          newPrices[key] = Math.round(newPrices[key] * (1 + change) * 100) / 100;
        });
        
        // Recalculate portfolio
        let currentValue = 0;
        const positions = { ...prev.portfolio.positions };
        Object.keys(positions).forEach(key => {
          if (newPrices[key]) {
            positions[key] = { ...positions[key], value: Math.round(newPrices[key] * positions[key].qty * 100) / 100 };
            currentValue += positions[key].value;
          }
        });

        const todayPnL = Math.round((currentValue - prev.portfolio.invested) * 0.1 * 100) / 100;

        return {
          ...prev,
          prices: newPrices,
          portfolio: { ...prev.portfolio, currentValue: Math.round(currentValue), todayPnL, positions },
        };
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const placeTrade = useCallback((instrument, type, qty) => {
    setState(prev => {
      const price = prev.prices[instrument];
      const total = Math.round(price * qty * 100) / 100;
      const newTrade = {
        id: prev.portfolio.trades.length + 1,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        instrument,
        type,
        qty,
        price,
        total,
        pnl: 0,
        status: 'EXECUTED',
      };
      
      let newBalance = prev.portfolio.virtualBalance;
      let newInvested = prev.portfolio.invested;
      const positions = { ...prev.portfolio.positions };
      
      if (type === 'BUY') {
        newBalance -= total;
        newInvested += total;
        if (positions[instrument]) {
          const existing = positions[instrument];
          const newQty = existing.qty + qty;
          positions[instrument] = {
            qty: newQty,
            avgPrice: Math.round(((existing.avgPrice * existing.qty) + total) / newQty * 100) / 100,
            value: Math.round(price * newQty * 100) / 100,
          };
        } else {
          positions[instrument] = { qty, avgPrice: price, value: total };
        }
      } else {
        newBalance += total;
        newInvested -= total;
        if (positions[instrument]) {
          const newQty = positions[instrument].qty - qty;
          if (newQty <= 0) {
            delete positions[instrument];
          } else {
            positions[instrument] = { ...positions[instrument], qty: newQty, value: Math.round(price * newQty * 100) / 100 };
          }
        }
      }

      let currentValue = 0;
      Object.values(positions).forEach(p => { currentValue += p.value; });

      return {
        ...prev,
        portfolio: {
          virtualBalance: Math.round(newBalance * 100) / 100,
          invested: Math.round(newInvested * 100) / 100,
          currentValue: Math.round(currentValue),
          todayPnL: prev.portfolio.todayPnL,
          trades: [newTrade, ...prev.portfolio.trades],
          positions,
        },
      };
    });
  }, []);

  const updateSettings = useCallback((updates) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  }, []);

  const updateUser = useCallback((updates) => {
    setState(prev => ({ ...prev, user: { ...prev.user, ...updates } }));
  }, []);

  return (
    <AppContext.Provider value={{ state, placeTrade, updateSettings, updateUser, INSTRUMENT_MAP }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export { INSTRUMENT_MAP };
