import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserLayout from '../../components/UserLayout';

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';

const formInputClasses =
  "block w-full rounded-xl border border-slate-300 bg-white/90 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 sm:text-sm transition-all duration-200";

export default function JobDetails() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [applicationData, setApplicationData] = useState({
    cover_letter: '',
    experience_years: 0,
    resume: null,
  });

  useEffect(() => {
    if (profile) {
      setApplicationData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (jobId) fetchJob();
    if (jobId && user) checkIfApplied();
  }, [jobId, user]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/jobs/${jobId}`);
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to load job');
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/applications/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to check applications');
      const found = Array.isArray(data) && data.some(a => (a.job_id === jobId) || (a.job_id && (a.job_id._id === jobId || String(a.job_id) === String(jobId))));
      setHasApplied(!!found);
    } catch (error) {
      console.error('Error checking application:', error);
    }
  };

  const handleInputChange = e => setApplicationData({ ...applicationData, [e.target.name]: e.target.value });
  const handleFileChange = e => setApplicationData({ ...applicationData, resume: e.target.files[0] });

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let resumeUrl = profile?.resume_url || '';
      if (applicationData.resume) {
        const token = localStorage.getItem(TOKEN_KEY);
        const form = new FormData();
        form.append('resume', applicationData.resume);
        const resUpload = await fetch(`${API}/uploads/resume`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const up = await resUpload.json();
        if (!resUpload.ok) throw new Error(up.error || 'Upload failed');
        resumeUrl = up.url;
      }
      if (!resumeUrl) {
        alert('Please upload your resume or save a resume in your profile first.');
        setSubmitting(false);
        return;
      }

      const experienceYears = Number(applicationData.experience_years);
      const payload = {
        job_id: jobId,
        full_name: applicationData.full_name,
        email: applicationData.email,
        phone: applicationData.phone,
        cover_letter: applicationData.cover_letter,
        experience_years: Number.isNaN(experienceYears) ? 0 : experienceYears,
        resume_url: resumeUrl,
      };

      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit');

      alert('Application submitted successfully!');
      setShowApplicationForm(false);
      setHasApplied(true);
      navigate('/user/profile');
    } catch (error) {
      console.error('Error submitting application:', error?.message || error);
      alert('Error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <UserLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UserLayout>
    );

  if (!job)
    return (
      <UserLayout>
        <div className="bg-white rounded-xl shadow-md p-12 text-center text-slate-500">
          Job not found or has been removed.
        </div>
      </UserLayout>
    );

  return (
    <UserLayout>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Back to Jobs
      </button>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-md p-8 hover:shadow-lg transition-shadow duration-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{job.title}</h1>
          <div className="prose prose-slate max-w-none text-slate-700 space-y-6">
            {job.description && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900 border-b pb-1 mb-2">Job Description</h2>
                <p>{job.description}</p>
              </section>
            )}
            {job.responsibilities && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900 border-b pb-1 mb-2">Responsibilities</h2>
                <p className="whitespace-pre-wrap">{job.responsibilities}</p>
              </section>
            )}
            {job.requirements && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900 border-b pb-1 mb-2">Requirements</h2>
                <p className="whitespace-pre-wrap">{job.requirements}</p>
              </section>
            )}
            {job.benefits && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900 border-b pb-1 mb-2">Benefits</h2>
                <p className="whitespace-pre-wrap">{job.benefits}</p>
              </section>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="mt-8 lg:mt-0 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-900">{job.company}</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {job.location}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="capitalize">{job.job_type}</span>
              </div>
              {job.salary_range && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.133 0V7.418zM10 18a8 8 0 100-16 8 8 0 000 16zm-1.133-12.582A2.5 2.5 0 0010 5.25a2.5 2.5 0 00-1.133.267v1.698c.155-.103.346-.196.567-.267V5.25zM10 14.75a2.5 2.5 0 001.133-.267v-1.698c-.155.103-.346.196-.567.267v1.698A2.5 2.5 0 0010 14.75z" />
                  </svg>
                  {job.salary_range}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6 text-center">
            {hasApplied ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Application Submitted
                </div>
                <p className="mt-3 text-sm text-slate-500">Track your status in your profile.</p>
                <button onClick={() => navigate('/user/profile')} className="mt-3 text-blue-600 font-semibold hover:text-blue-700 text-sm transition-colors">
                  View My Applications →
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Glass-style modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Apply for {job.title}</h2>
              <button
                onClick={() => setShowApplicationForm(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {['full_name', 'email', 'phone'].map(field => (
                <div key={field}>
                  <label htmlFor={field} className="block text-sm font-medium text-slate-700 mb-1 capitalize">
                    {field.replace('_', ' ')} *
                  </label>
                  <input
                    type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                    name={field}
                    id={field}
                    value={applicationData[field] || ''}
                    onChange={handleInputChange}
                    className={formInputClasses}
                    required
                  />
                </div>
              ))}
              <div>
                <label htmlFor="experience_years" className="block text-sm font-medium text-slate-700 mb-1">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  name="experience_years"
                  id="experience_years"
                  min="0"
                  value={applicationData.experience_years}
                  onChange={handleInputChange}
                  className={formInputClasses}
                  required
                />
              </div>
              <div>
                <label htmlFor="cover_letter" className="block text-sm font-medium text-slate-700 mb-1">
                  Cover Letter
                </label>
                <textarea
                  name="cover_letter"
                  id="cover_letter"
                  rows={5}
                  value={applicationData.cover_letter}
                  onChange={handleInputChange}
                  className={formInputClasses}
                  placeholder="Tell us why you're a great fit for this position..."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload Resume {profile?.resume_url ? '(optional — using your saved resume)' : '*'}
                </label>
                <label htmlFor="resume" className="block cursor-pointer border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition">
                  <svg className="w-6 h-6 text-slate-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="text-slate-600">{applicationData.resume ? applicationData.resume.name : 'Click to upload your resume'}</span>
                </label>
                <input id="resume" name="resume" type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="sr-only" />
                <p className="text-xs text-slate-500 mt-1">PDF, DOC, or DOCX up to 5MB</p>
              </div>
            </form>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowApplicationForm(false)}
                className="px-5 py-2.5 text-sm font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                formNoValidate
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
