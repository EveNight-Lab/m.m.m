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
import { checkIsMockMode } from '../services/characterService'

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
 */
export async function searchUsersByNickname(nickname: string, currentUserId: string): Promise<UserProfile[]> {
  if (checkIsMockMode()) {
    const { searchLocalUsersByNickname } = await import('./mockDataService')
    return searchLocalUsersByNickname(nickname, currentUserId)
  }

  try {
    const profilesRef = collection(db, 'userProfiles')
    const q = query(
      profilesRef,
      where('nickname', '>=', nickname.toLowerCase()),
      where('nickname', '<=', nickname.toLowerCase() + '\uf8ff')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs
      .filter(doc => doc.id !== currentUserId)
      .map(doc => {
        const data = doc.data()
        return {
          userId: doc.id,
          nickname: data.nickname || '',
        }
      })
      .filter(user => user.nickname.toLowerCase().includes(nickname.toLowerCase()))
  } catch (error) {
    console.error('사용자 검색 실패:', error)
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
  if (checkIsMockMode()) {
    const { sendLocalFriendRequest } = await import('./mockDataService')
    await sendLocalFriendRequest(fromUserId, fromUserNickname, toUserId, toUserNickname)
    window.dispatchEvent(new CustomEvent('mmm-friends-changed'))
    return
  }

  try {
    const isFriend = await checkFriendship(fromUserId, toUserId)
    if (isFriend) {
      throw new Error('이미 친구입니다.')
    }
    
    const existingSentRequest = await getFriendRequest(fromUserId, toUserId)
    if (existingSentRequest && existingSentRequest.status === 'pending') {
      throw new Error('이미 친구 요청을 보냈습니다.')
    }
    
    const existingReceivedRequest = await getFriendRequest(toUserId, fromUserId)
    if (existingReceivedRequest && existingReceivedRequest.status === 'pending') {
      await acceptFriendRequestById(existingReceivedRequest.id)
      return
    }
    
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
  if (checkIsMockMode()) {
    const { getLocalReceivedFriendRequests } = await import('./mockDataService')
    return getLocalReceivedFriendRequests(userId)
  }

  try {
    const requestsRef = collection(db, 'friendRequests')
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
  if (checkIsMockMode()) {
    const { acceptLocalFriendRequestById } = await import('./mockDataService')
    await acceptLocalFriendRequestById(requestId)
    window.dispatchEvent(new CustomEvent('mmm-friends-changed'))
    return
  }

  try {
    const requestRef = doc(db, 'friendRequests', requestId)
    const requestDoc = await getDoc(requestRef)
    
    if (!requestDoc.exists()) {
      throw new Error('친구 요청을 찾을 수 없습니다.')
    }
    
    const data = requestDoc.data()
    const userId1 = data.fromUserId
    const userId2 = data.toUserId
    
    await updateDoc(requestRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    })
    
    const friendId = userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`
    const friendRef = doc(db, 'friends', friendId)
    
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
  if (checkIsMockMode()) {
    const { rejectLocalFriendRequest } = await import('./mockDataService')
    await rejectLocalFriendRequest(requestId)
    window.dispatchEvent(new CustomEvent('mmm-friends-changed'))
    return
  }

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
  if (checkIsMockMode()) {
    const { getLocalFriends } = await import('./mockDataService')
    return getLocalFriends(userId)
  }

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
  if (checkIsMockMode()) {
    const { removeLocalFriend } = await import('./mockDataService')
    await removeLocalFriend(userId1, userId2)
    window.dispatchEvent(new CustomEvent('mmm-friends-changed'))
    return
  }

  try {
    const friendId = userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`
    const friendRef = doc(db, 'friends', friendId)
    await deleteDoc(friendRef)
    
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
  if (checkIsMockMode()) {
    const handleUpdate = async () => {
      const { getLocalReceivedFriendRequests } = await import('./mockDataService')
      const reqs = await getLocalReceivedFriendRequests(userId)
      callback(reqs)
    }
    
    handleUpdate()
    window.addEventListener('mmm-friends-changed', handleUpdate)
    return () => {
      window.removeEventListener('mmm-friends-changed', handleUpdate)
    }
  }

  const requestsRef = collection(db, 'friendRequests')
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
  if (checkIsMockMode()) {
    const handleUpdate = async () => {
      const friendsList = await getFriends(userId)
      callback(friendsList)
    }
    
    handleUpdate()
    window.addEventListener('mmm-friends-changed', handleUpdate)
    return () => {
      window.removeEventListener('mmm-friends-changed', handleUpdate)
    }
  }

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
  if (checkIsMockMode()) {
    const { getLocalOtherUserContractedMonsters } = await import('./mockDataService')
    return getLocalOtherUserContractedMonsters(userId)
  }

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
  if (checkIsMockMode()) {
    const { getLocalRandomUser } = await import('./mockDataService')
    return getLocalRandomUser(currentUserId)
  }

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


