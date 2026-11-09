import React, { useState, useEffect } from 'react';
import { User, Mail, Hash, BookOpen, GraduationCap, Check, AlertCircle, Save, Sparkles } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');
  const [section, setSection] = useState('');
  const [careerInterests, setCareerInterests] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await api.get('/profile');
      if (res.success && res.data) {
        const p = res.data.profile;
        if (p) {
          setStudentId(p.studentId || '');
          setDepartment(p.department || '');
          setBatch(p.batch || '');
          setSection(p.section || '');
          if (Array.isArray(p.careerInterests)) {
            setCareerInterests(p.careerInterests.join(', '));
          } else {
            setCareerInterests(p.careerInterests || '');
          }
        }
      }
    } catch (e) {
      console.warn('Could not load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const interestsArray = careerInterests
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    try {
      const res = await api.put('/profile', {
        studentId,
        department,
        batch,
        section,
        careerInterests: interestsArray
      });
      if (res.success) {
        setSuccess('Profile updated successfully!');
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Student Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your academic enrollment, university department, and career aspirations.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-[#182619] border border-[#2E4A28] text-[#A3E635] text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6 sm:p-8">
        {/* Header Badge */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#1E293B]">
          <div className="w-14 h-14 rounded-2xl bg-[#182619] border border-[#2E4A28] flex items-center justify-center text-xl font-black text-[#A3E635] shadow-[0_0_20px_rgba(163,230,53,0.2)]">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{user?.name || 'Student Name'}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#182619] text-[#A3E635] border border-[#2E4A28]">
                {user?.role?.toUpperCase() || 'STUDENT'}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Student ID */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                University Student ID
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. 241-35-134"
                  className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Academic Department
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
                />
              </div>
            </div>

            {/* Batch */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Batch
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="e.g. 42-B1"
                  className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
                />
              </div>
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Section
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. B1"
                className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
              />
            </div>
          </div>

          {/* Career Interests */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Career Interests (Comma Separated)</span>
              <span className="text-[10px] text-slate-500">Used for customized job matching recommendations</span>
            </label>
            <input
              type="text"
              value={careerInterests}
              onChange={(e) => setCareerInterests(e.target.value)}
              placeholder="e.g. Full-Stack Development, Cloud Architecture, DevOps"
              className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-3 rounded-xl focus:outline-none focus:border-[#A3E635] transition-colors"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-[#A3E635] text-black font-bold text-xs hover:bg-[#BEF264] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(163,230,53,0.3)] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
