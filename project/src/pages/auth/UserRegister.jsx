import { useEffect, useRef, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function UserRegister() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signUp, googleSignIn } = useAuth();
  const googleBtnRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    let initialized = false;
    const init = () => {
      if (initialized) return;
      if (!window.google || !clientId) return;
      initialized = true;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          try {
            setError('');
            setLoading(true);
            const { error } = await googleSignIn(resp.credential);
            if (error) {
              setError(error.message);
              setLoading(false);
            } else {
              navigate('/');
            }
          } catch (_) {
            setError('Google sign-in failed');
            setLoading(false);
          }
        },
        ux_mode: 'popup',
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
        });
      }
    };
    const t = setInterval(() => {
      if (window.google) {
        clearInterval(t);
        init();
      }
    }, 200);
    setTimeout(() => clearInterval(t), 5000);
    return () => clearInterval(t);
  }, [clientId, googleSignIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      'user'
    );
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/user/login');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left animation (replaces image) */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <DotLottieReact
          src="https://lottie.host/e143a1e9-0102-496b-942b-1c8529b5cd15/YyRmBhH7i1.lottie"
          loop
          autoplay
          style={{ width: 640, height: 640 }}
        />
      </div>
      {/* Original Register.jsx styling kept on the right */}
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-12 antialiased">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-600 to-green-600 drop-shadow-sm">
              Create Account in Job Board
            </h1>
            <p className="text-gray-600">Join us and start your journey</p>
          </div>

          <div className="card bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-gray-200/70 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl shadow-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* Keep spacing consistent but fix role to user */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Account Type
                </label>
                <input
                  type="text"
                  value="Job Seeker"
                  readOnly
                  className="input-field w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 shadow-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:from-blue-700 hover:to-green-700 transition-all duration-200 active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-px bg-gray-200 w-full" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="h-px bg-gray-200 w-full" />
            </div>
            <div className="mt-4 flex justify-center">
              <div ref={googleBtnRef} />
            </div>

            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button onClick={() => navigate('/user/login')} className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-4 decoration-2">
                  Sign In
                </button>
              </p>
              {/* Admin quick link (requested) */}
              <p>
                <button onClick={() => navigate('/admin/register')} className="font-semibold text-gray-700 hover:text-gray-900">
                  Admin? Sign up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
