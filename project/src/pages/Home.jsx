import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const API = import.meta.env.VITE_API_URL;

// Icon components for clarity and reusability
const BriefcaseIcon = () => (
  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg className="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const BellIcon = () => (
  <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

export default function Home() {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchFeaturedJobs();
  }, []);

  const fetchFeaturedJobs = async () => {
    try {
      // Try featured first
      const res = await fetch(`${API}/jobs/featured`);
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length > 0) {
        setFeaturedJobs(data);
      } else {
        // Fallback to all jobs if no featured
        const allRes = await fetch(`${API}/jobs`);
        const all = await allRes.json();
        if (!allRes.ok) throw new Error('Failed to fetch jobs');
        // Show up to 6 jobs on home
        setFeaturedJobs(Array.isArray(all) ? all.slice(0, 6) : []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setFeaturedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (jobId) => {
    if (!user) {
      navigate('/login');
    } else if (profile?.role === 'user') {
      navigate(`/user/jobs/${jobId}`);
    } else {
      navigate(`/admin/jobs`);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800">
      {/* --- Navigation Bar --- */}
      <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <DotLottieReact
                  src="https://lottie.host/dc00daab-a82c-409a-8a3b-88e3df00698a/t1KyA0TyDj.lottie"
                  loop
                  autoplay
                  style={{ width: 36, height: 36 }}
                />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  JobBoard Pro
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              {user ? (
                <button
                  onClick={() => navigate(profile?.role === 'admin' ? '/admin/dashboard' : '/user/jobs')}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors duration-300 shadow-sm"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-slate-600 hover:text-indigo-500 font-semibold px-4 py-2 text-sm transition-colors duration-300"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors duration-300 shadow-sm"
                  >
                    Sign Up Free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* --- Hero Section --- */}
        <div className="relative isolate pt-14 pb-24 sm:py-32">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#808afc] to-[#4c55c3] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              Find Your Next Big Opportunity
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600 max-w-3xl mx-auto">
              JobBoard Pro is the ultimate platform where talent meets innovation. Discover thousands of curated jobs and take the next step in your career.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => {
                  if (!user) return navigate('/register');
                  if (profile?.role === 'user') return navigate('/user/jobs');
                  return navigate('/admin/dashboard');
                }}
                className="rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </button>
              <button
                onClick={() => document.getElementById('featured-jobs')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-base font-semibold leading-6 text-slate-800 hover:text-slate-900"
              >
                Explore Jobs <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- Features Section --- */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"><BriefcaseIcon /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Thousands of Jobs</h3>
              <p className="text-slate-600">Access a wide range of opportunities from top companies worldwide.</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-sky-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"><CheckCircleIcon /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Easy Application</h3>
              <p className="text-slate-600">Apply to jobs with just a few clicks and track your progress seamlessly.</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"><BellIcon /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Real-time Updates</h3>
              <p className="text-slate-600">Get instant notifications about your application status and new roles.</p>
            </div>
          </div>
        </div>
        
        {/* --- Featured Jobs Section --- */}
        <div id="featured-jobs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Featured Opportunities</h3>
            <p className="mt-4 text-lg text-slate-600">Explore our hand-picked selection of top positions available right now.</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-600 text-lg font-medium">No featured jobs available right now.</p>
              <p className="text-slate-500 mt-2">Please check back soon for exciting new opportunities!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredJobs.map((job) => (
                <div
                  key={job._id || job.id}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-2xl border-l-4 border-transparent hover:border-indigo-500 transition-all duration-300 ease-in-out group cursor-pointer"
                  onClick={() => handleJobClick(job._id || job.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors duration-300 mb-1">{job.title}</h4>
                      <p className="text-sm text-slate-600">{job.company}</p>
                    </div>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">Featured</span>
                  </div>

                  <div className="space-y-3 mb-5 text-sm text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>{job.location}</div>
                    <div className="flex items-center"><svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>{job.job_type}</div>
                    {job.salary_range && (<div className="flex items-center"><svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.133 0V7.418zM10 18a8 8 0 100-16 8 8 0 000 16zm-1.133-12.582A2.5 2.5 0 0010 5.25a2.5 2.5 0 00-1.133.267v1.698c.155-.103.346-.196.567-.267V5.25zM10 14.75a2.5 2.5 0 001.133-.267v-1.698c-.155.103-.346.196-.567.267v1.698A2.5 2.5 0 0010 14.75z" /></svg>{job.salary_range}</div>)}
                  </div>

                  <p className="text-slate-600 text-sm mb-6 line-clamp-2">{job.description}</p>
                  
                  <button className="w-full text-center rounded-lg py-2.5 font-semibold bg-slate-100 text-slate-700 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                    {user ? 'View Details' : 'Sign in to View'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- Footer --- */}
      <footer className="bg-slate-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-base text-slate-400">&copy; 2024 JobBoard Pro. All rights reserved.</p>
          <p className="mt-2 text-sm text-slate-500">Connecting Talent with Opportunity</p>
        </div>
      </footer>
    </div>
  );
}