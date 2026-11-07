import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Flag,
  FileCheck,
  ShieldAlert,
  ChevronDown,
  Building
} from 'lucide-react';
import api from '../api/client';

export default function GapReports() {
  const [searchParams] = useSearchParams();
  const queryReportId = searchParams.get('id');

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flaggingItemId, setFlaggingItemId] = useState(null);
  const [flagReason, setFlagReason] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await api.get('/reports');
      if (res.success && res.data.length > 0) {
        setReports(res.data);
        const target = queryReportId
          ? res.data.find((r) => (r.id || r._id) === queryReportId) || res.data[0]
          : res.data[0];
        setSelectedReport(target);
      }
    } catch (err) {
      console.warn('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  async function handleFlag(itemId) {
    if (!flagReason) return;
    try {
      const reportId = selectedReport.id || selectedReport._id;
      const res = await api.post(`/reports/${reportId}/items/${itemId}/flag`, {
        reason: flagReason
      });
      if (res.success) {
        setFlaggingItemId(null);
        setFlagReason('');
        loadReports();
      }
    } catch (e) {
      console.warn('Flagging failed');
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'matched':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#182619] text-[#A3E635] border border-[#2E4A28] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Matched (Evidence Proven)</span>
          </span>
        );
      case 'partial':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Partial Match</span>
          </span>
        );
      case 'missing_evidence':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Missing Evidence</span>
          </span>
        );
      case 'gap':
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Skill Gap</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Skill-Gap Analysis</h1>
          <p className="text-xs text-slate-400 mt-1">
            Evidence-grounded comparison between job requirements and verified student artifacts (FR-10 to FR-13).
          </p>
        </div>

        {reports.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Select Report:</span>
            <select
              value={selectedReport?.id || selectedReport?._id}
              onChange={(e) => {
                const rep = reports.find((r) => (r.id || r._id) === e.target.value);
                if (rep) setSelectedReport(rep);
              }}
              className="bg-[#121822] border border-[#1E293B] text-xs text-white p-2 rounded-xl focus:outline-none focus:border-[#A3E635]"
            >
              {reports.map((r) => (
                <option key={r.id || r._id} value={r.id || r._id}>
                  {r.jobTitle} - {r.company} ({r.matchScore}% match)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!selectedReport ? (
        <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-12 text-center">
          <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">No Reports Generated Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Submit a job circular under "Job Matching" and click "Generate Gap Report" to see your evidence match analysis.
          </p>
        </div>
      ) : (
        <>
          {/* Header Card with Circular Match Score */}
          <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>{selectedReport.company}</span>
                </div>
                <h2 className="text-2xl font-black text-white">{selectedReport.jobTitle}</h2>
                <div className="text-xs text-slate-400 mt-1">
                  Analyzed against {selectedReport.totalRequired} target technical requirements
                </div>
                <div className="mt-3">
                  <a
                    href={`/learning-path?reportId=${selectedReport.id || selectedReport._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182619] border border-[#2E4A28] text-[#A3E635] text-xs font-bold hover:bg-[#233824] transition-colors"
                  >
                    <span>View Personalized Learning Path</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </div>

              {/* Match Score Gauge */}
              <div className="flex items-center gap-4 bg-[#0E1318] border border-[#1E293B] px-5 py-3 rounded-2xl">
                <div className="text-right">
                  <div className="text-2xl font-black text-[#A3E635]">
                    {selectedReport.matchScore}%
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Match Confidence
                  </div>
                </div>

                {/* Score Pills */}
                <div className="h-10 w-[1px] bg-[#1E293B]" />
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div className="text-slate-400">
                    Proven:{' '}
                    <span className="text-[#A3E635] font-bold">
                      {selectedReport.matchedCount || 0}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Partial:{' '}
                    <span className="text-amber-400 font-bold">
                      {selectedReport.partialCount || 0}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    No Proof:{' '}
                    <span className="text-orange-400 font-bold">
                      {selectedReport.missingCount || 0}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Gaps:{' '}
                    <span className="text-rose-400 font-bold">
                      {selectedReport.gapCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Official SRS Disclaimer Banner */}
          <div className="bg-[#141A14] border border-[#233827] rounded-xl p-3.5 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-[#A3E635] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-[#A3E635]">Guidance Notice:</span> {selectedReport.disclaimer}
            </p>
          </div>

          {/* Gap Items Table / Cards */}
          <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">
              Requirement-by-Requirement Evidence Audit ({selectedReport.items?.length || 0})
            </h3>

            <div className="space-y-4">
              {selectedReport.items?.map((item) => (
                <div
                  key={item.id || item._id}
                  className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-4 hover:border-[#2D3F54] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-bold text-white">{item.skillName}</div>
                      <span className="text-[10px] text-slate-500 bg-[#161F2A] px-2 py-0.5 rounded-md">
                        {item.category || 'Technical'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Recorded Level: <span className="font-semibold text-white">{item.studentLevel}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(item.status)}
                      <button
                        onClick={() =>
                          setFlaggingItemId(flaggingItemId === (item.id || item._id) ? null : (item.id || item._id))
                        }
                        className="text-[11px] text-slate-400 hover:text-[#A3E635] flex items-center gap-1 transition-colors"
                      >
                        <Flag className="w-3 h-3" />
                        <span>{item.isFlagged ? 'Flagged' : 'Flag'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                    {item.reason}
                  </div>

                  {/* Supporting Evidence Citations (FR-13 RAG Grounding) */}
                  {item.supportingEvidence && item.supportingEvidence.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#1E293B] space-y-2">
                      <div className="text-[10px] uppercase font-bold text-[#A3E635] tracking-wider flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        <span>Grounding Evidence Artifacts</span>
                      </div>
                      {item.supportingEvidence.map((ev, idx) => (
                        <div
                          key={idx}
                          className="bg-[#121820] border border-[#1B2430] p-2.5 rounded-lg text-xs"
                        >
                          <div className="font-bold text-slate-200">{ev.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-1">
                            "{ev.snippet}"
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Flag Form */}
                  {flaggingItemId === (item.id || item._id) && (
                    <div className="mt-3 p-3 bg-[#161414] border border-[#3D2525] rounded-xl space-y-2">
                      <div className="text-xs font-semibold text-rose-300">
                        Flag this AI evaluation (FR-24):
                      </div>
                      <input
                        type="text"
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        placeholder="Why do you believe this evaluation needs correction?"
                        className="w-full bg-[#0A0E13] border border-[#2D1B1B] text-xs text-white p-2 rounded-lg focus:outline-none focus:border-rose-400"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setFlaggingItemId(null)}
                          className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleFlag(item.id || item._id)}
                          className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
                        >
                          Submit Review
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
