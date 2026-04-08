import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';

const INSTRUMENT_NAMES = { nifty50: 'Nifty 50 ETF', hdfcBank: 'HDFC Bank', reliance: 'Reliance Ind.', sbiNifty: 'SBI Nifty Index Fund', tataMotors: 'Tata Motors', goldETF: 'Gold ETF' };

const EXTRA_TRADES = [
  { id: 6, date: '2024-02-10', time: '09:15', instrument: 'goldETF', type: 'BUY', qty: 2, price: 6180, total: 12360, pnl: 120, status: 'EXECUTED' },
  { id: 7, date: '2024-02-08', time: '10:40', instrument: 'reliance', type: 'SELL', qty: 1, price: 2870, total: 2870, pnl: -80, status: 'EXECUTED' },
  { id: 8, date: '2024-02-05', time: '14:00', instrument: 'nifty50', type: 'BUY', qty: 3, price: 22900, total: 68700, pnl: 1650, status: 'EXECUTED' },
  { id: 9, date: '2024-02-03', time: '11:22', instrument: 'hdfcBank', type: 'BUY', qty: 2, price: 1670, total: 3340, pnl: 100, status: 'EXECUTED' },
  { id: 10, date: '2024-01-30', time: '09:55', instrument: 'tataMotors', type: 'SELL', qty: 3, price: 875, total: 2625, pnl: 150, status: 'EXECUTED' },
];

const BAR_DATA = Array.from({ length: 28 }, (_, i) => ({ day: i, trades: Math.floor(Math.random() * 5) }));

export default function Track() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [filterInst, setFilterInst] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('30');
  const [filterType, setFilterType] = useState('all');
  const [showExtra, setShowExtra] = useState(false);

  const allTrades = [...state.portfolio.trades, ...(showExtra ? EXTRA_TRADES : [])];
  const filtered = allTrades.filter(t => {
    if (filterInst !== 'all' && t.instrument !== filterInst) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  const winRate = allTrades.length ? Math.round((allTrades.filter(t => t.pnl > 0).length / allTrades.length) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF4F2' }}>
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold" style={{ color: '#1A1A2E' }}>Track</h1>
          <button onClick={() => navigate('/track/portfolio')} className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-gray-200 hover:bg-white transition-all" style={{ color: '#0D6B5B' }}>View Portfolio Detail →</button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Realized P&L', val: '+₹4,230.50', sub: '↑ 12.4% vs last month', valColor: '#0D6B5B', subColor: '#1D9E75' },
            { label: 'Win Rate', val: `${winRate}%`, sub: `${allTrades.filter(t => t.pnl > 0).length} Wins / ${allTrades.filter(t => t.pnl <= 0).length} Losses`, valColor: '#1A1A2E', subColor: '#6B7280' },
            { label: 'Avg. Profit per Trade', val: '₹282.03', sub: 'Holding: 4.2 days avg.', valColor: '#1A1A2E', subColor: '#6B7280' },
            { label: 'Total Trades', val: `${allTrades.length}`, sub: 'Nifty 50 focused', valColor: '#1A1A2E', subColor: '#6B7280' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">{card.label}</p>
              <p className="text-2xl font-extrabold" style={{ color: card.valColor }}>{card.val}</p>
              <p className="text-xs mt-1" style={{ color: card.subColor }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Dark Analytics Card */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#0D2B25' }}>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select value={filterInst} onChange={e => setFilterInst(e.target.value)} className="px-3 py-2 rounded-lg text-sm text-white border bg-transparent" style={{ borderColor: '#1D9E7540' }}>
              <option value="all" className="text-black">All Instruments</option>
              {Object.entries(INSTRUMENT_NAMES).map(([k, v]) => <option key={k} value={k} className="text-black">{v}</option>)}
            </select>
            <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="px-3 py-2 rounded-lg text-sm text-white border bg-transparent" style={{ borderColor: '#1D9E7540' }}>
              <option value="30" className="text-black">Last 30 Days</option>
              <option value="90" className="text-black">Last 90 Days</option>
              <option value="365" className="text-black">All Time</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 rounded-lg text-sm text-white border bg-transparent" style={{ borderColor: '#1D9E7540' }}>
              <option value="all" className="text-black">All Types</option>
              <option value="BUY" className="text-black">BUY</option>
              <option value="SELL" className="text-black">SELL</option>
            </select>
            <span className="ml-auto text-xs font-mono" style={{ color: '#1D9E7560' }}>SYNC_STATUS: LIVE_MARKET_DB</span>
          </div>

          {/* Bar Chart */}
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Trade Frequency (Daily)</p>
          <div className="h-32 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BAR_DATA} barSize={6}>
                <Bar dataKey="trades" fill="#1D9E75" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trade Log Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  {['DATE / TIME', 'INSTRUMENT', 'TYPE', 'QTY', 'AVG. PRICE', 'P&L', 'STATUS'].map(h => (
                    <th key={h} className="pb-3 text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-1">
                {filtered.map((trade, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: '#ffffff08' }}>
                    <td className="py-3">
                      <p className="text-xs text-white">{trade.date}</p>
                      <p className="text-[10px]" style={{ color: '#6B7280' }}>{trade.time}</p>
                    </td>
                    <td className="py-3 text-xs text-white">{INSTRUMENT_NAMES[trade.instrument] || trade.instrument}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: trade.type === 'BUY' ? '#1D9E75' : '#E53E3E' }}>{trade.type}</span>
                    </td>
                    <td className="py-3 text-xs text-white">{trade.qty}</td>
                    <td className="py-3 text-xs text-white">₹{trade.price.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-xs font-bold" style={{ color: trade.pnl >= 0 ? '#1D9E75' : '#E53E3E' }}>{trade.pnl >= 0 ? '+' : ''}₹{trade.pnl}</td>
                    <td className="py-3 text-[10px] text-gray-500">{trade.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={() => setShowExtra(v => !v)}
              className="px-5 py-2 rounded-full text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition-all"
            >
              {showExtra ? 'Show Less' : 'Load More Trades'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 italic text-center">Note: All trades shown here are simulated 'Paper Trades' performed in the FinIQ Sandbox and involve no real capital.</p>
      </div>
    </div>
  );
}
