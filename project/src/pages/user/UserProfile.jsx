import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserLayout from '../../components/UserLayout';

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';

export default function UserProfile() {
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    bio: '',
  });
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && profile.role !== 'user') {
      navigate('/');
      return;
    }

    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      bio: profile?.bio || '',
    });

    fetchApplications();
    fetchNotifications();
  }, [profile, navigate]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/applications/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to fetch applications');
      // Normalize fields for UI parity
      const apps = (data || []).map(a => ({
        ...a,
        id: a._id || a.id,
        created_at: a.createdAt,
      }));
      setApplications(apps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const form = new FormData();
      form.append('resume', file);
      const res = await fetch(`${API}/uploads/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const { error } = await updateProfile({ resume_url: data.url });
      if (error) throw error;
      alert('Resume saved to your profile.');
    } catch (err) {
      console.error('Resume upload error:', err?.message || err);
      alert('Error uploading resume. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch(`${API}/uploads/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const fullUrl = typeof data.url === 'string' && data.url.startsWith('http') ? data.url : `${API}${data.url}`;
      const { error } = await updateProfile({ avatar_url: fullUrl });
      if (error) throw error;
    } catch (err) {
      console.error('Avatar upload error:', err?.message || err);
      alert('Error uploading avatar. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/notifications/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const items = (data || []).map(n => ({ ...n, id: n._id || n.id, created_at: n.createdAt }));
      setNotifications(items);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await updateProfile(formData);

    if (error) {
      alert('Error updating profile: ' + error.message);
    } else {
      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'reviewed':
        return 'bg-blue-100 text-blue-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account and applications</p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6 sm:gap-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 font-semibold transition-colors relative -mb-px border-b-2 inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-user-primary/30 ${
              activeTab === 'profile'
                ? 'text-user-primary border-user-primary'
                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-4 font-semibold transition-colors relative -mb-px border-b-2 inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-user-primary/30 ${
              activeTab === 'applications'
                ? 'text-user-primary border-user-primary'
                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
            }`}
          >
            My Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-4 font-semibold transition-colors relative -mb-px border-b-2 inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-user-primary/30 ${
              activeTab === 'notifications'
                ? 'text-user-primary border-user-primary'
                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
            }`}
          >
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white shadow-md">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="card rounded-2xl shadow-xl ring-1 ring-gray-200/70 bg-white/90 backdrop-blur-sm p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Personal Information</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-user rounded-xl px-5 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-user-primary/40 active:scale-95"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 mb-6">
            {(() => {
              const src = profile?.avatar_url
                ? (profile.avatar_url.startsWith('http') ? profile.avatar_url : `${API}${profile.avatar_url}`)
                : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='32'>👤</text></svg>";
              return <img src={src} alt="Avatar" className="h-24 w-24 rounded-full object-cover ring-2 ring-gray-200" />;
            })()}
            <div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg font-semibold text-gray-700 cursor-pointer hover:bg-gray-200">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <span>{uploading ? 'Uploading...' : 'Change Photo'}</span>
              </label>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-user-primary focus:ring-4 focus:ring-user-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email}
                  disabled
                  className="input-field w-full rounded-xl border border-gray-200 bg-gray-100 cursor-not-allowed px-4 py-3 text-gray-700"
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-user-primary focus:ring-4 focus:ring-user-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-user-primary focus:ring-4 focus:ring-user-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-user-primary focus:ring-4 focus:ring-user-primary/20"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Resume
                </label>
                {profile?.resume_url ? (
                  <div className="space-y-2">
                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-user-primary underline font-semibold">
                      View current resume
                    </a>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg font-semibold text-gray-700 cursor-pointer hover:bg-gray-200">
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />
                      <span>{uploading ? 'Uploading...' : 'Change Resume'}</span>
                    </label>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg font-semibold text-gray-700 cursor-pointer hover:bg-gray-200">
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />
                    <span>{uploading ? 'Uploading...' : 'Upload Resume'}</span>
                  </label>
                )}
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX. Max 5MB.</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      full_name: profile?.full_name || '',
                      phone: profile?.phone || '',
                      address: profile?.address || '',
                      bio: profile?.bio || '',
                    });
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-semibold bg-white hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 active:scale-95"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-user rounded-xl px-6 py-3 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-user-primary/40">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Full Name
                </label>
                <p className="text-gray-900 font-semibold">{profile?.full_name || 'Not set'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                <p className="text-gray-900 font-semibold">{profile?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Phone
                </label>
                <p className="text-gray-900 font-semibold">{profile?.phone || 'Not set'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Address
                </label>
                <p className="text-gray-900 font-semibold">{profile?.address || 'Not set'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Bio
                </label>
                <p className="text-gray-900">{profile?.bio || 'No bio provided'}</p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-user-primary border-t-transparent"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="card text-center py-12 rounded-2xl shadow-lg ring-1 ring-gray-200/70 bg-white/90 backdrop-blur-sm">
              <p className="text-gray-600 mb-4">You haven&apos;t applied to any jobs yet.</p>
              <button
                onClick={() => navigate('/user/jobs')}
                className="btn-user rounded-xl px-5 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                Browse Jobs
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {applications.map((application) => (
                <div key={application.id} className="card rounded-2xl p-6 shadow-xl ring-1 ring-gray-200/70 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {application.jobs?.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3 font-semibold">
                        {application.jobs?.company} • {application.jobs?.location}
                      </p>

                      <div className="space-y-1 mb-4">
                        <p className="text-sm text-gray-600">
                          Applied on {new Date(application.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Experience: {application.experience_years} years
                        </p>
                      </div>

                      <a
                        href={application.resume_url ? (application.resume_url.startsWith('http') ? application.resume_url : `${API}${application.resume_url}`) : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-user-primary hover:text-user-dark font-semibold text-sm flex items-center underline underline-offset-4 decoration-2"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Resume
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div>
          {notifications.length === 0 ? (
            <div className="card text-center py-12 rounded-2xl shadow-lg ring-1 ring-gray-200/70 bg-white/90 backdrop-blur-sm">
              <p className="text-gray-600">No notifications yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`card cursor-pointer rounded-xl transition-colors shadow-sm hover:shadow-md ${
                    notification.is_read
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-blue-50 border-2 border-blue-200 hover:bg-blue-100/70'
                  }`}
                  onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-gray-900 ${notification.is_read ? '' : 'font-semibold'}`}>
                        {notification.message}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(notification.created_at || notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <span className="ml-4 w-3 h-3 bg-blue-600 rounded-full shadow-inner"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </UserLayout>
  );
}