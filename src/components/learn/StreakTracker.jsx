import React from 'react';
import { Flame } from 'lucide-react';

export default function StreakTracker() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  // Real logic would pull from UserContext, mocking 0 for now per request
  const activePattern = [false, false, false, false, false, false, false];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4 text-center sm:text-left">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center border-4 border-orange-50 shadow-inner">
            <Flame className="w-8 h-8 text-orange-500" strokeWidth={2.5} />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            0
          </div>
        </div>
        <div>
          <h3 className="font-extrabold text-xl text-[#0d3d2e]">0 Day Streak</h3>
          <p className="text-sm font-medium text-gray-500">Complete a lesson to start your streak!</p>
        </div>
      </div>

      <div className="flex gap-2">
        {days.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              activePattern[idx] ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-gray-100 text-gray-400'
            }`}>
              {activePattern[idx] ? <Flame className="w-4 h-4" /> : <span className="text-[10px] font-bold">{day}</span>}
            </div>
            {/* Show day only if not active, or just generic label */}
            {activePattern[idx] && <span className="text-[10px] font-bold text-gray-400 uppercase">{day}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
