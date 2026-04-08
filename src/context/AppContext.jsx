import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
  user: { name: 'Arjun Mehta', email: 'arjun.mehta@email.com', level: 2, streak: 4, iqPoints: 2150, sessionScore: 0, roi: 0 },
  portfolio: {
    virtualBalance: 100000,
    invested: 0,
    currentValue: 0,
    todayPnL: 0,
    trades: [],
    positions: {},
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
  const { currentUser, userData } = useAuth() || {};
  const [state, setState] = useState(initialState);
  
  // Sync state with Firebase userData when available
  useEffect(() => {
    if (userData) {
      setState(prev => ({
        ...prev,
        portfolio: {
          ...prev.portfolio,
          ...(userData.portfolio || {})
        },
        user: {
           ...prev.user,
           ...userData,
           sessionScore: userData.sessionScore || 0
        }
      }));
    }
  }, [userData]);

  // Price update / Live Market Simulation
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

        const invested = prev.portfolio.invested;
        const todayPnL = Math.round((currentValue - invested) * 0.1 * 100) / 100;
        
        // Basic ROI calculation: (currentValue - invested) / invested
        let roi = 0;
        if (invested > 0) {
           roi = ((currentValue - invested) / invested) * 100;
        }

        return {
          ...prev,
          prices: newPrices,
          portfolio: { ...prev.portfolio, currentValue: Math.round(currentValue), todayPnL, positions },
          user: { ...prev.user, roi: Math.round(roi * 100) / 100 }
        };
      });
    }, 15000); // 15s update interval
    return () => clearInterval(interval);
  }, []);

  const placeTrade = useCallback(async (instrument, type, qty) => {
    let finalPortfolio = null;
    let newSessionScore = 0;
    
    setState(prev => {
      const price = prev.prices[instrument] || INITIAL_PRICES[instrument];
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
        if (newBalance < total) {
          return prev; // insufficient balance — SimZone validates before calling
        }
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
        if (!positions[instrument] || positions[instrument].qty < qty) {
           return prev; // no position — SimZone validates before calling
        }
        
        newBalance += total;
        const avgBuyPrice = positions[instrument].avgPrice;
        const costBasis = avgBuyPrice * qty;
        newInvested -= costBasis;
        
        // P&L calculation for the trade log
        newTrade.pnl = Math.round((price - avgBuyPrice) * qty * 100) / 100;
        
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

      finalPortfolio = {
        virtualBalance: Math.round(newBalance * 100) / 100,
        invested: Math.round(newInvested * 100) / 100,
        currentValue: Math.round(currentValue),
        todayPnL: prev.portfolio.todayPnL,
        trades: [newTrade, ...prev.portfolio.trades],
        positions,
      };

      // Increase session score by 10 points for a successfully executed trade
      newSessionScore = (prev.user.sessionScore || 0) + 10;

      return {
        ...prev,
        portfolio: finalPortfolio,
        user: { ...prev.user, sessionScore: newSessionScore }
      };
    });

    // Sync to Firestore
    if (currentUser) {
        setTimeout(async () => {
             try {
                const userRef = doc(db, 'users', currentUser.uid);
                // updating both portfolio and sessionScore
                const updatePayload = {};
                if (finalPortfolio) updatePayload.portfolio = finalPortfolio;
                if (newSessionScore > 0) updatePayload.sessionScore = newSessionScore;
                
                await updateDoc(userRef, updatePayload);
             } catch (e) {
                 console.error("Failed to sync to Firestore", e);
             }
        }, 100);
    }
    
  }, [currentUser]);

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
