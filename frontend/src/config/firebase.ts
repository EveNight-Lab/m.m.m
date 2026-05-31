/**
 * Firebase 설정
 */

import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase 설정 (공개 정보이므로 하드코딩)
const firebaseConfig = {
  apiKey: "AIzaSyCdOTL8RpXGdEv0-6yx83yDVaicHIzlR9I",
  authDomain: "my-monster-maker.firebaseapp.com",
  projectId: "my-monster-maker",
  storageBucket: "my-monster-maker.firebasestorage.app",
  messagingSenderId: "964890470998",
  appId: "1:964890470998:web:a451cc8c840e227469e9f7",
  measurementId: "G-S8FT7F5LX4"
}

// Firebase 앱 초기화 (중복 초기화 방지)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Firebase 서비스 초기화
export const auth = getAuth(app)
export const db = getFirestore(app)

// 익명 인증 활성화 (이미 Firebase 콘솔에서 활성화되어 있어야 함)

export default app

