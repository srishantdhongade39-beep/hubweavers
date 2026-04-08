import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BOOKS = [
  { id: 'intelligent-investor', title: 'The Intelligent Investor', author: 'Benjamin Graham', idea: 'Margin of Safety: never overpay for anything', goodreads: 'https://www.goodreads.com/book/show/106835' },
  { id: 'rich-dad-poor-dad', title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', idea: 'Assets put money in your pocket. Liabilities take it out.', goodreads: 'https://www.goodreads.com/book/show/69571' },
  { id: 'psychology-of-money', title: 'The Psychology of Money', author: 'Morgan Housel', idea: 'Wealth is what you don\'t spend', goodreads: 'https://www.goodreads.com/book/show/41881472' },
  { id: 'richest-man-babylon', title: 'The Richest Man in Babylon', author: 'George S. Clason', idea: 'Pay yourself first, every single time', goodreads: 'https://www.goodreads.com/book/show/1052' },
  { id: 'millionaire-next-door', title: 'The Millionaire Next Door', author: 'Stanley & Danko', idea: "Wealth doesn't look like wealth", goodreads: 'https://www.goodreads.com/book/show/998' },
  { id: 'little-book-investing', title: 'The Little Book of Common Sense Investing', author: 'John C. Bogle', idea: 'Stop trying to beat the market. Own it.', goodreads: 'https://www.goodreads.com/book/show/171127' },
  { id: 'think-grow-rich', title: 'Think and Grow Rich', author: 'Napoleon Hill', idea: 'Your beliefs about money control your financial life', goodreads: 'https://www.goodreads.com/book/show/30186' },
  { id: 'random-walk', title: 'A Random Walk Down Wall Street', author: 'Burton Malkiel', idea: 'Diversification is the only free lunch in investing', goodreads: 'https://www.goodreads.com/book/show/900076' },
  { id: 'your-money-life', title: 'Your Money or Your Life', author: 'Vicki Robin', idea: 'Every purchase costs hours of your life. Spend consciously.', goodreads: 'https://www.goodreads.com/book/show/78428' },
  { id: 'simple-path-wealth', title: 'The Simple Path to Wealth', author: 'JL Collins', idea: 'Simplicity beats complexity. Always.', goodreads: 'https://www.goodreads.com/book/show/29316652' },
];

export default function BookIQShelf() {
  const navigate = useNavigate();
  const [showMyLibrary, setShowMyLibrary] = useState(false);
  const [saved, setSaved] = useState(new Set(['intelligent-investor', 'psychology-of-money']));

  const toggleSave = (id) => {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const displayBooks = showMyLibrary ? BOOKS.filter(b => saved.has(b.id)) : BOOKS;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF4F2' }}>
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: '#1A1A2E' }}>BookIQ Library</h1>
            <p className="text-gray-500 mt-2 max-w-2xl text-sm leading-relaxed">
              The world's best finance books — distilled into lessons you can actually use. We teach the ideas. The credit goes to the authors.
            </p>
          </div>
          <button
            onClick={() => setShowMyLibrary(v => !v)}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: showMyLibrary ? '#D4A017' : '#0D6B5B' }}
          >
            {showMyLibrary ? '← All Books' : 'My Library'}
          </button>
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {displayBooks.map(book => (
            <div
              key={book.id}
              className="bg-white rounded-2xl shadow-sm card-lift overflow-hidden"
              style={{ borderLeft: '4px solid #0D6B5B' }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h2 className="font-bold text-base mb-1" style={{ color: '#1A1A2E' }}>{book.title}</h2>
                    <p className="text-sm text-gray-500">{book.author}</p>
                  </div>
                  <button
                    onClick={() => toggleSave(book.id)}
                    className="ml-3 text-xl hover:scale-110 transition-transform"
                    title={saved.has(book.id) ? 'Remove from library' : 'Save to library'}
                  >
                    {saved.has(book.id) ? '❤️' : '🤍'}
                  </button>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: '#FEF9E7' }}>
                  <span className="text-xs font-bold" style={{ color: '#D4A017' }}>💡 Big Idea:</span>
                  <span className="text-xs text-gray-700 italic">"{book.idea}"</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/bookiq/${book.id}`)}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                    style={{ backgroundColor: '#0D6B5B' }}
                  >
                    Read the Lesson
                  </button>
                  <button
                    onClick={() => window.open(book.goodreads, '_blank')}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 hover:bg-gray-50 transition-all"
                    style={{ color: '#1A1A2E' }}
                  >
                    📖 View on Goodreads
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#F3F0FF' }}>
          <p className="text-gray-700 font-medium mb-2">
            "These lessons teach the ideas behind the books, not the books themselves. We believe every student should eventually read the originals."
          </p>
          <p className="text-xs text-gray-400 italic">
            All concepts are attributed to their respective authors. FinIQ does not reproduce copyrighted content.
          </p>
        </div>
      </div>
    </div>
  );
}
