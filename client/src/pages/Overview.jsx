import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/http';
import {
  Plus,
  Bookmark,
  FileCheck2,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const Overview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    evidenceCoverage: 62,
    recordedSkillsCount: 8,
    processedEvidenceCount: 14,
    reportsGeneratedCount: 3,
    skillsToStrengthen: [],
    latestAnalysis: {
      jobTitle: 'Backend Developer',
      company: 'Industry Employer',
      matchScore: 78,
      status: 'ACTIVE'
    },
    metrics: {
      coverageChange: '+8% vs. last month',
      skillsChange: '+2 this month',
      evidenceChange: '+4 this month',
      reportsSubtitle: '1 active job analysis'
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard');
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.warn('Dashboard stats fallback:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  // Format today's date like "TUESDAY · NOVEMBER 10, 2026"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase().replace(',', ' ·');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            {formattedDate}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Good morning, {firstName}.
          </h1>
          <p className="text-sm md:text-base text-slate-400 mt-1">
            Here is how confidently you can prove your skills today.
          </p>
        </div>

        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#9FE870] hover:bg-[#8EDB5E] text-[#0B0F15] font-bold text-sm transition shadow-lg shadow-[#9FE870]/10 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Analyze a job circular</span>
        </button>
      </div>

      {/* 4 Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Evidence Coverage */}
        <div className="p-5 rounded-2xl bg-[#131B26] border border-[#1E293B] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">EVIDENCE COVERAGE</span>
            <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9FE870]"></span>
            </div>
          </div>
          <div className="my-4 flex items-center justify-between">
            <div className="text-4xl font-extrabold text-white tracking-tight">
              {stats.evidenceCoverage}%
            </div>
            {/* Circular mini gauge */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="#1E293B"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="#9FE870"
                  strokeWidth="3.5"
                  strokeDasharray="113"
                  strokeDashoffset={113 - (113 * stats.evidenceCoverage) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-slate-300">
                {stats.evidenceCoverage}%
              </span>
            </div>
          </div>
          <div className="text-xs font-medium text-[#9FE870] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats.metrics?.coverageChange || '+8% vs. last month'}</span>
          </div>
        </div>

        {/* Card 2: Recorded Skills */}
        <div className="p-5 rounded-2xl bg-[#131B26] border border-[#1E293B] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">RECORDED SKILLS</span>
            <Bookmark className="w-4 h-4 text-[#9FE870]" />
          </div>
          <div className="my-4">
            <div className="text-4xl font-extrabold text-white tracking-tight">
              {String(stats.recordedSkillsCount).padStart(2, '0')}
            </div>
          </div>
          <div className="text-xs font-medium text-[#9FE870]">
            {stats.metrics?.skillsChange || '+2 this month'}
          </div>
        </div>

        {/* Card 3: Processed Evidence */}
        <div className="p-5 rounded-2xl bg-[#131B26] border border-[#1E293B] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">PROCESSED EVIDENCE</span>
            <FileCheck2 className="w-4 h-4 text-[#9FE870]" />
          </div>
          <div className="my-4">
            <div className="text-4xl font-extrabold text-white tracking-tight">
              {String(stats.processedEvidenceCount).padStart(2, '0')}
            </div>
          </div>
          <div className="text-xs font-medium text-[#9FE870]">
            {stats.metrics?.evidenceChange || '+4 this month'}
          </div>
        </div>

        {/* Card 4: Reports Generated */}
        <div className="p-5 rounded-2xl bg-[#131B26] border border-[#1E293B] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">REPORTS GENERATED</span>
            <BarChart3 className="w-4 h-4 text-[#9FE870]" />
          </div>
          <div className="my-4">
            <div className="text-4xl font-extrabold text-white tracking-tight">
              {String(stats.reportsGeneratedCount).padStart(2, '0')}
            </div>
          </div>
          <div className="text-xs font-medium text-slate-400">
            {stats.metrics?.reportsSubtitle || '1 active job analysis'}
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Skills to strengthen */}
        <div className="p-6 rounded-2xl bg-[#131B26] border border-[#1E293B] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">YOUR SIGNAL</span>
                <h3 className="text-lg font-bold text-white">Skills to strengthen</h3>
              </div>
              <button
                onClick={() => navigate('/skills')}
                className="text-xs font-semibold text-[#9FE870] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {stats.skillsToStrengthen && stats.skillsToStrengthen.length > 0 ? (
                stats.skillsToStrengthen.map((skill, idx) => (
                  <div
                    key={skill.id || idx}
                    className="p-3 rounded-xl bg-[#0B0F15] border border-[#1E293B] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{skill.name}</div>
                      <div className="text-[11px] text-slate-400">{skill.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/40 border border-amber-800/40 text-amber-300">
                        {skill.currentLevel || 'Beginner'}
                      </span>
                      {!skill.hasEvidence && (
                        <span className="text-[10px] text-slate-400">Proof needed</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-[#0B0F15] border border-[#1E293B] text-center text-xs text-slate-400">
                  Add skills in <span className="text-[#9FE870] font-semibold">My skills</span> to view personalized recommendations.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Latest Analysis */}
        <div className="p-6 rounded-2xl bg-[#131B26] border border-[#1E293B] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">LATEST ANALYSIS</span>
                <h3 className="text-lg font-bold text-white">
                  {stats.latestAnalysis?.jobTitle || 'Backend Developer'}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1C2B1D] border border-[#274029] text-[#9FE870]">
                ACTIVE
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F15] border border-[#1E293B] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Employer / Source</div>
                  <div className="text-sm font-semibold text-white">{stats.latestAnalysis?.company || 'Industry Employer'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Match Readiness</div>
                  <div className="text-lg font-extrabold text-[#9FE870]">
                    {stats.latestAnalysis?.matchScore || 78}%
                  </div>
                </div>
              </div>

              <div className="w-full bg-[#1E293B] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#9FE870] h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.latestAnalysis?.matchScore || 78}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => navigate('/reports')}
                  className="text-xs font-semibold text-[#9FE870] hover:underline"
                >
                  View full gap breakdown &rarr;
                </button>
                <button
                  onClick={() => navigate('/evidence')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Upload additional evidence
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
