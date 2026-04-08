import React, { useState } from 'react';
import { PlayCircle, Clock, Award, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const categories = ['All', 'Stocks', 'MF', 'Insurance', 'Tax', 'Credit'];

const modules = [
  { id: 1, title: 'Understanding SIPs', category: 'MF', duration: '12 min', difficulty: 'Beginner', xp: 50, progress: 0 },
  { id: 2, title: 'Intro to Indian Stock Market', category: 'Stocks', duration: '18 min', difficulty: 'Beginner', xp: 75, progress: 0 },
  { id: 3, title: 'ELSS Tax Saving Hacks', category: 'Tax', duration: '15 min', difficulty: 'Intermediate', xp: 100, progress: 0 },
  { id: 4, title: 'Health Insurance Basics', category: 'Insurance', duration: '10 min', difficulty: 'Beginner', xp: 40, progress: 0 },
  { id: 5, title: 'Analyzing Reliance Industries', category: 'Stocks', duration: '25 min', difficulty: 'Pro', xp: 150, progress: 0 },
  { id: 6, title: 'Credit Score Secrets (CIBIL)', category: 'Credit', duration: '14 min', difficulty: 'Intermediate', xp: 80, progress: 0 },
];

export default function ModuleCards() {
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();

  const filteredModules = modules.filter(m => activeCategory === 'All' || m.category === activeCategory);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#0d3d2e]">Explore Modules</h3>
      </div>
      
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
              activeCategory === cat 
                ? 'bg-[#0d3d2e] text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1db887] hover:text-[#0d3d2e]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModules.map(mod => (
          <div 
            key={mod.id} 
            onClick={() => navigate('/learn/lesson')}
            className="group cursor-pointer bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
                mod.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                mod.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {mod.difficulty}
              </span>
              <div className="flex gap-1 items-center text-xs font-bold text-[#D4A017] bg-yellow-50 px-2 py-1 rounded-full">
                <Award className="w-3 h-3" /> +{mod.xp} XP
              </div>
            </div>
            
            <h4 className="font-bold text-lg text-[#0d3d2e] mb-2 leading-tight group-hover:text-[#1db887] transition-colors">
              {mod.title}
            </h4>
            
            <div className="flex items-center gap-4 text-xs font-medium text-gray-400 mb-5">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {mod.duration}</span>
              <span className="flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" /> Video</span>
            </div>
            
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                <span>Progress</span>
                <span className="text-[#1db887]">{mod.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1db887] transition-all duration-500 ease-out"
                  style={{ width: `${mod.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
