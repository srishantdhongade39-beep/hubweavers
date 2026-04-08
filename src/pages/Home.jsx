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

      {/* Live Stock Ticker Banner */}
      <div className="w-full overflow-hidden" style={{ backgroundColor: '#0a0f0f', height: '36px' }}>
        <div className="ticker-scroll flex items-center h-full whitespace-nowrap">
          {[...Array(2)].map((_, loopIdx) => (
            <div key={loopIdx} className="flex items-center shrink-0">
              {[
                { symbol: 'RELIANCE', price: '₹2,903.45', change: '+1.24%', up: true },
                { symbol: 'HDFCBANK', price: '₹1,726.80', change: '-0.38%', up: false },
                { symbol: 'TCS', price: '₹3,542.10', change: '+0.65%', up: true },
                { symbol: 'INFY', price: '₹1,487.30', change: '+0.92%', up: true },
                { symbol: 'TATAMOTORS', price: '₹890.55', change: '-1.12%', up: false },
                { symbol: 'WIPRO', price: '₹462.15', change: '+0.34%', up: true },
                { symbol: 'ICICIBANK', price: '₹1,198.70', change: '+0.78%', up: true },
                { symbol: 'AXISBANK', price: '₹1,087.25', change: '-0.21%', up: false },
                { symbol: 'BAJFINANCE', price: '₹6,823.90', change: '+1.56%', up: true },
                { symbol: 'HINDUNILVR', price: '₹2,345.60', change: '-0.45%', up: false },
                { symbol: 'SBIN', price: '₹812.40', change: '+0.88%', up: true },
                { symbol: 'ADANIENT', price: '₹2,678.15', change: '+2.13%', up: true },
                { symbol: 'MARUTI', price: '₹12,456.30', change: '-0.67%', up: false },
                { symbol: 'LT', price: '₹3,412.85', change: '+0.41%', up: true },
                { symbol: 'SUNPHARMA', price: '₹1,654.20', change: '+1.07%', up: true },
              ].map((s, i) => (
                <span key={i} className="flex items-center text-xs font-mono tracking-tight mx-4">
                  <span className="text-white/90 font-semibold">{s.symbol}</span>
                  <span className="text-white/60 ml-2">{s.price}</span>
                  <span className={`ml-1.5 font-bold ${s.up ? 'text-green-400' : 'text-red-400'}`}>
                    {s.up ? '▲' : '▼'} {s.change}
                  </span>
                  <span className="text-white/20 ml-4">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <style>{`
          .ticker-scroll {
            animation: tickerMove 45s linear infinite;
          }
          .ticker-scroll:hover {
            animation-play-state: paused;
          }
          @keyframes tickerMove {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* Trust Bar */}
      <section className="py-12 bg-[#0D2B1F]" ref={students.ref}>
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
