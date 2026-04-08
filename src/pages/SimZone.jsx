import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  ClipboardList,
  Briefcase,
  FileText,
  GraduationCap,
  Settings,
  Maximize2,
  X,
  Minus,
  ChevronUp,
  Lightbulb,
  Building2,
  ChevronRight,
  Send,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateMentorResponse } from '../config/groq';
import { createChart } from 'lightweight-charts';

// Helper to generate some dummy historical data for the chart
const generateDummyData = (basePrice) => {
  const data = [];
  let current = basePrice * 0.95; // start lower
  const today = new Date();
  today.setHours(0,0,0,0);
  for (let i = 50; i >= 0; i--) {
    const time = new Date(today);
    time.setDate(today.getDate() - i);
    const open = current;
    const high = current + Math.random() * 20;
    const low = current - Math.random() * 20;
    const close = (open + high + low) / 3 + (Math.random() - 0.4) * 10;
    data.push({
      time: time.toISOString().split('T')[0],
      open, high, low, close
    });
    current = close;
  }
  // Make the last candle exactly match currentPrice
  data[data.length - 1].close = basePrice;
  return data;
};

export default function SimZone() {
  const [activeTimeframe, setActiveTimeframe] = useState('1M');
  const [activeTradeTab, setActiveTradeTab] = useState('Trade History');
  const [activeInstrument, setActiveInstrument] = useState('reliance');

  const { state, placeTrade, INSTRUMENT_MAP } = useApp();
  const currentPrice = state.prices[activeInstrument] || 0;
  const portfolio = state.portfolio;
  const instrumentInfo = INSTRUMENT_MAP[activeInstrument];

  // Mentor Chat State - 3 states: "open", "minimized", "closed"
  const [mentorState, setMentorState] = useState(() => {
    return localStorage.getItem('simzone_mentor_state') || 'open';
  });

  // Persist mentor state to localStorage
  useEffect(() => {
    localStorage.setItem('simzone_mentor_state', mentorState);
  }, [mentorState]);

  const [mentorMessages, setMentorMessages] = useState([
    { role: 'ai', text: 'Namaste! I see you have ₹1,00,000 ready. Look at the chart and let me know if you need help, or just place a trade and I will evaluate it!' }
  ]);
  const [isMentorTyping, setIsMentorTyping] = useState(false);
  const [mentorInput, setMentorInput] = useState('');
  const chatScrollRef = useRef(null);

  const chartContainerRef = useRef(null);
  const chartSeriesRef = useRef(null);

  // Auto-scroll logic for Mentor Chat
  useEffect(() => {
    if (chatScrollRef.current && mentorState === 'open') {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [mentorMessages, isMentorTyping, mentorState]);

  // TradingView Lightweight Charts initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: '#0a0f0f' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#16a34a', downColor: '#dc2626', borderVisible: false,
      wickUpColor: '#16a34a', wickDownColor: '#dc2626',
    });

    const data = generateDummyData(currentPrice);
    candlestickSeries.setData(data);

    chartSeriesRef.current = candlestickSeries;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartSeriesRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInstrument]); // reinitialize on instrument change

  // Update current live price candle
  useEffect(() => {
    if (chartSeriesRef.current) {
      const today = new Date().toISOString().split('T')[0];
      const fakeHigh = currentPrice + 5;
      const fakeLow = currentPrice - 5;
      
      chartSeriesRef.current.update({
        time: today,
        open: currentPrice - 2, // arbitrary
        high: fakeHigh,
        low: fakeLow,
        close: currentPrice
      });
    }
  }, [currentPrice]);

  // Formatting currency safely
  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  // Convert raw AI text blocks with pseudo-markdown into clean HTML tags
  const renderFormattedText = (text, role) => {
    // If it's a user message, just return it as a simple string
    if (role === 'user') return text;

    return text.split('\n').map((line, i) => {
      // Empty line spacer
      if (!line.trim()) return <div key={i} className="h-1.5" />;
      
      // Split the line by strict **bold** markdown tags
      const parts = line.split(/(\*\*.*?\*\*)/g);
      
      return (
        <p key={i} className="mb-2 last:mb-0 leading-relaxed text-[13px]">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              // Ensure bolded text stands out but inherits correct coloring context
              return <strong key={j} className="font-bold text-green-950">{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  };

  const askMentor = async (query, visibleQuery = null) => {
    if (!query.trim()) return;
    const userDisplay = visibleQuery || query;
    setMentorMessages(prev => [...prev, { role: 'user', text: userDisplay }]);
    setMentorInput('');
    setIsMentorTyping(true);
    setMentorState('open'); // make sure it's open if asked a question
    
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

  const handleBuy = () => {
    placeTrade(activeInstrument, 'BUY', 1); // defaulting to qty=1 for simplicity
    askMentor(`I just bought 1 unit of ${instrumentInfo?.name} at ${formatMoney(currentPrice)}. What do you think about this trade?`);
  };

  const handleSell = () => {
    placeTrade(activeInstrument, 'SELL', 1);
    askMentor(`I just sold 1 unit of ${instrumentInfo?.name} at ${formatMoney(currentPrice)}. What do you think about this trade?`);
  };

  const handleMentorSubmit = (e) => {
    e.preventDefault();
    askMentor(mentorInput);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      
      {/* TOP BAR */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
        <div className="flex items-center space-x-2">
          {/* Hamburger Menu Mobile */}
          <button className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-green-600 items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">SimZone</span>
        </div>

        <div className="flex items-center space-x-6 flex-1 max-w-2xl px-8">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full bg-slate-100 border-none rounded-full py-1.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          
          <div className="flex items-center space-x-1 bg-slate-100 rounded-md p-1">
            <div className="px-3 py-1 bg-white shadow-sm rounded text-xs font-semibold text-slate-700 uppercase tracking-wide">
              {instrumentInfo?.ticker}
            </div>
            <button className="px-2 py-1 hover:bg-slate-200 rounded text-slate-500"><X className="w-3 h-3" /></button>
          </div>

          <div className="flex items-center space-x-4 text-sm font-medium text-slate-500">
            {['1D', '5D', '1M', '6M', '1Y'].map(tf => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`pb-1 relative transition-colors ${
                  activeTimeframe === tf ? 'text-slate-900' : 'hover:text-slate-700'
                }`}
              >
                {tf}
                {activeTimeframe === tf && (
                  <span className="absolute bottom-[-19px] left-0 right-0 h-0.5 bg-green-600"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={handleSell}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded shadow-sm transition-colors">
            SELL {formatMoney(currentPrice)}
          </button>
          <button 
            onClick={handleBuy}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded shadow-sm transition-colors">
            BUY {formatMoney(currentPrice)}
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT SIDEBAR */}
        <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between shrink-0">
          <div>
            <div className="p-6 pb-2">
              <h2 className="font-bold text-lg leading-tight">SimZone Terminal</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Learning Mode</p>
            </div>
            
            <nav className="px-3 mt-4 space-y-1">
              {[
                { name: 'Dashboard', icon: LayoutDashboard, active: true },
                { name: 'Watchlist', icon: ClipboardList },
                { name: 'Portfolio', icon: Briefcase },
                { name: 'Orders', icon: FileText },
                { name: 'Academy', icon: GraduationCap },
              ].map(item => (
                <button 
                  key={item.name}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    item.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.active ? 'text-green-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4">
            
            {/* VIRTUAL BALANCE CARD — Premium standout */}
            <div className="rounded-2xl p-5 w-full text-white relative overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #065f46 50%, #14532d 100%)' }}>
              {/* Decorative glows */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-400/20 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-teal-300/15 rounded-full blur-2xl -ml-6 -mb-6 pointer-events-none"></div>
              
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

        {/* MAIN CENTER AREA */}
        <div className="flex-1 flex flex-col relative bg-[#f8fafc] border-r border-slate-200">
          
          {/* CHART HEADER */}
          <div className="h-12 bg-[#0a0f0f] flex items-center justify-between px-4 text-slate-300 text-xs font-mono border-b border-gray-800">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-white tracking-wider">{instrumentInfo?.ticker} · 1D</span>
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

          {/* CHART AREA */}
          <div className="flex-1 bg-[#0a0f0f] relative overflow-hidden flex">
            {/* TradingView Lightweight Charts Container */}
            <div ref={chartContainerRef} className="flex-1 w-full h-full relative" />
          </div>

          {/* TRADE PANEL */}
          <div className="h-64 bg-[#0F171A] text-white flex flex-col shrink-0 border-t border-gray-800">
            <div className="flex items-center space-x-6 px-4 border-b border-gray-800">
              {['Trade History', 'Positions'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTradeTab(tab)}
                  className={`py-3 text-sm font-medium relative ${
                    activeTradeTab === tab ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tab}
                  {activeTradeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></span>
                  )}
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
                    const currentVal = pos.value;
                    const invested = pos.avgPrice * pos.qty;
                    const pnl = currentVal - invested;
                    return (
                      <tr key={key} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{INSTRUMENT_MAP[key]?.ticker}</td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold border border-blue-500/30">HOLD</span>
                        </td>
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
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>


        </div>

        {/* RIGHT PANEL */}
        <div className="hidden md:flex w-80 bg-white flex-col shrink-0 overflow-y-auto">
          
          {/* Watchlist Section */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Watchlist</h3>
              <button className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                +
              </button>
            </div>
            
            <div className="space-y-3">
              {Object.entries(INSTRUMENT_MAP).map(([key, info]) => {
                  if(key === 'nifty50' || key === 'sbiNifty') return null; // hide some to save space
                  const p = state.prices[key];
                  const change = (Math.random() * 0.5 + 0.1).toFixed(2); // fake change logic for purely visual mockup
                  const isUp = Math.random() > 0.5;
                  return (
                    <div 
                      key={key}
                      onClick={() => setActiveInstrument(key)}
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
            
            {/* SimZone Mentor Card (CSS hides/shrinks it based on mentorState) */}
            <div 
              className={`bg-white rounded-xl shadow-lg shadow-black/5 border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${
                mentorState === 'closed' ? 'hidden' : 
                mentorState === 'minimized' ? 'h-[46px] cursor-pointer' : 'h-[400px]'
              }`}
              onClick={(e) => {
                if(mentorState === 'minimized') setMentorState('open');
              }}
            >
              <div className="bg-green-900 px-4 py-3 flex items-center justify-between shrink-0 h-[46px]">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-green-50 tracking-wide uppercase">SimZone Mentor ✨</span>
                </div>
                <div className="flex items-center space-x-1">
                  {mentorState === 'minimized' ? (
                    <button className="text-green-300 hover:text-white transition-colors p-1">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMentorState('minimized'); }} 
                        className="text-green-300 hover:text-white transition-colors p-1"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMentorState('closed'); }} 
                        className="text-green-300 hover:text-white transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Internal elements - hide visibility to prevent layout reflow glitches during height transition */}
              <div className={`flex flex-col flex-1 overflow-hidden transition-opacity duration-300 ${mentorState === 'minimized' ? 'opacity-0' : 'opacity-100'}`}>
                
                {/* Chat History */}
                <div 
                  ref={chatScrollRef}
                  className="flex-1 p-4 bg-white overflow-y-auto space-y-4 text-sm"
                >
                  {mentorMessages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[90%] rounded-xl px-4 py-3 ${
                        msg.role === 'user' 
                        ? 'bg-green-600 text-white rounded-br-none' 
                        : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
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

                {/* Optional Suggestions (only if no deep chat yet) */}
                {mentorMessages.length === 1 && (
                  <div className="px-4 pb-2 bg-white flex flex-wrap gap-2 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); askMentor("What is RSI?"); }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-full transition-colors border border-slate-200">
                      What is RSI?
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); askMentor(`Is ${instrumentInfo?.ticker} a good buy right now?`); }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-full transition-colors border border-slate-200">
                      Is it a good time to buy?
                    </button>
                  </div>
                )}
                
                {/* Input form */}
                <form onSubmit={handleMentorSubmit} className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                   <input 
                     type="text" 
                     value={mentorInput}
                     onChange={(e) => setMentorInput(e.target.value)}
                     disabled={isMentorTyping}
                     placeholder="Ask me anything..."
                     className="flex-1 bg-white border border-slate-200 rounded-full py-1.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-100 disabled:text-slate-400"
                   />
                   <button 
                     type="submit"
                     disabled={isMentorTyping || !mentorInput.trim()}
                     className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white shrink-0 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                   >
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

            {/* Key Stats Section */}
            <div className="px-1 mt-6">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Key Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Market Cap</span>
                  <span className="font-semibold text-slate-900">20.14T</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500">P/E Ratio</span>
                  <span className="font-semibold text-slate-900">28.4</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Div Yield</span>
                  <span className="font-semibold text-slate-900">0.34%</span>
                </div>
                <div className="flex justify-between text-sm pb-2">
                  <span className="text-slate-500">52W High</span>
                  <span className="font-semibold text-slate-900">{formatMoney(currentPrice * 1.15)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FLOATING REOPEN BUTTON (When Closed) */}
        <button 
          onClick={() => setMentorState('open')}
          className={`absolute bottom-6 right-6 z-50 bg-[#14532d] text-white px-4 py-3 rounded-full shadow-2xl flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 hover:bg-[#166534] ${
            mentorState === 'closed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold text-sm tracking-wide">Mentor</span>
        </button>

      </div>
    </div>
  );
}
