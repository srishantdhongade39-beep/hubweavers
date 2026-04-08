import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const CHAPTERS = [
  { id: 0, title: 'Introduction', status: 'completed' },
  { id: 1, title: 'Ch 1: Mr. Market', status: 'active' },
  { id: 2, title: 'Ch 2: Defensive Investor', status: 'locked' },
  { id: 3, title: 'Ch 3: Margin of Safety', status: 'locked' },
  { id: 4, title: 'Ch 4: Market Fluctuations', status: 'locked' },
  { id: 5, title: 'Conclusion', status: 'locked' },
];

const KEY_TERMS = [
  { term: 'NAV', def: 'Net Asset Value — the price per unit of a mutual fund, calculated daily based on total portfolio value.' },
  { term: 'CAGR', def: 'Compound Annual Growth Rate — the smoothed yearly return showing how fast your investment grew.' },
  { term: 'Expense Ratio', def: 'Annual fee charged by the fund house, expressed as a percentage of your investment.' },
  { term: 'SIP', def: 'Systematic Investment Plan — investing a fixed amount regularly, like ₹2,000 every month.' },
];

export default function LearnLesson() {
  const navigate = useNavigate();
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    setTimeout(() => setProgressWidth(15), 100);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF4F2' }}>
      <div className="fixed top-16 left-0 right-0 h-1 bg-gray-200 z-40">
        <div className="h-full rounded-r-full transition-all duration-1000 ease-out" style={{ width: `${progressWidth}%`, backgroundColor: '#0D6B5B' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <button onClick={() => navigate('/learn')} className="flex items-center gap-1 text-sm font-medium mb-4 hover:opacity-70 transition-opacity" style={{ color: '#0D6B5B' }}>
                ← Back
              </button>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Table of Contents</p>
              <div className="space-y-1">
                {CHAPTERS.map(ch => (
                  <div
                    key={ch.id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      ch.status === 'active' ? 'font-bold' : ch.status === 'locked' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                    style={ch.status === 'active' ? { backgroundColor: '#E6F7F2', color: '#0D6B5B' } : {}}
                  >
                    <span className="text-sm">{ch.title}</span>
                    {ch.status === 'completed' && <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: '#1D9E75' }}>✓</div>}
                    {ch.status === 'active' && <span className="text-[10px] font-semibold" style={{ color: '#0D6B5B' }}>READING NOW</span>}
                    {ch.status === 'locked' && <span className="text-gray-400">🔒</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs uppercase tracking-widest text-gray-400">Reading Progress</p>
                <span className="text-xs text-gray-500">1 of 12</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${progressWidth}%`, backgroundColor: '#0D6B5B', transition: 'width 1s ease-out' }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">1 of 12 Lessons</p>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#0D6B5B' }}>Investing 101</span>
                <span className="text-xs text-gray-500">Lesson 3 of 8</span>
              </div>

              <h1 className="text-2xl font-extrabold mb-6" style={{ color: '#1A1A2E' }}>
                What is a Mutual Fund and how does a SIP work?
              </h1>

              <div className="space-y-4 text-gray-600 leading-relaxed text-base">
                <p>A <strong>Mutual Fund</strong> is like a pool where thousands of investors put their money together, and a professional fund manager invests it across stocks, bonds, or other assets. Instead of buying shares of Infosys directly, you buy units of a fund that already holds Infosys, TCS, HDFC Bank, and 47 other companies.</p>
                <p>The beauty? With just ₹500, you get exposure to India's top companies. As those companies grow, your NAV (unit price) grows too. Your ₹500 isn't tied to one company's fate — it's spread across the entire economy.</p>
                <p>A <strong>SIP (Systematic Investment Plan)</strong> lets you invest a fixed amount every month automatically — like an EMI, but for your future self. Set up ₹2,000/month, and it gets invested on the same date every month regardless of whether the market is up or down.</p>
                <p>When markets fall, your ₹2,000 buys more units. When markets rise, your existing units are worth more. Over time, this <em>Rupee Cost Averaging</em> smooths out volatility and creates compounding wealth.</p>
              </div>

              {/* Real Indian Example */}
              <div className="mt-8 p-5 rounded-xl" style={{ backgroundColor: '#FEF9E7', borderLeft: '4px solid #D4A017' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-600 font-bold text-sm">🇮🇳 Real Indian Example</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <strong>Priya, 22, from Pune</strong> starts a ₹2,000/month SIP in a Nifty 50 Index Fund at 12% CAGR.
                  By age 45, she'll have invested ₹5.52 lakh — but her portfolio will be worth <strong>₹27 lakh</strong>.
                  That's the power of compounding and time in the market.
                </p>
              </div>

              {/* Key Terms */}
              <div className="mt-8">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#1A1A2E' }}>Key Terms</h2>
                <div className="space-y-3">
                  {KEY_TERMS.map(({ term, def }) => (
                    <div key={term} className="flex gap-3">
                      <span className="font-bold text-sm flex-shrink-0" style={{ color: '#0D6B5B' }}>{term}</span>
                      <span className="text-sm text-gray-600">{def}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/quiz')}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm border-2 hover:bg-gray-50 transition-all"
                  style={{ borderColor: '#0D6B5B', color: '#0D6B5B' }}
                >
                  Take the Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
