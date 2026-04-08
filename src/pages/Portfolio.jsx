import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';

const PIE_DATA = [
  { name: 'Nifty 50 ETF', pct: 45, color: '#0D6B5B' },
  { name: 'HDFC Bank', pct: 25, color: '#D4A017' },
  { name: 'Reliance Ind.', pct: 20, color: '#1D9E75' },
  { name: 'Cash Reserve', pct: 10, color: '#E5E7EB' },
];

function Sparkline({ color, up }) {
  const data = Array.from({ length: 10 }, (_, i) => ({ v: 50 + (up ? i * 3 : -i * 2) + Math.random() * 8 }));
  return (
    <ResponsiveContainer width={70} height={40}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function Portfolio() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const exportCSV = () => {
    const rows = [['Date', 'Type', 'Asset', 'Qty', 'Amount']];
    state.portfolio.trades.forEach(t => rows.push([t.date, t.type, t.instrument, t.qty, t.total]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'finiq_trades.csv';
    a.click();
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#EDF4F2' }}>
      {/* Slide-out Sidebar Trigger */}
      <div
        className="fixed left-0 top-0 bottom-0 w-3 z-50"
        onMouseEnter={() => setSidebarOpen(true)}
      />
      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col items-center py-8 gap-8 transition-transform duration-300"
        style={{ width: '56px', backgroundColor: '#0D2B25', transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        {[
          { icon: '🏠', path: '/' }, { icon: '🎓', path: '/learn' },
          { icon: '📖', path: '/bookiq' }, { icon: '📊', path: '/track', active: true },
          { icon: '👥', path: '/community' },
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${item.active ? 'ring-2' : 'hover:bg-white/10'}`}
            style={item.active ? { backgroundColor: '#1D9E7530', ringColor: '#1D9E75' } : {}}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-extrabold" style={{ color: '#1A1A2E' }}>Track Portfolio</h1>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-400">Total Portfolio Value</p>
            <p className="text-3xl font-extrabold" style={{ color: '#0D6B5B' }}>₹{(state.portfolio.currentValue + state.portfolio.virtualBalance).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left — Allocation */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base" style={{ color: '#1A1A2E' }}>Asset Allocation</h2>
              <span className="text-gray-400">🥧</span>
            </div>
            <div className="relative flex justify-center my-4">
              <PieChart width={220} height={220}>
                <Pie data={PIE_DATA} cx={110} cy={110} innerRadius={70} outerRadius={100} dataKey="pct" startAngle={90} endAngle={-270}>
                  {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-400 uppercase">Positions</p>
                <p className="text-3xl font-extrabold" style={{ color: '#1A1A2E' }}>03</p>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              {PIE_DATA.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#1A1A2E' }}>{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Positions */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Nifty 50 ETF', ticker: 'NIFTYBEES', pct: '+8.4%', pos: true, value: '₹50,364', avg: '₹212.4' },
              { name: 'HDFC Bank', ticker: 'HDFCBANK', pct: '-1.2%', pos: false, value: '₹27,980', avg: '₹1,460.0' },
              { name: 'Reliance Ind.', ticker: 'RELIANCE', pct: '+5.7%', pos: true, value: '₹22,384', avg: '₹2,752.0' },
              null,
            ].map((pos, i) => pos === null ? (
              <div
                key={i}
                onClick={() => navigate('/practice')}
                className="bg-white rounded-2xl p-6 shadow-sm border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 transition-all group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#E6F7F2' }}>
                  <span className="text-xl">+</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: '#0D6B5B' }}>New Trade</span>
              </div>
            ) : (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#1A1A2E' }}>{pos.name}</p>
                    <p className="text-xs text-gray-400">{pos.ticker}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: pos.pos ? '#1D9E75' : '#E53E3E' }}>{pos.pct}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Sparkline color={pos.pos ? '#1D9E75' : '#E53E3E'} up={pos.pos} />
                  <div className="text-right">
                    <p className="font-extrabold text-sm" style={{ color: '#1A1A2E' }}>{pos.value}</p>
                    <p className="text-xs text-gray-400">Avg: {pos.avg}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Log */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#0D6B5B' }}>Trade Log</h2>
            <button onClick={exportCSV} className="text-sm font-semibold hover:underline" style={{ color: '#0D6B5B' }}>View Export ↓</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                {['DATE', 'TYPE', 'ASSET', 'QTY', 'AMOUNT'].map(h => (
                  <th key={h} className="pb-3 text-xs text-gray-400 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.portfolio.trades.slice(0, 8).map((t, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-3 text-sm text-gray-600">{t.date}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: t.type === 'BUY' ? '#E6F7F2' : '#FEF2F2', color: t.type === 'BUY' ? '#0D6B5B' : '#E53E3E' }}>
                      {t.type}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-700">{t.instrument}</td>
                  <td className="py-3 text-sm text-gray-600">{t.qty}</td>
                  <td className="py-3 text-sm font-semibold" style={{ color: '#1A1A2E' }}>₹{t.total.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
