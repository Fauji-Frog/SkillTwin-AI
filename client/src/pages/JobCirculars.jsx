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
  Play,
  Upload,
  CheckSquare,
  Square,
  Clock,
  Layers
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
  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'upload'
  const [title, setTitle] = useState('Junior Full-Stack Developer');
  const [company, setCompany] = useState('BrainStation Tech');
  const [rawText, setRawText] = useState(SAMPLE_CIRCULAR_TEXT);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Review & Confirmation State (FR-09)
  const [extractedReview, setExtractedReview] = useState(null);
  const [selectedSkillIds, setSelectedSkillIds] = useState(new Set());

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
    if (!title) {
      setError('Please provide circular position title.');
      return;
    }

    if (inputMode === 'paste' && (!rawText || rawText.trim().length < 15)) {
      setError('Please paste job description text (at least 15 characters).');
      return;
    }

    if (inputMode === 'upload' && !file) {
      setError('Please select a PDF or DOCX file to upload.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    setExtractedReview(null);

    try {
      let res;
      if (inputMode === 'upload') {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('company', company);
        formData.append('file', file);
        res = await api.post('/job-circulars', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/job-circulars', {
          title,
          company,
          rawText
        });
      }

      if (res.success) {
        setSuccess('Circular parsed! Please review and confirm the required skills below (FR-09).');
        setExtractedReview(res.data);

        // Pre-select all detected skills for convenience, requiring user to review and confirm
        const detectedIds = new Set(
          (res.data.requirements || []).map((r) => (r.skillId?._id || r.skillId?.id || r.skillId || r.id || r._id).toString())
        );
        setSelectedSkillIds(detectedIds);
        loadCirculars();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit circular.');
    } finally {
      setSubmitting(false);
    }
  }

  const toggleSkill = (skillId) => {
    const sId = skillId.toString();
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(sId)) {
        next.delete(sId);
      } else {
        next.add(sId);
      }
      return next;
    });
  };

  const selectAllSkills = () => {
    if (!extractedReview?.requirements) return;
    const all = new Set(
      extractedReview.requirements.map((r) => (r.skillId?._id || r.skillId?.id || r.skillId || r.id || r._id).toString())
    );
    setSelectedSkillIds(all);
  };

  const deselectAllSkills = () => {
    setSelectedSkillIds(new Set());
  };

  // FR-09: Explicitly confirm requirements and then run gap analysis
  async function handleConfirmAndAnalyze() {
    if (!extractedReview?.circular) return;
    const circularId = extractedReview.circular.id || extractedReview.circular._id;

    if (selectedSkillIds.size === 0) {
      setError('Please select at least one skill requirement to confirm.');
      return;
    }

    setConfirming(true);
    setError('');

    try {
      // 1. Save explicit user confirmation (FR-09)
      await api.post(`/job-circulars/${circularId}/confirm-requirements`, {
        confirmedSkillIds: Array.from(selectedSkillIds)
      });

      // 2. Run Evidence-Grounded Gap Analysis (FR-10 to FR-13)
      setAnalyzingId(circularId);
      const res = await api.post(`/job-circulars/${circularId}/analyze`);
      if (res.success && res.data) {
        navigate(`/reports?id=${res.data.id || res.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setConfirming(false);
      setAnalyzingId(null);
    }
  }

  async function handleDirectAnalyze(circularId) {
    setAnalyzingId(circularId);
    setError('');

    try {
      const res = await api.post(`/job-circulars/${circularId}/analyze`);
      if (res.success && res.data) {
        navigate(`/reports?id=${res.data.id || res.data._id}`);
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('confirm')) {
        handleReviewCircular(circularId);
      }
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
          Submit job descriptions via text or PDF/DOCX file. Review AI-extracted skills and generate evidence-grounded gap reports (FR-08 &amp; FR-09).
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

      {/* Submission Form Card */}
      <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#A3E635]" />
          <span>Submit Job Circular</span>
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

          {/* Mode Switcher Tabs */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-2">
              Submission Mode <span className="text-[#A3E635]">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  inputMode === 'paste'
                    ? 'bg-[#182619] border border-[#2E4A28] text-[#A3E635]'
                    : 'bg-[#0A0E13] border border-[#1F2937] text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Description Text</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  inputMode === 'upload'
                    ? 'bg-[#182619] border border-[#2E4A28] text-[#A3E635]'
                    : 'bg-[#0A0E13] border border-[#1F2937] text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Circular File (PDF/DOCX)</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Paste Text */}
          {inputMode === 'paste' ? (
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
          ) : (
            /* Tab 2: Upload File */
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Select Circular Document (PDF or DOCX) <span className="text-[#A3E635]">*</span>
              </label>
              <div className="border-2 border-dashed border-[#1E293B] hover:border-[#A3E635]/50 rounded-xl p-6 text-center cursor-pointer bg-[#0A0E13] transition-colors">
                <input
                  type="file"
                  id="circular-file-upload"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                />
                <label htmlFor="circular-file-upload" className="cursor-pointer block">
                  <Upload className="w-7 h-7 text-[#A3E635] mx-auto mb-2" />
                  <span className="text-xs font-semibold text-white block">
                    {file ? file.name : 'Click to select or drop job circular file'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Supported: PDF, DOCX, TXT documents
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-6 rounded-xl bg-[#A3E635] text-black font-bold text-xs hover:bg-[#BEF264] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(163,230,53,0.3)] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Extracting Skills from Circular...' : 'Extract Required Skills'}</span>
            </button>
          </div>
        </form>

        {/* FR-09: Explicit Skill Review & Confirmation Box */}
        {extractedReview && (
          <div className="mt-6 pt-5 border-t border-[#1E293B] bg-[#0E1318] p-5 rounded-xl border border-[#1E293B] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#A3E635]" />
                  <span>Review &amp; Confirm Required Skills (FR-09)</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm which skills are truly required for <span className="text-white font-semibold">{extractedReview.circular?.title}</span> before running the gap report.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllSkills}
                  className="text-slate-400 hover:text-[#A3E635] underline text-[11px]"
                >
                  Select All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={deselectAllSkills}
                  className="text-slate-400 hover:text-rose-400 underline text-[11px]"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Skills Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {extractedReview.requirements?.map((req) => {
                const sId = (req.skillId?._id || req.skillId?.id || req.skillId || req.id || req._id).toString();
                const isChecked = selectedSkillIds.has(sId);

                return (
                  <div
                    key={sId}
                    onClick={() => toggleSkill(sId)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                      isChecked
                        ? 'bg-[#182619] border-[#2E4A28] text-white'
                        : 'bg-[#121822] border-[#1E293B] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#A3E635] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-white">{req.skillName}</div>
                        <div className="text-[10px] text-slate-400">{req.category || 'Technical'}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      isChecked ? 'bg-[#2E4A28] text-[#A3E635]' : 'bg-[#1C2533] text-slate-500'
                    }`}>
                      {isChecked ? 'Confirmed' : 'Excluded'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1E293B]">
              <span className="text-xs text-slate-400 font-mono">
                {selectedSkillIds.size} of {extractedReview.requirements?.length || 0} skills confirmed
              </span>

              <button
                onClick={handleConfirmAndAnalyze}
                disabled={confirming || analyzingId !== null || selectedSkillIds.size === 0}
                className="py-2.5 px-6 rounded-xl bg-[#A3E635] text-black text-xs font-bold hover:bg-[#BEF264] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(163,230,53,0.3)] disabled:opacity-50 transition-all"
              >
                {confirming || analyzingId !== null ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Computing Evidence Gap Analysis...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-black" />
                    <span>Confirm Skills &amp; Run Evidence Gap Analysis</span>
                  </>
                )}
              </button>
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
            No circulars submitted yet. Paste or upload a job circular above to begin.
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
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-bold text-white">{circ.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#141B24] border border-[#202B38] text-slate-300">
                        {circ.company}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#182619] border border-[#2E4A28] text-[#A3E635]">
                        {circ.confirmedSkills || circ.totalSkills || 0} skills
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-1 max-w-xl">
                      {circ.rawText}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleDirectAnalyze(circId)}
                      disabled={isAnalyzing}
                      className="py-1.5 px-4 rounded-xl bg-[#A3E635] text-black text-xs font-bold hover:bg-[#BEF264] flex items-center gap-1.5 shadow-[0_0_15px_rgba(163,230,53,0.25)] disabled:opacity-50"
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
