import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fingerprint, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Controlled states guaranteed to initialize strictly blank
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Guarantee fields remain completely blank when visiting the login page
  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');

    // Extra safeguard against aggressive browser password managers pre-filling values
    const timer = setTimeout(() => {
      if (emailInputRef.current) emailInputRef.current.value = '';
      if (passwordInputRef.current) passwordInputRef.current.value = '';
      setEmail('');
      setPassword('');
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#A3E635]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-[#22C55E]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#A3E635] flex items-center justify-center text-black shadow-[0_0_25px_rgba(163,230,53,0.35)] mb-3">
            <Fingerprint className="w-7 h-7 stroke-[2.4]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
            SkillTwin <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#182619] border border-[#2E4A28] text-[#A3E635]">AI WORKSPACE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Student Skill Verification &amp; Evidence-Grounded Gap Analysis
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Student Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your credentials to access your workspace
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form with autocomplete disabled */}
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="space-y-4"
          >
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={emailInputRef}
                  type="email"
                  name="skilltwin_student_email"
                  id="skilltwin_student_email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  placeholder="name@university.edu"
                  className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white placeholder-slate-600 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  name="skilltwin_student_secret"
                  id="skilltwin_student_secret"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white placeholder-slate-600 pl-9 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#A3E635] text-black font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#BEF264] transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)] mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-5 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#A3E635] font-semibold hover:underline">
              Create student account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}