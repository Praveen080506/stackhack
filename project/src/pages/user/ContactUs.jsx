import { useState } from 'react';
import UserLayout from '../../components/UserLayout';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';

export default function ContactUs() {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!name || !email || !subject || !message) {
      setStatus({ ok: false, msg: 'Please fill all fields.' });
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send');
      setStatus({ ok: true, msg: 'Thanks! Your message has been sent.' });
      setSubject('');
      setMessage('');
    } catch (err) {
      setStatus({ ok: false, msg: err.message || 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto p-6 sm:p-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">
            Contact Us
          </h1>
          <p className="text-slate-600 max-w-md mx-auto">
            Have any questions or feedback? Fill out the form below, and we’ll
            get back to you shortly.
          </p>
        </div>

        {status && (
          <div
            className={`mb-6 rounded-xl px-5 py-3 text-sm font-medium shadow-sm ${
              status.ok
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {status.msg}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="space-y-5 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 text-sm shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 text-sm shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="How can we help?"
              required
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 text-sm shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Write your message here..."
              required
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 text-sm shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-3 font-semibold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </UserLayout>
  );
}
