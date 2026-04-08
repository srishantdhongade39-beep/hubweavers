import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AnimatedNumber({ target, label, duration = 1500 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return (
    <div>
      <div className="text-xs uppercase tracking-widest mb-1" style={{ color: '#6B7280' }}>{label}</div>
      <div className="text-2xl font-extrabold" style={{ color: '#0D6B5B' }}>
        {typeof target === 'number' && target > 1000 
          ? `${Math.floor(val / 1000)}K+`
          : target === 12 ? `₹${val}B+` : `${val}+`
        }
      </div>
    </div>
  );
}

export default function LearnWelcome() {
  const navigate = useNavigate();
  const [progressWidth, setProgressWidth] = useState(0);
  const [knowledgeWidth, setKnowledgeWidth] = useState(0);

  useEffect(() => {
    setTimeout(() => setProgressWidth(30), 100);
    setTimeout(() => setKnowledgeWidth(65), 300);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF4F2' }}>
      {/* Top progress bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-gray-200 z-40">
        <div
          className="h-full rounded-r-full transition-all duration-1000 ease-out"
          style={{ width: `${progressWidth}%`, backgroundColor: '#0D6B5B' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          {/* Left 60% */}
          <div className="md:col-span-3 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ backgroundColor: '#E6F7F2' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0D6B5B' }}></div>
              <span className="text-sm font-medium" style={{ color: '#0D6B5B' }}>FinIQ Learn</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6" style={{ color: '#0D6B5B' }}>
              Welcome to<br />Your Future.
            </h1>

            <p className="text-lg mb-8 leading-relaxed max-w-lg" style={{ color: '#6B7280' }}>
              Namaste! You're about to join 2,00,000+ Indians on a journey to financial freedom. 
              We'll help you learn, practice, and build wealth with confidence.
            </p>

            <button
              onClick={() => navigate('/learn/lesson')}
              className="group px-8 py-3.5 rounded-xl text-white font-semibold text-base hover:opacity-90 transition-all shadow-lg mb-10 flex items-center gap-2"
              style={{ backgroundColor: '#0D6B5B' }}
            >
              Let's Get Started 
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </button>

            <div className="grid grid-cols-3 gap-8">
              <AnimatedNumber target={200} label="Members Active" />
              <AnimatedNumber target={12} label="Wealth Generated" />
              <AnimatedNumber target={450} label="Learning Modules" />
            </div>
          </div>

          {/* Right 40% — Knowledge Card */}
          <div className="md:col-span-2 flex justify-center">
            <div className="animate-float-simple bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest text-gray-500">Knowledge Level</span>
                <span style={{ color: '#0D6B5B' }}>↗</span>
              </div>

              {/* Progress bar */}
              <div className="relative mb-3">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-[1500ms] ease-out"
                    style={{ width: `${knowledgeWidth}%`, backgroundColor: '#D4A017' }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">NOVICE</span>
                  <span className="text-[10px] text-gray-400">PRO</span>
                </div>
              </div>

              <h3 className="text-2xl font-extrabold mb-1" style={{ color: '#1A1A2E' }}>Intermediate</h3>
              <p className="text-sm text-gray-500 mb-4">Tier 3 Investor</p>
              
              <hr className="mb-4" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#0D6B5B' }}>AK</div>
                <div>
                  <div className="text-xs uppercase text-gray-400">Your Mentor</div>
                  <div className="font-bold text-sm" style={{ color: '#1A1A2E' }}>Arjun K.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
