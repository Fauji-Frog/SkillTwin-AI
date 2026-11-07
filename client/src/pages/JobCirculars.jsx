import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Sparkles,
  ArrowRight,
  Check,
  AlertCircle,
  Building,
  FileText,
  Play
} from 'lucide-react';
import api from '../api/client';

const SAMPLE_CIRCULAR_TEXT = `We are looking for a Junior Full-Stack Developer to join our backend platform engineering team.
Requirements:
- Strong foundations in JavaScript, React, and Node.js with Express framework.
- Good understanding of MongoDB, REST API design, and SQL database schemas.
- Familiarity with Git version control, Docker containers, and Teamwork in Agile environments.
- Problem Solving skills and interest in Data Structures.`;

export default function JobCirculars() {
  const navigate = useNavigate();

  const [circulars, setCirculars] = useState([]);
  const [title, setTitle] = useState('Junior Full-Stack Developer');
  const [company, setCompany] = useState('BrainStation Tech');
  const [rawText, setRawText] = useState(SAMPLE_CIRCULAR_TEXT);
  const [submitting, setSubmitting] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [error, setError] = useState('');
  const [extractedPreview, setExtractedPreview] = useState(null);

  useEffect(() => {
    loadCirculars();
  }, []);

  async function loadCirculars() {
    try {
      const res = await api.get('/job-circulars');
      if (res.success) setCirculars(res.data);
    } catch (e) {
      console.warn('Failed to load circulars');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !rawText) {
      setError('Please provide circular title and description text.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/job-circulars', { title, company, rawText });
      if (res.success) {
        setExtractedPreview(res.data);
        loadCirculars();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit circular.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAnalyze(circularId) {
    setAnalyzingId(circularId);
    setError('');

    try {
      const res = await api.post(`/job-circulars/${circularId}/analyze`);
      if (res.success && res.data) {
        navigate(`/reports?id=${res.data.id || res.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'Gap analysis failed');
    } finally {
      setAnalyzingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Job Circular Matching</h1>
        <p className="text-xs text-slate-400 mt-1">
          Submit real job circulars. SkillTwin AI will parse required skills and compare them against your proven evidence (FR-08 &amp; FR-09).
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submission Form */}
      <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#A3E635]" />
          <span>Submit New Job Circular</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Job Position Title <span className="text-[#A3E635]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Junior Backend Engineer"
                className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-[#A3E635]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Company / Organization
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. BrainStation / Augmedix"
                  className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#A3E635]"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-medium text-slate-300">
                Job Description &amp; Requirements Text <span className="text-[#A3E635]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_CIRCULAR_TEXT)}
                className="text-[10px] text-[#A3E635] hover:underline"
              >
                Insert Sample Circular
              </button>
            </div>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw requirements text here..."
              className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-3 rounded-xl focus:outline-none focus:border-[#A3E635] font-mono leading-relaxed"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-6 rounded-xl bg-[#A3E635] text-black font-bold text-xs hover:bg-[#BEF264] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(163,230,53,0.3)] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Extracting Skills...' : 'Extract Required Skills'}</span>
            </button>
          </div>
        </form>

        {/* Extracted Skills Preview Box */}
        {extractedPreview && (
          <div className="mt-6 pt-5 border-t border-[#1E293B] bg-[#0E1318] p-4 rounded-xl border">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>
                  AI Extracted Skills ({extractedPreview.requirements?.length || 0})
                </span>
              </div>
              <button
                onClick={() => handleAnalyze(extractedPreview.circular?.id || extractedPreview.circular?._id)}
                disabled={analyzingId !== null}
                className="py-1.5 px-3 rounded-lg bg-[#A3E635] text-black text-xs font-bold hover:bg-[#BEF264] flex items-center gap-1.5 shadow-[0_0_12px_rgba(163,230,53,0.3)]"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>{analyzingId ? 'Running RAG Analysis...' : 'Run Evidence Gap Analysis'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {extractedPreview.requirements?.map((req, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[#182619] border border-[#2E4A28] text-[#A3E635] text-xs font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>{req.skillName}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submitted Circulars List */}
      <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#A3E635]" />
          <span>Active Circulars ({circulars.length})</span>
        </h2>

        {circulars.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No circulars submitted yet. Paste a job circular above to begin.
          </div>
        ) : (
          <div className="space-y-3">
            {circulars.map((circ) => {
              const circId = circ.id || circ._id;
              const isAnalyzing = analyzingId === circId;

              return (
                <div
                  key={circId}
                  className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#2D3F54] transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-white">{circ.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#141B24] border border-[#202B38] text-slate-300">
                        {circ.company}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-1 max-w-xl">
                      {circ.rawText}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleAnalyze(circId)}
                      disabled={isAnalyzing}
                      className="py-1.5 px-4 rounded-xl bg-[#A3E635] text-black text-xs font-bold hover:bg-[#BEF264] flex items-center gap-1.5 shadow-[0_0_15px_rgba(163,230,53,0.25)]"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>{isAnalyzing ? 'Analyzing...' : 'Generate Gap Report'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
