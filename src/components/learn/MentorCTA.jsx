import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function MentorCTA() {
  return (
    <div 
      className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
      onClick={() => alert('Mentor Chat triggered!')}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold bg-[#0D6B5B] shadow-inner group-hover:scale-105 transition-transform">
            AK
          </div>
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div>
          <h4 className="font-bold text-[#0D6B5B] text-base group-hover:text-[#1db887] transition-colors">Ask Arjun K. anything</h4>
          <p className="text-xs text-gray-500 font-medium">Your AI mentor is online</p>
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-[#eaf5f0] flex items-center justify-center text-[#1db887] group-hover:bg-[#1db887] group-hover:text-white transition-colors">
        <MessageCircle className="w-5 h-5" />
      </div>
    </div>
  );
}
