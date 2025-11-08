import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    job_type: 'full-time',
    salary_range: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    is_featured: false,
    deadline_at: '',
  });

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchJobs();
  }, [profile, navigate]);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API}/jobs`);
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to load jobs');
      // Sort by createdAt desc client-side if needed
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (editingJob) {
        const res = await fetch(`${API}/jobs/${editingJob._id || editingJob.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to update job');
      } else {
        const res = await fetch(`${API}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to create job');
      }

      setShowAddModal(false);
      setEditingJob(null);
      setFormData({
        title: '',
        company: '',
        location: '',
        job_type: 'full-time',
        salary_range: '',
        description: '',
        requirements: '',
        responsibilities: '',
        benefits: '',
        is_featured: false,
      });
      fetchJobs();
      try { window.dispatchEvent(new Event('jobs:update')); } catch (_) {}
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Error saving job. Please try again.');
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      company: job.company,
      location: job.location,
      job_type: job.job_type,
      salary_range: job.salary_range || '',
      description: job.description,
      requirements: job.requirements || '',
      responsibilities: job.responsibilities || '',
      benefits: job.benefits || '',
      is_featured: job.is_featured,
      deadline_at: (() => {
        if (!job.deadline_at) return '';
        const d = new Date(job.deadline_at);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        const yyyy = d.getFullYear();
        const MM = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mm = pad(d.getMinutes());
        return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
      })(),
    });
    setShowAddModal(true);
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchJobs();
      try { window.dispatchEvent(new Event('jobs:update')); } catch (_) {}
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Error deleting job. Please try again.');
    }
  };

  const toggleStatus = async (job) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/jobs/${job._id || job.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: job.status === 'active' ? 'closed' : 'active' }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchJobs();
      try { window.dispatchEvent(new Event('jobs:update')); } catch (_) {}
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
          <p className="mt-1 text-gray-600">Create and manage job postings</p>
        </div>
        <button
          onClick={() => {
            setEditingJob(null);
            setFormData({
              title: '',
              company: '',
              location: '',
              job_type: 'full-time',
              salary_range: '',
              description: '',
              requirements: '',
              responsibilities: '',
              benefits: '',
              is_featured: false,
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-indigo-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 active:scale-[.99]"
        >
          + Add New Job
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-admin-primary"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-600">
            No jobs posted yet. Create your first job posting!
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <div
              key={job._id || job.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      {job.title}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        job.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {job.status === 'active' ? 'Active' : 'Closed'}
                    </span>
                    {job.is_featured && (
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="mb-3 text-gray-600">
                    {job.company} • {job.location} • {job.job_type}
                  </p>

                  {job.salary_range && (
                    <p className="mb-3 font-semibold text-gray-700">
                      💰 {job.salary_range}
                    </p>
                  )}

                  <p className="mb-3 text-gray-700">{job.description}</p>
                  <p className="text-sm text-gray-500">
                    {(() => {
                      const d = job.createdAt || job.created_at || job.created_on || job.updatedAt || Date.now();
                      const date = new Date(d);
                      return `Posted ${isNaN(date.getTime()) ? new Date().toLocaleDateString() : date.toLocaleDateString()}`;
                    })()}
                  </p>
                  {job.deadline_at && (
                    <p className="text-sm text-gray-500 mt-1">
                      Deadline: {(() => { try { return new Date(job.deadline_at).toLocaleString(); } catch { return String(job.deadline_at); } })()}
                    </p>
                  )}
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <button
                    onClick={() => handleEdit(job)}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-4 py-2 font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(job)}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold transition-colors ${
                      job.status === 'active'
                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {job.status === 'active' ? 'Close' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(job._id || job.id)}
                    className="inline-flex items-center justify-center rounded-lg bg-red-50 px-4 py-2 font-semibold text-red-700 transition-colors hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingJob ? 'Edit Job' : 'Add New Job'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingJob(null);
                }}
                className="rounded-md p-1 text-gray-500 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/50"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/30"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Company *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/30"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/30"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Job Type *
                  </label>
                  <select
                    name="job_type"
                    value={formData.job_type}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/30"
                    required
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    name="salary_range"
                    value={formData.salary_range}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/30"
                    placeholder="e.g., $50,000 - $70,000"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Application Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="deadline_at"
                    value={formData.deadline_at}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/30"
                  />
                  <p className="mt-1 text-xs text-gray-500">After this date/time, the job will automatically be marked Closed.</p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/30"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Requirements
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/30"
                  placeholder="List the job requirements (one per line)"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Responsibilities
                </label>
                <textarea
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleInputChange}
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/30"
                  placeholder="List the key responsibilities"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Benefits
                </label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleInputChange}
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/30"
                  placeholder="List the benefits offered"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-admin-primary focus:ring-admin-primary"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Mark as Featured (show on home page)
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingJob(null);
                  }}
                  className="inline-flex items-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 px-5 py-2.5 font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  {editingJob ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}