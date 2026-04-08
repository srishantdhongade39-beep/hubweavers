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
            streakCount: 1,
            lastActiveDate: new Date().toISOString().split("T")[0],
            createdAt: new Date(),
            referralCode: user.uid.substring(0, 6).toUpperCase(),
            referralCount: 0,
            notifications: {
              emailLessonReminders: true,
              marketVolatilityAlerts: true,
              communityMentions: false
            }
          };
          await setDoc(userRef, data);
        }

        // Streak Tracker
        const today = new Date().toISOString().split("T")[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split("T")[0];

        const { lastActiveDate, streakCount } = data;

        if (lastActiveDate !== today) {
          let newStreakCount = streakCount;
          if (lastActiveDate === yesterday) {
            newStreakCount += 1;
          } else {
            newStreakCount = 1;
          }
           
          await updateDoc(userRef, { streakCount: newStreakCount, lastActiveDate: today });
          data.streakCount = newStreakCount;
          data.lastActiveDate = today;
        }

        setUserData(data);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
