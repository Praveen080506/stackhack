import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from './PageTransition';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [applicationsCount, setApplicationsCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch(`${API}/applications`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error('failed');
        const pending = Array.isArray(data) ? data.filter(a => a.status === 'pending').length : 0;
        setApplicationsCount(pending);
      } catch (e) {
        setApplicationsCount(0);
      }
    };
    fetchCount();
  }, []);

  const navItems = [
    { path: '/admin/dashboard', label: 'Job Management', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { path: '/admin/applications', label: 'Applications', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: '/admin/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  const isActive = (path) => location.pathname === path;

  // Tailwind class helpers (kept inline, no external CSS)
  const baseNavBtn =
    'group inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';
  const activeNavBtn = 'bg-gray-900 text-white shadow-lg';
  const inactiveNavBtn = 'text-gray-300 hover:bg-gray-800 hover:text-white';

  const mobileBaseBtn =
    'group flex flex-col items-center px-4 py-2 text-xs font-medium transition-colors duration-200';
  const mobileActiveBtn = 'text-white font-bold';
  const mobileInactiveBtn = 'text-gray-400 hover:text-white';

  return (
    <div className="min-h-screen bg-gradient-to-br from-admin-light via-white to-blue-50 antialiased">
      {/* Top Nav */}
      <nav className="bg-black shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <button
                className="flex items-center gap-2 cursor-pointer text-2xl font-bold text-white hover:opacity-90"
                onClick={() => navigate('/admin/dashboard')}
                aria-label="JobBoard Admin Home"
              >
                <DotLottieReact
                  src="https://lottie.host/dc00daab-a82c-409a-8a3b-88e3df00698a/t1KyA0TyDj.lottie"
                  loop
                  autoplay
                  style={{ width: 32, height: 32 }}
                />
                <span>JobBoard Admin</span>
              </button>

              <div className="hidden md:flex items-center gap-3">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`${baseNavBtn} ${
                      isActive(item.path) ? activeNavBtn : inactiveNavBtn
                    }`}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                    title={item.label}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/applications')}
                className="relative inline-flex items-center rounded-md p-2 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                aria-label="Pending applications"
                title={`Pending applications: ${applicationsCount}`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {applicationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-black">
                    {applicationsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate('/messages')}
                className="inline-flex items-center rounded-md p-2 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                aria-label="Messages"
                title="Messages"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <span className="max-w-[40vw] truncate font-semibold text-white sm:max-w-none">
                Hello, {profile?.full_name || 'Admin'}
              </span>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center rounded-md text-white transition-colors hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                aria-label="Go to Home"
                title="Home"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <div className="md:hidden bg-black/95 shadow-lg backdrop-blur">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`${mobileBaseBtn} ${
                isActive(item.path) ? mobileActiveBtn : mobileInactiveBtn
              }`}
              title={item.label}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}