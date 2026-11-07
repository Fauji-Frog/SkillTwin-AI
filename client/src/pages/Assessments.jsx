import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';

export default function Assessments() {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssessments();
  }, []);

  async function loadAssessments() {
    setLoading(true);
    try {
      const res = await api.get('/assessments');
      if (res.success && res.data) {
        setAssessments(res.data);
      }
    } catch (e) {
      setError('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }

  async function startQuiz(assessmentId) {
    setLoading(true);
    setError('');
    setQuizResult(null);
    setUserAnswers({});

    try {
      const res = await api.get(`/assessments/${assessmentId}`);
      if (res.success && res.data) {
        setActiveQuiz(res.data);
      }
    } catch (err) {
      setError('Could not retrieve quiz questions');
    } finally {
      setLoading(false);
    }
  }

  const handleSelectOption = (questionIndex, optionIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  async function handleSubmitQuiz(e) {
    e.preventDefault();
    if (!activeQuiz) return;

    // Verify all questions answered
    const totalQuestions = activeQuiz.questions?.length || 0;
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < totalQuestions) {
      setError(`Please answer all ${totalQuestions} questions before submitting.`);
      return;
    }

    setSubmitting(true);
    setError('');

    // Format array of answers
    const answersArray = activeQuiz.questions.map((_, idx) => userAnswers[idx]);

    try {
      const res = await api.post(`/assessments/${activeQuiz.id}/submit`, {
        answers: answersArray
      });
      if (res.success && res.data) {
        setQuizResult(res.data);
      }
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Award className="w-6 h-6 text-[#A3E635]" />
          <span>Skill Assessments &amp; Proficiency Estimation</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Take standard multiple-choice assessments to verify your skills and compute estimated proficiency levels (FR-14 to FR-16).
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quiz Catalog Cards (when no quiz is active) */}
      {!activeQuiz && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assessments.map((item) => (
            <div
              key={item.id || item._id}
              className="bg-[#121822] border border-[#1E293B] rounded-2xl p-5 hover:border-[#2D3F54] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#182619] border border-[#2E4A28] text-[#A3E635]">
                    {item.skillName}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {item.questionCount} Questions
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Evaluates core conceptual and practical knowledge. Passing advances your profile proficiency rating.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-[#1E293B] flex items-center justify-between">
                <span className="text-[10px] text-slate-500">1 pt / question</span>
                <button
                  onClick={() => startQuiz(item.id || item._id)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#A3E635] text-black font-bold text-xs hover:bg-[#BEF264] transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(163,230,53,0.25)]"
                >
                  <span>Start Quiz</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Quiz View */}
      {activeQuiz && !quizResult && (
        <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#182619] text-[#A3E635] border border-[#2E4A28]">
                {activeQuiz.skillName}
              </span>
              <h2 className="text-lg font-black text-white mt-1">{activeQuiz.title}</h2>
              <div className="text-xs text-slate-400">{activeQuiz.scoringRule}</div>
            </div>

            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitQuiz} className="space-y-6">
            {activeQuiz.questions?.map((q, qIdx) => (
              <div
                key={qIdx}
                className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-5 space-y-3"
              >
                <div className="text-xs font-bold text-white leading-relaxed flex items-start gap-2">
                  <span className="text-[#A3E635] font-mono">Q{qIdx + 1}.</span>
                  <span>{q.text}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options?.map((opt, optIdx) => {
                    const isSelected = userAnswers[qIdx] === optIdx;
                    return (
                      <button
                        type="button"
                        key={optIdx}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#182619] border-[#2E4A28] text-[#A3E635] shadow-[0_0_12px_rgba(163,230,53,0.15)]'
                            : 'bg-[#121820] border-[#1C2533] text-slate-300 hover:border-[#2D3F54]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${
                              isSelected
                                ? 'border-[#A3E635] bg-[#A3E635] text-black font-bold'
                                : 'border-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="py-3 px-8 rounded-xl bg-[#A3E635] text-black font-bold text-xs hover:bg-[#BEF264] transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)] disabled:opacity-50"
              >
                {submitting ? 'Scoring Assessment...' : 'Submit & Calculate Proficiency'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quiz Result View (FR-15, FR-16) */}
      {quizResult && (
        <div className="bg-[#121822] border border-[#1E293B] rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Result Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                ASSESSMENT SCORE REPORT
              </span>
              <h2 className="text-2xl font-black text-white mt-0.5">
                {quizResult.skillName} Results
              </h2>
              <div className="text-xs text-slate-400 mt-1">
                Your profile competency rating has been automatically updated with source{' '}
                <span className="text-[#A3E635] font-semibold">estimated</span>.
              </div>
            </div>

            <div className="flex items-center gap-5 bg-[#0E1318] border border-[#1E293B] px-6 py-4 rounded-2xl">
              <div>
                <div className="text-3xl font-black text-white">
                  {quizResult.score} / {quizResult.maxScore}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                  Accuracy: {quizResult.percent}%
                </div>
              </div>

              <div className="h-10 w-[1px] bg-[#1E293B]" />

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Estimated Level
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    quizResult.estimatedLevel === 'Advanced'
                      ? 'bg-[#182619] text-[#A3E635] border border-[#2E4A28]'
                      : quizResult.estimatedLevel === 'Intermediate'
                      ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {quizResult.estimatedLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Question Breakdown Feedback (FR-15) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Answer Review &amp; Explanations
            </h3>

            {quizResult.feedback?.map((f, idx) => (
              <div
                key={idx}
                className="bg-[#0E1318] border border-[#1E293B] rounded-xl p-4 flex items-start gap-3"
              >
                <div className="mt-0.5">
                  {f.correct ? (
                    <CheckCircle2 className="w-4 h-4 text-[#A3E635]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Question {idx + 1}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        f.correct
                          ? 'bg-[#182619] text-[#A3E635]'
                          : 'bg-rose-500/10 text-rose-300'
                      }`}
                    >
                      {f.correct ? 'Correct (+1 pt)' : 'Incorrect (0 pt)'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {f.explanation}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#1E293B]">
            <button
              onClick={() => {
                setActiveQuiz(null);
                setQuizResult(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#141B24] border border-[#202B38] text-xs font-semibold text-slate-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Take Another Assessment</span>
            </button>

            <button
              onClick={() => startQuiz(activeQuiz.id)}
              className="px-4 py-2 rounded-xl bg-[#A3E635] text-black font-bold text-xs hover:bg-[#BEF264]"
            >
              Retake This Quiz (FR-20)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
