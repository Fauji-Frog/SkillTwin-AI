import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/http';
import { Briefcase, FileText, CheckCircle2, XCircle, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

const JobMatching = () => {
  const [circulars, setCirculars] = useState([]);
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' | 'upload'
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState(null);
  const [currentCircular, setCurrentCircular] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const loadCirculars = async () => {
    try {
      const res = await api.get('/jobs');
      if (res.success) setCirculars(res.data);
    } catch (err) {
      console.warn('Could not load circulars:', err);
    }
  };

  useEffect(() => {
    loadCirculars();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'paste' && (!rawText || rawText.trim().length < 15)) {
      setError('Please paste the complete job circular requirements text.');
      return;
    }
    if (activeTab === 'upload' && !file) {
      setError('Please select a job circular document or text file.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title || 'Software Engineer');
      formData.append('company', company || 'Industry Tech Partner');
      if (activeTab === 'paste') {
        formData.append('rawText', rawText);
      } else {
        formData.append('file', file);
      }

      const res = await api.post('/jobs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success && res.data) {
        setCurrentCircular(res.data.circular);
        setRequirements(res.data.requirements);
        await loadCirculars();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit circular.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRequirement = async (id, currentVal) => {
    try {
      const res = await api.patch(`/jobs/requirements/${id}`, { isConfirmed: !currentVal });
      if (res.success) {
        setRequirements(requirements.map(r => r._id === id ? res.data : r));
      }
    } catch (err) {
      setError(err.message || 'Could not update requirement.');
    }
  };

  const handleRunGapAnalysis = async () => {
    if (!currentCircular) return;
    try {
      setAnalyzing(true);
      const res = await api.post('/reports', { jobCircularId: currentCircular._id });
      if (res.success && res.data) {
        navigate('/reports');
      }
    } catch (err) {
      setError(err.message || 'Gap analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Job Matching & Circulars</h1>
        <p className="text-sm text-slate-400 mt-1">
          Submit live job postings to automatically extract required skills and calculate your verified gap analysis.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submission Card */}
      <div className="p-6 rounded-2xl bg-[#131B26] border border-[#1E293B]">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#1E293B] pb-3">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'paste'
                ? 'bg-[#1C2B1D] text-[#9FE870] border border-[#274029]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Paste Circular Text
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'upload'
                ? 'bg-[#1C2B1D] text-[#9FE870] border border-[#274029]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload Circular File
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Job Position Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Junior Full-Stack Engineer"
                className="w-full bg-[#0B0F15] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#9FE870] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Company / Organization
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Brain Station 23 / Optimizely"
                className="w-full bg-[#0B0F15] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#9FE870] transition"
              />
            </div>
          </div>

          {activeTab === 'paste' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Job Description & Requirements
              </label>
              <textarea
                rows={6}
                required
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the circular requirements here. E.g. 'We are hiring a Junior Developer. Requirements: strong JavaScript, React, Node.js and Express; experience with MongoDB and REST APIs; Git/GitHub...'"
                className="w-full bg-[#0B0F15] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#9FE870] transition"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Select Circular File (.pdf, .docx, .txt)
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                required
                className="text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1C2B1D] file:text-[#9FE870] hover:file:bg-[#274029] file:cursor-pointer"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#9FE870] text-[#0B0F15] font-bold text-sm hover:bg-[#8EDB5E] transition shadow-md shadow-[#9FE870]/10 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{submitting ? 'Extracting Skills via AI...' : 'Submit & Extract Skills'}</span>
          </button>
        </form>
      </div>

      {/* Extracted Skills Review */}
      {currentCircular && (
        <div className="p-6 rounded-2xl bg-[#131B26] border border-[#1E293B] space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FE870]">AI EXTRACTION COMPLETE</span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {currentCircular.title} ({currentCircular.company})
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Review and confirm the required skills detected by the system before generating your gap report.
              </p>
            </div>

            <button
              onClick={handleRunGapAnalysis}
              disabled={analyzing || requirements.filter(r => r.isConfirmed).length === 0}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#9FE870] hover:bg-[#8EDB5E] text-[#0B0F15] font-bold text-sm transition shadow-lg shadow-[#9FE870]/10 disabled:opacity-50"
            >
              <span>{analyzing ? 'Analyzing Gap...' : 'Analyze Skill Gap Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Detected Skills ({requirements.length})
            </div>

            <div className="flex flex-wrap gap-2.5">
              {requirements.map((req) => (
                <button
                  key={req._id}
                  onClick={() => handleToggleRequirement(req._id, req.isConfirmed)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    req.isConfirmed
                      ? 'bg-[#1C2B1D] text-[#9FE870] border-[#274029]'
                      : 'bg-[#0B0F15] text-slate-500 border-[#1E293B] line-through'
                  }`}
                >
                  {req.isConfirmed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9FE870]" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{req.skillId?.name || req.matchedTerm}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobMatching;
