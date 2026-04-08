import React from 'react';
import { Trophy, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LeaderboardTeaser() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#0D6B5B] font-bold">
          <Trophy className="w-5 h-5 text-[#D4A017]" />
          <h3>Leaderboard</h3>
        </div>
        <button 
          onClick={() => navigate('/community')}
          className="text-xs font-bold text-[#1db887] hover:text-[#189970] flex items-center gap-1 group"
        >
          Full <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</span>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">User</span>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total XP</span>
        </div>
        
        <div className="py-6 text-center">
          <p className="text-sm font-medium text-gray-500">Complete modules to earn XP and appear on the leaderboard</p>
        </div>
      </div>
    </div>
  );
}
