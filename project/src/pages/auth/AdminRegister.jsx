import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const API = import.meta.env.VITE_API_URL;

export default function AdminRegister() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (String(adminCode) !== '1122') {
      setError('Enter correct admin code');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role: 'admin', admin_code: adminCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Registration failed');
      navigate('/admin/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Google auth removed for admin pages

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left animation (replaces image) */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <DotLottieReact
          src="https://lottie.host/fd21d415-6341-451f-96d0-db818a19261c/0ZjA9ZdYp0.lottie"
          loop
          autoplay
          style={{ width: 560, height: 560 }}
        />
      </div>
      {/* Right: preserved structure, orange theme similar to user register */}
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-12 antialiased">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-700 via-orange-600 to-amber-600 drop-shadow-sm">
              Create Admin Account In Job Board
            </h1>
            <p className="text-gray-600">Admin signup requires a code</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-gray-200/70 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl shadow-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e)=>setFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                  placeholder="Jane Admin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5"> Official Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Admin Code</label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e)=>setAdminCode(e.target.value)}
                  placeholder="Enter admin code"
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-600/20 hover:shadow-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-200 active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
            </form>

            {/* Google sign-in removed for Admin */}

            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-600">
                Have an account?{' '}
                <button onClick={()=>navigate('/admin/login')} className="text-orange-600 hover:text-orange-700 font-semibold underline underline-offset-4 decoration-2">
                  Login
                </button>
              </p>
              <p>
                <button onClick={()=>navigate('/user/register')} className="font-semibold text-gray-700 hover:text-gray-900">User? Sign up</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
