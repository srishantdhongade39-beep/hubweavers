import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, User as UserIcon } from 'lucide-react';

const tabs = [
  { name: 'Home', path: '/', icon: '🏠' },
  { name: 'Learn', path: '/learn', icon: '🎓' },
  { name: 'BookIQ', path: '/bookiq', icon: '📖' },
  { name: 'Track', path: '/track', icon: '📊' },
  { name: 'Community', path: '/community', icon: '👥' },
  { name: 'SimZone', path: '/simzone', icon: '📈' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setDropdownOpen(false);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'FI';
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 hidden md:flex items-center justify-between px-6 h-16 transition-all duration-300">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-xl font-extrabold text-[#0D2B1F]">FinIQ</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white bg-[#1DB88E]">BETA</span>
        </div>

        <div className="flex items-center gap-1 relative">
          {tabs.map(tab => {
            const isActive = tab.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(tab.path);
              
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={`relative px-4 py-5 text-sm font-medium transition-colors duration-200 group ${
                  isActive ? 'text-[#0D2B1F] font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.name}
                <span 
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#1DB88E] transform origin-left transition-transform duration-300 ease-out ${
                    isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </NavLink>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-4 relative">
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold bg-[#0D2B1F] shadow-sm relative overflow-hidden" style={{ borderRadius: '50%' }}>
                    {userData?.photoURL ? (
                      <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      getInitials(userData?.name)
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute top-12 right-0 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 animate-fade-in origin-top-right">
                    <button
                      onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                      <UserIcon size={16} /> My Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors mt-1"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
             <div className="flex items-center gap-3">
               <button
                 onClick={() => navigate('/signin')}
                 className="px-4 py-2 rounded-xl text-gray-600 font-semibold hover:text-[#0D2B1F] hover:bg-gray-50 transition-colors"
               >
                 Sign In
               </button>
               <button
                 onClick={() => navigate('/signup')}
                 className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-[#1DB88E] hover:bg-[#159a75] hover:scale-105 hover:shadow-md transform transition-all"
               >
                 Get Started Free
               </button>
             </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-t border-gray-200 flex md:hidden items-center justify-around py-2 px-1 pb-safe">
        {tabs.map(tab => {
          const isActive = tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path);
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center gap-0.5 px-2 py-1"
            >
              <span className={`text-xl ${isActive ? '' : 'grayscale opacity-50'}`}>{tab.icon}</span>
              <span 
                className={`text-[10px] font-medium transition-colors ${isActive ? 'font-bold text-[#0D2B1F]' : 'text-gray-400'}`}
              >
                {tab.name}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
