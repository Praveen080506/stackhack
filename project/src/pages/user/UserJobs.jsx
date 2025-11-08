import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserLayout from '../../components/UserLayout';
import { MapPin, Briefcase, IndianRupee } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const LS_KEY = 'savedJobs';

export default function UserJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    if (profile?.role !== 'user') {
      navigate('/');
      return;
    }
    fetchJobs();
    try {
      const raw = localStorage.getItem(LS_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      setSavedIds(Array.isArray(ids) ? ids.map(String) : []);
    } catch {
      setSavedIds([]);
    }

    const onSavedUpdate = () => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        const ids = raw ? JSON.parse(raw) : [];
        setSavedIds(Array.isArray(ids) ? ids.map(String) : []);
      } catch {}
    };
    window.addEventListener('savedjobs:update', onSavedUpdate);
    window.addEventListener('storage', onSavedUpdate);
    return () => {
      window.removeEventListener('savedjobs:update', onSavedUpdate);
      window.removeEventListener('storage', onSavedUpdate);
    };
  }, [profile, navigate]);

  useEffect(() => {
    const id = setInterval(fetchJobs, 30000);
    const onFocus = () => fetchJobs();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchJobs();
    };
    const onJobsUpdate = () => fetchJobs();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('jobs:update', onJobsUpdate);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('jobs:update', onJobsUpdate);
    };
  }, []);

  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const formatCountdown = (ms) => {
    if (ms <= 0) return 'Expired';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s left`;
    if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s left`;
    return `${minutes}m ${pad(seconds)}s left`;
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API}/jobs`);
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to fetch jobs');
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q);
    const matchesFilter = filterType === 'all' || job.job_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const isSaved = (id) => savedIds.includes(String(id));
  const toggleSave = (id) => {
    try {
      const strId = String(id);
      const raw = localStorage.getItem(LS_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      const set = new Set((Array.isArray(ids) ? ids : []).map(String));
      if (set.has(strId)) set.delete(strId); else set.add(strId);
      const next = Array.from(set);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      setSavedIds(next);
      try { window.dispatchEvent(new Event('savedjobs:update')); } catch {}
    } catch {}
  };

  return (
    <UserLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-blue-700 tracking-tight">Browse Jobs</h1>
        <p className="mt-2 text-gray-600 text-lg">Find your next opportunity and apply instantly.</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="🔍 Search jobs, companies, or locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition-all duration-200"
        >
          <option value="all">All Job Types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-14 text-center shadow-sm">
          <p className="text-gray-600 text-lg">
            {searchTerm || filterType !== 'all'
              ? 'No jobs match your search criteria.'
              : 'No jobs available at the moment.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {filteredJobs.map((job) => {
            let isClosed = job.status === 'closed';
            if (job.deadline_at) {
              let d; try { d = new Date(job.deadline_at); } catch { d = null; }
              const ok = d && !isNaN(d.getTime());
              if (ok) {
                const remaining = d.getTime() - nowTs;
                isClosed = remaining <= 0;
              }
            }
            return (
              <div
                key={job._id || job.id}
                className={`cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isClosed ? 'opacity-75' : ''
                }`}
                onClick={() => navigate(`/user/jobs/${job._id || job.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isClosed
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isClosed ? 'Closed' : 'Active'}
                      </span>
                      {job.is_featured && (
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          Featured
                        </span>
                      )}
                    </div>

                    <p className="mb-3 font-semibold text-indigo-600">{job.company}</p>

                    <div className="mb-4 space-y-1 text-gray-600">
  <p className="flex items-center gap-2">
    <MapPin className="h-4 w-4 text-blue-600" />
    {job.location}
  </p>

  <p className="flex items-center gap-2">
    <Briefcase className="h-4 w-4 text-indigo-600" />
    {job.job_type}
  </p>

  {job.salary_range && (
    <p className="flex items-center gap-2">
      <IndianRupee className="h-4 w-4 text-green-600" />
      {job.salary_range}
    </p>
  )}
</div>


                    <p className="mb-4 text-gray-700 line-clamp-2">{job.description}</p>

                    <p className="text-sm text-gray-500">
                      Posted on: {new Date(job.createdAt || job.created_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-end gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(job._id || job.id);
                      }}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        isSaved(job._id || job.id)
                          ? 'border-yellow-400 bg-yellow-50 text-yellow-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {isSaved(job._id || job.id) ? '★ Saved' : '☆ Save'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/user/jobs/${job._id || job.id}`);
                      }}
                      className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 px-5 py-2.5 font-semibold text-white shadow-md transition-all duration-300 hover:from-blue-700 hover:to-indigo-600 hover:shadow-lg"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </UserLayout>
  );
}
