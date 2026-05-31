import { Routes, Route, Navigate } from 'react-router-dom'
import { useFontSize } from './hooks/useFontSize'
import BottomTabBar from './components/BottomTabBar'
import ProtectedRoute from './components/ProtectedRoute'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import Login from './pages/Login'
import CreateFirst from './pages/CreateFirst'
import Create from './pages/Create'
import Manage from './pages/Manage'
import Battle from './pages/Battle'
import Friends from './pages/Friends'
import Settings from './pages/Settings'
import { DEFAULT_ROUTE } from './constants/tabs'
import './App.css'

/**
 * 메인 App 컴포넌트
 * 라우팅과 전체 레이아웃을 관리
 */
function App() {
  // 폰트 크기 설정 적용 (html font-size 변경)
  useFontSize()

  return (
    <div className="w-full h-screen h-[100dvh] flex flex-col relative overflow-hidden cosmic-bg">
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden pb-[env(safe-area-inset-bottom)] [-webkit-overflow-scrolling:touch]"
        data-scroll-container
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to={DEFAULT_ROUTE} replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateFirst />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-second"
            element={
              <ProtectedRoute>
                <Create />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage"
            element={
              <ProtectedRoute>
                <Manage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/battle"
            element={
              <ProtectedRoute>
                <Battle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <BottomTabBar />
      <PWAInstallPrompt />
    </div>
  )
}

export default App

