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
  Eye,
  X,
  Layers,
  HelpCircle
} from 'lucide-react';
import api from '../api/client';
import SkillSelector from '../components/SkillSelector';

export default function Evidence() {
  const [evidenceList, setEvidenceList] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [customSkillName, setCustomSkillName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState('report');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // View Evidence Modal State
  const [viewingEvidence, setViewingEvidence] = useState(null);
  const [loadingView, setLoadingView] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [evRes, skRes] = await Promise.all([api.get('/evidence'), api.get('/skills')]);
      if (evRes.success) setEvidenceList(evRes.data);
      if (skRes.success) {
        setSkills(skRes.data);
        if (skRes.data.length > 0 && !selectedSkillId) {
          setSelectedSkillId(skRes.data[0]._id || skRes.data[0].id);
        }
      }
    } catch (err) {
      setError('Failed to load evidence repository');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const useCustom = isCustomMode || skills.length === 0;

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (useCustom && !customSkillName.trim()) {
      setError('Please write which skill this file proves.');
      return;
    }
    if (!useCustom && !selectedSkillId) {
      setError('Please choose which skill this file proves or switch to write a custom skill.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please provide a specific description of your personal contribution (at least 10 characters).');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    if (useCustom) {
      formData.append('skillName', customSkillName.trim());
    } else {
      formData.append('skillId', selectedSkillId);
    }
    formData.append('title', title || file.name);
    formData.append('description', description);
    formData.append('evidenceType', evidenceType);

    try {
      const res = await api.post('/evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        setSuccess(`Evidence "${res.data.title}" uploaded & processed! Extracted ${res.data.chunkCount || 0} text chunks.`);
        setFile(null);
        setTitle('');
        setDescription('');
        setCustomSkillName('');
        setIsCustomMode(false);
        // Reset file input element
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        loadData();
      }
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleView(id) {
    setLoadingView(true);
    try {
      const res = await api.get(`/evidence/${id}`);
      if (res.success && res.data) {
        setViewingEvidence(res.data);
      }
    } catch (err) {
      setError('Failed to fetch evidence details');
    } finally {
      setLoadingView(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this evidence artifact? This will remove its extracted text chunks and update your gap reports.')) {
      return;
    }
    try {
      await api.delete(`/evidence/${id}`);
      setEvidenceList((prev) => prev.filter((e) => (e.id || e._id) !== id));
      if (viewingEvidence && (viewingEvidence.id === id || viewingEvidence._id === id)) {
        setViewingEvidence(null);
      }
    } catch (err) {
      setError('Failed to delete evidence item');
    }
  }

  const getFileIcon = (ext) => {
    if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.sql', '.json'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-amber-400" />;
    }
    if (['.pdf', '.docx', '.txt', '.md'].includes(ext)) {
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
            Upload course reports, lab assignments, and project code to substantiate your skills.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141B24] border border-[#202B38] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
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
            <SkillSelector
              label="Target Skill Proven"
              required
              skills={skills}
              selectedSkillId={selectedSkillId}
              onSelectSkillId={setSelectedSkillId}
              customSkillName={customSkillName}
              onCustomSkillNameChange={setCustomSkillName}
              isCustomMode={isCustomMode}
              onToggleCustomMode={setIsCustomMode}
              loading={loading}
            />

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
                placeholder="e.g. MERN Authentication Server"
                className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-[#A3E635]"
              />
            </div>
          </div>

          {/* Personal Contribution Description */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>
                Personal Contribution ("What did <span className="italic font-bold">you</span> specifically do?") <span className="text-[#A3E635]">*</span>
              </span>
              <span className="text-[10px] text-slate-500">Min 10 chars, max 500 chars</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I implemented the JWT cookie authentication, database schema indexing, and unit tests."
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
                accept=".pdf,.docx,.txt,.js,.jsx,.ts,.tsx,.py,.java,.sql,.json,.md"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="w-6 h-6 text-[#A3E635] mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-white block">
                  {file ? file.name : 'Click to browse or drop file here'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Supported: PDF, DOCX, TXT, Code files (.js, .py, .java, .sql) (Max 10MB)
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="py-2.5 px-6 rounded-xl bg-[#A3E635] text-black font-bold text-xs hover:bg-[#BEF264] transition-all shadow-[0_0_15px_rgba(163,230,53,0.3)] disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Extracting &amp; Chunking...</span>
                </>
              ) : (
                <span>Upload &amp; Extract Evidence</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Evidence List */}
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
              const itemId = item.id || item._id;
              const skillName = item.skill?.name || item.skillName || 'General';
              const isProcessed = item.status === 'processed';

              return (
                <div
                  key={itemId}
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

                        {isProcessed && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#182619] text-[#A3E635] border border-[#2E4A28] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Processed ({item.chunkCount || 0} chunks)</span>
                          </span>
                        )}

                        {item.status === 'unsupported' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Unsupported Format
                          </span>
                        )}

                        {item.status === 'failed' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            Extraction Failed
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
                        {item.description}
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                        <span>Original: <span className="font-mono text-slate-400">{item.originalName}</span></span>
                        <span>•</span>
                        <span>Size: <span className="font-mono text-slate-400">{item.sizeBytes ? `${Math.round(item.sizeBytes / 1024)} KB` : 'Local file'}</span></span>
                        <span>•</span>
                        <span>Chunks: <span className="font-mono text-[#A3E635] font-bold">{item.chunkCount || 0}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
                    <button
                      onClick={() => handleView(itemId)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#141B24] border border-[#202B38] text-xs font-semibold text-slate-300 hover:text-white hover:border-[#A3E635]/40 flex items-center gap-1.5 transition-colors"
                      title="View extracted text and chunks"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#A3E635]" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => handleDelete(itemId)}
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

      {/* View Evidence Modal */}
      {viewingEvidence && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-[#1E293B] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1E293B] flex items-center justify-between bg-[#0E1318]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#A3E635]" />
                  <span>{viewingEvidence.title}</span>
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Proving Skill: <span className="text-[#A3E635] font-semibold">{viewingEvidence.skill?.name || viewingEvidence.skillName}</span> | File: <span className="font-mono">{viewingEvidence.originalName}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingEvidence(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1A2330] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Metadata Banner */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0A0E13] border border-[#1E293B] p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Status</div>
                  <div className="text-xs font-bold text-[#A3E635] mt-0.5 capitalize">
                    {viewingEvidence.status}
                  </div>
                </div>
                <div className="bg-[#0A0E13] border border-[#1E293B] p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Stored Chunks</div>
                  <div className="text-xs font-bold text-white mt-0.5 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>{viewingEvidence.chunkCount || viewingEvidence.chunks?.length || 0} Chunks</span>
                  </div>
                </div>
                <div className="bg-[#0A0E13] border border-[#1E293B] p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">File Size</div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {viewingEvidence.sizeBytes ? `${Math.round(viewingEvidence.sizeBytes / 1024)} KB` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Personal Contribution */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Personal Contribution Statement
                </h4>
                <div className="bg-[#0A0E13] border border-[#1E293B] p-3 rounded-xl text-xs text-slate-300 leading-relaxed">
                  {viewingEvidence.description}
                </div>
              </div>

              {/* Extracted Text Chunks */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Actual Extracted Text Chunks in EvidenceChunk Collection</span>
                  <span className="text-[10px] text-[#A3E635] font-mono">
                    {viewingEvidence.chunks?.length || 0} chunk(s) stored
                  </span>
                </h4>

                {viewingEvidence.chunks && viewingEvidence.chunks.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {viewingEvidence.chunks.map((chk, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0A0E13] border border-[#1E293B] p-3 rounded-xl font-mono text-[11px] text-slate-300 leading-relaxed"
                      >
                        <div className="text-[10px] text-[#A3E635] font-bold mb-1 flex items-center justify-between">
                          <span>Chunk #{chk.index !== undefined ? chk.index + 1 : idx + 1}</span>
                          <span className="text-slate-500 font-normal">{(chk.text || '').length} chars</span>
                        </div>
                        <div className="text-slate-300 whitespace-pre-wrap">{chk.text}</div>
                      </div>
                    ))}
                  </div>
                ) : viewingEvidence.extractedText ? (
                  <div className="bg-[#0A0E13] border border-[#1E293B] p-3 rounded-xl font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {viewingEvidence.extractedText}
                  </div>
                ) : (
                  <div className="bg-[#0A0E13] border border-[#1E293B] p-4 rounded-xl text-center text-xs text-slate-500">
                    No extracted text chunks stored for this item.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1E293B] flex justify-end bg-[#0E1318]">
              <button
                onClick={() => setViewingEvidence(null)}
                className="px-5 py-2 rounded-xl bg-[#1E293B] text-white text-xs font-bold hover:bg-[#2B394E] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
