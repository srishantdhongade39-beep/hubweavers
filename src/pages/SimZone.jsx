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
  TrendingDown
} from 'lucide-react';
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

  // ── Toast state ──
  const [toast, setToast] = useState(null); // { message, type: 'success'|'sell'|'error' }

  // ── App context ──
  const { state, placeTrade, INSTRUMENT_MAP } = useApp();
  const currentPrice = state.prices[activeInstrument] || 0;
  const portfolio = state.portfolio;
  const instrumentInfo = INSTRUMENT_MAP[activeInstrument];

  // ── Mentor state ──
  const [mentorState, setMentorState] = useState(() => localStorage.getItem('simzone_mentor_state') || 'open');
  const [mentorMessages, setMentorMessages] = useState([
    { role: 'ai', text: 'Namaste! I see you have ₹1,00,000 ready. Look at the chart and let me know if you need help, or just place a trade and I will evaluate it!' }
  ]);
  const [isMentorTyping, setIsMentorTyping] = useState(false);
  const [mentorInput, setMentorInput] = useState('');
  const chatScrollRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartSeriesRef = useRef(null);

  // ── Persist mentor state ──
  useEffect(() => { localStorage.setItem('simzone_mentor_state', mentorState); }, [mentorState]);

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
  const askMentor = async (query, visibleQuery = null) => {
    if (!query.trim()) return;
    setMentorMessages(prev => [...prev, { role: 'user', text: visibleQuery || query }]);
    setMentorInput('');
    setIsMentorTyping(true);
    setMentorState('open');
    const ctxData = {
      portfolioValue: formatMoney(portfolio.currentValue),
      virtualBalance: formatMoney(portfolio.virtualBalance),
      instrument: instrumentInfo?.name,
      price: formatMoney(currentPrice)
    };
    const response = await generateMentorResponse(query, ctxData);
    setMentorMessages(prev => [...prev, { role: 'ai', text: response }]);
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
    askMentor(`I just bought 1 unit of ${instrumentInfo?.name} at ${formatMoney(currentPrice)}. What do you think about this trade?`);
  };

  const handleSell = () => {
    const pos = portfolio.positions[activeInstrument];
    if (!pos || pos.qty < 1) {
      showToast("You don't own any shares of this stock!", 'error');
      return;
    }
    placeTrade(activeInstrument, 'SELL', 1);
    showToast(`Sold 1 share of ${instrumentInfo?.name} at ${formatMoney(currentPrice)}`, 'sell');
    askMentor(`I just sold 1 unit of ${instrumentInfo?.name} at ${formatMoney(currentPrice)}. What do you think about this trade?`);
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
          const price = state.prices[key] || 0;
          const changePct = ((price - (price / (1 + (Math.random() - 0.5) * 0.01))) / price * 100).toFixed(2);
          const isUp = parseFloat(changePct) >= 0;
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
        <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between shrink-0">
          <div>
            <div className="p-6 pb-2">
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

          {/* Virtual Balance Card */}
          <div className="p-4">
            <div className="rounded-2xl p-5 w-full text-white relative overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #065f46 50%, #14532d 100%)' }}>
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-400/20 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-teal-300/15 rounded-full blur-2xl -ml-6 -mb-6 pointer-events-none" />
              <div className="flex items-center space-x-2 mb-3 relative z-10">
                <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-emerald-200" />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-emerald-200/90">Virtual Balance</span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight mb-1 relative z-10 drop-shadow-sm">
                {formatMoney(portfolio.virtualBalance)}
              </div>
              <div className={`text-sm font-semibold flex items-center relative z-10 mt-2 ${portfolio?.todayPnL >= 0 ? 'text-emerald-200' : 'text-red-300'}`}>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${portfolio?.todayPnL >= 0 ? 'bg-emerald-400/20' : 'bg-red-400/20'}`}>
                  {portfolio?.todayPnL >= 0 ? '▲' : '▼'} {portfolio?.todayPnL >= 0 ? '+' : ''}{formatMoney(portfolio?.todayPnL || 0)}
                </span>
                <span className="text-white/50 font-normal ml-2 text-xs tracking-wide">Today's P&L</span>
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
        <div className="hidden md:flex w-80 bg-white flex-col shrink-0 overflow-y-auto">

          {/* Watchlist Section */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Watchlist</h3>
            </div>
            <div className="space-y-3">
              {watchlistKeys.map(key => {
                const info = INSTRUMENT_MAP[key];
                if (!info) return null;
                const p = state.prices[key] || 0;
                const change = (Math.random() * 0.5 + 0.1).toFixed(2);
                const isUp = Math.random() > 0.5;
                return (
                  <div key={key} onClick={() => setActiveInstrument(key)}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer border ${activeInstrument === key ? 'bg-green-50 border-green-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'}`}>
                    <div>
                      <h4 className="font-bold text-sm tracking-tight">{info.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">{info.ticker}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-slate-900">{formatMoney(p)}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                        {isUp ? '+' : '-'}{change}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 space-y-4">

            {/* SimZone Mentor Card */}
            <div className={`bg-white rounded-xl shadow-lg shadow-black/5 border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${
              mentorState === 'closed' ? 'hidden' : mentorState === 'minimized' ? 'h-[46px] cursor-pointer' : 'h-[400px]'
            }`} onClick={() => { if (mentorState === 'minimized') setMentorState('open'); }}>
              <div className="bg-green-900 px-4 py-3 flex items-center justify-between shrink-0 h-[46px]">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-green-50 tracking-wide uppercase">SimZone Mentor ✨</span>
                </div>
                <div className="flex items-center space-x-1">
                  {mentorState === 'minimized' ? (
                    <button className="text-green-300 hover:text-white transition-colors p-1"><ChevronUp className="w-4 h-4" /></button>
                  ) : (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setMentorState('minimized'); }} className="text-green-300 hover:text-white transition-colors p-1"><Minus className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setMentorState('closed'); }} className="text-green-300 hover:text-white transition-colors p-1"><X className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
              <div className={`flex flex-col flex-1 overflow-hidden transition-opacity duration-300 ${mentorState === 'minimized' ? 'opacity-0' : 'opacity-100'}`}>
                <div ref={chatScrollRef} className="flex-1 p-4 bg-white overflow-y-auto space-y-4 text-sm">
                  {mentorMessages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[90%] rounded-xl px-4 py-3 ${
                        msg.role === 'user' ? 'bg-green-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                      }`}>
                        {renderFormattedText(msg.text, msg.role)}
                      </div>
                    </div>
                  ))}
                  {isMentorTyping && (
                    <div className="flex items-start">
                      <div className="bg-slate-100 text-slate-800 rounded-xl rounded-bl-none border border-slate-200 px-3 py-2 flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                        <span className="text-xs font-medium text-slate-500">Analyzing market...</span>
                      </div>
                    </div>
                  )}
                </div>
                {mentorMessages.length === 1 && (
                  <div className="px-4 pb-2 bg-white flex flex-wrap gap-2 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); askMentor("What is RSI?"); }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-full transition-colors border border-slate-200">
                      What is RSI?
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); askMentor(`Is ${instrumentInfo?.ticker} a good buy right now?`); }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-full transition-colors border border-slate-200">
                      Is it a good time to buy?
                    </button>
                  </div>
                )}
                <form onSubmit={handleMentorSubmit} className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <input type="text" value={mentorInput} onChange={(e) => setMentorInput(e.target.value)} disabled={isMentorTyping}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-white border border-slate-200 rounded-full py-1.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-100 disabled:text-slate-400" />
                  <button type="submit" disabled={isMentorTyping || !mentorInput.trim()}
                    className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white shrink-0 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </div>

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

        {/* ── FLOATING MENTOR REOPEN BUTTON ── */}
        <button onClick={() => setMentorState('open')}
          className={`absolute bottom-6 right-6 z-50 bg-[#14532d] text-white px-4 py-3 rounded-full shadow-2xl flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 hover:bg-[#166534] ${
            mentorState === 'closed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}>
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold text-sm tracking-wide">Mentor</span>
        </button>
      </div>

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
