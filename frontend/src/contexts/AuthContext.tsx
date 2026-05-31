/**
 * 인증 컨텍스트
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth, db } from '../config/firebase'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  signup: (nickname: string, password: string) => Promise<void>
  login: (nickname: string, password: string) => Promise<void>
  logout: () => Promise<void>
  userNickname: string | null
}

// 닉네임을 이메일 형식으로 변환
const NICKNAME_DOMAIN = '@mmm.com'
function nicknameToEmail(nickname: string): string {
  return `${nickname.trim().toLowerCase()}${NICKNAME_DOMAIN}`
}

// 닉네임을 이메일 형식으로 변환하여 Firebase 인증에 사용

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userNickname, setUserNickname] = useState<string | null>(null)

  // 회원가입 (닉네임 + 비밀번호)
  async function signup(nickname: string, password: string) {
    const email = nicknameToEmail(nickname)
    
    try {
      // Firebase 인증으로 계정 생성 (이메일 형식이지만 실제 이메일은 아님)
      // Firebase는 같은 이메일(닉네임@mmm.com)이 이미 존재하면 에러 발생
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 프로필에 닉네임 저장
      await updateProfile(user, { displayName: nickname })

      // Firestore에 사용자 프로필 저장
      await setDoc(doc(db, 'userProfiles', user.uid), {
        nickname: nickname,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      return user
    } catch (error: any) {
      // Firebase Authentication 에러 코드별 처리
      if (error.code === 'auth/email-already-in-use') {
        // 동일한 닉네임(이메일)이 이미 등록된 경우
        throw new Error('이미 사용 중인 닉네임입니다.')
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('비밀번호는 6자 이상이어야 합니다.')
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('올바르지 않은 닉네임 형식입니다.')
      }
      // 기타 에러는 원본 메시지 전달
      console.error('회원가입 에러:', error)
      throw new Error(error.message || '회원가입에 실패했습니다.')
    }
  }

  // 로그인 (닉네임 + 비밀번호)
  async function login(nickname: string, password: string) {
    const email = nicknameToEmail(nickname)
    
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      // Firebase Authentication 에러 코드별 처리
      if (error.code === 'auth/user-not-found') {
        throw new Error('존재하지 않는 닉네임입니다.')
      }
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        throw new Error('닉네임 또는 비밀번호가 올바르지 않습니다.')
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('올바르지 않은 닉네임 형식입니다.')
      }
      // 기타 에러는 원본 메시지 전달
      console.error('로그인 에러:', error)
      throw new Error(error.message || '로그인에 실패했습니다.')
    }
  }

  // 로그아웃
  async function logout() {
    await signOut(auth)
    setUserNickname(null)
  }

  // 사용자 닉네임 가져오기
  useEffect(() => {
    if (!currentUser) {
      setUserNickname(null)
      return
    }

    const loadUserNickname = async () => {
      try {
        // 먼저 Firestore에서 닉네임 확인
        const profileRef = doc(db, 'userProfiles', currentUser.uid)
        const profileDoc = await getDoc(profileRef)
        
        if (profileDoc.exists()) {
          setUserNickname(profileDoc.data().nickname || null)
        } else {
          // Firestore에 없으면 이메일에서 닉네임 추출
          const email = currentUser.email || ''
          if (email.endsWith(NICKNAME_DOMAIN)) {
            const nickname = email.replace(NICKNAME_DOMAIN, '')
            setUserNickname(nickname)
          } else {
            // displayName 사용
            setUserNickname(currentUser.displayName || null)
          }
        }
      } catch (error) {
        console.error('닉네임 로드 실패:', error)
        // 에러 발생 시 displayName 사용
        setUserNickname(currentUser.displayName || null)
      }
    }

    loadUserNickname()
  }, [currentUser])

  // 인증 상태 변화 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    userNickname,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

