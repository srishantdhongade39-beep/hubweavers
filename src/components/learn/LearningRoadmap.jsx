import React from 'react';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

export default function LearningRoadmap() {
  const steps = [
    { title: 'Basics of Money', status: 'unlocked' },
    { title: 'Budgeting & Saving', status: 'locked' },
    { title: 'Mutual Funds & SIPs', status: 'locked' },
    { title: 'Intro to Stocks', status: 'locked' },
    { title: 'Tax Planning (ELSS)', status: 'locked' },
    { title: 'Wealth Building', status: 'locked' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
      <h3 className="text-xl font-bold mb-6 text-[#0d3d2e]">Your Learning Roadmap</h3>
      <div className="relative">
        <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
        <ul className="space-y-6">
          {steps.map((step, idx) => (
            <li key={idx} className="relative flex items-center gap-4">
              <div className="relative z-10 flex items-center justify-center bg-white">
                {step.status === 'completed' && <CheckCircle2 className="w-8 h-8 text-[#1db887]" />}
                {step.status === 'in-progress' && (
                  <div className="w-8 h-8 rounded-full border-4 border-[#1db887] text-white flex items-center justify-center bg-white shadow-[0_0_0_4px_rgba(29,184,135,0.2)]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1db887]"></div>
                  </div>
                )}
                {step.status === 'unlocked' && (
                  <div className="w-8 h-8 rounded-full border-4 border-[#1db887] bg-white"></div>
                )}
                {step.status === 'locked' && <Lock className="w-8 h-8 text-gray-300 p-1.5 bg-gray-50 rounded-full border border-gray-200" />}
              </div>
              <div className={`text-base font-semibold ${step.status === 'locked' ? 'text-gray-400' : 'text-[#0d3d2e]'}`}>
                {step.title}
                {step.status === 'in-progress' && <span className="ml-3 text-xs font-bold text-[#1db887] bg-[#eaf5f0] px-2 py-1 rounded-full uppercase tracking-wider">Current Stage</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
