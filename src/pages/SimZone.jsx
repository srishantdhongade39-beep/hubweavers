import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Briefcase,
  FileText,
  Settings,
  Maximize2,
  X,
  Minus,
  ChevronUp,
  Lightbulb,
  Building2,
  Send,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Plus,
  TrendingUp,
  TrendingDown,
  Bot,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { generateMentorResponse } from '../config/groq';
import { createChart } from 'lightweight-charts';

// ─── Timeframe-aware dummy data generator ─────────────────────────────────────
const generateDummyData = (basePrice, timeframe = '1M') => {
  const data = [];
  let current = basePrice * 0.95;
  const now = new Date();

  const configs = {
    '1D':  { count: 78,  volatility: 4 },
    '5D':  { count: 130, volatility: 8 },
    '1M':  { count: 22,  volatility: 18 },
    '6M':  { count: 130, volatility: 25 },
    '1Y':  { count: 52,  volatility: 35 },
  };
  const cfg = configs[timeframe] || configs['1M'];

  for (let i = cfg.count - 1; i >= 0; i--) {
    let time;
    if (timeframe === '1D') {
      // 5-minute intervals as unix timestamp (seconds)
      time = Math.floor(now.getTime() / 1000) - i * 300;
    } else if (timeframe === '5D') {
      // 15-minute intervals
      time = Math.floor(now.getTime() / 1000) - i * 900;
    } else if (timeframe === '1Y') {
      // Weekly intervals
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      time = d.toISOString().split('T')[0];
    } else {
      // Daily intervals (1M, 6M)
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      time = d.toISOString().split('T')[0];
    }

    const open = current;
    const high = current + Math.random() * cfg.volatility;
    const low = current - Math.random() * cfg.volatility;
    const close = (open + high + low) / 3 + (Math.random() - 0.4) * (cfg.volatility / 2);
    data.push({ time, open, high, low, close });
    current = close;
  }

  // Snap last candle to exact current price
  if (data.length > 0) data[data.length - 1].close = basePrice;
  return data;
};

// ─── Timeframe label map ──────────────────────────────────────────────────────
const TF_LABEL = { '1D': '5m', '5D': '15m', '1M': '1d', '6M': '1d', '1Y': '1w' };

// ─── Component ────────────────────────────────────────────────────────────────
export default function SimZone() {
  // ── Core state ──
  const [activeTimeframe, setActiveTimeframe] = useState('1M');
  const [activeSidebarTab, setActiveSidebarTab] = useState('dashboard');
  const [activeTradeTab, setActiveTradeTab] = useState('Trade History');
  const [portfolioSubTab, setPortfolioSubTab] = useState('holdings');
  const [activeInstrument, setActiveInstrument] = useState('reliance');

  // ── Watchlist state ──
  const [watchlistKeys, setWatchlistKeys] = useState(['hdfcBank', 'reliance', 'tataMotors', 'goldETF']);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [watchlistPrices, setWatchlistPrices] = useState({});

  // ── Toast state ──
  const [toast, setToast] = useState(null); // { message, type: 'success'|'sell'|'error' }

  // ── App context ──
  const { state, placeTrade, INSTRUMENT_MAP } = useApp();
  const currentPrice = state.prices[activeInstrument] || 0;
  const portfolio = state.portfolio;
  const instrumentInfo = INSTRUMENT_MAP[activeInstrument];

  // ── Watchlist Prices Polling ──
  useEffect(() => {
    const updatePrices = () => {
      setWatchlistPrices(prev => {
        const nextPrices = { ...prev };
        watchlistKeys.forEach(key => {
          const price = state.prices[key] || 0;
          const changePct = ((Math.random() - 0.5) * 2).toFixed(2);
          nextPrices[key] = {
            price,
            changePct,
            isUp: parseFloat(changePct) >= 0
          };
        });
        return nextPrices;
      });
    };
    updatePrices();
    const intervalId = setInterval(updatePrices, 15000);
    return () => clearInterval(intervalId);
  }, [watchlistKeys, state.prices]);

  // ── Mentor state ──
  const navigate = useNavigate();
  const [mentorState, setMentorState] = useState(() => localStorage.getItem('simzone_mentor_state') || 'open');
  const [mentorMessages, setMentorMessages] = useState([]);
  const [isMentorTyping, setIsMentorTyping] = useState(false);
  const [mentorInput, setMentorInput] = useState('');
  const chatScrollRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartSeriesRef = useRef(null);
  const mentorInitializedRef = useRef(false);

  // ── Persist mentor state ──
  useEffect(() => { localStorage.setItem('simzone_mentor_state', mentorState); }, [mentorState]);

  // ── Mentor Initial Greeting ──
  useEffect(() => {
    if (!mentorInitializedRef.current && instrumentInfo && currentPrice > 0) {
      mentorInitializedRef.current = true;
      const initialPrompt = `(INTERNAL COMMAND) The user just loaded the page. You must output exactly in this format but naturally: "Namaste! You have ₹[virtualBalance] ready to trade. You're currently looking at [STOCK] which is trading at ₹[currentPrice]. This stock has moved [X]% today. Want me to explain what that means before you place your first trade?" Replace the brackets with actual context data provided.`;
      askMentor(initialPrompt, null, true);
    }
  }, [instrumentInfo, currentPrice]);

  // ── Auto-scroll mentor ──
  useEffect(() => {
    if (chatScrollRef.current && mentorState === 'open')
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [mentorMessages, isMentorTyping, mentorState]);

  // ── Toast auto-dismiss ──
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── TradingView Chart init (re-inits on instrument OR timeframe change) ──
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid', color: '#0a0f0f' }, textColor: '#9ca3af' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const series = chart.addCandlestickSeries({
      upColor: '#16a34a', downColor: '#dc2626', borderVisible: false,
      wickUpColor: '#16a34a', wickDownColor: '#dc2626',
    });

    series.setData(generateDummyData(currentPrice, activeTimeframe));
    chartSeriesRef.current = series;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
    };
    window.addEventListener('resize', handleResize);

    return () => { window.removeEventListener('resize', handleResize); chart.remove(); chartSeriesRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInstrument, activeTimeframe]);

  // ── Live candle update ──
  useEffect(() => {
    if (!chartSeriesRef.current) return;
    const isIntraday = activeTimeframe === '1D' || activeTimeframe === '5D';
    const time = isIntraday
      ? Math.floor(Date.now() / 1000)
      : new Date().toISOString().split('T')[0];
    chartSeriesRef.current.update({
      time, open: currentPrice - 2, high: currentPrice + 5, low: currentPrice - 5, close: currentPrice
    });
  }, [currentPrice, activeTimeframe]);

  // ── Helpers ──
  const formatMoney = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

  const renderFormattedText = (text, role) => {
    if (role === 'user') return text;
    if (!text) return null; // Safe guard for empty strings during stream init
    
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-1.5" />;
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="mb-2 last:mb-0 leading-relaxed text-[13px]">
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j} className="font-bold text-green-950">{part.slice(2, -2)}</strong>
              : <span key={j}>{part}</span>
          )}
        </p>
      );
    });
  };

  // ── AI Mentor ──
  const askMentor = async (query, visibleQuery = null, skipUserRender = false) => {
    if (!query.trim()) return;
    if (!skipUserRender) {
      setMentorMessages(prev => [...prev, { role: 'user', text: visibleQuery || query }]);
    }
    setMentorInput('');
    setIsMentorTyping(true);
    setMentorState('open');

    const isUp = watchlistPrices[activeInstrument]?.isUp;
    const ctxData = {
      portfolioValue: formatMoney(portfolio.currentValue),
      virtualBalance: formatMoney(portfolio.virtualBalance),
      instrument: instrumentInfo?.name,
      price: formatMoney(currentPrice),
      dayHigh: formatMoney(currentPrice * 1.012),
      dayLow: formatMoney(currentPrice * 0.988),
      percentChange: `${isUp ? '+' : ''}${watchlistPrices[activeInstrument]?.changePct || '0.00'}%`,
      tradeHistory: (portfolio.trades || []).slice(0, 5),
      positions: portfolio.positions || {}
    };

    setMentorMessages(prev => [...prev, { role: 'ai', text: '' }]);

    await generateMentorResponse(query, ctxData, (chunk) => {
      setMentorMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = { role: 'ai', text: chunk };
        return newArr;
      });
    });
    
    setIsMentorTyping(false);
  };

  // ── Trade handlers with validation + toasts ──
  const handleBuy = () => {
    if (portfolio.virtualBalance < currentPrice) {
      showToast('Insufficient Virtual Balance!', 'error');
      return;
    }
    placeTrade(activeInstrument, 'BUY', 1);
    showToast(`Bought 1 share of ${instrumentInfo?.name} at ${formatMoney(currentPrice)}`, 'success');
    
    const prompt = `(INTERNAL COMMAND) The user just clicked BUY. Respond in exactly this structure: "Good move! You just bought 1 share of [STOCK] at ₹[price]. This means ₹[price] has been deducted from your balance. You now have ₹[newBalance] left. To make a profit, [STOCK] needs to go above ₹[price]. Watch the candles — if you see more green candles forming, the price might keep rising." Fill in actual data.`;
    askMentor(prompt, "I just placed a BUY order.", true);
  };

  const handleSell = () => {
    const pos = portfolio.positions[activeInstrument];
    if (!pos || pos.qty < 1) {
      showToast("You don't own any shares of this stock!", 'error');
      return;
    }
    const buyPrice = pos.avgPrice;
    const pnl = currentPrice - buyPrice;
    const isProfit = pnl >= 0;

    placeTrade(activeInstrument, 'SELL', 1);
    showToast(`Sold 1 share of ${instrumentInfo?.name} at ${formatMoney(currentPrice)}`, 'sell');
    
    let prompt = "";
    if (isProfit) {
        prompt = `(INTERNAL COMMAND) The user just clicked SELL with a profit. Respond exactly like: "Nice trade! You sold [STOCK] at ₹[sellPrice] which you bought at ₹[buyPrice]. You made a profit of ₹[pnl] on this trade. That's a [X]% return. This happened because the price moved up after you bought. This is called a long trade — buy low, sell high." Fill actual data.`;
    } else {
        prompt = `(INTERNAL COMMAND) The user just clicked SELL with a loss. Respond exactly like: "You sold [STOCK] at ₹[sellPrice] but you bought it at ₹[buyPrice]. That's a loss of ₹[pnl]. Don't worry — losses are part of learning. In real trading, this is called a stop-loss situation. Notice how the red candles were forming before the price dropped? That's a signal to watch for next time." Fill actual data.`;
    }
    askMentor(prompt, "I just placed a SELL order.", true);
  };

  const handleMentorSubmit = (e) => { e.preventDefault(); askMentor(mentorInput); };

  // ── Helper: first buy date for an instrument ──
  const getFirstBuyDate = (instrumentKey) => {
    const buys = (portfolio.trades || []).filter(t => t.instrument === instrumentKey && t.type === 'BUY');
    if (buys.length === 0) return 'N/A';
    const first = buys[buys.length - 1]; // trades are newest-first
    return `${first.date} ${first.time}`;
  };

  // ── Add stock to watchlist ──
  const addToWatchlist = (key) => {
    if (!watchlistKeys.includes(key)) setWatchlistKeys(prev => [...prev, key]);
    setShowAddMenu(false);
  };
  const availableToAdd = Object.keys(INSTRUMENT_MAP).filter(k => !watchlistKeys.includes(k));

  // ─────────────────────────────── BOTTOM PANEL RENDERERS ──────────────────────

  // ── Dashboard Panel (Trade History / Positions) ──
  const renderDashboardPanel = () => (
    <div className="h-64 bg-[#0F171A] text-white flex flex-col shrink-0 border-t border-gray-800">
      <div className="flex items-center space-x-6 px-4 border-b border-gray-800">
        {['Trade History', 'Positions'].map(tab => (
          <button key={tab} onClick={() => setActiveTradeTab(tab)}
            className={`py-3 text-sm font-medium relative ${activeTradeTab === tab ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            {tab}
            {activeTradeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-[#0a0f0f] border-b border-gray-800 font-mono">
            <tr>
              <th className="px-4 py-3 font-semibold">Instrument</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold text-right">Qty</th>
              <th className="px-4 py-3 font-semibold text-right">Price</th>
              <th className="px-4 py-3 font-semibold text-right">P&amp;L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 font-mono text-gray-300">
            {activeTradeTab === 'Trade History' && portfolio.trades?.map((trade, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{INSTRUMENT_MAP[trade.instrument]?.ticker}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${trade.type === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {trade.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{trade.qty}</td>
                <td className="px-4 py-3 text-right">{formatMoney(trade.price)}</td>
                <td className={`px-4 py-3 text-right ${trade.pnl > 0 ? 'text-green-400' : trade.pnl < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {trade.pnl > 0 ? '+' : ''}{formatMoney(trade.pnl)}
                </td>
              </tr>
            ))}
            {activeTradeTab === 'Positions' && Object.entries(portfolio.positions || {}).map(([key, pos]) => {
              const pnl = (state.prices[key] || 0) * pos.qty - pos.avgPrice * pos.qty;
              return (
                <tr key={key} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{INSTRUMENT_MAP[key]?.ticker}</td>
                  <td className="px-4 py-3"><span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold border border-blue-500/30">HOLD</span></td>
                  <td className="px-4 py-3 text-right">{pos.qty}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(pos.avgPrice)}</td>
                  <td className={`px-4 py-3 text-right ${pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {pnl > 0 ? '+' : ''}{formatMoney(pnl)}
                  </td>
                </tr>
              );
            })}
            {((activeTradeTab === 'Trade History' && (!portfolio.trades || portfolio.trades.length === 0)) ||
              (activeTradeTab === 'Positions' && Object.keys(portfolio.positions || {}).length === 0)) && (
              <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Watchlist Panel ──
  const renderWatchlistPanel = () => (
    <div className="h-64 bg-[#0F171A] text-white flex flex-col shrink-0 border-t border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-sm font-bold text-white uppercase tracking-wide">Watchlist</span>
        <div className="relative">
          <button onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition-colors">
            <Plus className="w-3 h-3" /><span>Add</span>
          </button>
          {showAddMenu && availableToAdd.length > 0 && (
            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 w-48 py-1">
              {availableToAdd.map(k => (
                <button key={k} onClick={() => addToWatchlist(k)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  {INSTRUMENT_MAP[k]?.name} ({INSTRUMENT_MAP[k]?.ticker})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {watchlistKeys.map(key => {
          const info = INSTRUMENT_MAP[key];
          if (!info) return null;
          const wp = watchlistPrices[key] || { price: state.prices[key] || 0, changePct: '0.00', isUp: true };
          const { price, changePct, isUp } = wp;
          return (
            <button key={key} onClick={() => { setActiveInstrument(key); setActiveSidebarTab('dashboard'); }}
              className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] ${activeInstrument === key ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-gray-800/60 hover:border-gray-600'}`}>
              <h4 className="font-bold text-sm text-white truncate">{info.name}</h4>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{info.ticker}</p>
              <p className="text-lg font-black text-white mt-2">{formatMoney(price)}</p>
              <p className={`text-xs font-semibold mt-1 flex items-center ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {isUp ? '+' : ''}{changePct}%
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Portfolio Panel (Holdings + My Positions) ──
  const renderPortfolioPanel = () => {
    const positions = portfolio.positions || {};
    const posEntries = Object.entries(positions);
    let totalValue = 0, totalInvested = 0;
    posEntries.forEach(([key, pos]) => {
      totalValue += (state.prices[key] || 0) * pos.qty;
      totalInvested += pos.avgPrice * pos.qty;
    });
    const totalPnl = totalValue - totalInvested;
    const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested * 100) : 0;

    return (
      <div className="h-64 bg-[#0F171A] text-white flex flex-col shrink-0 border-t border-gray-800">
        {/* Summary bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#0a0f0f]">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Portfolio Value</span>
              <p className="text-sm font-bold text-white">{formatMoney(totalValue)}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total P&L</span>
              <p className={`text-sm font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}{formatMoney(totalPnl)} ({totalPnlPct.toFixed(2)}%)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-gray-800 rounded-md p-0.5">
            {['holdings', 'positions'].map(t => (
              <button key={t} onClick={() => setPortfolioSubTab(t)}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors capitalize ${portfolioSubTab === t ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t === 'positions' ? 'My Positions' : 'Holdings'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {portfolioSubTab === 'holdings' ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-[#0a0f0f] border-b border-gray-800 font-mono">
                <tr>
                  <th className="px-4 py-2 font-semibold">Stock</th>
                  <th className="px-4 py-2 font-semibold text-right">Avg Buy</th>
                  <th className="px-4 py-2 font-semibold text-right">Qty</th>
                  <th className="px-4 py-2 font-semibold text-right">Current</th>
                  <th className="px-4 py-2 font-semibold text-right">Value</th>
                  <th className="px-4 py-2 font-semibold text-right">P&L (₹)</th>
                  <th className="px-4 py-2 font-semibold text-right">P&L (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 font-mono text-gray-300">
                {posEntries.length > 0 ? posEntries.map(([key, pos]) => {
                  const cp = state.prices[key] || 0;
                  const val = cp * pos.qty;
                  const pnl = val - pos.avgPrice * pos.qty;
                  const pnlPct = pos.avgPrice > 0 ? ((cp - pos.avgPrice) / pos.avgPrice * 100) : 0;
                  return (
                    <tr key={key} className="hover:bg-white/5">
                      <td className="px-4 py-2 font-medium text-white">{INSTRUMENT_MAP[key]?.ticker}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(pos.avgPrice)}</td>
                      <td className="px-4 py-2 text-right">{pos.qty}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(cp)}</td>
                      <td className="px-4 py-2 text-right text-white">{formatMoney(val)}</td>
                      <td className={`px-4 py-2 text-right ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pnl >= 0 ? '+' : ''}{formatMoney(pnl)}</td>
                      <td className={`px-4 py-2 text-right ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No holdings yet.</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            /* My Positions — card-based view */
            <div className="p-4 space-y-3 overflow-auto">
              {posEntries.length > 0 ? posEntries.map(([key, pos]) => {
                const cp = state.prices[key] || 0;
                const pnl = (cp - pos.avgPrice) * pos.qty;
                const pnlPct = pos.avgPrice > 0 ? ((cp - pos.avgPrice) / pos.avgPrice * 100) : 0;
                const buyDate = getFirstBuyDate(key);
                return (
                  <div key={key} className="bg-gray-800/80 rounded-xl p-4 border border-gray-700 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{INSTRUMENT_MAP[key]?.name}</span>
                        <span className="text-xs text-gray-500 font-mono">{INSTRUMENT_MAP[key]?.ticker}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>Bought at <span className="text-green-300 font-semibold">{formatMoney(pos.avgPrice)}</span></span>
                        <span>on <span className="text-gray-300 font-medium">{buyDate}</span></span>
                      </div>
                      <div className="text-xs text-gray-400">Shares held: <span className="text-white font-bold">{pos.qty}</span></div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-bold text-white">{formatMoney(cp)}</p>
                      <p className="text-xs text-gray-500">Current Price</p>
                      <p className={`text-sm font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{formatMoney(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-sm">
                  <Briefcase className="w-8 h-8 mb-3 text-gray-600" />
                  <p className="font-medium">You haven't bought any stocks yet.</p>
                  <p className="text-xs mt-1 text-gray-600">Go to Dashboard and place your first trade!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Orders Panel ──
  const renderOrdersPanel = () => (
    <div className="h-64 bg-[#0F171A] text-white flex flex-col shrink-0 border-t border-gray-800">
      <div className="px-4 py-3 border-b border-gray-800">
        <span className="text-sm font-bold text-white uppercase tracking-wide">Order History</span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-[#0a0f0f] border-b border-gray-800 font-mono">
            <tr>
              <th className="px-4 py-2 font-semibold">Date & Time</th>
              <th className="px-4 py-2 font-semibold">Stock</th>
              <th className="px-4 py-2 font-semibold">Type</th>
              <th className="px-4 py-2 font-semibold text-right">Qty</th>
              <th className="px-4 py-2 font-semibold text-right">Price</th>
              <th className="px-4 py-2 font-semibold text-right">Total</th>
              <th className="px-4 py-2 font-semibold text-right">P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 font-mono text-gray-300">
            {portfolio.trades && portfolio.trades.length > 0 ? portfolio.trades.map((t, idx) => (
              <tr key={idx} className="hover:bg-white/5">
                <td className="px-4 py-2 text-gray-400 text-xs">{t.date} {t.time}</td>
                <td className="px-4 py-2 font-medium text-white">{INSTRUMENT_MAP[t.instrument]?.ticker}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${t.type === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">{t.qty}</td>
                <td className="px-4 py-2 text-right">{formatMoney(t.price)}</td>
                <td className="px-4 py-2 text-right text-white">{formatMoney(t.total || t.price * t.qty)}</td>
                <td className={`px-4 py-2 text-right ${t.pnl > 0 ? 'text-green-400' : t.pnl < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {t.pnl > 0 ? '+' : ''}{formatMoney(t.pnl)}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No orders placed yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─────────────────────────────────── JSX RENDER ──────────────────────────────

  // Sidebar nav items
  const sidebarItems = [
    { name: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
    { name: 'Watchlist', key: 'watchlist', icon: ClipboardList },
    { name: 'Portfolio', key: 'portfolio', icon: Briefcase },
    { name: 'Orders', key: 'orders', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className={`fixed top-20 right-6 z-[200] px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold flex items-center space-x-2 transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'sell' ? 'bg-red-600' : 'bg-amber-600'
        }`} style={{ animation: 'slideIn 0.3s ease-out' }}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── TOP BAR (search bar removed) ── */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
        <div className="flex items-center space-x-2">
          <button className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-green-600 items-center justify-center text-white font-bold text-xl">S</div>
          <span className="text-xl font-bold tracking-tight">SimZone</span>
        </div>

        <div className="flex items-center space-x-6 flex-1 justify-center">
          {/* Ticker chip */}
          <div className="flex items-center space-x-1 bg-slate-100 rounded-md p-1">
            <div className="px-3 py-1 bg-white shadow-sm rounded text-xs font-semibold text-slate-700 uppercase tracking-wide">
              {instrumentInfo?.ticker}
            </div>
          </div>

          {/* Timeframe tabs */}
          <div className="flex items-center space-x-4 text-sm font-medium text-slate-500">
            {['1D', '5D', '1M', '6M', '1Y'].map(tf => (
              <button key={tf} onClick={() => setActiveTimeframe(tf)}
                className={`pb-1 relative transition-colors ${activeTimeframe === tf ? 'text-slate-900 font-bold' : 'hover:text-slate-700'}`}>
                {tf}
                {activeTimeframe === tf && <span className="absolute bottom-[-19px] left-0 right-0 h-0.5 bg-green-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Buy / Sell — both show exact same price */}
        <div className="flex items-center space-x-3">
          <button onClick={handleSell}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded shadow-sm transition-colors">
            SELL {formatMoney(currentPrice)}
          </button>
          <button onClick={handleBuy}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded shadow-sm transition-colors">
            BUY {formatMoney(currentPrice)}
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── LEFT SIDEBAR ── */}
        <div className="hidden lg:flex w-[220px] min-w-[220px] bg-white border-r border-slate-200 flex-col justify-between shrink-0 h-screen overflow-y-auto">
          <div>
            <div className="p-6 pb-2">
              <button 
                onClick={() => navigate('/')} 
                className="mb-4 flex items-center space-x-1 text-xs font-semibold text-slate-400 hover:text-green-600 hover:underline transition-all">
                <span>←</span> <span>Back to FinIQ</span>
              </button>
              <h2 className="font-bold text-lg leading-tight">SimZone Terminal</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Learning Mode</p>
            </div>
            <nav className="px-3 mt-4 space-y-1">
              {sidebarItems.map(item => (
                <button key={item.key} onClick={() => setActiveSidebarTab(item.key)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSidebarTab === item.key ? 'bg-green-100 text-green-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}>
                  <item.icon className={`w-5 h-5 ${activeSidebarTab === item.key ? 'text-green-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 mt-auto space-y-4 mb-16">
            {/* SimZone Mentor Floating Button (MiniState) */}
            <div className="group relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setMentorState(mentorState === 'open' ? 'closed' : 'open'); }}
                className={`w-[56px] h-[56px] rounded-full bg-[#14532d] text-white flex items-center justify-center shadow-xl transition-all duration-300 transform hover:scale-[1.05] active:scale-95 animate-pulse-green border-4 border-white`}
              >
                <Bot className="w-7 h-7" />
              </button>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                <div className="bg-slate-900 shadow-2xl text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap">
                  SimZone Mentor
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900" />
                </div>
              </div>
            </div>

            {/* Virtual Balance Card */}
            <div className="w-full transform transition-all duration-300">
              <div className="rounded-2xl p-4 text-white relative overflow-hidden shadow-lg border border-emerald-800/20" style={{ background: 'linear-gradient(135deg, #065f46 0%, #14532d 100%)' }}>
                <div className="flex items-center space-x-2 mb-2 relative z-10">
                  <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-3 h-3 text-emerald-200" />
                  </div>
                  <span className="text-[9px] font-bold tracking-widest uppercase text-emerald-200/80 leading-tight">Virtual Balance</span>
                </div>
                
                <div className="text-xl font-black text-white tracking-tight mb-1 relative z-10 truncate" title={formatMoney(portfolio.virtualBalance)}>
                  {formatMoney(portfolio.virtualBalance)}
                </div>
                
                <div className={`text-[11px] font-bold flex items-center relative z-10 ${portfolio?.todayPnL >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  <span>{portfolio?.todayPnL >= 0 ? '▲' : '▼'} {portfolio?.todayPnL >= 0 ? '+' : ''}{formatMoney(portfolio?.todayPnL || 0)}</span>
                  <span className="ml-1.5 opacity-60 font-medium">Today's P&L</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER AREA ── */}
        <div className="flex-1 flex flex-col relative bg-[#f8fafc] border-r border-slate-200">

          {/* Chart Header */}
          <div className="h-12 bg-[#0a0f0f] flex items-center justify-between px-4 text-slate-300 text-xs font-mono border-b border-gray-800">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-white tracking-wider">{instrumentInfo?.ticker} · {TF_LABEL[activeTimeframe]}</span>
              <span className="text-slate-500">VOL 41.31M</span>
              <span>O: {formatMoney(currentPrice - 20)}</span>
              <span className="text-red-400">H: {formatMoney(currentPrice + 10)}</span>
              <span className="text-red-400">L: {formatMoney(currentPrice - 30)}</span>
              <span>C: {formatMoney(currentPrice)}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button className="hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
              <button className="hover:text-white transition-colors"><Maximize2 className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="flex-1 bg-[#0a0f0f] relative overflow-hidden flex">
            <div ref={chartContainerRef} className="flex-1 w-full h-full relative" />
          </div>

          {/* Bottom Panel — switches based on sidebar tab */}
          {activeSidebarTab === 'dashboard' && renderDashboardPanel()}
          {activeSidebarTab === 'watchlist' && renderWatchlistPanel()}
          {activeSidebarTab === 'portfolio' && renderPortfolioPanel()}
          {activeSidebarTab === 'orders' && renderOrdersPanel()}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="hidden lg:flex w-[320px] min-w-[320px] bg-white flex-col shrink-0 overflow-y-auto h-screen border-l border-slate-200 pb-20">

          {/* Watchlist Section */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Watchlist</h3>
            </div>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {watchlistKeys.map(key => {
                const info = INSTRUMENT_MAP[key];
                if (!info) return null;
                const wp = watchlistPrices[key] || { price: state.prices[key] || 0, changePct: '0.00', isUp: true };
                const { price: p, changePct: change, isUp } = wp;
                return (
                  <div key={key} onClick={() => setActiveInstrument(key)}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer border shrink-0 h-[64px] ${activeInstrument === key ? 'bg-green-50 border-green-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'}`}>
                    <div className="flex-1 min-w-0 mr-3">
                      <h4 className="font-bold text-sm tracking-tight truncate">{info.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">{info.ticker}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-slate-900">{formatMoney(p)}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                        {isUp ? '+' : ''}{change}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 space-y-4">

            {/* Insight Card */}
            <div className="bg-[#f0fdf4] rounded-xl p-4 border border-green-100 shadow-sm">
              <div className="flex items-center space-x-2 mb-2 text-green-800">
                <Lightbulb className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Insight</span>
              </div>
              <p className="text-sm text-green-900 italic font-medium leading-relaxed">
                "Trade Execution is live! Real-time syncing with your Firebase portfolio."
              </p>
            </div>

            {/* Key Stats — dynamic per instrument */}
            <div className="px-1 mt-6">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Key Statistics</h3>
              {(() => {
                // Per-instrument base fundamentals (realistic Indian market figures)
                const STOCK_FUNDAMENTALS = {
                  hdfcBank:   { marketCap: '13.42T', pe: 19.8, divYield: 1.12, beta: 0.92, sector: 'Banking' },
                  reliance:   { marketCap: '20.14T', pe: 28.4, divYield: 0.34, beta: 1.05, sector: 'Conglomerate' },
                  tataMotors: { marketCap: '3.24T',  pe: 8.2,  divYield: 0.15, beta: 1.42, sector: 'Automotive' },
                  goldETF:    { marketCap: '18.7K Cr', pe: '-', divYield: 0, beta: 0.08, sector: 'Commodity ETF' },
                  nifty50:    { marketCap: '2.1K Cr', pe: 22.5, divYield: 1.28, beta: 1.0, sector: 'Index ETF' },
                  sbiNifty:   { marketCap: '1.8K Cr', pe: 22.5, divYield: 0.95, beta: 1.0, sector: 'Index Fund' },
                };
                const f = STOCK_FUNDAMENTALS[activeInstrument] || STOCK_FUNDAMENTALS.reliance;
                const dayHigh = (currentPrice * 1.012).toFixed(2);
                const dayLow = (currentPrice * 0.988).toFixed(2);
                const w52High = (currentPrice * 1.18).toFixed(2);
                const w52Low = (currentPrice * 0.72).toFixed(2);
                const volume = (Math.floor(Math.random() * 30 + 15) + (currentPrice > 5000 ? 5 : 40)).toFixed(1);

                const stats = [
                  { label: 'Market Cap', value: f.marketCap },
                  { label: 'P/E Ratio', value: f.pe },
                  { label: 'Div Yield', value: f.divYield > 0 ? `${f.divYield}%` : '—' },
                  { label: 'Beta', value: f.beta },
                  { label: 'Sector', value: f.sector },
                  { label: 'Day Range', value: `₹${Number(dayLow).toLocaleString('en-IN')} – ₹${Number(dayHigh).toLocaleString('en-IN')}` },
                  { label: '52W High', value: formatMoney(Number(w52High)) },
                  { label: '52W Low', value: formatMoney(Number(w52Low)) },
                  { label: 'Volume', value: `${volume}M` },
                ];

                return (
                  <div className="space-y-2.5">
                    {stats.map((s, i) => (
                      <div key={i} className={`flex justify-between text-sm pb-2 ${i < stats.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <span className="text-slate-500">{s.label}</span>
                        <span className="font-semibold text-slate-900">{s.value}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── MENTOR POPUP (FLOATING) ── */}
      {mentorState === 'open' && (
        <div className="fixed bottom-6 left-[240px] z-[200] pointer-events-auto w-[340px] h-[420px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-200 flex flex-col overflow-hidden animate-slide-up">
          <div className="bg-[#14532d] px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-400/30">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
              <span className="font-bold text-[15px] text-white tracking-wide uppercase">SimZone Mentor ✨</span>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => setMentorState('closed')} className="text-emerald-100/60 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10">
                <Minus className="w-4 h-4" />
              </button>
              <button onClick={() => setMentorState('closed')} className="text-emerald-100/60 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden bg-white">
            <div ref={chatScrollRef} className="p-5 overflow-y-auto space-y-5 text-sm flex-1 scroll-smooth bg-gradient-to-b from-slate-50/50 to-white">
              {mentorMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user' ? 'bg-[#22c55e] text-white font-semibold rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                  }`}>
                    {renderFormattedText(msg.text, msg.role)}
                  </div>
                </div>
              ))}
              {isMentorTyping && (
                <div className="flex items-start">
                  <div className="bg-white text-slate-700 rounded-2xl rounded-bl-none border border-slate-200 px-5 py-3 flex items-center space-x-3 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-500">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {mentorMessages.length > 0 && (
              <div className="px-4 pb-3 bg-white flex flex-wrap gap-2 shrink-0">
                <button onClick={() => askMentor("(INTERNAL COMMAND) What is RSI?", "What is RSI?", true)}
                  className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full transition-all hover:scale-105 active:scale-95">
                  What is RSI?
                </button>
                <button onClick={() => askMentor("(INTERNAL COMMAND) Is it a good time to buy?", "Is it a good time to buy?", true)}
                  className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full transition-all hover:scale-105 active:scale-95">
                  Is it a good time to buy?
                </button>
              </div>
            )}

            <form onSubmit={handleMentorSubmit} className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center space-x-2">
              <input type="text" value={mentorInput} onChange={(e) => setMentorInput(e.target.value)} disabled={isMentorTyping}
                placeholder="Ask me anything..."
                className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 px-5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-100 disabled:text-slate-400 shadow-inner" />
              <button type="submit" disabled={isMentorTyping || !mentorInput.trim()}
                className="w-10 h-10 rounded-xl bg-[#14532d] flex items-center justify-center text-white shrink-0 hover:bg-emerald-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95">
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast animation keyframe (injected once) */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
