import React, { useState } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import Todo from './pages/Todo';
import TimerPage from './pages/TimerPage';
import Logs from './pages/Logs';
import Summary from './pages/Summary';
import History from './pages/History';
import Priorities from './pages/Priorities';
import Auth from './pages/Auth';

// Global Axios Interceptor for Auth
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'roadmap': return <Roadmap />;
      case 'todo': return <Todo />;
      case 'timer': return <TimerPage />;
      case 'logs': return <Logs />;
      case 'history': return <History />;
      case 'summary': return <Summary />;
      case 'priorities': return <Priorities onNavigate={setActiveTab} />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">
      <Navbar active={activeTab} setActive={setActiveTab} onLogout={handleLogout} user={user} />
      <main className="flex-1 overflow-y-auto h-screen pb-20 pt-20 md:pt-0 md:pb-0">
        <div className="max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
