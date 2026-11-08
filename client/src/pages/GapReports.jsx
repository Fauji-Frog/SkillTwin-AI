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
  Building,
  RefreshCw,
  Clock,
  Sparkles
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
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadReports();
  }, [queryReportId]);

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

  // FR-24: Student Flagging with Persistent Reason (Match score remains unchanged!)
  async function handleFlag(itemId) {
    if (!flagReason || flagReason.trim().length === 0) return;
    setSubmittingFlag(true);
    setStatusMessage('');

    try {
      const reportId = selectedReport.id || selectedReport._id;
      const res = await api.post(`/reports/${reportId}/items/${itemId}/flag`, {
        reason: flagReason.trim()
      });

      if (res.success && res.data) {
        // Update local report with returned flagged state (matchScore untouched)
        setSelectedReport(res.data);
        setReports((prev) =>
          prev.map((r) => ((r.id || r._id) === reportId ? res.data : r))
        );
        setFlaggingItemId(null);
        setFlagReason('');
        setStatusMessage('AI assessment flagged successfully for faculty/mentor review.');
      }
    } catch (e) {
      setStatusMessage('Flagging failed. Please try again.');
    } finally {
      setSubmittingFlag(false);
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'matched':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#182619] text-[#A3E635] border border-[#2E4A28] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Matched (Evidence Proven)</span>
          </span>
        );
      case 'partial':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Partial Match</span>
          </span>
        );
      case 'missing_evidence':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Missing Evidence</span>
          </span>
        );
      case 'gap':
      default:
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Skill Gap</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title & Report Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Skill-Gap Analysis</h1>
          <p className="text-xs text-slate-400 mt-1">
            Evidence-grounded comparison between job requirements and verified student artifacts (FR-10 to FR-13, FR-24).
          </p>
        </div>

        {reports.length > 0 && (
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

      {statusMessage && (
        <div className="p-3 rounded-xl bg-[#182619] border border-[#2E4A28] text-[#A3E635] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {!selectedReport ? (
        <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-12 text-center">
          <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">No Reports Generated Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Submit a job circular under "Job Matching" and click "Run Evidence Gap Analysis" to see your evidence match analysis.
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
                  Analyzed against {selectedReport.totalRequired} verified technical requirements
                </div>
                <div className="mt-3">
                  <a
                    href={`/learning-path?reportId=${selectedReport.id || selectedReport._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182619] border border-[#2E4A28] text-[#A3E635] text-xs font-bold hover:bg-[#233824] transition-colors"
                  >
                    <span>View Recommended Learning Path</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </div>

              {/* Match Score Gauge */}
              <div className="flex items-center gap-4 bg-[#0E1318] border border-[#1E293B] px-5 py-3 rounded-2xl">
                <div className="text-right">
                  <div className="text-3xl font-black text-[#A3E635]">
                    {selectedReport.matchScore}%
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Match Confidence
                  </div>
                </div>

                {/* Score Breakdown Pills */}
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
              {selectedReport.items?.map((item) => {
                const itemId = item.id || item._id;

                return (
                  <div
                    key={itemId}
                    className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-4 hover:border-[#2D3F54] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-sm font-bold text-white">{item.skillName}</div>
                        <span className="text-[10px] text-slate-500 bg-[#161F2A] px-2 py-0.5 rounded-md">
                          {item.category || 'Technical'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Recorded Level: <span className="font-semibold text-white">{item.studentLevel}</span>
                        </span>

                        {item.isFlagged && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <Flag className="w-3 h-3 text-rose-400" />
                            <span>Flagged by Student</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(item.status)}
                        <button
                          onClick={() => {
                            if (flaggingItemId === itemId) {
                              setFlaggingItemId(null);
                            } else {
                              setFlaggingItemId(itemId);
                              setFlagReason(item.flagReason || '');
                            }
                          }}
                          className={`text-[11px] px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                            item.isFlagged
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                              : 'bg-[#141B24] border-[#202B38] text-slate-400 hover:text-[#A3E635]'
                          }`}
                          title="Flag evaluation for review (FR-24)"
                        >
                          <Flag className="w-3 h-3" />
                          <span>{item.isFlagged ? 'Review Flag' : 'Flag'}</span>
                        </button>
                      </div>
                    </div>

                    {/* AI Assessment Rationale */}
                    <div className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                      {item.reason}
                    </div>

                    {/* Flag Reason Display if previously flagged */}
                    {item.isFlagged && item.flagReason && (
                      <div className="mt-2 text-[11px] text-rose-300/90 bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-lg flex items-start gap-2">
                        <Flag className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-rose-300">Student Flag Note: </span>
                          <span>"{item.flagReason}"</span>
                        </div>
                      </div>
                    )}

                    {/* Supporting Evidence Citations (FR-13 RAG Grounding) */}
                    {item.supportingEvidence && item.supportingEvidence.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#1E293B] space-y-2">
                        <div className="text-[10px] uppercase font-bold text-[#A3E635] tracking-wider flex items-center gap-1">
                          <FileCheck className="w-3 h-3" />
                          <span>Grounding Evidence Artifacts ({item.supportingEvidence.length})</span>
                        </div>
                        {item.supportingEvidence.map((ev, idx) => (
                          <div
                            key={idx}
                            className="bg-[#121820] border border-[#1B2430] p-2.5 rounded-lg text-xs"
                          >
                            <div className="font-bold text-slate-200">{ev.title}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-1 leading-relaxed">
                              "{ev.snippet}"
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Flag Form (FR-24) */}
                    {flaggingItemId === itemId && (
                      <div className="mt-3 p-3.5 bg-[#161414] border border-[#3D2525] rounded-xl space-y-2.5">
                        <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                          <Flag className="w-3.5 h-3.5" />
                          <span>Flag this evaluation for human review (FR-24)</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Explain why you believe this assessment does not accurately reflect your verified competencies:
                        </p>
                        <input
                          type="text"
                          value={flagReason}
                          onChange={(e) => setFlagReason(e.target.value)}
                          placeholder="e.g. My evidence file in Lab #3 explicitly demonstrates Docker container orchestration in lines 45-80."
                          className="w-full bg-[#0A0E13] border border-[#2D1B1B] text-xs text-white p-2.5 rounded-lg focus:outline-none focus:border-rose-400"
                        />
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-500 italic">
                            * Note: Flagging records your justification without modifying the algorithmic match score.
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setFlaggingItemId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleFlag(itemId)}
                              disabled={submittingFlag || !flagReason.trim()}
                              className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold disabled:opacity-50"
                            >
                              {submittingFlag ? 'Saving...' : 'Submit Flag'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
