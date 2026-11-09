import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fingerprint, Check, X, AlertCircle, ArrowRight, Lock, Mail, User, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password validation rules
  const hasMinLength = formData.password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(formData.password);
  const hasLowerCase = /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;

  const isFormValid =
    formData.name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(formData.email) &&
    hasMinLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    passwordsMatch;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please meet all password and validation criteria before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle green ambient background glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#A3E635]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#22C55E]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#A3E635] flex items-center justify-center text-black shadow-[0_0_25px_rgba(163,230,53,0.35)] mb-3">
            <Fingerprint className="w-7 h-7 stroke-[2.4]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
            SkillTwin <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#182619] border border-[#2E4A28] text-[#A3E635]">STUDENT</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create your account to track evidence and generate skill-gap reports
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Student Registration</h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter your academic details to get started</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name <span className="text-[#A3E635]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sabiha Farin"
                  className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white placeholder-slate-600 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
                  required
                />
              </div>
            </div>

            {/* University Email */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address <span className="text-[#A3E635]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@university.edu"
                  className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white placeholder-slate-600 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Student ID (Optional) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Student ID <span className="text-slate-500 text-[10px]">(Optional)</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="e.g. 241-35-134"
                  className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white placeholder-slate-600 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password <span className="text-[#A3E635]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white placeholder-slate-600 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm Password <span className="text-[#A3E635]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white placeholder-slate-600 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Live Password Criteria Badges */}
            <div className="bg-[#0A0E13] p-3 rounded-xl border border-[#1A232E] space-y-1.5 text-[11px]">
              <div className="text-slate-400 font-medium mb-1">Security requirements:</div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-[#A3E635]' : 'text-slate-500'}`}>
                  {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>≥ 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-[#A3E635]' : 'text-slate-500'}`}>
                  {hasUpperCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-[#A3E635]' : 'text-slate-500'}`}>
                  {hasLowerCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-[#A3E635]' : 'text-slate-500'}`}>
                  {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Number (0-9)</span>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 pt-1 border-t border-[#161F2A] ${passwordsMatch ? 'text-[#A3E635]' : 'text-slate-500'}`}>
                {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                <span>Passwords match</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all mt-2 ${
                isFormValid && !loading
                  ? 'bg-[#A3E635] text-black hover:bg-[#BEF264] shadow-[0_0_20px_rgba(163,230,53,0.3)]'
                  : 'bg-[#1C261D] text-slate-500 cursor-not-allowed border border-[#28382A]'
              }`}
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 pt-5 border-t border-[#1E293B] text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[#A3E635] font-semibold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
