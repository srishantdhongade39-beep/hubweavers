import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Target, TrendingUp, Shield, HelpCircle, GraduationCap, Home } from 'lucide-react';

const GOALS = [
  { id: 'Retirement Planning', icon: Target },
  { id: 'Wealth Building', icon: TrendingUp },
  { id: 'Tax Saving', icon: Shield },
  { id: 'Emergency Fund', icon: HelpCircle },
  { id: 'Child Education', icon: GraduationCap },
  { id: 'Buy a Home', icon: Home }
];

const RISKS = [
  { id: 'Conservative', desc: 'Focus on capital preservation with lower returns' },
  { id: 'Moderate', desc: 'Balance between growth and safety' },
  { id: 'Aggressive', desc: 'Maximize growth with higher volatility tolerance' }
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [risk, setRisk] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleNext = () => {
    if (step === 1 && goal) setStep(2);
  };

  const handleComplete = async () => {
    if (!risk) return;
    setLoading(true);
    try {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          financialGoal: goal,
          riskAppetite: risk
        });
      }
      navigate('/');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF0EC] px-4 pt-16">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 transition-all">
        {/* Progress Bar */}
        <div className="mb-8 relative">
          <div className="h-2 bg-gray-100 rounded-full">
            <div 
              className="h-full bg-[#1DB88E] rounded-full transition-all duration-500 ease-out"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500 font-medium text-right">Step {step} of 2</div>
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-[#0D2B1F] mb-3">What's your main financial goal?</h2>
            <p className="text-gray-600 mb-8">This helps us personalize your mentorship journey.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    goal === g.id 
                      ? 'border-[#1DB88E] bg-[#1DB88E]/10 scale-[1.02] shadow-sm' 
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-3 rounded-full ${goal === g.id ? 'bg-[#1DB88E] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <g.icon size={20} />
                  </div>
                  <span className="font-semibold text-gray-800">{g.id}</span>
                </button>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <button
                onClick={handleNext}
                disabled={!goal}
                className="py-3 px-8 bg-[#0D2B1F] text-white font-medium rounded-xl hover:bg-[#1DB88E] transition-all disabled:opacity-50 disabled:hover:bg-[#0D2B1F]"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in relative">
            <button 
              onClick={() => setStep(1)}
              className="absolute -top-12 left-0 text-sm font-medium text-gray-400 hover:text-gray-800 transition-colors"
            >
              ← Back
            </button>
            
            <h2 className="text-3xl font-bold text-[#0D2B1F] mb-3">What's your risk appetite?</h2>
            <p className="text-gray-600 mb-8">How do you feel about market volatility?</p>

            <div className="space-y-4">
              {RISKS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRisk(r.id)}
                  className={`w-full flex flex-col p-5 rounded-xl border-2 transition-all text-left ${
                    risk === r.id 
                      ? 'border-[#1DB88E] bg-[#1DB88E]/10 scale-[1.02] shadow-sm' 
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-bold text-lg text-gray-800 mb-1">{r.id}</span>
                  <span className="text-gray-500 text-sm">{r.desc}</span>
                </button>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <button
                onClick={handleComplete}
                disabled={!risk || loading}
                className="py-3 px-8 bg-[#1DB88E] text-white font-medium rounded-xl hover:bg-[#159a75] hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
