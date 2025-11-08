import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';

export default function AdminProfile() {
  const { profile, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    bio: profile?.bio || '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateProfile(formData);

    if (error) {
      alert('Error updating profile: ' + error.message);
    } else {
      setEditing(false);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
      alert('Error uploading avatar');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 antialiased">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Admin Profile
          </h1>
          <p className="text-gray-600 mt-1">Manage your account settings</p>
        </div>

        <div className="card rounded-2xl shadow-xl ring-1 ring-gray-200/70 bg-white/90 backdrop-blur-sm p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Personal Information
            </h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg hover:bg-green-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 active:scale-95"
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
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-admin-primary focus:ring-4 focus:ring-admin-primary/20"
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
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-admin-primary focus:ring-4 focus:ring-admin-primary/20"
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
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-admin-primary focus:ring-4 focus:ring-admin-primary/20"
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
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-admin-primary focus:ring-4 focus:ring-admin-primary/20"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="flex justify-end gap-3">
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
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-admin rounded-xl px-6 py-3 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/40 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                  Full Name
                </label>
                <p className="text-gray-900 font-semibold">{profile?.full_name || 'Not set'}</p>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                  Email
                </label>
                <p className="text-gray-900 font-semibold">{profile?.email}</p>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                  Role
                </label>
                <p className="text-gray-900 font-semibold capitalize">{profile?.role}</p>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                  Phone
                </label>
                <p className="text-gray-900 font-semibold">{profile?.phone || 'Not set'}</p>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                  Address
                </label>
                <p className="text-gray-900 font-semibold">{profile?.address || 'Not set'}</p>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                  Bio
                </label>
                <p className="text-gray-900">{profile?.bio || 'No bio provided'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="card mt-6 rounded-2xl bg-red-50/80 backdrop-blur-sm ring-1 ring-red-200/60 p-6 shadow-md">
          <h2 className="text-xl font-bold text-red-900 mb-4 tracking-tight">Danger Zone</h2>
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:bg-red-700 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
          >
            Sign Out
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}