import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDwhxtXTWAVClU2OHjK7jRWtMsbs25XVy4",
  authDomain: "finiq-693f1.firebaseapp.com",
  projectId: "finiq-693f1",
  storageBucket: "finiq-693f1.firebasestorage.app",
  messagingSenderId: "397581048205",
  appId: "1:397581048205:web:84e6d2506595f66482c5c4",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dummyUsers = [
  { name: 'Arjun Mehta', xp: 380, streak: 5 },
  { name: 'Priya Verma', xp: 310, streak: 7 },
  { name: 'Siddharth K.', xp: 290, streak: 4 },
  { name: 'Rohan Adani', xp: 250, streak: 3 },
  { name: 'Neha Patil', xp: 275, streak: 6 },
  { name: 'Ravi Kumar', xp: 120, streak: 1 },
  { name: 'Kiran Desai', xp: 180, streak: 2 },
  { name: 'Aditi Sharma', xp: 395, streak: 7 },
  { name: 'Vikram Singh', xp: 210, streak: 3 },
  { name: 'Meera Reddy', xp: 340, streak: 6 },
  { name: 'Tarun Joshi', xp: 195, streak: 2 },
  { name: 'Ananya Gupta', xp: 90, streak: 1 },
  { name: 'Sanjay Nair', xp: 280, streak: 5 },
  { name: 'Aisha Khan', xp: 330, streak: 6 },
  { name: 'Rahul Bose', xp: 150, streak: 2 },
  { name: 'Sneha Rao', xp: 220, streak: 4 },
  { name: 'Karan Malhotra', xp: 360, streak: 7 },
  { name: 'Pooja Iyer', xp: 75, streak: 1 },
  { name: 'Dev Kapoor', xp: 265, streak: 5 },
  { name: 'Shruti Bhatt', xp: 190, streak: 3 }
];

async function seed() {
  console.log("Starting seeding...");
  const usersRef = collection(db, 'users');
  for (const user of dummyUsers) {
    try {
      await addDoc(usersRef, {
        name: user.name,
        email: `${user.name.replace(' ', '.').toLowerCase()}@example.com`,
        xp: user.xp,
        streak: user.streak,
        createdAt: new Date().toISOString()
      });
      console.log(`Added ${user.name}`);
    } catch (e) {
      console.error(`Error adding ${user.name}:`, e);
    }
  }
  console.log("Seeding complete!");
  process.exit(0);
}

seed();
