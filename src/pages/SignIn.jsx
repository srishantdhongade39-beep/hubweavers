import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
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
      setError('Failed to sign in with Google');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/invalid-credential':
          setError('Invalid credentials');
          break;
        case 'auth/email-already-in-use':
          setError('An account already exists with this email');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Try again later.');
          break;
        default:
          setError('Failed to sign in');
      }
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password');
      return;
    }
    try {
      setMessage('');
      setError('');
      await sendPasswordResetEmail(auth, email);
      setMessage('Reset link sent to your email');
    } catch (err) {
      setError('Failed to reset password. Check your email address.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF0EC] px-4 pt-20 pb-10">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 transition-transform hover:-translate-y-1 duration-300">
        <h2 className="text-3xl font-bold text-[#0D2B1F] mb-2">Welcome Back</h2>
        <p className="text-gray-600 mb-8">Sign in to continue your financial journey.</p>
        
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg animate-fade-in text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg animate-fade-in text-sm">
            <CheckCircle size={18} />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="you@example.com"
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
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-sm text-[#1DB88E] hover:text-[#0D2B1F] transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3 px-4 bg-[#1DB88E] text-white font-medium rounded-xl hover:bg-[#159a75] hover:shadow-lg hover:scale-[1.02] transform transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
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
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#1DB88E] font-medium hover:text-[#0D2B1F] transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
