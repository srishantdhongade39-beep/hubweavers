import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const QUESTIONS = [
  {
    q: 'What does SIP stand for in mutual fund investing?',
    opts: ['Stock Investment Plan', 'Systematic Investment Plan', 'Savings Interest Plan', 'Secure Investment Portfolio'],
    answer: 1,
  },
  {
    q: 'Which of the following best describes "Expense Ratio" in a mutual fund?',
    opts: ['The profit earned by the investor', 'The annual fee charged by the fund house', 'The entry load when buying a fund', 'The tax on capital gains'],
    answer: 1,
  },
  {
    q: 'If Nifty 50 falls 30%, what is the correct understanding for a long-term SIP investor?',
    opts: ['Panic sell immediately', 'Pause SIP until markets recover', 'Your SIP now buys more units at lower prices', 'Switch to fixed deposits permanently'],
    answer: 2,
  },
  {
    q: 'What is the concept of "Rupee Cost Averaging"?',
    opts: ['Investing in US dollar funds to hedge', 'Buying more units when prices fall via regular investing', 'Averaging losses across multiple assets', 'Converting rupees to gold as a hedge'],
    answer: 1,
  },
  {
    q: 'CAGR of 12% means your investment of ₹1 lakh grows to approximately how much in 6 years?',
    opts: ['₹1.72 lakh', '₹1.97 lakh', '₹2.12 lakh', '₹1.45 lakh'],
    answer: 1,
  },
];

export default function Quiz() {
  const navigate = useNavigate();
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState({ correct: 0, total: 0 });
  const [timeLeft, setTimeLeft] = useState(30);
  const [scoreAnim, setScoreAnim] = useState(false);
  const timerRef = useRef(null);

  const q = QUESTIONS[qIdx];
  const RADIUS = 36;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC - (timeLeft / 30) * CIRC;

  useEffect(() => {
    setTimeLeft(30);
    setSelected(null);
    setChecked(false);
  }, [qIdx]);

  useEffect(() => {
    if (checked) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          nextQuestion();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qIdx, checked]);

  const checkAnswer = () => {
    if (selected === null) return;
    clearInterval(timerRef.current);
    setChecked(true);
    const isCorrect = selected === q.answer;
    setAccuracy(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
    if (isCorrect) {
      setScore(s => s + 250);
      setScoreAnim(true);
      setTimeout(() => setScoreAnim(false), 600);
    }
    setTimeout(() => nextQuestion(), 1500);
  };

  const nextQuestion = () => {
    if (qIdx + 1 >= QUESTIONS.length) {
      navigate('/level-complete');
    } else {
      setQIdx(i => i + 1);
    }
  };

  const skip = () => {
    clearInterval(timerRef.current);
    nextQuestion();
  };

  const getOptionStyle = (i) => {
    if (!checked) {
      return selected === i
        ? { border: '2px solid #0D6B5B', backgroundColor: '#EDF9F5' }
        : { border: '2px solid #E5E7EB', backgroundColor: 'white' };
    }
    if (i === q.answer) return { border: '2px solid #1D9E75', backgroundColor: '#E6F7F2' };
    if (i === selected && selected !== q.answer) return { border: '2px solid #E53E3E', backgroundColor: '#FEF2F2' };
    return { border: '2px solid #E5E7EB', backgroundColor: 'white' };
  };

  const getLetterStyle = (i) => {
    if (selected === i && !checked) return { backgroundColor: '#0D6B5B', color: 'white' };
    if (checked && i === q.answer) return { backgroundColor: '#1D9E75', color: 'white' };
    if (checked && i === selected && selected !== q.answer) return { backgroundColor: '#E53E3E', color: 'white' };
    return { backgroundColor: '#F3F4F6', color: '#6B7280' };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF4F2' }}>
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold" style={{ color: '#1A1A2E' }}>Finance Quiz</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#FEF9E7' }}>
            <span className="text-yellow-600 font-bold text-xs">⚡ DOUBLE POINTS ACTIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quiz Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-8">
            <p className="text-xs text-gray-400 mb-2">Question {qIdx + 1} of {QUESTIONS.length}</p>
            <h2 className="text-xl font-extrabold mb-6 leading-snug" style={{ color: '#1A1A2E' }}>{q.q}</h2>

            <div className="space-y-3 mb-8">
              {q.opts.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => !checked && setSelected(i)}
                  className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                  style={getOptionStyle(i)}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all" style={getLetterStyle(i)}>
                    {['A', 'B', 'C', 'D'][i]}
                  </div>
                  <span className="text-sm text-gray-700">{opt}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={skip}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Skip for now
              </button>
              <button
                onClick={checkAnswer}
                disabled={selected === null || checked}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-all hover:opacity-90"
                style={{ backgroundColor: '#0D6B5B' }}
              >
                Check Answer
              </button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Timer */}
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center">
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r={RADIUS} fill="none" stroke="#E5E7EB" strokeWidth="6" />
                <circle
                  cx="44" cy="44" r={RADIUS}
                  fill="none" stroke="#D4A017" strokeWidth="6"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 44 44)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
                <text x="44" y="50" textAnchor="middle" className="font-extrabold" style={{ fontSize: '22px', fontWeight: '800', fill: timeLeft <= 10 ? '#E53E3E' : '#1A1A2E', fontFamily: 'Inter' }}>
                  {timeLeft}
                </text>
              </svg>
              <p className="text-xs text-gray-400 uppercase tracking-wider mt-2">Time Remaining</p>
            </div>

            {/* Score */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">Current Score</p>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-extrabold transition-all ${scoreAnim ? 'scale-125' : ''}`} style={{ color: '#0D6B5B' }}>{score.toLocaleString()}</span>
                {scoreAnim && <span className="text-sm font-bold text-green-500 animate-bounce-in">▲ +250</span>}
              </div>
            </div>

            {/* Accuracy */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">Accuracy</p>
              <p className="text-3xl font-extrabold" style={{ color: '#1A1A2E' }}>
                {accuracy.total === 0 ? '—' : `${Math.round((accuracy.correct / accuracy.total) * 100)}%`}
              </p>
              <p className="text-xs text-gray-400 mt-1">{accuracy.correct}/{accuracy.total} Correct</p>
            </div>

            {/* Next Milestone */}
            <div className="rounded-2xl shadow-sm p-5" style={{ backgroundColor: '#0D6B5B' }}>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Next Milestone</p>
              <p className="font-extrabold text-white mb-3">Fund Master Badge</p>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '70%', backgroundColor: '#D4A017' }} />
              </div>
              <p className="text-xs text-white/70 mt-2">3 questions to go</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
