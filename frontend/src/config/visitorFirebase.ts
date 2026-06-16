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

const getKstDateStrings = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value || '2026';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  return {
    dailyKey: `${year}-${month}-${day}`,
    monthlyKey: `${year}-${month}`
  };
};

export const trackVisitor = async () => {
  const sessionKey = 'evenight_visit_tracked_mymonstermaker';
  if (sessionStorage.getItem(sessionKey)) return;

  try {
    const { dailyKey, monthlyKey } = getKstDateStrings();
    const docRefTotal = doc(visitorDb, 'site_stats', 'my-monster-maker');
    const docRefDaily = doc(visitorDb, 'site_stats', `my-monster-maker_daily_${dailyKey}`);
    const docRefMonthly = doc(visitorDb, 'site_stats', `my-monster-maker_monthly_${monthlyKey}`);

    await Promise.all([
      setDoc(docRefTotal, { visit_count: increment(1) }, { merge: true }),
      setDoc(docRefDaily, { visit_count: increment(1) }, { merge: true }),
      setDoc(docRefMonthly, { visit_count: increment(1) }, { merge: true })
    ]);

    sessionStorage.setItem(sessionKey, 'true');
  } catch (error) {
    console.error("Failed to track visitor count:", error);
  }
};
