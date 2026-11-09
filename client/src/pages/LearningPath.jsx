import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Code,
  Award,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';

export default function LearningPath() {
  const [searchParams] = useSearchParams();
  const reportIdParam = searchParams.get('reportId');

  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(reportIdParam || '');
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (selectedReportId) {
      loadPath(selectedReportId);
    }
  }, [selectedReportId]);

  async function loadReports() {
    try {
      const res = await api.get('/reports');
      if (res.success && res.data.length > 0) {
        setReports(res.data);
        if (!selectedReportId) {
          const firstId = res.data[0].id || res.data[0]._id;
          setSelectedReportId(firstId);
        }
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  }

  async function loadPath(rId) {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/learning-paths/${rId}`);
      if (res.success) {
        setLearningPath(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load personalized learning path');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusToggle(step) {
    if (!learningPath) return;
    const nextStatus = step.status === 'done' ? 'todo' : step.status === 'todo' ? 'in_progress' : 'done';
    const pathId = learningPath.id || learningPath._id;
    const stepId = step.id || step._id;

    try {
      const res = await api.patch(`/learning-paths/${pathId}/steps/${stepId}`, {
        status: nextStatus
      });
      if (res.success) {
        setLearningPath(res.data);
      }
    } catch (e) {
      console.warn('Status update failed');
    }
  }

  const completedCount = learningPath?.steps?.filter((s) => s.status === 'done').length || 0;
  const totalCount = learningPath?.steps?.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#A3E635]" />
            <span>Personalized Learning Path</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tailored curriculum automatically generated to bridge your verified skill-gaps.
          </p>
        </div>

        {reports.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Target Role:</span>
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="bg-[#121822] border border-[#1E293B] text-xs text-white p-2 rounded-xl focus:outline-none focus:border-[#A3E635]"
            >
              {reports.map((r) => (
                <option key={r.id || r._id} value={r.id || r._id}>
                  {r.jobTitle} ({r.company})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!learningPath || learningPath.steps?.length === 0 ? (
        <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-12 text-center">
          <Compass className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Learning Gaps Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Run a Job Circular Analysis first to identify missing technical skills and generate your custom learning path.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-[#A3E635] text-black font-bold text-xs hover:bg-[#BEF264] transition-colors"
          >
            <span>Analyze a Job Circular</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <>
          {/* Progress Overview Card */}
          <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  CURRICULUM OBJECTIVE
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Path for: {learningPath.jobTitle}
                </h2>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-white">
                  {completedCount} of {learningPath.steps.length} Milestones Completed
                </div>
                <div className="text-[11px] font-bold text-[#A3E635] mt-0.5">
                  {progressPercent}% Mastery
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-[#0A0E13] rounded-full overflow-hidden border border-[#1A232E]">
              <div
                className="h-full bg-gradient-to-r from-[#84CC16] to-[#A3E635] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Sequential Step Timeline */}
          <div className="space-y-4">
            {learningPath.steps.map((step, idx) => {
              const isDone = step.status === 'done';
              const isInProgress = step.status === 'in_progress';

              return (
                <div
                  key={step.id || step._id || idx}
                  className={`border rounded-2xl p-5 transition-all ${
                    isDone
                      ? 'bg-[#101712] border-[#203322]'
                      : isInProgress
                      ? 'bg-[#121B24] border-[#22394D]'
                      : 'bg-[#121822] border-[#1E293B]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      {/* Step Number & Checkbox */}
                      <button
                        onClick={() => handleStatusToggle(step)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-[#A3E635] text-black shadow-[0_0_12px_rgba(163,230,53,0.3)]'
                            : isInProgress
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                            : 'bg-[#1A232E] text-slate-400 hover:text-white border border-[#243040]'
                        }`}
                        title="Click to toggle status (Todo -> In Progress -> Done)"
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                            {step.title}
                          </h3>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#182619] border border-[#2E4A28] text-[#A3E635]">
                            {step.skillName}
                          </span>

                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              step.gapType === 'gap'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : step.gapType === 'missing_evidence'
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            }`}
                          >
                            {step.gapType.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {step.description}
                        </p>

                        {/* Practice Mini-Project Task */}
                        {step.practiceTask && (
                          <div className="mt-3 p-3 rounded-xl bg-[#0A0E13] border border-[#1A232E] flex items-start gap-2.5">
                            <Code className="w-4 h-4 text-[#A3E635] shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Practice Project Task
                              </div>
                              <div className="text-xs text-slate-300 font-mono mt-0.5 leading-snug">
                                {step.practiceTask}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Action: External Resource Link */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#182619] border border-[#2E4A28] text-[#A3E635] text-xs font-semibold hover:bg-[#233824] transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Documentation</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
