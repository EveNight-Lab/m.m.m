import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, increment } from 'firebase/firestore';

const visitorFirebaseConfig = {
  apiKey: "AIzaSyDTmS96KCL6IzAL7onJvtEsqSB7htjEyNI",
  authDomain: "evenight-cloud.firebaseapp.com",
  projectId: "evenight-cloud",
  storageBucket: "evenight-cloud.firebasestorage.app",
  messagingSenderId: "357661488366",
  appId: "1:357661488366:web:cf19e6e9500667106b2fff",
  measurementId: "G-Q4NJMVRS12"
};

// 'visitor_tracker'라는 이름으로 두 번째 Firebase 앱 초기화
const visitorApp = getApps().find(app => app.name === 'visitor_tracker')
  || initializeApp(visitorFirebaseConfig, 'visitor_tracker');

const visitorDb = getFirestore(visitorApp);

export const trackVisitor = async () => {
  const sessionKey = 'evenight_visit_tracked_mymonstermaker';
  if (sessionStorage.getItem(sessionKey)) return;

  try {
    const docRef = doc(visitorDb, 'site_stats', 'my-monster-maker');
    await setDoc(docRef, { visit_count: increment(1) }, { merge: true });
    sessionStorage.setItem(sessionKey, 'true');
  } catch (error) {
    console.error("Failed to track visitor count:", error);
  }
};
