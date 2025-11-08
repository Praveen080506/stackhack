import { useEffect, useRef, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn, googleSignIn } = useAuth();
  const googleBtnRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
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
            const { data, error } = await googleSignIn(resp.credential);
            if (error) {
              setError(error.message);
              setLoading(false);
            } else {
              navigate('/');
            }
          } catch (e) {
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

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left animation (replaces image) */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <DotLottieReact
          src="https://lottie.host/f9f6cfec-0183-41c8-aca5-8c1da78f35b9/u0taAQotA6.lottie"
          loop
          autoplay
          style={{ width: 640, height: 640 }}
        />
      </div>

      {/* Original right-side login content with previous styling kept */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 antialiased">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to continue to your account</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white/80 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-green-600 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-green-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
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
                Don&apos;t have an account?{' '}
                <button onClick={() => navigate('/user/register')} className="font-semibold text-blue-600 hover:text-blue-700">
                  Sign Up
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
