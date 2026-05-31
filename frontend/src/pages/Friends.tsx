/**
 * 친구 탭
 * 친구 검색, 요청 관리, 친구 목록 표시
 */

import { useState, useEffect } from 'react'
import PageLayout from '../components/PageLayout'
import Card from '../components/Card'
import { useAuth } from '../contexts/AuthContext'
import {
  searchUsersByNickname,
  sendFriendRequest,
  getReceivedFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend,
  subscribeToFriendRequests,
  subscribeToFriends,
  type FriendRequest,
  type Friend,
  type UserProfile,
} from '../utils/friends'
import { getUserCharacters } from '../utils/characters'
import type { Character } from '../types'

/**
 * 친구 프로필 모달 컴포넌트
 */
function FriendProfileModal({
  friend,
  isOpen,
  onClose,
}: {
  friend: Friend | null
  isOpen: boolean
  onClose: () => void
}) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !friend) return

    const loadCharacters = async () => {
      setLoading(true)
      try {
        const friendCharacters = await getUserCharacters(friend.userId)
        const contractedCharacters = friendCharacters.filter(char => char.contracted)
        setCharacters(contractedCharacters)
      } catch (error) {
        console.error('친구 캐릭터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCharacters()
  }, [isOpen, friend])

  if (!isOpen || !friend) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pb-[calc(100px+env(safe-area-inset-bottom))] bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[calc(100vh-120px)] rounded-2xl overflow-hidden overflow-y-auto bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 border-2 border-cyan-500/60 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/60 text-red-300 hover:text-red-200 transition-all duration-300 z-20"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
            {friend.nickname}
          </h2>
          <p className="text-sm text-gray-400 mb-6">친구의 계약 몬스터</p>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">로딩 중...</div>
            </div>
          ) : characters.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400">계약된 몬스터가 없습니다.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-cyan-500/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50"
                >
                  {char.imageUrl ? (
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      className="w-full h-full object-cover"
                    />
                  ) : char.imageData ? (
                    <img
                      src={`data:image/png;base64,${char.imageData}`}
                      alt={char.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-4xl opacity-30">🎭</div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="text-xs font-bold text-white truncate">{char.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Friends() {
  const { currentUser, userNickname } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [searching, setSearching] = useState(false)
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // 친구 요청 실시간 구독
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToFriendRequests(currentUser.uid, (requests) => {
      setFriendRequests(requests)
    })

    return unsubscribe
  }, [currentUser])

  // 친구 목록 실시간 구독
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToFriends(currentUser.uid, (friendsList) => {
      setFriends(friendsList)
    })

    return unsubscribe
  }, [currentUser])

  // 사용자 검색
  const handleSearch = async () => {
    if (!currentUser || !searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const results = await searchUsersByNickname(searchQuery.trim(), currentUser.uid)
      setSearchResults(results)
    } catch (error) {
      console.error('사용자 검색 실패:', error)
      alert('사용자 검색에 실패했습니다.')
    } finally {
      setSearching(false)
    }
  }

  // 친구 요청 보내기
  const handleSendRequest = async (toUserId: string, toUserNickname: string) => {
    if (!currentUser || !userNickname) return

    try {
      await sendFriendRequest(currentUser.uid, userNickname, toUserId, toUserNickname)
      alert('친구 요청을 보냈습니다!')
      setSearchQuery('')
      setSearchResults([])
    } catch (error: any) {
      console.error('친구 요청 보내기 실패:', error)
      alert(error.message || '친구 요청 보내기에 실패했습니다.')
    }
  }

  // 친구 요청 승인
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequestById(requestId)
    } catch (error: any) {
      console.error('친구 요청 승인 실패:', error)
      alert(error.message || '친구 요청 승인에 실패했습니다.')
    }
  }

  // 친구 요청 거절
  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId)
    } catch (error: any) {
      console.error('친구 요청 거절 실패:', error)
      alert('친구 요청 거절에 실패했습니다.')
    }
  }

  // 친구 삭제
  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUser) return

    const confirmed = window.confirm('정말 이 친구를 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      await removeFriend(currentUser.uid, friendId)
    } catch (error) {
      console.error('친구 삭제 실패:', error)
      alert('친구 삭제에 실패했습니다.')
    }
  }

  // 친구 프로필 열기
  const handleOpenProfile = (friend: Friend) => {
    setSelectedFriend(friend)
    setShowProfileModal(true)
  }

  if (!currentUser) {
    return (
      <PageLayout title="친구">
        <Card>
          <p className="text-center text-gray-400">로그인이 필요합니다.</p>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="친구">
      <div className="space-y-4">
        {/* 친구 검색 */}
        <Card>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">친구 검색</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="닉네임으로 검색"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {searching ? '검색 중...' : '검색'}
              </button>
            </div>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-sm text-gray-400">검색 결과</div>
                {searchResults.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div>
                      <div className="font-semibold text-white">{user.nickname}</div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(user.userId, user.nickname)}
                      className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm font-semibold transition-colors"
                    >
                      친구 추가
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* 친구 요청 (받은 요청) */}
        {friendRequests.length > 0 && (
          <Card>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">친구 요청</h3>
              {friendRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-lg border border-purple-500/30"
                >
                  <div>
                    <div className="font-semibold text-white">{request.fromUserNickname}</div>
                    <div className="text-xs text-gray-400">친구 요청이 왔습니다</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="px-4 py-1.5 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-semibold transition-colors"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="px-4 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-semibold transition-colors"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 친구 목록 */}
        <Card>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">친구 목록 ({friends.length})</h3>
            {friends.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                친구가 없습니다. 위에서 친구를 검색해 추가해보세요!
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold">
                        {friend.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{friend.nickname}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenProfile(friend)}
                        className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm font-semibold transition-colors"
                      >
                        프로필
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend.userId)}
                        className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm font-semibold text-red-300 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 친구 프로필 모달 */}
      <FriendProfileModal
        friend={selectedFriend}
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false)
          setSelectedFriend(null)
        }}
      />
    </PageLayout>
  )
}

export default Friends
