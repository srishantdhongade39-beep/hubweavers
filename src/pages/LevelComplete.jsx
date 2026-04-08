import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CONFETTI_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF922B', '#CC5DE8', '#1D9E75', '#D4A017'];

function Confetti() {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    setPieces(Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 45,
      size: 8 + Math.random() * 8,
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      isDiamond: Math.random() > 0.5,
    })));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: p.isDiamond ? 'rotate(45deg)' : 'none',
            borderRadius: p.isDiamond ? '2px' : '3px',
            animation: `fall ${p.duration}s ease-in ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function LevelComplete() {
  const navigate = useNavigate();
  const { userData, updateUserData } = useAuth();
  const [claiming, setClaiming] = useState(false);

  const handleClaimReward = async () => {
    if (claiming) return;
    setClaiming(true);

    try {
      // 1. Add XP to User Context/Firestore
      if (userData && updateUserData) {
        await updateUserData({
          xp: (userData.xp || 0) + 450
        });
      }

      // 2. Chapter progression tracking via LocalStorage for the mocked lesson page
      const currentChapterStr = localStorage.getItem('lesson_active_idx');
      if (currentChapterStr) {
        let chapterIdx = parseInt(currentChapterStr, 10);
        // Save the index that was just completed to be unlocked
        localStorage.setItem('finiq_record_completion', chapterIdx.toString());
      } else {
        localStorage.setItem('finiq_record_completion', '1'); // Default fallback
      }

      // 3. Navigate back to lesson module
      navigate('/learn/lesson');
    } catch (e) {
      console.error(e);
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#EDF4F2' }}>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl relative animate-bounce-in">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left */}
          <div className="p-10 flex flex-col items-center relative border-b md:border-b-0 md:border-r border-gray-100 overflow-hidden">
            <Confetti />

            {/* Spinning Trophy */}
            <div className="relative mb-6">
              <div
                className="w-32 h-32 rounded-full border-4 border-dashed flex items-center justify-center"
                style={{ borderColor: '#F59E0B', animation: 'spin 4s linear infinite' }}
              >
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
                  <span className="text-5xl">🏆</span>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 mb-4">
              <span className="text-sm">✨</span>
              <span className="text-sm font-semibold text-gray-600">+450 XP Gained</span>
            </div>

            <h1 className="text-4xl font-extrabold text-center mb-3" style={{ color: '#0D6B5B' }}>Level 2 Complete!</h1>
            <p className="text-gray-500 text-center text-sm leading-relaxed mb-8">
              You've mastered the fundamentals of long-term investing and SIP mechanics.
            </p>

            <button
              onClick={handleClaimReward}
              disabled={claiming}
              className="w-full py-3.5 rounded-xl text-white font-bold hover:opacity-90 transition-all mb-3 disabled:opacity-50"
              style={{ backgroundColor: '#0D6B5B' }}
            >
              {claiming ? 'Claiming...' : 'Claim Rewards & Continue'}
            </button>
            <button
              onClick={() => navigate('/track')}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Right */}
          <div className="p-10 flex flex-col">
            <h2 className="text-xl font-extrabold mb-6" style={{ color: '#0D6B5B' }}>Knowledge Summary</h2>

            <div className="space-y-5 mb-8">
              {[
                { title: 'Compounding Power', desc: 'Understood how time multipliers affect small monthly savings.' },
                { title: 'Market Volatility', desc: 'Mastered Rupee Cost Averaging during market downturns.' },
                { title: 'Asset Allocation', desc: 'Learned the difference between Equity and Debt benchmarks.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5" style={{ backgroundColor: '#1D9E75' }}>✓</div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#1A1A2E' }}>{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Recommended Next</p>

            <div className="space-y-3">
              <div
                onClick={() => navigate('/learn')}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 cursor-pointer hover:border-amber-300 transition-all"
              >
                <span className="text-2xl p-2 rounded-xl" style={{ backgroundColor: '#FEF9E7' }}>📊</span>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: '#1A1A2E' }}>Level 3: Technical Analysis</p>
                  <p className="text-xs text-gray-500">Start reading candlesticks & trends.</p>
                </div>
                <span className="text-gray-400">→</span>
              </div>

              <div
                onClick={() => navigate('/quiz')}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 cursor-pointer hover:border-blue-300 transition-all"
              >
                <span className="text-2xl p-2 rounded-xl" style={{ backgroundColor: '#EEF2FF' }}>🛡️</span>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: '#1A1A2E' }}>Risk Profiling Quiz</p>
                  <p className="text-xs text-gray-500">Find your personal investor DNA.</p>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
