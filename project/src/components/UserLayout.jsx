import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from './PageTransition';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';
const LS_KEY = 'savedJobs';

export default function UserLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [appliedCount, setAppliedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user?.id) return;
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch(`${API}/applications/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error('failed');
        const totalApplied = Array.isArray(data) ? data.length : 0;
        const totalAccepted = Array.isArray(data) ? data.filter(a => a.status === 'accepted').length : 0;
        setAppliedCount(totalApplied);
        setAcceptedCount(totalAccepted);
      } catch (e) {
        setAppliedCount(0);
        setAcceptedCount(0);
      }
    };

    fetchCounts();
  }, [user]);

  useEffect(() => {
    const loadSaved = () => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        const ids = raw ? JSON.parse(raw) : [];
        setSavedCount(Array.isArray(ids) ? ids.length : 0);
      } catch (_) {
        setSavedCount(0);
      }
    };
    loadSaved();
    const onUpdate = () => loadSaved();
    window.addEventListener('savedjobs:update', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('savedjobs:update', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  // Notifications: count only user notifications (unread)
  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) { setNotifCount(0); return; }
        const res = await fetch(`${API}/notifications/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const unread = Array.isArray(data) ? data.filter(n => !n.is_read).length : 0;
        setNotifCount(unread);
      } catch (_) {
        setNotifCount(0);
      }
    };
    loadNotifs();
    const id = setInterval(loadNotifs, 15000);
    const onUpdate = () => loadNotifs();
    window.addEventListener('notifications:update', onUpdate);
    return () => {
      clearInterval(id);
      window.removeEventListener('notifications:update', onUpdate);
    };
  }, []);

  const navItems = [
    { path: '/user/jobs', label: 'Browse Jobs', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { path: '/user/ats', label: 'ATS Score', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { path: '/user/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { path: '/user/contact', label: 'Contact Us', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M21 15a2 2 0 01-2 2H5a2 2 0 01-2-2V7' },
  ];

  // Navigation button styles
  const isActive = (path) => location.pathname === path;
  const baseNavBtn = 'group inline-flex items-center px-5 py-2.5 rounded-lg font-semibold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-user-primary';
  const activeNavBtn = 'bg-blue-600 text-white shadow-lg';
  const inactiveNavBtn = 'text-gray-300 hover:bg-gray-700 hover:text-white';

  return (
    <div className="min-h-screen antialiased">
      <nav className="sticky top-0 z-50 bg-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <button
                className="flex items-center gap-2 text-2xl font-extrabold text-white tracking-tight cursor-pointer transition-opacity hover:opacity-90"
                onClick={() => navigate('/user/jobs')}
                aria-label="JobBoard Pro Home"
              >
                <DotLottieReact
                  src="https://lottie.host/dc00daab-a82c-409a-8a3b-88e3df00698a/t1KyA0TyDj.lottie"
                  loop
                  autoplay
                  style={{ width: 32, height: 32 }}
                />
                <span>JobBoard</span>
              </button>
              <div className="hidden md:flex space-x-3">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`${baseNavBtn} ${
                      isActive(item.path) ? activeNavBtn : inactiveNavBtn
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/user/saved')}
                className="text-white hover:text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-user-primary"
                aria-label="Saved jobs"
                title="Saved jobs"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
                  <path d="M6 2a2 2 0 00-2 2v18l8-4 8 4V4a2 2 0 00-2-2H6z" strokeWidth="2" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/user/profile')}
                className="relative text-white hover:text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-user-primary"
                aria-label="Notifications"
                title={`Notifications: ${notifCount}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-black">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate('/messages')}
                className="text-white hover:text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-user-primary"
                aria-label="Messages"
                title="Messages"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <span className="text-white font-medium bg-black bg-opacity-10 px-3 py-1.5 rounded-full shadow-sm">
                Hello, {profile?.full_name || 'User'}
              </span>
              <button
                onClick={() => navigate('/')}
                className="text-white hover:text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-user-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden bg-black/95 shadow-lg backdrop-blur">
        <div className="flex justify-around py-2.5">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all duration-200 transform active:scale-95 ${
                isActive(item.path)
                  ? 'text-white font-semibold bg-gray-800 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="text-xs mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}