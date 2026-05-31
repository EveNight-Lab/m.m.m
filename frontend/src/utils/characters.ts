/**
 * Firestore 기반 캐릭터 저장/로드 유틸리티
 */

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Character } from '../types'

/**
 * 사용자의 캐릭터 목록 가져오기
 */
export async function getUserCharacters(userId: string): Promise<Character[]> {
  try {
    const charactersRef = collection(db, 'characters')
    const q = query(
      charactersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as Character[]
  } catch (error) {
    console.error('캐릭터 목록 가져오기 실패:', error)
    throw error
  }
}

/**
 * 캐릭터 저장
 */
export async function saveCharacter(userId: string, character: Omit<Character, 'id'>): Promise<string> {
  try {
    const charactersRef = collection(db, 'characters')
    const docRef = await addDoc(charactersRef, {
      ...character,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('캐릭터 저장 실패:', error)
    throw error
  }
}

/**
 * 캐릭터 업데이트
 */
export async function updateCharacter(userId: string, characterId: string, updates: Partial<Character>): Promise<void> {
  try {
    const characterRef = doc(db, 'characters', characterId)
    await updateDoc(characterRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('캐릭터 업데이트 실패:', error)
    throw error
  }
}

/**
 * 캐릭터 삭제
 */
export async function deleteCharacter(userId: string, characterId: string): Promise<void> {
  try {
    const characterRef = doc(db, 'characters', characterId)
    await deleteDoc(characterRef)
  } catch (error) {
    console.error('캐릭터 삭제 실패:', error)
    throw error
  }
}

