import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

function useCountUp(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) { setStarted(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return { count, ref };
}

const TICKERS = [
  { name: 'HDFC Bank', change: '+4.2%', positive: true },
  { name: 'Reliance', change: '+1.8%', positive: true },
  { name: 'Infosys', change: '-0.5%', positive: false }
];

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tickerIndex, setTickerIndex] = useState(0);

  const [chartData, setChartData] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({ x: i, y: 50 + Math.random() * 40 }))
  );

  const students = useCountUp(200000, 2000);

  useEffect(() => {
    // Ticker cycle
    const tickerInterval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % TICKERS.length);
    }, 3000);

    // Chart live data simulation
    const chartInterval = setInterval(() => {
      setChartData(prev => {
        const next = [...prev.slice(1)];
        next.push({ x: prev[prev.length - 1].x + 1, y: 40 + Math.random() * 50 });
        return next;
      });
    }, 2000);

    return () => {
      clearInterval(tickerInterval);
      clearInterval(chartInterval);
    };
  }, []);

  const handleCtaClick = () => {
    if (currentUser) {
      navigate('/learn');
    } else {
      navigate('/signup');
    }
  };

  const ticker = TICKERS[tickerIndex];

  return (
    <div className="min-h-screen bg-[#EAF0EC]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight mb-6 text-[#0D2B1F]">
              Your personal finance mentor.
              <br />
              <span className="text-[#1DB88E]">Always on.</span>
            </h1>
            <p className="text-lg mb-8 leading-relaxed text-gray-600 max-w-lg">
              The only platform that teaches you finance AND lets you practice it — with an AI mentor watching every move. Built for India.
            </p>
            <div className="flex flex-wrap gap-4">
               <button
                 onClick={handleCtaClick}
                 className="px-8 py-4 rounded-xl text-white font-bold text-base bg-[#1DB88E] hover:bg-[#159a75] hover:scale-105 hover:shadow-[0_8px_30px_rgba(29,184,142,0.4)] transform transition-wait-motion"
               >
                 Start Learning Free
               </button>
            </div>
          </div>

          {/* Right — Floating Card */}
          <div className="flex justify-center relative">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-[#1DB88E] blur-[100px] opacity-20 rounded-full w-3/4 h-3/4 m-auto"></div>
            
            <div className="animate-float relative w-full max-w-md rounded-3xl p-6 shadow-2xl bg-[#0D2B1F] overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1DB88E] rounded-full filter blur-[60px] opacity-30 group-hover:opacity-50 transition-opacity"></div>
              
              <div key={tickerIndex} className="absolute top-4 right-4 bg-white/95 rounded-lg px-3 py-1.5 shadow-md flex items-center gap-1.5 animate-fade-in">
                <span className="text-xs font-bold text-gray-800">{ticker.name}</span>
                <span className={`text-xs font-bold ${ticker.positive ? 'text-[#1DB88E]' : 'text-red-500'}`}>{ticker.change}</span>
              </div>
              
              <div className="h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line 
                      type="monotone" 
                      dataKey="y" 
                      stroke="#1DB88E" 
                      strokeWidth={3} 
                      dot={false}
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center mt-4 border-t border-white/10 pt-4">
                <span className="text-xs font-mono text-[#1DB88E]/80 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1DB88E] animate-pulse"></span>
                  SYSTEM: ACTIVE
                </span>
                <span className="text-xs font-mono text-white/50">MARKET_FEED: LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Cards - Staggered */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📊', text: 'Only 27% of Indians are financially literate.', delay: '0ms' },
            { icon: '📱', text: 'Finance education is fragmented — 100 YouTube channels, 0 structured path.', delay: '150ms' },
            { icon: '🎯', text: "You can read all you want. Nobody gave you a safe space to practice.", delay: '300ms' },
          ].map((card, i) => (
            <div 
              key={i} 
              className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-default animate-slide-up-stagger"
              style={{ animationDelay: card.delay, animationFillMode: 'both' }}
            >
              <div className="bg-[#EAF0EC] w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6">
                {card.icon}
              </div>
              <p className="text-[#0D2B1F] font-bold text-lg leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-[#0D2B1F] mt-12" ref={students.ref}>
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-12 md:gap-24">
          {[
            { num: students.count > 0 ? `${Math.floor(students.count / 1000)},${String(students.count % 1000).padStart(3, '0')}+` : '0', label: 'Registered Students' },
            { num: '100% Free', label: 'Forever access' },
            { num: 'Built for', label: 'Bharat' },
          ].map((item, i) => (
            <div key={i} className="text-center text-white">
              <div className="text-3xl md:text-4xl font-extrabold text-[#1DB88E] mb-2">{item.num}</div>
              <div className="text-white/70 text-sm font-medium uppercase tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 text-center border-t border-gray-100">
        <p className="text-gray-400 text-sm font-medium">© 2024 FinIQ Beta · Learn. Practice. Master.</p>
      </footer>
    </div>
  );
}
