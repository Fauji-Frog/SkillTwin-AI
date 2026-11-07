import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  FileCode,
  File,
  RefreshCw,
  Info
} from 'lucide-react';
import api from '../api/client';

export default function Evidence() {
  const [evidenceList, setEvidenceList] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState('report');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
    // Auto-poll every 3 seconds if any item is 'processing'
    const timer = setInterval(() => {
      setEvidenceList((current) => {
        const hasProcessing = current.some((e) => e.status === 'processing');
        if (hasProcessing) {
          fetchEvidenceOnly();
        }
        return current;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [evRes, skRes] = await Promise.all([api.get('/evidence'), api.get('/skills')]);
      if (evRes.success) setEvidenceList(evRes.data);
      if (skRes.success) {
        setSkills(skRes.data);
        if (skRes.data.length > 0) setSelectedSkillId(skRes.data[0]._id || skRes.data[0].id);
      }
    } catch (err) {
      setError('Failed to load evidence repository');
    } finally {
      setLoading(false);
    }
  }

  async function fetchEvidenceOnly() {
    try {
      const res = await api.get('/evidence');
      if (res.success) setEvidenceList(res.data);
    } catch (e) {
      // quiet poll
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (!selectedSkillId) {
      setError('Please choose which skill this file proves.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please provide a specific description of your personal contribution (≥ 10 chars).');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('skillId', selectedSkillId);
    formData.append('title', title || file.name);
    formData.append('description', description);
    formData.append('evidenceType', evidenceType);

    try {
      const res = await api.post('/evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        setSuccess('Evidence uploaded successfully! Text extraction & verification initiated.');
        setFile(null);
        setTitle('');
        setDescription('');
        // Reload list
        loadData();
      }
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/evidence/${id}`);
      setEvidenceList((prev) => prev.filter((e) => (e.id || e._id) !== id));
    } catch (err) {
      setError('Failed to delete evidence item');
    }
  }

  const getFileIcon = (ext) => {
    if (['.js', '.jsx', '.ts', '.py', '.java', '.sql'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-amber-400" />;
    }
    if (['.pdf', '.docx', '.txt'].includes(ext)) {
      return <FileText className="w-5 h-5 text-sky-400" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Evidence Repository</h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload course reports, lab assignments, and project code to substantiate your skills (FR-04 to FR-07).
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141B24] border border-[#202B38] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-[#182619] border border-[#2E4A28] text-[#A3E635] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Form Card */}
      <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#A3E635]" />
          <span>Submit Evidence Artifact</span>
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Skill */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Target Skill Proven <span className="text-[#A3E635]">*</span>
              </label>
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-[#A3E635]"
              >
                {skills.map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Artifact Type */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Evidence Type
              </label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-[#A3E635]"
              >
                <option value="report">Project / Lab Report (PDF/DOCX)</option>
                <option value="code">Source Code Implementation</option>
                <option value="certificate">Certification</option>
                <option value="other">Other Documentation</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Artifact Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. MERN Stack Lab Report #3"
                className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-[#A3E635]"
              />
            </div>
          </div>

          {/* Personal Contribution Description (PRD Requirement) */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>
                Personal Contribution ("What did <span className="italic font-bold">you</span> specifically do?") <span className="text-[#A3E635]">*</span>
              </span>
              <span className="text-[10px] text-slate-500">Max 500 characters</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I designed the RESTful authentication endpoints, implemented password hashing with bcrypt, and connected Mongoose schemas."
              maxLength={500}
              className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-3 rounded-xl focus:outline-none focus:border-[#A3E635]"
              required
            />
          </div>

          {/* File Input */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              Select Document or Code File <span className="text-[#A3E635]">*</span>
            </label>
            <div className="border-2 border-dashed border-[#1E293B] hover:border-[#A3E635]/50 rounded-xl p-4 text-center cursor-pointer bg-[#0A0E13] transition-colors">
              <input
                type="file"
                id="file-upload"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="hidden"
                accept=".pdf,.docx,.txt,.js,.jsx,.ts,.py,.java,.sql,.json,.md"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="w-6 h-6 text-[#A3E635] mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-white block">
                  {file ? file.name : 'Click to browse or drop file here'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Supported: PDF, DOCX, TXT, JS, PY, Java, SQL (Max 10MB)
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="py-2.5 px-6 rounded-xl bg-[#A3E635] text-black font-bold text-xs hover:bg-[#BEF264] transition-all shadow-[0_0_15px_rgba(163,230,53,0.3)] disabled:opacity-50"
            >
              {uploading ? 'Uploading & Processing...' : 'Upload & Extract Evidence'}
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Evidence List with Status Badges (FR-07) */}
      <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[#A3E635]" />
          <span>Submitted Evidence Artifacts ({evidenceList.length})</span>
        </h2>

        {evidenceList.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No evidence files uploaded yet. Submit your project code or reports above.
          </div>
        ) : (
          <div className="space-y-3">
            {evidenceList.map((item) => {
              const skillName = item.skill?.name || item.skillName || 'General';
              const isProcessing = item.status === 'processing';
              const isProcessed = item.status === 'processed';

              return (
                <div
                  key={item.id || item._id}
                  className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#2D3F54] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-[#141B24] border border-[#202B38]">
                      {getFileIcon(item.extension)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-bold text-white">{item.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#182619] border border-[#2E4A28] text-[#A3E635]">
                          {skillName}
                        </span>

                        {/* Status Badge */}
                        {isProcessing && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>Processing...</span>
                          </span>
                        )}

                        {isProcessed && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#182619] text-[#A3E635] border border-[#2E4A28] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Processed &amp; Verified</span>
                          </span>
                        )}

                        {item.status === 'unsupported' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Unsupported Type
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
                        {item.description}
                      </div>

                      {item.extractedText && (
                        <div className="mt-2 text-[10px] text-slate-500 bg-[#121820] p-2 rounded-lg border border-[#1B2430] font-mono line-clamp-2">
                          Extracted Context: "{item.extractedText}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <span className="text-[10px] font-mono text-slate-500">
                      {item.sizeBytes ? `${Math.round(item.sizeBytes / 1024)} KB` : 'Local file'}
                    </span>

                    <button
                      onClick={() => handleDelete(item.id || item._id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete evidence"
                    >
                      <Trash2 className="w-4 h-4" />
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
