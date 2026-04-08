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
  
  const [chapters, setChapters] = useState(() => {
    const saved = localStorage.getItem(`finiq_book_progress_${bookId}`);
    if (saved) return JSON.parse(saved);

    return [
      {
        num: 1, title: 'No One\'s Crazy', status: 'completed',
        body: 'Your personal experiences with money make up maybe 0.00000001% of what\'s happened in the world, but maybe 80% of how you think the world works. Rohan, a 45-year-old from Indore who lived through the 1992 Harshad Mehta scam, will forever be wary of the stock market. His 22-year-old nephew, who only knows bull markets, thinks investing is easy. Both are rational, given their experiences.',
        takeaway: 'No one is crazy. People make financial decisions based on their own life experiences — not textbooks. Understand this before judging anyone\'s money choices.'
      },
      {
        num: 2, title: 'Luck & Risk', status: 'completed',
        body: 'Nothing is as good or as bad as it seems. Bill Gates went to one of the only high schools in the world with a computer in 1968. His classmate Kent Evans, equally talented, died in a mountaineering accident before seeing his potential. Luck and risk are siblings. When studying success or failure, be careful about what to attribute to individual decisions versus forces beyond anyone\'s control.',
        takeaway: 'The same skills that drive success also drive failure. Judge financial decisions by their quality, not their outcomes — because luck and risk both play a massive, invisible role.'
      },
      {
        num: 3, title: 'Never Enough', status: 'active',
        body: 'Rajat Gupta — born poor in Kolkata, became CEO of McKinsey, one of the most admired men in India. He had hundreds of millions of dollars but risked it all by acting on inside information. He wanted more. There\'s no financial challenge as hard as mastering "enough." Modern capitalism makes it hard to turn down a dollar. The ceiling on social comparison is so high that virtually no one feels rich, which fuels a cycle of wanting more even when you already have everything you need.',
        takeaway: 'There is no financial challenge as hard as mastering "enough."'
      },
      {
        num: 4, title: 'Confounding Compounding', status: 'locked',
        body: 'Warren Buffett\'s net worth is $100 billion. $99.9 billion was accumulated after his 50th birthday. His secret is not just being a good investor, but being a good investor for 75 years.',
        takeaway: 'Good investing isn\'t necessarily about earning the highest returns. It\'s about earning pretty good returns that you can stick with.'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(`finiq_book_progress_${bookId}`, JSON.stringify(chapters));
  }, [chapters, bookId]);

  const TOTAL_CHAPTERS = chapters.length;
  const chaptersCompleted = chapters.filter(c => c.status === 'completed').length;
  const progressRatio = Math.min(100, Math.round((chaptersCompleted / TOTAL_CHAPTERS) * 100));

  const handleChapterComplete = (idx) => {
    setChapters(prev => {
      const next = [...prev];
      if (next[idx]) next[idx].status = 'completed';
      if (next[idx + 1]) next[idx + 1].status = 'active';
      return next;
    });
    
    // Smooth scroll to the newly unlocked chapter
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 150);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF4F2' }}>
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        {/* Book Hero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="md:col-span-1">
            <div className="rounded-2xl p-8 text-center text-white shadow-lg relative overflow-hidden" style={{ backgroundColor: '#0D6B5B', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl">📖</div>
              <h2 className="text-3xl font-extrabold leading-tight z-10">{book.title}</h2>
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2" style={{ color: '#1A1A2E' }}>{book.title}</h1>
            <p className="italic text-gray-500 mb-6 text-lg">by {book.author}</p>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">"The most important quality for an investor is temperament, not intellect. A temperament that neither derives great pleasure from being with the crowd nor against it."</p>
            
            {/* Reading Progress Component */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-500">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-500 font-semibold text-sm tracking-wide uppercase">Reading Progress</span>
                  <span className="font-bold text-lg" style={{ color: '#0D6B5B' }}>{progressRatio}% Complete</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressRatio}%`, backgroundColor: '#0D6B5B' }}></div>
                </div>
                <p className="text-sm font-semibold text-gray-400 mt-3">{chaptersCompleted} of {TOTAL_CHAPTERS} chapters mastered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chapters Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-5 space-y-6">
            
            {chapters.map((ch, idx) => {
              if (ch.status === 'locked') return null;
              
              const isReading = ch.status === 'active';
              
              return (
                <div 
                  key={ch.num} 
                  className={`bg-white rounded-2xl p-6 shadow-sm relative transition-all duration-300 ${isReading ? 'shadow-md transform scale-[1.01]' : 'opacity-80 hover:opacity-100'}`}
                  style={isReading ? { border: `2px solid #0D6B5B` } : {}}
                >
                  {isReading && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="px-4 py-1.5 rounded-full text-xs font-extrabold text-white shadow-md tracking-wider" style={{ backgroundColor: '#0D6B5B' }}>CURRENTLY READING</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4 mt-2">
                    <span className="text-sm font-bold uppercase tracking-widest" style={{ color: isReading ? '#0D6B5B' : '#6B7280' }}>Chapter {ch.num}</span>
                    
                    {ch.status === 'completed' && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#1D9E75] bg-[#E6F7F2] px-3 py-1.5 rounded-full shadow-sm">
                        ✓ COMPLETED
                      </span>
                    )}
                    {isReading && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">8 MIN READ</span>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-4" style={{ color: isReading ? '#0D6B5B' : '#1A1A2E' }}>"{ch.title}"</h2>
                  <p className="text-gray-600 text-base leading-relaxed mb-6">{ch.body}</p>
                  
                  <div className="p-5 rounded-xl mb-2 transition-all hover:shadow-sm" style={{ backgroundColor: '#FFF3EE', borderLeft: '4px solid #F97316' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-orange-500 text-lg">⭐</span>
                      <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Key Takeaway</span>
                    </div>
                    <p className="text-sm font-medium italic text-gray-700 leading-relaxed">{ch.takeaway}</p>
                  </div>

                  {isReading && (
                    <div className="mt-8">
                      <button
                        onClick={() => handleChapterComplete(idx)}
                        className="w-full py-4 rounded-xl text-white font-bold transition-all hover:shadow-lg transform hover:-translate-y-0.5 text-lg"
                        style={{ backgroundColor: '#0D6B5B' }}
                      >
                        Continue Summary →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
          </div>
        </div>
      </div>
    </div>
  );
}
