import React from 'react';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuizCTA() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-[#0D6B5B] to-[#125348] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group mb-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-green-200">Practice Time</span>
        </div>
        <h3 className="text-xl font-bold mb-2">Test Your Knowledge</h3>
        <p className="text-sm text-green-100 mb-5 leading-relaxed">
          Take a short 5-question quiz to reinforce what you've learned and earn up to +100 XP.
        </p>
        <button 
          onClick={() => navigate('/quiz')}
          className="bg-[#1db887] hover:bg-[#189970] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md flex items-center gap-2"
        >
          Start Quiz <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
