import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BOOK_DATA = {
  'intelligent-investor': { title: 'The Intelligent Investor', author: 'Benjamin Graham' },
  'rich-dad-poor-dad': { title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki' },
  'psychology-of-money': { title: 'The Psychology of Money', author: 'Morgan Housel' },
};

const DEFAULT_BOOK = { title: 'The Psychology of Money', author: 'Morgan Housel' };

const CHAPTERS = [
  {
    num: 1,
    title: 'No One\'s Crazy',
    status: 'unread',
    body: 'Your personal experiences with money make up maybe 0.00000001% of what\'s happened in the world, but maybe 80% of how you think the world works. Rohan, a 45-year-old from Indore who lived through the 1992 Harshad Mehta scam, will forever be wary of the stock market. His 22-year-old nephew, who only knows bull markets, thinks investing is easy. Both are rational, given their experiences.',
    takeaway: 'No one is crazy. People make financial decisions based on their own life experiences — not textbooks. Understand this before judging anyone\'s money choices.'
  },
  {
    num: 2,
    title: 'Luck & Risk',
    status: 'unread',
    body: 'Nothing is as good or as bad as it seems. Bill Gates went to one of the only high schools in the world with a computer in 1968. His classmate Kent Evans, equally talented, died in a mountaineering accident before seeing his potential. Luck and risk are siblings. When studying success or failure, be careful about what to attribute to individual decisions versus forces beyond anyone\'s control.',
    takeaway: 'The same skills that drive success also drive failure. Judge financial decisions by their quality, not their outcomes — because luck and risk both play a massive, invisible role.'
  },
];

export default function BookIQDetail() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const book = BOOK_DATA[bookId] || DEFAULT_BOOK;
  const [progressWidth, setProgressWidth] = useState(0);
  const [ch3Complete, setCh3Complete] = useState(false);

  useEffect(() => {
    setTimeout(() => setProgressWidth(0), 200);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF4F2' }}>
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        {/* Book Hero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="md:col-span-1">
            <div className="rounded-2xl p-8 text-center text-white" style={{ backgroundColor: '#0D6B5B', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <h2 className="text-2xl font-extrabold leading-tight">{book.title}</h2>
            </div>
          </div>
          <div className="md:col-span-2">
            <h1 className="text-4xl font-extrabold mb-1" style={{ color: '#1A1A2E' }}>{book.title}</h1>
            <p className="italic text-gray-500 mb-4">by {book.author}</p>
            <p className="text-gray-600 mb-6 leading-relaxed">"The most important quality for an investor is temperament, not intellect. A temperament that neither derives great pleasure from being with the crowd nor against it."</p>
            
            {/* Reading Progress Component */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 font-semibold text-sm">Reading Progress</span>
                  <span className="font-bold text-sm" style={{ color: '#0D6B5B' }}>0% Complete</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressWidth}%`, backgroundColor: '#0D6B5B' }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">0 of 20 chapters mastered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Two Column */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left — Chapters */}
          <div className="lg:col-span-5 space-y-4">
            {CHAPTERS.map(ch => (
              <div key={ch.num} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#0D6B5B]">Chapter {ch.num}</span>
                  {/* Hardcoded Completed badge removed, no badge shown */}
                </div>
                <h2 className="text-xl font-bold mb-3" style={{ color: '#1A1A2E' }}>"{ch.title}"</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{ch.body}</p>
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#FFF3EE', borderLeft: '4px solid #F97316' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-orange-500">⭐</span>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Key Takeaway</span>
                  </div>
                  <p className="text-sm italic text-gray-700">{ch.takeaway}</p>
                </div>
              </div>
            ))}

            {/* Chapter 3 — Currently Reading */}
            <div className="bg-white rounded-2xl p-6 shadow-sm relative" style={{ border: `2px solid #0D6B5B` }}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#0D6B5B' }}>CURRENTLY READING</span>
              </div>
              <div className="flex items-center justify-between mb-3 mt-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0D6B5B' }}>Chapter 3</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">8 MIN READ</span>
              </div>
              <h2 className="text-xl font-bold mb-3" style={{ color: '#0D6B5B' }}>"Never Enough"</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Rajat Gupta — born poor in Kolkata, became CEO of McKinsey, one of the most admired men in India. He had hundreds of millions of dollars but risked it all by acting on inside information. He wanted more. There's no financial challenge as hard as mastering "enough." Modern capitalism makes it hard to turn down a dollar. 
                The ceiling on social comparison is so high that virtually no one feels rich, which fuels a cycle of wanting more even when you already have everything you need.
              </p>
              <button
                onClick={() => setCh3Complete(true)}
                className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: ch3Complete ? '#1D9E75' : '#0D6B5B' }}
              >
                {ch3Complete ? '✓ Chapter Complete! Next chapter unlocked.' : 'Continue Summary →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
