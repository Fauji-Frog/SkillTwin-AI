import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowUpRight,
  TrendingUp,
  Award,
  FileCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    coverage: 0,
    recordedSkills: 0,
    processedEvidence: 0,
    reportsGenerated: 0,
    skillsToStrengthen: [],
    latestAnalysis: null,
    latestReport: null
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, [user]);

  async function fetchStats() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/stats');
      if (res.success && res.data) {
        setStats({
          coverage: Number(res.data.coverage) || 0,
          recordedSkills: Number(res.data.recordedSkills) || 0,
          processedEvidence: Number(res.data.processedEvidence) || 0,
          reportsGenerated: Number(res.data.reportsGenerated) || 0,
          skillsToStrengthen: Array.isArray(res.data.skillsToStrengthen) ? res.data.skillsToStrengthen : [],
          latestAnalysis: res.data.latestAnalysis || null,
          latestReport: res.data.latestReport || null
        });
      }
    } catch (err) {
      console.warn('Dashboard stats error:', err);
      setError('Unable to load dashboard stats.');
      // Keep strictly 0/null upon error - NEVER fallback to mock data
      setStats({
        coverage: 0,
        recordedSkills: 0,
        processedEvidence: 0,
        reportsGenerated: 0,
        skillsToStrengthen: [],
        latestAnalysis: null,
        latestReport: null
      });
    } finally {
      setLoading(false);
    }
  }

  // Dynamic user name
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  // Dynamic date header
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthDayYear = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  const dateFormatted = `${dayName} • ${monthDayYear}`;

  // Time-based greeting
  const currentHour = today.getHours();
  const greetingTime = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  // SVG Circular calculation for Evidence Coverage Ring
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.coverage / 100) * circumference;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Date & Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest uppercase text-slate-400 font-semibold mb-2">
            {dateFormatted}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {greetingTime}, {firstName}.
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is how confidently you can prove your skills today.
          </p>
        </div>

        {/* Green Primary Action Button */}
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 bg-[#A3E635] hover:bg-[#BEF264] text-black font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Analyze a job circular</span>
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Evidence Coverage */}
        <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-5 relative overflow-hidden group hover:border-[#2D3F54] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Evidence Coverage
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#182619] border border-[#2E4A28] flex items-center justify-center text-[#A3E635]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-white">{stats.coverage}%</div>
              <div className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                {stats.coverage > 0 ? (
                  <span className="text-[#A3E635] font-semibold">Verified evidence backing</span>
                ) : (
                  <span>0% verified evidence</span>
                )}
              </div>
            </div>

            {/* Circular Progress Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="#1E293B"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="#A3E635"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-white">{stats.coverage}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Recorded Skills */}
        <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-5 hover:border-[#2D3F54] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Recorded Skills
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#192330] border border-[#28384D] flex items-center justify-center text-sky-400">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {stats.recordedSkills < 10 ? `0${stats.recordedSkills}` : stats.recordedSkills}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-1">
            {stats.recordedSkills > 0 ? (
              <span className="text-[#A3E635] font-semibold">Active competencies</span>
            ) : (
              <span>0 skills recorded</span>
            )}
          </div>
        </div>

        {/* Card 3: Processed Evidence */}
        <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-5 hover:border-[#2D3F54] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Processed Evidence
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#271E1A] border border-[#4A3225] flex items-center justify-center text-amber-400">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {stats.processedEvidence < 10 ? `0${stats.processedEvidence}` : stats.processedEvidence}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-1">
            {stats.processedEvidence > 0 ? (
              <span className="text-[#A3E635] font-semibold">Artifacts verified</span>
            ) : (
              <span>0 files processed</span>
            )}
          </div>
        </div>

        {/* Card 4: Reports Generated */}
        <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-5 hover:border-[#2D3F54] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Reports Generated
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#251A2E] border border-[#442857] flex items-center justify-center text-purple-400">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {stats.reportsGenerated < 10 ? `0${stats.reportsGenerated}` : stats.reportsGenerated}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-1">
            {stats.reportsGenerated > 0 ? (
              <span className="text-[#A3E635] font-semibold">{stats.reportsGenerated} completed</span>
            ) : (
              <span>No reports yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Two Columns: Skills to strengthen & Latest Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Skills to strengthen */}
        <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  YOUR SIGNAL
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">Skills to strengthen</h2>
              </div>
              {stats.recordedSkills > 0 && (
                <Link
                  to="/skills"
                  className="text-xs font-semibold text-[#A3E635] hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="space-y-3 py-4">
                <div className="h-12 bg-[#0E1318] rounded-xl animate-pulse" />
                <div className="h-12 bg-[#0E1318] rounded-xl animate-pulse" />
              </div>
            ) : stats.skillsToStrengthen.length > 0 ? (
              <div className="space-y-3">
                {stats.skillsToStrengthen.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-3.5 flex items-center justify-between hover:border-[#2D3F54] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#182619] border border-[#2E4A28] flex items-center justify-center text-xs font-bold text-[#A3E635]">
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.category}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#1B2430] text-slate-300 border border-[#263547]">
                        {item.level}
                      </span>
                      {!item.hasEvidence ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Needs evidence</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#182619] text-[#A3E635] border border-[#2E4A28] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state for skills section */
              <div className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-6 text-center space-y-3 my-2">
                <div className="w-10 h-10 rounded-full bg-[#161F2B] border border-[#233042] flex items-center justify-center mx-auto text-[#A3E635]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">No skills recorded yet.</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Your skills will appear here after your evidence is analyzed.
                  </p>
                </div>
                <Link
                  to="/skills"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A3E635] hover:text-[#BEF264] pt-1"
                >
                  <span>Record your first skill</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {stats.recordedSkills === 0 && (
            <div className="pt-4 mt-4 border-t border-[#1E293B] flex items-center justify-between text-xs text-slate-400">
              <span>0 actual skill records</span>
              <Link to="/evidence" className="text-[#A3E635] hover:underline font-semibold">
                Upload Evidence &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Right: Latest Analysis */}
        <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  LATEST ANALYSIS
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">
                  {stats.latestReport ? stats.latestReport.jobTitle : 'No analysis yet'}
                </h2>
              </div>
              {stats.latestReport && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#182619] text-[#A3E635] border border-[#2E4A28] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
                  <span>ACTIVE</span>
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3 py-6">
                <div className="h-4 bg-[#0E1318] rounded w-3/4 animate-pulse" />
                <div className="h-16 bg-[#0E1318] rounded-xl animate-pulse" />
              </div>
            ) : stats.latestReport ? (
              <>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Comparison completed against your verified evidence documents for {stats.latestReport.company}.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-[#A3E635]">{stats.latestReport.matchScore}%</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Fit Score</div>
                  </div>
                  <div className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-white">
                      {stats.latestReport.matchedCount} / {stats.latestReport.totalRequired}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Skills Proven</div>
                  </div>
                  <div className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-amber-400">{stats.latestReport.missingCount}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Missing Proof</div>
                  </div>
                </div>
              </>
            ) : (
              /* Empty state for Job Matching / Latest Analysis */
              <div className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-6 text-center space-y-3 my-2">
                <div className="w-10 h-10 rounded-full bg-[#161F2B] border border-[#233042] flex items-center justify-center mx-auto text-[#A3E635]">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">No job analysis available yet.</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Analyze a job circular to discover how your skills match the requirements.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#121820] border border-[#1B2430] rounded-xl p-2.5 text-center">
                    <div className="text-xs font-bold text-slate-400">Not available</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Fit Score</div>
                  </div>
                  <div className="bg-[#121820] border border-[#1B2430] rounded-xl p-2.5 text-center">
                    <div className="text-xs font-bold text-slate-400">0</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Skills Proven</div>
                  </div>
                  <div className="bg-[#121820] border border-[#1B2430] rounded-xl p-2.5 text-center">
                    <div className="text-xs font-bold text-slate-400">Not available</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Missing Proof</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[#1E293B] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {stats.latestReport ? `Analyzed on ${new Date(stats.latestReport.createdAt).toLocaleDateString()}` : 'No analyses performed'}
              </span>
            </div>
            {stats.latestReport ? (
              <Link
                to={`/reports?id=${stats.latestReport.id}`}
                className="text-xs font-bold text-[#A3E635] hover:text-[#BEF264] flex items-center gap-1"
              >
                <span>Open Skill-Gap Report</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/jobs"
                className="text-xs font-bold text-[#A3E635] hover:text-[#BEF264] flex items-center gap-1"
              >
                <span>Analyze a Job Circular</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
