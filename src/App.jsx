import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import LearnWelcome from './pages/LearnWelcome';
import LearnLesson from './pages/LearnLesson';
import BookIQShelf from './pages/BookIQShelf';
import BookIQDetail from './pages/BookIQDetail';
import Track from './pages/Track';
import Portfolio from './pages/Portfolio';
import Quiz from './pages/Quiz';
import LevelComplete from './pages/LevelComplete';
import Profile from './pages/Profile';
import Community from './pages/Community';
import SimZone from './pages/SimZone';
import FloatingAssistant from './components/FloatingAssistant';

function AnimatedRoutes() {
  const location = useLocation();
  const isSimZone = location.pathname === '/simzone';
  
  return (
    <div key={location.pathname} className={isSimZone ? "" : "animate-fade-in"}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        
        <Route path="/learn" element={<LearnWelcome />} />
        <Route path="/learn/lesson" element={<LearnLesson />} />
        <Route path="/bookiq" element={<BookIQShelf />} />
        <Route path="/bookiq/:bookId" element={<BookIQDetail />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/level-complete" element={<LevelComplete />} />
        <Route path="/simzone" element={<SimZone />} />

        {/* Protected Routes */}
        <Route path="/track" element={<ProtectedRoute><Track /></ProtectedRoute>} />
        <Route path="/track/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isSimZone = location.pathname === '/simzone';

  return (
    <>
      {!isSimZone && <Navbar />}
      <AnimatedRoutes />
      {!isSimZone && <FloatingAssistant />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
