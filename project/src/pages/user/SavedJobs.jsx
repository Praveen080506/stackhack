import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';

const API = import.meta.env.VITE_API_URL;
const LS_KEY = 'savedJobs';

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem(LS_KEY);
        const ids = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(ids) || ids.length === 0) {
          setJobs([]);
          return;
        }
        const responses = await Promise.allSettled(ids.map(id => fetch(`${API}/jobs/${id}`)));
        const jsons = await Promise.all(responses.map(async (r) => {
          if (r.status !== 'fulfilled') return null;
          try { return await r.value.json(); } catch { return null; }
        }));
        const valid = jsons.filter(Boolean);
        setJobs(valid);
      } catch (_) {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    load();

    const onUpdate = () => load();
    window.addEventListener('savedjobs:update', onUpdate);
    return () => window.removeEventListener('savedjobs:update', onUpdate);
  }, []);

  const removeSaved = (id) => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      const next = ids.filter(x => String(x) !== String(id));
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('savedjobs:update'));
    } catch (_) {}
  };

  return (
    <UserLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">💼 Saved Jobs</h1>
        <p className="mt-2 text-gray-500 text-base">Review and apply for your bookmarked opportunities.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading saved jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white/80 p-16 text-center shadow-sm backdrop-blur-sm">
          <p className="text-gray-600 text-lg">No saved jobs yet.</p>
          <p className="text-sm text-gray-400 mt-2">Start browsing and save your favorite listings.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <div
              key={job._id || job.id}
              className="rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm hover:scale-[1.01]"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                  <p className="mt-1 text-purple-700 font-medium">{job.company}</p>
                  <p className="mt-2 text-sm text-gray-600">{job.location} • {job.job_type}</p>
                  {job.salary_range && (
                    <p className="mt-1 text-sm text-gray-500">{job.salary_range}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/user/jobs/${job._id || job.id}`)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-xl transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => removeSaved(job._id || job.id)}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:text-red-500 hover:border-red-400 transition-colors duration-200"
                    title="Remove from saved"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M6 2a2 2 0 00-2 2v18l8-4 8 4V4a2 2 0 00-2-2H6z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </UserLayout>
  );
}
