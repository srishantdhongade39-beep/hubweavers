import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        const data = {
          uid: result.user.uid,
          name: result.user.displayName || '',
          email: result.user.email || '',
          photoURL: result.user.photoURL || null,
          memberType: 'free',
          streakCount: 1,
          lastActiveDate: new Date().toISOString().split("T")[0],
          createdAt: new Date(),
          referralCode: result.user.uid.substring(0, 6).toUpperCase(),
          referralCount: 0,
          notifications: {
            emailLessonReminders: true,
            marketVolatilityAlerts: true,
            communityMentions: false
          }
        };
        await setDoc(userRef, data);
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Failed to sign up with Google');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // update profile name immediately
      await updateProfile(userCredential.user, { displayName: name });
      
      const userRef = doc(db, 'users', userCredential.user.uid);
      const data = {
        uid: userCredential.user.uid,
        name: name,
        email: email,
        photoURL: null,
        memberType: 'free',
        streakCount: 1,
        lastActiveDate: new Date().toISOString().split("T")[0],
        createdAt: new Date(),
        referralCode: userCredential.user.uid.substring(0, 6).toUpperCase(),
        referralCount: 0,
        notifications: {
          emailLessonReminders: true,
          marketVolatilityAlerts: true,
          communityMentions: false
        }
      };
      await setDoc(userRef, data);
      navigate('/onboarding');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists with this email');
      } else {
        setError('Failed to create an account');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF0EC] px-4 pt-20 pb-10">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 transition-transform hover:-translate-y-1 duration-300">
        <h2 className="text-3xl font-bold text-[#0D2B1F] mb-2">Create Account</h2>
        <p className="text-gray-600 mb-8">Join FinIQ and start learning today.</p>
        
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg animate-fade-in text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1DB88E] focus:border-transparent transition-shadow outline-none"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1DB88E] focus:border-transparent transition-shadow outline-none"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1DB88E] focus:border-transparent transition-shadow outline-none"
                placeholder="Create a password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1DB88E] focus:border-transparent transition-shadow outline-none"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full mt-2 py-3 px-4 bg-[#1DB88E] text-white font-medium rounded-xl hover:bg-[#159a75] hover:shadow-lg hover:scale-[1.02] transform transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#dadce0] rounded-xl bg-white hover:bg-gray-50 hover:shadow-md transform transition-all overflow-hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="font-medium text-gray-700">Continue with Google</span>
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/signin" className="text-[#1DB88E] font-medium hover:text-[#0D2B1F] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
