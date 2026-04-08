import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        let data = null;
        if (docSnap.exists()) {
          data = docSnap.data();
        } else {
          // Fallback if doc is not natively created
          data = {
            uid: user.uid,
            name: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || null,
            memberType: 'free',
            xp: 0,
            streakCount: 0,
            completedDates: [],
            lastActiveDate: new Date().toISOString().split("T")[0],
            createdAt: new Date(),
            referralCode: user.uid.substring(0, 6).toUpperCase(),
            referralCount: 0,
            notifications: {
              emailLessonReminders: true,
              marketVolatilityAlerts: true,
              communityMentions: false
            },
            sessionScore: 0,
            portfolio: {
              virtualBalance: 100000,
              invested: 0,
              currentValue: 0,
              todayPnL: 0,
              trades: [],
              positions: {}
            }
          };
          await setDoc(userRef, data);
        }

        // Streak Tracker / Reset Logic
        // We only reset streak to 0 if they missed yesterday completely.
        // We do NOT increment here anymore—that happens when they finish a lesson.
        const today = new Date().toISOString().split("T")[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split("T")[0];

        const { streakCount, completedDates = [] } = data;
        let newStreakCount = streakCount;

        // If the last time they completed a lesson wasn't today and wasn't yesterday,
        // the streak is broken.
        const lastLessonDate = completedDates.length > 0 ? completedDates[completedDates.length - 1] : null;
        
        if (lastLessonDate && lastLessonDate !== today && lastLessonDate !== yesterday) {
           newStreakCount = 0;
           await updateDoc(userRef, { streakCount: 0, lastActiveDate: today });
           data.streakCount = 0;
        } else if (data.lastActiveDate !== today) {
           await updateDoc(userRef, { lastActiveDate: today });
        }
        
        data.lastActiveDate = today;
        data.completedDates = completedDates; // ensure array exists
        data.xp = data.xp || 0; // ensure fallback for existing users

        setUserData(data);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateUserData = async (updates) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, updates);
    setUserData(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading, updateUserData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
