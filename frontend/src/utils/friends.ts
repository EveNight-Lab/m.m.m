/**
 * 친구 시스템 유틸리티
 * Firestore 기반 친구 검색, 요청, 목록 관리
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

export interface FriendRequest {
  id: string
  fromUserId: string
  fromUserNickname: string
  toUserId: string
  toUserNickname: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
}

export interface Friend {
  id: string
  userId: string
  nickname: string
  addedAt: Date
}

export interface UserProfile {
  userId: string
  nickname: string
}

/**
 * 닉네임으로 사용자 검색
 * Firestore의 문자열 범위 쿼리 사용 (인덱스 필요 없음)
 */
export async function searchUsersByNickname(nickname: string, currentUserId: string): Promise<UserProfile[]> {
  try {
    const profilesRef = collection(db, 'userProfiles')
    // 정확한 일치 또는 시작 부분 일치 검색
    const q = query(
      profilesRef,
      where('nickname', '>=', nickname.toLowerCase()),
      where('nickname', '<=', nickname.toLowerCase() + '\uf8ff')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs
      .filter(doc => doc.id !== currentUserId) // 자기 자신 제외
      .map(doc => {
        const data = doc.data()
        return {
          userId: doc.id,
          nickname: data.nickname || '',
        }
      })
      .filter(user => user.nickname.toLowerCase().includes(nickname.toLowerCase())) // 대소문자 무시 필터링
  } catch (error) {
    console.error('사용자 검색 실패:', error)
    // 인덱스 오류인 경우 빈 배열 반환
    if (error instanceof Error && error.message.includes('index')) {
      console.warn('Firestore 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.')
      return []
    }
    throw error
  }
}

/**
 * 친구 요청 보내기
 */
export async function sendFriendRequest(fromUserId: string, fromUserNickname: string, toUserId: string, toUserNickname: string): Promise<void> {
  try {
    // 이미 친구인지 확인
    const isFriend = await checkFriendship(fromUserId, toUserId)
    if (isFriend) {
      throw new Error('이미 친구입니다.')
    }
    
    // 이미 보낸 요청이 있는지 확인
    const existingSentRequest = await getFriendRequest(fromUserId, toUserId)
    if (existingSentRequest && existingSentRequest.status === 'pending') {
      throw new Error('이미 친구 요청을 보냈습니다.')
    }
    
    // 상대방이 보낸 요청이 있는지 확인 (있으면 자동 승인)
    const existingReceivedRequest = await getFriendRequest(toUserId, fromUserId)
    if (existingReceivedRequest && existingReceivedRequest.status === 'pending') {
      // 상대방이 보낸 요청이 있으면 자동으로 승인
      await acceptFriendRequestById(existingReceivedRequest.id)
      return
    }
    
    // 새 친구 요청 생성 (각 요청을 별도 문서로 저장)
    const requestsRef = collection(db, 'friendRequests')
    await addDoc(requestsRef, {
      fromUserId,
      fromUserNickname,
      toUserId,
      toUserNickname,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('친구 요청 보내기 실패:', error)
    throw error
  }
}

/**
 * 친구 요청 가져오기 (fromUserId -> toUserId)
 */
async function getFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest | null> {
  try {
    const requestsRef = collection(db, 'friendRequests')
    const q = query(
      requestsRef,
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    // 가장 최근 요청 반환
    const requests = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        fromUserId: data.fromUserId,
        fromUserNickname: data.fromUserNickname,
        toUserId: data.toUserId,
        toUserNickname: data.toUserNickname,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
      }
    })
    
    requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return requests[0]
  } catch (error) {
    console.error('친구 요청 가져오기 실패:', error)
    return null
  }
}

/**
 * 받은 친구 요청 목록 가져오기
 */
export async function getReceivedFriendRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const requestsRef = collection(db, 'friendRequests')
    // orderBy 없이 먼저 쿼리 (인덱스 문제 방지)
    const q = query(
      requestsRef,
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    )
    const querySnapshot = await getDocs(q)
    
    const requests = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        fromUserId: data.fromUserId,
        fromUserNickname: data.fromUserNickname,
        toUserId: data.toUserId,
        toUserNickname: data.toUserNickname,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
      }
    })
    
    // 클라이언트에서 정렬
    requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    
    return requests
  } catch (error) {
    console.error('받은 친구 요청 목록 가져오기 실패:', error)
    throw error
  }
}

/**
 * 친구 요청 승인
 */
export async function acceptFriendRequestById(requestId: string): Promise<void> {
  try {
    const requestRef = doc(db, 'friendRequests', requestId)
    const requestDoc = await getDoc(requestRef)
    
    if (!requestDoc.exists()) {
      throw new Error('친구 요청을 찾을 수 없습니다.')
    }
    
    const data = requestDoc.data()
    const userId1 = data.fromUserId
    const userId2 = data.toUserId
    
    // 요청 상태 업데이트
    await updateDoc(requestRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    })
    
    // 친구 관계 생성 (양방향 체크를 위해 정렬된 ID 사용)
    const friendId = userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`
    const friendRef = doc(db, 'friends', friendId)
    
    // 이미 친구 관계가 있는지 확인
    const friendDoc = await getDoc(friendRef)
    if (!friendDoc.exists()) {
      await setDoc(friendRef, {
        userId1: userId1 < userId2 ? userId1 : userId2,
        userId2: userId1 < userId2 ? userId2 : userId1,
        addedAt: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error('친구 요청 승인 실패:', error)
    throw error
  }
}

/**
 * 친구 요청 거절
 */
export async function rejectFriendRequest(requestId: string): Promise<void> {
  try {
    const requestRef = doc(db, 'friendRequests', requestId)
    await updateDoc(requestRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('친구 요청 거절 실패:', error)
    throw error
  }
}

/**
 * 친구 관계 확인
 */
async function checkFriendship(userId1: string, userId2: string): Promise<boolean> {
  try {
    const friendId = userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`
    const friendRef = doc(db, 'friends', friendId)
    const friendDoc = await getDoc(friendRef)
    return friendDoc.exists()
  } catch (error) {
    console.error('친구 관계 확인 실패:', error)
    return false
  }
}

/**
 * 친구 목록 가져오기
 */
export async function getFriends(userId: string): Promise<Friend[]> {
  try {
    const friendsRef = collection(db, 'friends')
    const q1 = query(friendsRef, where('userId1', '==', userId))
    const q2 = query(friendsRef, where('userId2', '==', userId))
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2),
    ])
    
    const friendIds: string[] = []
    snapshot1.docs.forEach(doc => {
      const data = doc.data()
      if (data.userId2) friendIds.push(data.userId2)
    })
    snapshot2.docs.forEach(doc => {
      const data = doc.data()
      if (data.userId1) friendIds.push(data.userId1)
    })
    
    // 친구 프로필 정보 가져오기
    const friends: Friend[] = []
    for (const friendId of friendIds) {
      const profileRef = doc(db, 'userProfiles', friendId)
      const profileDoc = await getDoc(profileRef)
      
      if (profileDoc.exists()) {
        const data = profileDoc.data()
        const friendDoc = snapshot1.docs.find(d => d.data().userId2 === friendId) || 
                         snapshot2.docs.find(d => d.data().userId1 === friendId)
        
        friends.push({
          id: friendId,
          userId: friendId,
          nickname: data.nickname || '',
          addedAt: friendDoc?.data().addedAt?.toDate() || new Date(),
        })
      }
    }
    
    // 추가일 기준으로 정렬
    friends.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
    
    return friends
  } catch (error) {
    console.error('친구 목록 가져오기 실패:', error)
    throw error
  }
}

/**
 * 친구 삭제
 */
export async function removeFriend(userId1: string, userId2: string): Promise<void> {
  try {
    const friendId = userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`
    const friendRef = doc(db, 'friends', friendId)
    await deleteDoc(friendRef)
    
    // 친구 요청도 삭제 (있는 경우)
    const requestId = friendId
    const requestRef = doc(db, 'friendRequests', requestId)
    const requestDoc = await getDoc(requestRef)
    if (requestDoc.exists()) {
      await deleteDoc(requestRef)
    }
  } catch (error) {
    console.error('친구 삭제 실패:', error)
    throw error
  }
}

/**
 * 친구 요청 실시간 구독
 */
export function subscribeToFriendRequests(
  userId: string,
  callback: (requests: FriendRequest[]) => void
): () => void {
  const requestsRef = collection(db, 'friendRequests')
  // orderBy 없이 쿼리 (인덱스 문제 방지)
  const q = query(
    requestsRef,
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  )
  
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        fromUserId: data.fromUserId,
        fromUserNickname: data.fromUserNickname,
        toUserId: data.toUserId,
        toUserNickname: data.toUserNickname,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
      }
    })
    // 클라이언트에서 정렬
    requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    callback(requests)
  })
}

/**
 * 친구 목록 실시간 구독
 */
export function subscribeToFriends(
  userId: string,
  callback: (friends: Friend[]) => void
): () => void {
  const friendsRef = collection(db, 'friends')
  const q1 = query(friendsRef, where('userId1', '==', userId))
  const q2 = query(friendsRef, where('userId2', '==', userId))
  
  let unsubscribe1: (() => void) | null = null
  let unsubscribe2: (() => void) | null = null
  
  const updateFriends = async () => {
    try {
      const friends = await getFriends(userId)
      callback(friends)
    } catch (error) {
      console.error('친구 목록 업데이트 실패:', error)
    }
  }
  
  unsubscribe1 = onSnapshot(q1, updateFriends)
  unsubscribe2 = onSnapshot(q2, updateFriends)
  
  return () => {
    if (unsubscribe1) unsubscribe1()
    if (unsubscribe2) unsubscribe2()
  }
}

/**
 * 다른 사용자의 계약된 몬스터 가져오기
 */
export async function getOtherUserContractedMonsters(userId: string) {
  try {
    const { getUserCharacters } = await import('./characters')
    const allCharacters = await getUserCharacters(userId)
    return allCharacters.filter((char: any) => char.contracted)
  } catch (error) {
    console.error('다른 사용자의 계약된 몬스터 가져오기 실패:', error)
    throw error
  }
}

/**
 * 무작위 사용자 선택 (자기 자신 제외)
 */
export async function getRandomUser(currentUserId: string): Promise<UserProfile | null> {
  try {
    const profilesRef = collection(db, 'userProfiles')
    const querySnapshot = await getDocs(profilesRef)
    
    const users = querySnapshot.docs
      .filter(doc => doc.id !== currentUserId)
      .map(doc => ({
        userId: doc.id,
        nickname: doc.data().nickname || '',
      }))
    
    if (users.length === 0) {
      return null
    }
    
    const randomIndex = Math.floor(Math.random() * users.length)
    return users[randomIndex]
  } catch (error) {
    console.error('무작위 사용자 선택 실패:', error)
    return null
  }
}

