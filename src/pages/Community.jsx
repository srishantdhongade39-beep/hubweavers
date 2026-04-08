import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WEEKLY = [
  { rank: 1, initials: 'AM', name: 'Arjun Mehta', level: 6, title: 'Master Investor', streak: 142, badges: '🏆💎⭐', points: 12450, isYou: false },
  { rank: 2, initials: 'PV', name: 'Priya Verma', level: 5, title: 'Portfolio Pro', streak: 89, badges: '🥈🔥', points: 10820, isYou: false },
  { rank: 3, initials: 'SK', name: 'Siddharth K.', level: 5, title: 'Market Wizard', streak: 114, badges: '🥉📊', points: 9940, isYou: false },
  { rank: 14, initials: 'IS', name: 'Ishaan Sharma (You)', level: 2, title: 'SIP Starter', streak: 4, badges: '🌱', points: 2150, isYou: true },
  { rank: 15, initials: 'RA', name: 'Rohan Adani', level: 3, title: 'Compounder', streak: 22, badges: '📈', points: 1890, isYou: false },
];

const ALL_TIME = [
  { rank: 1, initials: 'RK', name: 'Ravi Kumar', level: 8, title: 'Wealth Legend', streak: 365, badges: '👑💰🏆', points: 85200, isYou: false },
  { rank: 2, initials: 'AM', name: 'Arjun Mehta', level: 6, title: 'Master Investor', streak: 142, badges: '🏆💎', points: 52450, isYou: false },
  { rank: 3, initials: 'NP', name: 'Neha Patil', level: 6, title: 'Alpha Generator', streak: 201, badges: '🥇🔥', points: 48900, isYou: false },
  { rank: 38, initials: 'IS', name: 'Ishaan Sharma (You)', level: 2, title: 'SIP Starter', streak: 4, badges: '🌱', points: 2150, isYou: true },
  { rank: 39, initials: 'RA', name: 'Rohan Adani', level: 3, title: 'Compounder', streak: 22, badges: '📈', points: 1890, isYou: false },
];

export default function Community() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('weekly');
  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState('');

  const rows = tab === 'weekly' ? WEEKLY : ALL_TIME;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const rankColor = (r) => r === 1 ? '#D4A017' : r === 2 ? '#9CA3AF' : r === 3 ? '#CD7F32' : '#6B7280';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF4F2' }}>
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg animate-slide-up" style={{ backgroundColor: '#1D9E75' }}>{toast}</div>
      )}

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <h1 className="text-3xl font-extrabold mb-1" style={{ color: '#1A1A2E' }}>Community</h1>
        <p className="text-gray-500 mb-8 text-sm">Rise through the ranks by mastering financial concepts and maintaining your streak.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT — Rankings */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="font-bold" style={{ color: '#1A1A2E' }}>Global Rankings — Season 4</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setTab('weekly')} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ backgroundColor: tab === 'weekly' ? '#0D6B5B' : 'transparent', color: tab === 'weekly' ? 'white' : '#6B7280' }}>Weekly</button>
                <button onClick={() => setTab('alltime')} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ backgroundColor: tab === 'alltime' ? '#0D6B5B' : 'transparent', color: tab === 'alltime' ? 'white' : '#6B7280' }}>All Time</button>
              </div>
            </div>

            <div className="space-y-2">
              {(expanded ? [...rows, ...rows.slice(0, 3)] : rows).map((entry, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all" style={entry.isYou ? { backgroundColor: '#E6F7F2' } : { backgroundColor: '#FAFAFA' }}>
                  <span className="text-sm font-extrabold w-6" style={{ color: rankColor(entry.rank) }}>#{entry.rank}</span>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: entry.isYou ? '#0D6B5B' : '#6B7280' }}>
                    {entry.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: entry.isYou ? '#0D6B5B' : '#1A1A2E' }}>{entry.name}</p>
                    <p className="text-xs text-gray-400">Lv.{entry.level} · {entry.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">🔥<span className="text-xs font-bold text-gray-600">{entry.streak}</span></div>
                  <span className="text-sm">{entry.badges}</span>
                  <span className="text-xs font-extrabold" style={{ color: '#0D6B5B' }}>{entry.points.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setExpanded(v => !v)} className="w-full text-center mt-4 text-sm font-semibold hover:underline" style={{ color: '#0D6B5B' }}>
              {expanded ? 'Show Less' : 'View Full Rankings →'}
            </button>
          </div>

          {/* RIGHT Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Weekly Challenge */}
            <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#0D6B5B' }}>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white/80">WEEKLY CHALLENGE</span>
              <h2 className="text-xl font-extrabold text-white mt-3 mb-2">The Dividend Hunter</h2>
              <p className="text-white/75 text-sm mb-4 leading-relaxed">Identify 3 stocks with consistent dividend payouts over 10 years in the Sandbox.</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-xs font-semibold">PROGRESS</span>
                <span className="text-white font-extrabold text-sm">66%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-4">
                <div className="h-full rounded-full" style={{ width: '66%', backgroundColor: '#D4A017' }} />
              </div>
              <button onClick={() => navigate('/practice')} className="w-full py-2.5 rounded-xl bg-white font-bold text-sm hover:bg-white/90 transition-all" style={{ color: '#0D6B5B' }}>GO TO SANDBOX</button>
              <p className="text-white/60 text-[10px] mt-3 text-center">REWARDS: +500 IQ POINTS, "YIELD FINDER" BADGE</p>
            </div>

            {/* Compete with Friends */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-extrabold mb-1" style={{ color: '#1A1A2E' }}>Compete with Friends</h3>
              <p className="text-xs text-gray-500 mb-4">Challenge friends to beat your IQ score this week.</p>
              <div className="mb-3">
                <p className="text-[10px] text-gray-400 uppercase mb-1">Invite Link</p>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs font-mono flex-1 text-gray-700">finiq.in/invite/ishaan_7</span>
                  <button onClick={() => { navigator.clipboard.writeText('finiq.in/invite/ishaan_7'); showToast('Link copied!'); }} className="text-gray-400 hover:text-gray-600 transition-colors">📋</button>
                </div>
              </div>
              <button className="w-full py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all" style={{ backgroundColor: '#0D6B5B' }}>Challenge a Friend</button>
            </div>

            {/* Redeem */}
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <span className="text-4xl block mb-3">🎁</span>
              <h3 className="font-extrabold mb-1" style={{ color: '#1A1A2E' }}>Redeem IQ Points</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">Use your hard-earned points to unlock exclusive financial masterclasses.</p>
              <button className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Visit Store</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
