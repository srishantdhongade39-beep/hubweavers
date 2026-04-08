import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
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
import FloatingAssistant from './components/FloatingAssistant';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fade-in">
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

        {/* Protected Routes */}
        <Route path="/track" element={<ProtectedRoute><Track /></ProtectedRoute>} />
        <Route path="/track/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Navbar />
          <AnimatedRoutes />
          <FloatingAssistant />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
