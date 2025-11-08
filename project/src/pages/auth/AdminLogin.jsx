import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (String(adminCode) !== '1122') {
      setError('Enter correct admin code');
      return;
    }
    setLoading(true);
    const { data, error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/admin/dashboard');
    }
  };

  // Google auth removed for admin pages

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left animation (replaces image) */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <DotLottieReact
          src="https://lottie.host/86e49139-d49a-406e-b97c-11fcbc2a336b/q2Fg5LklEo.lottie"
          loop
          autoplay
          style={{ width: 640, height: 640 }}
        />
      </div>
      {/* Right: preserved structure, orange theme */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 antialiased">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Sign in to admin dashboard</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/90 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">Admin Code</label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e)=>setAdminCode(e.target.value)}
                  placeholder="Enter admin code"
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                  required
                />
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-orange-700 hover:to-amber-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-600">
                Don&apos;t have an admin account?{' '}
                <button onClick={()=>navigate('/admin/register')} className="font-semibold text-orange-600 hover:text-orange-700">Sign Up</button>
              </p>
              <p>
                <button onClick={()=>navigate('/user/login')} className="font-semibold text-gray-700 hover:text-gray-900">User login</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
