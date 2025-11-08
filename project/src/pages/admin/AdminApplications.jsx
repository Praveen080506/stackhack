import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/');
    }
  }, [profile, navigate]);
  
  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchApplications();
    }
  }, [profile]);


  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to load applications');
      const formattedData = data.map(app => ({
        ...app,
        id: app._id || app.id,
        created_at: app.createdAt,
        full_name: app.profiles?.full_name,
        email: app.profiles?.email,
      }));
      setApplications(formattedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const openApplication = async (app) => {
    try {
      if (app.status === 'pending') {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch(`${API}/applications/${app.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'reviewed' }),
        });
        if (!res.ok) throw new Error('Failed to update');
        setSelectedApplication({ ...app, status: 'reviewed' });
        fetchApplications();
      } else {
        setSelectedApplication(app);
      }
    } catch (e) {
      console.error('Error marking application as reviewed:', e);
      setSelectedApplication(app);
    }
  };

  const updateApplicationStatus = async (applicationId, status, message) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, message }),
      });
      if (!res.ok) throw new Error('Failed to update');
      alert('Application status updated and notification sent!');
      setSelectedApplication(null);
      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error updating application. Please try again.');
    }
  };

  const downloadResume = async (applicationId) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/applications/${applicationId}/resume`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download resume');

      // Try to extract filename from Content-Disposition
      const disposition = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
      let filename = 'resume.pdf';
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename\*?=([^;]+)/i);
        if (match && match[1]) filename = decodeURIComponent(match[1].replace(/UTF-8''/i, '').trim().replace(/"/g, ''));
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Resume download failed', e);
      alert('Failed to download resume');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'reviewed':
        return 'bg-sky-100 text-sky-800';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };
  
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Job Applications</h1>
        <p className="text-slate-500 mt-1">Review and manage all candidate applications.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center bg-white rounded-lg border border-dashed border-slate-300 p-12">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-slate-900">No applications received</h3>
            <p className="mt-1 text-sm text-slate-500">When candidates apply for jobs, their applications will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <ul role="list" className="divide-y divide-slate-200">
            {applications.map((app) => (
              <li key={app.id} className="group hover:bg-slate-50 transition-colors duration-200">
                <div className="flex items-center justify-between p-4 sm:p-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                       <p className="text-base font-semibold text-indigo-600 truncate">{app.full_name}</p>
                       <span className={`capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(app.status)}`}>
                         {app.status}
                       </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Applied for <span className="font-medium text-slate-800">{app.jobs?.title}</span> at <span className="font-medium text-slate-800">{app.jobs?.company}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(app.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    {app.email && (
                  <button
                    onClick={(e) => { 
                      e.stopPropagation();
                      navigate('/messages', {
                        state: {
                          recipient: {
                            id: app.userId || app.user_id || app.applicantId || app.applicant_id || app.profiles?.user_id || app.id,
                            name: app.full_name,
                            avatar: app.profiles?.avatar || app.profiles?.avatar_url || app.profiles?.photo_url,
                          },
                        },
                      });
                    }}
                    className={`inline-flex items-center justify-center p-2 rounded-lg border bg-white text-slate-700 hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${app.email ? 'border-slate-300 hover:border-slate-400 focus:ring-indigo-500' : 'border-slate-200 opacity-50 cursor-not-allowed'}`}
                    aria-label="Message applicant"
                    title="Message applicant"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </button>
                )}
                    <button
                      onClick={() => openApplication(app)}
                      className="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 shadow-sm hover:bg-slate-100 hover:border-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity animate-in fade-in" aria-modal="true" role="dialog">
          <div className="bg-slate-50 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 px-6 py-4 flex justify-between items-center border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">Application Details</h2>
              <button
                onClick={() => setSelectedApplication(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Info Sections */}
                <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-slate-800">Applicant</h3>
                        <p className="text-slate-600">{selectedApplication.full_name}</p>
                        <p className="text-slate-600">{selectedApplication.email}</p>
                        <p className="text-slate-600">{selectedApplication.phone}</p>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-slate-800">Job Position</h3>
                        <p className="text-slate-600">{selectedApplication.jobs?.title}</p>
                        <p className="text-slate-600">{selectedApplication.jobs?.company}</p>
                         <p className="text-slate-600 flex items-center gap-2">Status: 
                            <span className={`capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(selectedApplication.status)}`}>
                                {selectedApplication.status}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Resume & Cover Letter */}
                <div className="space-y-4">
                    {selectedApplication.resume_url && 
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-2">Resume</h3>
                            <div className="flex items-center gap-3">
                              <button onClick={() => downloadResume(selectedApplication.id)} className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12v9m0 0l-4-4m4 4l4-4M12 3v9"/></svg>
                                Download Resume
                              </button>
                            </div>
                        </div>
                    }
                    {selectedApplication.cover_letter && (
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-2">Cover Letter</h3>
                            <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-700 max-h-48 overflow-y-auto prose-sm">
                                <p className="whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-shrink-0 p-4 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-800">Update Status & Notify</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { 
                        if (selectedApplication.email) {
                          navigate('/messages', {
                            state: {
                              recipient: {
                                id: selectedApplication.userId || selectedApplication.user_id || selectedApplication.applicantId || selectedApplication.applicant_id || selectedApplication.profiles?.user_id || selectedApplication.id,
                                name: selectedApplication.full_name,
                                avatar: selectedApplication.profiles?.avatar || selectedApplication.profiles?.avatar_url || selectedApplication.profiles?.photo_url,
                              },
                            },
                          });
                        }
                      }}
                      className={`inline-flex items-center justify-center px-3 py-2 rounded-lg border bg-white text-slate-700 hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm font-semibold ${selectedApplication.email ? 'border-slate-300 hover:border-slate-400 focus:ring-indigo-500' : 'border-slate-200 opacity-50 cursor-not-allowed'}`}
                      aria-label="Message applicant"
                      title="Message applicant"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      Message
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <button onClick={() => updateApplicationStatus(selectedApplication.id, 'accepted')} className="w-full text-center rounded-lg px-3 py-2 text-sm font-semibold bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-colors">Accept</button>
                  <button onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')} className="w-full text-center rounded-lg px-3 py-2 text-sm font-semibold bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition-colors">Reject</button>
                  <button onClick={() => updateApplicationStatus(selectedApplication.id, 'reviewed')} className="w-full text-center rounded-lg px-3 py-2 text-sm font-semibold bg-sky-600 text-white shadow-sm hover:bg-sky-700 transition-colors">Reviewed</button>
                  <button onClick={() => setSelectedApplication(null)} className="w-full text-center rounded-lg px-3 py-2 text-sm font-semibold bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 transition-colors">Close</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}