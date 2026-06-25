/**
 * 로컬 스토리지 기반 데이터 서비스 (Firestore 대체)
 */

import type { Character } from '../types'
import type { Friend, FriendRequest, UserProfile } from './friends'

const STORAGE_KEYS = {
  CHARACTERS: 'mmm_characters',
  FRIENDS: 'mmm_friends',
  FRIEND_REQUESTS: 'mmm_friend_requests',
  USER_PROFILES: 'mmm_user_profiles',
}

// 헬퍼: 로컬 스토리지에서 데이터 파싱
function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`localStorage read error for key ${key}:`, error)
    return defaultValue
  }
}

// 헬퍼: 로컬 스토리지에 데이터 저장
function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`localStorage write error for key ${key}:`, error)
  }
}

export function seedInitialData() {
  const profiles = getStorageItem<Record<string, UserProfile>>(STORAGE_KEYS.USER_PROFILES, {})
  
  // 이미 데이터가 존재하면 시딩 건너뜀
  if (Object.keys(profiles).length > 0) return

  const mockUsers: Record<string, UserProfile> = {
    'user_gemini': { userId: 'user_gemini', nickname: '제미나이마스터' },
    'user_neon': { userId: 'user_neon', nickname: '사이버닌자' },
    'user_fantasy': { userId: 'user_fantasy', nickname: '아르칸드현자' },
    'user_steam': { userId: 'user_steam', nickname: '태엽장이' },
  }
  setStorageItem(STORAGE_KEYS.USER_PROFILES, mockUsers)

  const mockCharacters: Character[] = [
    {
      id: 'char_gemini_1',
      name: '프로토타입 G-25',
      nickname: '차원 돌파자',
      species: '안드로이드 기계수',
      battleStyle: '원거리 빔 방사 및 중력 왜곡',
      appearance: '우주 은하빛 외장 장갑과 푸른빛 홀로그램 눈을 가진 휴머노이드 로봇',
      worldView: '코스모스 (우주, 별, 신비)',
      stats: { hp: 120, diceCount: 3, fixedDamage: 12, defense: 8 },
      traits: [
        { name: '강철 장갑', stat: 'defense', statName: '방어력', value: 3, description: '방어력+3' },
        { name: '초고출력 코어', stat: 'fixedDamage', statName: '고정데미지', value: 4, description: '고정데미지+4' },
        { name: '연산 시스템 과부하', stat: 'diceCount', statName: '주사위 수', value: 1, description: '주사위 수+1' }
      ],
      activeSkill: {
        name: '제미나이 빔',
        manaCost: 1,
        effect: '출혈:3:1', // 3초간 출혈 스택 1개
        description: '강력한 타겟팅 빔을 쏘아 상대에게 지속 출혈 효과를 부여합니다.'
      },
      createdAt: new Date().toISOString(),
      contracted: true,
      imageUrl: '/templates/template-1766689748122-코스모스-인간-원거리 딜러-61bhg8.png',
    },
    {
      id: 'char_neon_1',
      name: '코드네임 쉐도우',
      nickname: '어둠의 집행자',
      species: '바이오닉 닌자',
      battleStyle: '쌍검 고속 쾌검술 및 은신',
      appearance: '네온 핑크색 발광 라인이 그려진 검은 슈트와 한 쌍의 플라즈마 카타나',
      worldView: '네온 시티 (SF, 미래, 사이버펑크)',
      stats: { hp: 90, diceCount: 4, fixedDamage: 15, defense: 4 },
      traits: [
        { name: '민첩성 극대화', stat: 'diceCount', statName: '주사위 수', value: 2, description: '주사위 수+2' },
        { name: '나노 입자 검날', stat: 'fixedDamage', statName: '고정데미지', value: 5, description: '고정데미지+5' },
        { name: '유리 몸체', stat: 'hp', statName: '체력', value: -10, description: '체력-10' }
      ],
      activeSkill: {
        name: '네온 쉐도우 슬래시',
        manaCost: 1,
        effect: '둔화:3:50', // 3초간 둔화
        description: '눈 깜짝할 사이에 적을 베어넘겨 적의 속도를 3초 동안 50% 둔화시킵니다.'
      },
      createdAt: new Date().toISOString(),
      contracted: true,
      imageUrl: '/templates/template-1766689609983-네온 시티-수인-근접 딜러-2w6ccm.png',
    },
    {
      id: 'char_fantasy_1',
      name: '메디브스',
      nickname: '원소 학자',
      species: '고대 마법사',
      battleStyle: '4대 원소 화염빙결 붕괴 마법',
      appearance: '보랏빛 로브와 기묘한 푸른 룬 문자가 회전하는 지팡이를 든 노현자',
      worldView: '아르칸드리아 (마법, 중세, 판타지)',
      stats: { hp: 100, diceCount: 3, fixedDamage: 8, defense: 10 },
      traits: [
        { name: '마력 보호막', stat: 'defense', statName: '방어력', value: 5, description: '방어력+5' },
        { name: '현자의 생명력', stat: 'hp', statName: '체력', value: 15, description: '체력+15' },
        { name: '원소 집중', stat: 'fixedDamage', statName: '고정데미지', value: 2, description: '고정데미지+2' }
      ],
      activeSkill: {
        name: '아르칸 붕괴',
        manaCost: 1,
        effect: '중독:4:2', // 4초간 중독 스택 2개
        description: '타락한 마력을 주입하여 적에게 원소 오염을 유발하며 마력 지속 중독 피해를 입힙니다.'
      },
      createdAt: new Date().toISOString(),
      contracted: true,
      imageUrl: '/templates/template-1766689374749-아르칸드리아-인간-원거리 딜러-a72ivc.png',
    },
    {
      id: 'char_steam_1',
      name: '태엽 태풍',
      nickname: '증기 폭주족',
      species: '스팀 골렘',
      battleStyle: '초진동 톱날 베기',
      appearance: '구리빛 태엽 장치와 관절에서 뿜어 나오는 스팀 증기, 날카로운 피스톤 톱날',
      worldView: '스팀하이븐 (스팀펑크, 기계, 증기)',
      stats: { hp: 110, diceCount: 3, fixedDamage: 10, defense: 10 },
      traits: [
        { name: '스팀 아머', stat: 'defense', statName: '방어력', value: 4, description: '방어력+4' },
        { name: '과부하 피스톤', stat: 'fixedDamage', statName: '고정데미지', value: 3, description: '고정데미지+3' }
      ],
      activeSkill: {
        name: '증기 분출',
        manaCost: 1,
        effect: '둔화:3:30',
        description: '뜨거운 고압 증기를 내뿜어 적의 움직임을 방해합니다.'
      },
      createdAt: new Date().toISOString(),
      contracted: true,
      imageUrl: '/templates/template-1766687630980-스팀하이븐-인간-탱커-dhzhc.png',
    }
  ]

  // 각 캐릭터에 해당 유저 아이디 할당
  mockCharacters[0].id = 'char_gemini_1'
  ;(mockCharacters[0] as any).userId = 'user_gemini'
  
  mockCharacters[1].id = 'char_neon_1'
  ;(mockCharacters[1] as any).userId = 'user_neon'

  mockCharacters[2].id = 'char_fantasy_1'
  ;(mockCharacters[2] as any).userId = 'user_fantasy'

  mockCharacters[3].id = 'char_steam_1'
  ;(mockCharacters[3] as any).userId = 'user_steam'

  setStorageItem(STORAGE_KEYS.CHARACTERS, mockCharacters)

  // 기본 친구 관계 몇 개 추가 (제미나이마스터와 사이버닌자가 친구요청/수락된 느낌 연출)
  const mockFriends: any[] = [
    {
      id: 'user_gemini_user_neon',
      userId1: 'user_gemini',
      userId2: 'user_neon',
      addedAt: new Date().toISOString()
    }
  ]
  setStorageItem(STORAGE_KEYS.FRIENDS, mockFriends)
}

// -------------------------------------------------------------
// 캐릭터 데이터 관련 메서드 (characters.ts 대체)
// -------------------------------------------------------------

export async function getLocalUserCharacters(userId: string): Promise<Character[]> {
  seedInitialData()
  const characters = getStorageItem<any[]>(STORAGE_KEYS.CHARACTERS, [])
  const userChars = characters.filter(char => char.userId === userId)
  
  if (userChars.length === 0) {
    // 이 유저의 캐릭터가 전혀 없는 경우 4개의 현실적인 캐릭터 세팅
    const defaultUserChars: any[] = [
      {
        id: 'char_' + userId + '_steam',
        name: '스팀가드 대원',
        nickname: '구리 장벽',
        species: '인간',
        battleStyle: '방패 밀치기 및 증기 장벽',
        appearance: '묵직한 구리 갑옷과 고압 증기 방패를 든 가디언',
        worldView: '스팀하이븐 (스팀펑크, 기계, 증기)',
        stats: { hp: 130, diceCount: 3, fixedDamage: 10, defense: 12 },
        traits: [
          { name: '증기 장갑', stat: 'defense', statName: '방어력', value: 4, description: '방어력+4' },
          { name: '고압 배기', stat: 'fixedDamage', statName: '고정데미지', value: 2, description: '고정데미지+2' },
          { name: '묵직한 무게', stat: 'hp', statName: '체력', value: 10, description: '체력+10' }
        ],
        activeSkill: {
          name: '증기 폭발',
          manaCost: 1,
          effect: '둔화:3:30',
          description: '방패에서 고압의 뜨거운 증기를 뿜어내 상대방을 3초간 30% 둔화시킵니다.'
        },
        createdAt: new Date().toISOString(),
        contracted: true,
        imageUrl: '/templates/template-1766687630980-스팀하이븐-인간-탱커-dhzhc.png',
        userId: userId
      },
      {
        id: 'char_' + userId + '_arc',
        name: '아르카디아 궁수',
        nickname: '실버 애로우',
        species: '인간',
        battleStyle: '원소 마법 활쏘기',
        appearance: '보랏빛 바람을 깃들인 활과 신비로운 은빛 화살통을 멘 사수',
        worldView: '아르칸드리아 (마법, 중세, 판타지)',
        stats: { hp: 90, diceCount: 4, fixedDamage: 12, defense: 5 },
        traits: [
          { name: '바람의 인도', stat: 'diceCount', statName: '주사위 수', value: 1, description: '주사위 수+1' },
          { name: '마력 화살', stat: 'fixedDamage', statName: '고정데미지', value: 3, description: '고정데미지+3' },
          { name: '가벼운 가죽옷', stat: 'hp', statName: '체력', value: -5, description: '체력-5' }
        ],
        activeSkill: {
          name: '아르칸 샷',
          manaCost: 1,
          effect: '중독:4:2',
          description: '마력이 깃든 화살을 날려 상대를 4초 동안 마력 중독 상태로 만듭니다.'
        },
        createdAt: new Date().toISOString(),
        contracted: true,
        imageUrl: '/templates/template-1766689374749-아르칸드리아-인간-원거리 딜러-a72ivc.png',
        userId: userId
      },
      {
        id: 'char_' + userId + '_neon',
        name: '네온 샷 해커',
        nickname: '홀로 스나이퍼',
        species: '인간',
        battleStyle: '홀로그램 유도탄 발사',
        appearance: '빛나는 홀로그램 고글과 형광 사이안 에너지 런처를 장착한 해커',
        worldView: '네온 시티 (SF, 미래, 사이버펑크)',
        stats: { hp: 100, diceCount: 3, fixedDamage: 14, defense: 6 },
        traits: [
          { name: '시스템 디버깅', stat: 'fixedDamage', statName: '고정데미지', value: 4, description: '고정데미지+4' },
          { name: '네온 센서', stat: 'diceCount', statName: '주사위 수', value: 1, description: '주사위 수+1' }
        ],
        activeSkill: {
          name: '오버클럭 포스',
          manaCost: 1,
          effect: '출혈:3:1',
          description: '에너지 런처를 과부하 시켜 대상에게 지속적인 전기 출혈 피해를 입힙니다.'
        },
        createdAt: new Date().toISOString(),
        contracted: true,
        imageUrl: '/templates/template-1766689563521-네온 시티-인간-원거리 딜러-le30up.png',
        userId: userId
      },
      {
        id: 'char_' + userId + '_cos',
        name: '성간 탐사자',
        nickname: '우주 미아',
        species: '인간',
        battleStyle: '중력 붕괴 탄환 발사',
        appearance: '우주 헬멧과 별빛 에너지 코어를 장착한 우주 비행사',
        worldView: '코스모스 (우주, 별, 신비)',
        stats: { hp: 110, diceCount: 3, fixedDamage: 11, defense: 8 },
        traits: [
          { name: '무중력 적응', stat: 'defense', statName: '방어력', value: 2, description: '방어력+2' },
          { name: '중력 가속', stat: 'fixedDamage', statName: '고정데미지', value: 3, description: '고정데미지+3' }
        ],
        activeSkill: {
          name: '중력 왜곡',
          manaCost: 1,
          effect: '둔화:3:40',
          description: '중력을 로컬로 왜곡하여 상대의 이동 및 행동을 3초간 40% 둔화시킵니다.'
        },
        createdAt: new Date().toISOString(),
        contracted: false,
        imageUrl: '/templates/template-1766689748122-코스모스-인간-원거리 딜러-61bhg8.png',
        userId: userId
      }
    ]
    
    const updatedCharacters = [...characters, ...defaultUserChars]
    setStorageItem(STORAGE_KEYS.CHARACTERS, updatedCharacters)
    return defaultUserChars as Character[]
  }
  
  return userChars.map(char => ({
    ...char,
    createdAt: char.createdAt || new Date().toISOString(),
  })) as Character[]
}

export async function saveLocalCharacter(userId: string, character: Omit<Character, 'id'>): Promise<string> {
  seedInitialData()
  const characters = getStorageItem<any[]>(STORAGE_KEYS.CHARACTERS, [])
  const characterId = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  
  const newCharacter = {
    ...character,
    id: characterId,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  characters.push(newCharacter)
  setStorageItem(STORAGE_KEYS.CHARACTERS, characters)
  return characterId
}

export async function updateLocalCharacter(userId: string, characterId: string, updates: Partial<Character>): Promise<void> {
  seedInitialData()
  const characters = getStorageItem<any[]>(STORAGE_KEYS.CHARACTERS, [])
  const index = characters.findIndex(char => char.id === characterId)
  
  if (index !== -1) {
    characters[index] = {
      ...characters[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    setStorageItem(STORAGE_KEYS.CHARACTERS, characters)
  } else {
    throw new Error('캐릭터를 찾을 수 없습니다.')
  }
}

export async function deleteLocalCharacter(userId: string, characterId: string): Promise<void> {
  seedInitialData()
  const characters = getStorageItem<any[]>(STORAGE_KEYS.CHARACTERS, [])
  const filtered = characters.filter(char => char.id !== characterId)
  setStorageItem(STORAGE_KEYS.CHARACTERS, filtered)
}


// -------------------------------------------------------------
// 친구 및 프로필 관련 메서드 (friends.ts 대체)
// -------------------------------------------------------------

export async function searchLocalUsersByNickname(nickname: string, currentUserId: string): Promise<UserProfile[]> {
  seedInitialData()
  const profiles = getStorageItem<Record<string, UserProfile>>(STORAGE_KEYS.USER_PROFILES, {})
  const query = nickname.toLowerCase().trim()
  
  if (!query) return []
  
  return Object.values(profiles).filter(user => {
    return user.userId !== currentUserId && user.nickname.toLowerCase().includes(query)
  })
}

export async function sendLocalFriendRequest(
  fromUserId: string,
  fromUserNickname: string,
  toUserId: string,
  toUserNickname: string
): Promise<void> {
  seedInitialData()
  const friends = getStorageItem<any[]>(STORAGE_KEYS.FRIENDS, [])
  
  // 이미 친구인지 검사
  const friendId = fromUserId < toUserId ? `${fromUserId}_${toUserId}` : `${toUserId}_${fromUserId}`
  const alreadyFriends = friends.some(f => f.id === friendId)
  if (alreadyFriends) {
    throw new Error('이미 친구 상태입니다.')
  }
  
  const requests = getStorageItem<any[]>(STORAGE_KEYS.FRIEND_REQUESTS, [])
  
  // 이미 보낸 대기중인 요청 확인
  const alreadyRequested = requests.some(r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending')
  if (alreadyRequested) {
    throw new Error('이미 친구 요청을 보냈습니다.')
  }
  
  // 상대방이 먼저 요청한 건이 있는지 검사 (자동 수락)
  const receivedRequestIndex = requests.findIndex(r => r.fromUserId === toUserId && r.toUserId === fromUserId && r.status === 'pending')
  if (receivedRequestIndex !== -1) {
    requests[receivedRequestIndex].status = 'accepted'
    requests[receivedRequestIndex].acceptedAt = new Date().toISOString()
    setStorageItem(STORAGE_KEYS.FRIEND_REQUESTS, requests)
    
    // 친구 추가
    friends.push({
      id: friendId,
      userId1: fromUserId < toUserId ? fromUserId : toUserId,
      userId2: fromUserId < toUserId ? toUserId : fromUserId,
      addedAt: new Date().toISOString()
    })
    setStorageItem(STORAGE_KEYS.FRIENDS, friends)
    return
  }
  
  // 신규 요청 생성
  const requestId = 'freq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  requests.push({
    id: requestId,
    fromUserId,
    fromUserNickname,
    toUserId,
    toUserNickname,
    status: 'pending',
    createdAt: new Date().toISOString(),
  })
  setStorageItem(STORAGE_KEYS.FRIEND_REQUESTS, requests)
}

export async function getLocalReceivedFriendRequests(userId: string): Promise<FriendRequest[]> {
  seedInitialData()
  const requests = getStorageItem<any[]>(STORAGE_KEYS.FRIEND_REQUESTS, [])
  return requests
    .filter(r => r.toUserId === userId && r.status === 'pending')
    .map(r => ({
      ...r,
      createdAt: new Date(r.createdAt),
    }))
}

export async function acceptLocalFriendRequestById(requestId: string): Promise<void> {
  seedInitialData()
  const requests = getStorageItem<any[]>(STORAGE_KEYS.FRIEND_REQUESTS, [])
  const reqIndex = requests.findIndex(r => r.id === requestId)
  
  if (reqIndex === -1) {
    throw new Error('친구 요청을 찾을 수 없습니다.')
  }
  
  requests[reqIndex].status = 'accepted'
  requests[reqIndex].acceptedAt = new Date().toISOString()
  setStorageItem(STORAGE_KEYS.FRIEND_REQUESTS, requests)
  
  const data = requests[reqIndex]
  const userId1 = data.fromUserId
  const userId2 = data.toUserId
  
  const friendId = userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`
  const friends = getStorageItem<any[]>(STORAGE_KEYS.FRIENDS, [])
  
  if (!friends.some(f => f.id === friendId)) {
    friends.push({
      id: friendId,
      userId1: userId1 < userId2 ? userId1 : userId2,
      userId2: userId1 < userId2 ? userId2 : userId1,
      addedAt: new Date().toISOString()
    })
    setStorageItem(STORAGE_KEYS.FRIENDS, friends)
  }
}

export async function rejectLocalFriendRequest(requestId: string): Promise<void> {
  seedInitialData()
  const requests = getStorageItem<any[]>(STORAGE_KEYS.FRIEND_REQUESTS, [])
  const reqIndex = requests.findIndex(r => r.id === requestId)
  
  if (reqIndex !== -1) {
    requests[reqIndex].status = 'rejected'
    requests[reqIndex].rejectedAt = new Date().toISOString()
    setStorageItem(STORAGE_KEYS.FRIEND_REQUESTS, requests)
  }
}

export async function getLocalFriends(userId: string): Promise<Friend[]> {
  seedInitialData()
  const friends = getStorageItem<any[]>(STORAGE_KEYS.FRIENDS, [])
  const profiles = getStorageItem<Record<string, UserProfile>>(STORAGE_KEYS.USER_PROFILES, {})
  
  const friendIds: string[] = []
  friends.forEach(f => {
    if (f.userId1 === userId) friendIds.push(f.userId2)
    else if (f.userId2 === userId) friendIds.push(f.userId1)
  })
  
  const result: Friend[] = []
  for (const fId of friendIds) {
    const profile = profiles[fId]
    if (profile) {
      const relationship = friends.find(f => (f.userId1 === userId && f.userId2 === fId) || (f.userId1 === fId && f.userId2 === userId))
      result.push({
        id: fId,
        userId: fId,
        nickname: profile.nickname,
        addedAt: relationship ? new Date(relationship.addedAt) : new Date()
      })
    }
  }
  
  return result.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
}

export async function removeLocalFriend(userId1: string, userId2: string): Promise<void> {
  seedInitialData()
  const friends = getStorageItem<any[]>(STORAGE_KEYS.FRIENDS, [])
  const friendId = userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`
  
  const filteredFriends = friends.filter(f => f.id !== friendId)
  setStorageItem(STORAGE_KEYS.FRIENDS, filteredFriends)
  
  // 친구 요청 정보도 정리
  const requests = getStorageItem<any[]>(STORAGE_KEYS.FRIEND_REQUESTS, [])
  const filteredRequests = requests.filter(r => 
    !((r.fromUserId === userId1 && r.toUserId === userId2) || (r.fromUserId === userId2 && r.toUserId === userId1))
  )
  setStorageItem(STORAGE_KEYS.FRIEND_REQUESTS, filteredRequests)
}

const CPU_PROFILES: UserProfile[] = [
  { userId: 'cpu_gemini', nickname: '차원의 방랑자(CPU)' },
  { userId: 'cpu_neon', nickname: '네온 시티 경비대(CPU)' },
  { userId: 'cpu_fantasy', nickname: '아르칸드 마법소장(CPU)' },
  { userId: 'cpu_steam', nickname: '녹슨 태엽 기사단(CPU)' },
  { userId: 'cpu_death', nickname: '심연의 인도자(CPU)' },
  { userId: 'cpu_beast', nickname: '야생의 기계 드래곤(CPU)' }
]

export async function getLocalRandomUser(currentUserId: string): Promise<UserProfile | null> {
  seedInitialData()
  // 항상 무작위 NPC 캐릭터랑 매칭되도록 CPU 리스트에서 무작위 선택하여 반환
  const randomIndex = Math.floor(Math.random() * CPU_PROFILES.length)
  return CPU_PROFILES[randomIndex]
}

export async function getLocalOtherUserContractedMonsters(userId: string): Promise<Character[]> {
  seedInitialData()

  // CPU 유저 매칭 시, 해당 CPU 캐릭터 데이터 반환
  if (userId.startsWith('cpu_')) {
    const cpuMonsters: Record<string, Character[]> = {
      cpu_gemini: [
        {
          id: 'char_cpu_gemini',
          name: '프로토타입 G-25',
          nickname: '차원 돌파자',
          species: '안드로이드 기계수',
          battleStyle: '원거리 빔 방사 및 중력 왜곡',
          appearance: '우주 은하빛 외장 장갑과 푸른빛 홀로그램 눈을 가진 휴머노이드 로봇',
          worldView: '코스모스 (우주, 별, 신비)',
          stats: { hp: 120, diceCount: 3, fixedDamage: 12, defense: 8 },
          traits: [
            { name: '강철 장갑', stat: 'defense', statName: '방어력', value: 3, description: '방어력+3' },
            { name: '초고출력 코어', stat: 'fixedDamage', statName: '고정데미지', value: 4, description: '고정데미지+4' }
          ],
          activeSkill: {
            name: '제미나이 빔',
            manaCost: 1,
            effect: '출혈:3:1',
            description: '강력한 타겟팅 빔을 쏘아 상대에게 지속 출혈 효과를 부여합니다.'
          },
          createdAt: new Date().toISOString(),
          contracted: true,
          imageUrl: '/templates/template-1766689748122-코스모스-인간-원거리 딜러-61bhg8.png'
        }
      ],
      cpu_neon: [
        {
          id: 'char_cpu_neon',
          name: '코드네임 쉐도우',
          nickname: '어둠의 집행자',
          species: '바이오닉 닌자',
          battleStyle: '쌍검 고속 쾌검술 및 은신',
          appearance: '네온 핑크색 발광 라인이 그려진 검은 슈트와 한 쌍의 플라즈마 카타나',
          worldView: '네온 시티 (SF, 미래, 사이버펑크)',
          stats: { hp: 90, diceCount: 4, fixedDamage: 15, defense: 4 },
          traits: [
            { name: '민첩성 극대화', stat: 'diceCount', statName: '주사위 수', value: 2, description: '주사위 수+2' },
            { name: '나노 입자 검날', stat: 'fixedDamage', statName: '고정데미지', value: 5, description: '고정데미지+5' }
          ],
          activeSkill: {
            name: '네온 쉐도우 슬래시',
            manaCost: 1,
            effect: '둔화:3:50',
            description: '눈 깜짝할 사이에 적을 베어넘겨 적의 속도를 3초 동안 50% 둔화시킵니다.'
          },
          createdAt: new Date().toISOString(),
          contracted: true,
          imageUrl: '/templates/template-1766689609983-네온 시티-수인-근접 딜러-2w6ccm.png'
        }
      ],
      cpu_fantasy: [
        {
          id: 'char_cpu_fantasy',
          name: '메디브스',
          nickname: '원소 학자',
          species: '고대 마법사',
          battleStyle: '4대 원소 마법',
          appearance: '보랏빛 로브와 기묘한 푸른 룬 문자가 회전하는 지팡이를 든 노현자',
          worldView: '아르칸드리아 (마법, 중세, 판타지)',
          stats: { hp: 100, diceCount: 3, fixedDamage: 8, defense: 10 },
          traits: [
            { name: '마력 보호막', stat: 'defense', statName: '방어력', value: 5, description: '방어력+5' },
            { name: '원소 집중', stat: 'fixedDamage', statName: '고정데미지', value: 2, description: '고정데미지+2' }
          ],
          activeSkill: {
            name: '아르칸 붕괴',
            manaCost: 1,
            effect: '중독:4:2',
            description: '타락한 마력을 주입하여 적에게 원소 오염을 유발하며 마력 지속 중독 피해를 입힙니다.'
          },
          createdAt: new Date().toISOString(),
          contracted: true,
          imageUrl: '/templates/template-1766689374749-아르칸드리아-인간-원거리 딜러-a72ivc.png'
        }
      ],
      cpu_steam: [
        {
          id: 'char_cpu_steam',
          name: '태엽 태풍',
          nickname: '증기 폭주족',
          species: '스팀 골렘',
          battleStyle: '초진동 톱날 베기',
          appearance: '구리빛 태엽 장치와 관절에서 뿜어 나오는 스팀 증기, 날카로운 피스톤 톱날',
          worldView: '스팀하이븐 (스팀펑크, 기계, 증기)',
          stats: { hp: 110, diceCount: 3, fixedDamage: 10, defense: 10 },
          traits: [
            { name: '스팀 아머', stat: 'defense', statName: '방어력', value: 4, description: '방어력+4' },
            { name: '과부하 피스톤', stat: 'fixedDamage', statName: '고정데미지', value: 3, description: '고정데미지+3' }
          ],
          activeSkill: {
            name: '증기 분출',
            manaCost: 1,
            effect: '둔화:3:30',
            description: '뜨거운 고압 증기를 내뿜어 적의 움직임을 방해합니다.'
          },
          createdAt: new Date().toISOString(),
          contracted: true,
          imageUrl: '/templates/template-1766687630980-스팀하이븐-인간-탱커-dhzhc.png'
        }
      ],
      cpu_death: [
        {
          id: 'char_cpu_death',
          name: '심연의 벤시',
          nickname: '영혼의 지배자',
          species: '정령',
          battleStyle: '영혼 흡수 및 저주',
          appearance: '공중에 떠 있는 유령 실루엣과 어두운 그림자 로브',
          worldView: '데스랜드 (암흑, 언데드, 고딕)',
          stats: { hp: 95, diceCount: 3, fixedDamage: 12, defense: 5 },
          traits: [
            { name: '영혼 장갑', stat: 'defense', statName: '방어력', value: 2, description: '방어력+2' },
            { name: '공포 유발', stat: 'fixedDamage', statName: '고정데미지', value: 3, description: '고정데미지+3' }
          ],
          activeSkill: {
            name: '데스 스크림',
            manaCost: 1,
            effect: '둔화:3:30',
            description: '날카로운 비명으로 상대방을 3초간 30% 둔화시킵니다.'
          },
          createdAt: new Date().toISOString(),
          contracted: true,
          imageUrl: '/templates/template-1766689609983-네온 시티-수인-근접 딜러-2w6ccm.png'
        }
      ],
      cpu_beast: [
        {
          id: 'char_cpu_beast',
          name: '야생의 기계 드래곤',
          nickname: '강철의 재앙',
          species: '드래곤',
          battleStyle: '화염 방사 및 꼬리 휘두르기',
          appearance: '구리빛 기계 장갑과 붉은 눈의 로봇 드래곤',
          worldView: '스팀하이븐 (스팀펑크, 기계, 증기)',
          stats: { hp: 130, diceCount: 3, fixedDamage: 14, defense: 8 },
          traits: [
            { name: '강철 비늘', stat: 'defense', statName: '방어력', value: 4, description: '방어력+4' },
            { name: '고온 엔진', stat: 'fixedDamage', statName: '고정데미지', value: 4, description: '고정데미지+4' }
          ],
          activeSkill: {
            name: '오버히트 플레임',
            manaCost: 1,
            effect: '출혈:3:1',
            description: '강력한 화염을 내뿜어 지속 데미지를 입힙니다.'
          },
          createdAt: new Date().toISOString(),
          contracted: true,
          imageUrl: '/templates/template-1766687630980-스팀하이븐-인간-탱커-dhzhc.png'
        }
      ]
    }
    return cpuMonsters[userId] || cpuMonsters.cpu_beast
  }

  const characters = getStorageItem<any[]>(STORAGE_KEYS.CHARACTERS, [])
  const list = characters
    .filter(char => char.userId === userId && char.contracted)
    .map(char => ({
      ...char,
      createdAt: char.createdAt || new Date().toISOString(),
    })) as Character[]

  if (list.length === 0) {
    return [
      {
        id: 'virtual_enemy_' + userId,
        name: '야생의 기계 드래곤',
        nickname: '강철의 재앙',
        species: '드래곤',
        battleStyle: '화염 방사 및 꼬리 휘두르기',
        appearance: '구리빛 기계 장갑과 붉은 눈의 로봇 드래곤',
        worldView: '스팀하이븐 (스팀펑크, 기계, 증기)',
        stats: { hp: 100, diceCount: 3, fixedDamage: 8, defense: 6 },
        traits: [
          { name: '강철 비늘', stat: 'defense', statName: '방어력', value: 3, description: '방어력+3' },
          { name: '고온 엔진', stat: 'fixedDamage', statName: '고정데미지', value: 2, description: '고정데미지+2' }
        ],
        activeSkill: {
          name: '오버히트 플레임',
          manaCost: 1,
          effect: '출혈:3:1',
          description: '강력한 화염을 내뿜어 지속 데미지를 입힙니다.'
        },
        createdAt: new Date().toISOString(),
        contracted: true,
        imageUrl: '/templates/template-1766687630980-스팀하이븐-인간-탱커-dhzhc.png'
      }
    ]
  }
  return list
}

// -------------------------------------------------------------
// 프로필 관리 (인증 및 회원가입 시 호출)
// -------------------------------------------------------------

export function saveLocalUserProfile(userId: string, nickname: string): void {
  const profiles = getStorageItem<Record<string, UserProfile>>(STORAGE_KEYS.USER_PROFILES, {})
  profiles[userId] = { userId, nickname }
  setStorageItem(STORAGE_KEYS.USER_PROFILES, profiles)
}

export function getLocalUserProfile(userId: string): UserProfile | null {
  const profiles = getStorageItem<Record<string, UserProfile>>(STORAGE_KEYS.USER_PROFILES, {})
  return profiles[userId] || null
}

// 닉네임 중복 체크
export function checkNicknameExists(nickname: string): boolean {
  const profiles = getStorageItem<Record<string, UserProfile>>(STORAGE_KEYS.USER_PROFILES, {})
  const lowerNick = nickname.toLowerCase().trim()
  return Object.values(profiles).some(user => user.nickname.toLowerCase() === lowerNick)
}
