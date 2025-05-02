import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import ChatView from './components/Chat/ChatView';
import ProfileSettings from './components/Profile/ProfileSettings';
import FriendsTab from './components/Friends/FriendsTab';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      {isAuthenticated && <Navbar />}
      <div className="app-container">
        {isAuthenticated && <Sidebar />}
        <div className="content">
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            <Route path="/" element={
              <ProtectedRoute>
                <ChatView />
              </ProtectedRoute>
            } />
            <Route path="/chat/:chatId" element={
              <ProtectedRoute>
                <ChatView />
              </ProtectedRoute>
            } />
            <Route path="/friends" element={
              <ProtectedRoute>
                <FriendsTab />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;