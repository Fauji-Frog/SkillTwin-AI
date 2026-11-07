import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Search, Check, AlertCircle } from 'lucide-react';
import api from '../api/client';

export default function MySkills() {
  const [catalog, setCatalog] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [level, setLevel] = useState('Intermediate');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [catRes, myRes] = await Promise.all([
        api.get('/skills'),
        api.get('/student-skills')
      ]);
      if (catRes.success) setCatalog(catRes.data);
      if (myRes.success) setMySkills(myRes.data);
      if (catRes.data.length > 0) setSelectedSkillId(catRes.data[0]._id || catRes.data[0].id);
    } catch (err) {
      setError('Failed to load skills catalog');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSkill(e) {
    e.preventDefault();
    if (!selectedSkillId) return;

    setError('');
    setSuccess('');

    try {
      const res = await api.post('/student-skills', {
        skillId: selectedSkillId,
        level,
        note
      });
      if (res.success) {
        setSuccess('Skill added to your profile!');
        setNote('');
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Skill already added or failed to save.');
    }
  }

  async function handleDeleteSkill(id) {
    try {
      await api.delete(`/student-skills/${id}`);
      setMySkills((prev) => prev.filter((s) => (s.id || s._id) !== id));
    } catch (err) {
      setError('Failed to remove skill');
    }
  }

  const filteredSkills = mySkills.filter((s) => {
    const name = s.skill?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Skills Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Record technical competencies and self-assessed levels to match against job circulars.
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

      {/* Add Skill Form */}
      <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-5">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#A3E635]" />
          <span>Add Skill to Profile</span>
        </h2>

        <form onSubmit={handleAddSkill} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Select Skill */}
          <div className="md:col-span-1">
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              Select Skill
            </label>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-[#A3E635]"
            >
              {catalog.map((s) => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          {/* Select Level */}
          <div className="md:col-span-1">
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              Proficiency Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-[#A3E635]"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Note / Experience */}
          <div className="md:col-span-1">
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Built 2 full-stack apps"
              className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-[#A3E635]"
            />
          </div>

          {/* Submit */}
          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#A3E635] text-black font-bold text-xs hover:bg-[#BEF264] transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(163,230,53,0.25)]"
            >
              <Plus className="w-4 h-4" />
              <span>Record Skill</span>
            </button>
          </div>
        </form>
      </div>

      {/* Recorded Skills List */}
      <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#A3E635]" />
            <h2 className="text-sm font-bold text-white">Recorded Competencies ({mySkills.length})</h2>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recorded skills..."
              className="bg-[#0A0E13] border border-[#1F2937] text-xs text-white pl-8 pr-3 py-1.5 rounded-lg w-52 focus:outline-none focus:border-[#A3E635]"
            />
          </div>
        </div>

        {filteredSkills.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No skills recorded yet. Add your first skill using the form above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSkills.map((s) => {
              const skillName = s.skill?.name || 'Skill';
              const category = s.skill?.category || 'General';
              const skillLevel = s.level || 'Beginner';

              return (
                <div
                  key={s.id || s._id}
                  className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between hover:border-[#2D3F54] transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{skillName}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          skillLevel === 'Advanced'
                            ? 'bg-[#182619] text-[#A3E635] border border-[#2E4A28]'
                            : skillLevel === 'Intermediate'
                            ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {skillLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{category}</div>
                    {s.note && (
                      <div className="text-[10px] text-slate-500 italic mt-1 truncate max-w-[200px]">
                        "{s.note}"
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteSkill(s.id || s._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove skill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
