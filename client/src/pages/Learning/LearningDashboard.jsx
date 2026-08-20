import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import {
  getConceptPerformance,
  getPerformanceSummary,
  getLearningGaps,
  getAIRecommendations,
} from "../../services/performanceService";
import { useToast } from "../../context/ToastContext";
import "./LearningDashboard.css";

const CATEGORY_TABS = ["All", "Foundations", "Data Structures", "Algorithms"];

function LearningDashboard() {
  const { showToast } = useToast() || { showToast: () => {} };

  const [performances, setPerformances] = useState([]);
  const [summary, setSummary] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [perfRes, sumRes, gapsRes] = await Promise.allSettled([
        getConceptPerformance(),
        getPerformanceSummary(),
        getLearningGaps(),
      ]);

      if (perfRes.status === "fulfilled" && perfRes.value?.success) {
        setPerformances(perfRes.value.performances || []);
      }
      if (sumRes.status === "fulfilled" && sumRes.value?.success) {
        setSummary(sumRes.value.summary || null);
      }
      if (gapsRes.status === "fulfilled" && gapsRes.value?.success) {
        setGaps(gapsRes.value.gaps || []);
      }
    } catch (err) {
      console.error("fetchDashboard error:", err);
      if (showToast) showToast("Failed to load learning data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    try {
      setAiLoading(true);
      if (showToast) showToast("Gemini is analyzing your concept performance...", "info");
      const res = await getAIRecommendations();
      if (res.success && res.analysis) {
        setAiAnalysis(res.analysis);
        if (showToast) showToast("AI Learning Path generated!", "success");
      } else {
        throw new Error(res.message || "Failed to generate AI learning path.");
      }
    } catch (err) {
      console.error("AI Gen error:", err);
      if (showToast) showToast(err.message || "AI Analysis unavailable right now.", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const filteredPerformances =
    selectedCategory === "All"
      ? performances
      : performances.filter((p) => p.category === selectedCategory);

  const activeGaps = gaps.filter((g) => !g.resolved);

  const getMasteryClass = (level) => {
    const l = (level || "").toLowerCase();
    if (l === "mastered" || l === "expert" || l === "proficient") return "mastered";
    if (l === "good" || l === "competent") return "good";
    if (l === "developing") return "developing";
    return "weak";
  };

  return (
    <MainLayout>
      <div className="learning-page">
        {/* Header */}
        <header className="learning-header">
          <div>
            <h1>🧠 AI Adaptive Learning Hub</h1>
            <p>
              Concept-level mastery tracking, automated learning gap detection, and personalized AI learning paths.
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <Link to="/assessments" className="btn-ai-generate" style={{ textDecoration: "none" }}>
              📝 Take an Assessment →
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="empty-state-box">
            <p>Analyzing student performance records...</p>
          </div>
        ) : (
          <>
            {/* KPI Summary Grid */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon purple">🎯</div>
                <div className="kpi-content">
                  <span className="kpi-label">Concepts Tested</span>
                  <span className="kpi-value">
                    {summary?.totalConceptsAttempted || 0} / 19
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon blue">📊</div>
                <div className="kpi-content">
                  <span className="kpi-label">Overall Accuracy</span>
                  <span className="kpi-value">
                    {summary?.overallAccuracy || 0}%
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon green">🏆</div>
                <div className="kpi-content">
                  <span className="kpi-label">Mastered Concepts</span>
                  <span className="kpi-value">
                    {summary?.masteryDistribution?.Mastered || 0}
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon red">⚠️</div>
                <div className="kpi-content">
                  <span className="kpi-label">Learning Gaps</span>
                  <span className="kpi-value">{activeGaps.length}</span>
                </div>
              </div>
            </div>

            {/* AI-Powered Adaptive Learning Path (Gemini Integration) */}
            <section className="ai-section-banner">
              <div className="ai-header-row">
                <div className="ai-header-title">
                  <span style={{ fontSize: "1.8rem" }}>✨</span>
                  <div>
                    <h3>AI Personalized Learning Path</h3>
                    <span style={{ fontSize: "0.85rem", color: "#c4b5fd" }}>
                      Powered by Google Gemini AI
                    </span>
                  </div>
                </div>

                <button
                  className="btn-ai-generate"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                >
                  {aiLoading ? "Analyzing Performance..." : "Generate Learning Path ✨"}
                </button>
              </div>

              {aiAnalysis ? (
                <div className="ai-content-box">
                  {/* Summaries */}
                  <div className="ai-summary-grid">
                    <div className="ai-summary-item">
                      <h5>Overall Assessment</h5>
                      <p>{aiAnalysis.overallAssessment}</p>
                    </div>

                    <div className="ai-summary-item">
                      <h5>Strength Highlights</h5>
                      <p>{aiAnalysis.strengthSummary}</p>
                    </div>

                    <div className="ai-summary-item">
                      <h5>Priority Focus Areas</h5>
                      <p>{aiAnalysis.weaknessSummary}</p>
                    </div>
                  </div>

                  {/* Step-by-Step Learning Path */}
                  {aiAnalysis.learningPath && aiAnalysis.learningPath.length > 0 && (
                    <div style={{ marginTop: "1rem" }}>
                      <h4 style={{ color: "#f8fafc", margin: "0 0 1rem 0" }}>
                        Suggested Step-by-Step Curriculum
                      </h4>
                      <div className="path-timeline">
                        {aiAnalysis.learningPath.map((step, idx) => (
                          <div key={idx} className="path-step-card">
                            <div className="step-badge">{step.step || idx + 1}</div>
                            <div className="step-details">
                              <div className="step-title-row">
                                <span className="step-concept-name">{step.concept}</span>
                                {step.estimatedTime && (
                                  <span className="step-est-time">⏱ {step.estimatedTime}</span>
                                )}
                              </div>
                              <p className="step-action-text">{step.action}</p>
                              {step.resources && step.resources.length > 0 && (
                                <div style={{ fontSize: "0.8rem", color: "#818cf8", marginTop: "0.25rem" }}>
                                  📚 <strong>Resources: </strong> {step.resources.join(" • ")}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Encouragement & Next Assessment */}
                  {aiAnalysis.encouragement && (
                    <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "0.75rem", padding: "1rem", color: "#6ee7b7", fontSize: "0.9rem" }}>
                      💬 <strong>Coach Tip: </strong> {aiAnalysis.encouragement}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#cbd5e1" }}>
                  <p>
                    Click <strong>"Generate Learning Path"</strong> to have Gemini analyze your concept accuracy, recent mistakes, and create a tailored roadmap.
                  </p>
                </div>
              )}
            </section>

            {/* Learning Gap Detection Section */}
            <section className="dashboard-panel">
              <div className="panel-header">
                <h3 className="panel-title">
                  <span>🚨</span> Detected Learning Gaps ({activeGaps.length})
                </h3>
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  Rule-based threshold detection ({"<"} 50% accuracy or repeated mistakes)
                </span>
              </div>

              {activeGaps.length === 0 ? (
                <div className="empty-state-box">
                  <span style={{ fontSize: "2rem" }}>🎉</span>
                  <p>No critical learning gaps detected! Keep practicing to maintain high mastery.</p>
                </div>
              ) : (
                <div className="gaps-grid">
                  {activeGaps.map((gap) => (
                    <div
                      key={gap._id || gap.concept}
                      className={`gap-card severity-${gap.severity.toLowerCase()}`}
                    >
                      <div className="gap-card-top">
                        <h4 className="gap-concept-title">{gap.displayName || gap.concept}</h4>
                        <span className={`severity-pill ${gap.severity.toLowerCase()}`}>
                          {gap.severity} Priority
                        </span>
                      </div>

                      <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                        Accuracy: <strong style={{ color: "#f8fafc" }}>{gap.accuracy}%</strong> • Attempts: <strong>{gap.attemptCount}</strong>
                      </div>

                      <p className="gap-reason">{gap.reason}</p>

                      <div className="gap-action-box">
                        <strong>⚡ Recommended Action: </strong>
                        {gap.recommendedAction}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Concept Mastery Matrix */}
            <section className="dashboard-panel">
              <div className="panel-header">
                <h3 className="panel-title">
                  <span>📈</span> Concept Mastery Matrix
                </h3>

                {/* Category Filter Tabs */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {CATEGORY_TABS.map((cat) => (
                    <button
                      key={cat}
                      className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredPerformances.length === 0 ? (
                <div className="empty-state-box">
                  <p>No performance data available yet. Complete an assessment to see concept metrics.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="concept-table">
                    <thead>
                      <tr>
                        <th>Concept</th>
                        <th>Category</th>
                        <th>Accuracy</th>
                        <th>Score History</th>
                        <th>Mastery Level</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPerformances.map((p) => {
                        const mClass = getMasteryClass(p.masteryLevel);
                        return (
                          <tr key={p._id || p.concept}>
                            <td style={{ fontWeight: "600", color: "#f8fafc" }}>
                              {p.displayName || p.concept}
                            </td>
                            <td style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                              {p.category}
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ width: "80px", height: "6px", background: "rgba(148,163,184,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                                  <div
                                    style={{
                                      width: `${p.accuracy}%`,
                                      height: "100%",
                                      background: p.accuracy >= 75 ? "#10b981" : p.accuracy >= 50 ? "#f59e0b" : "#ef4444",
                                      borderRadius: "999px",
                                    }}
                                  ></div>
                                </div>
                                <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>
                                  {p.accuracy}%
                                </span>
                              </div>
                            </td>
                            <td style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                              {p.correctAnswers} / {p.totalAttempts} correct
                            </td>
                            <td>
                              <span className={`mastery-pill ${mClass}`}>
                                {p.masteryLevel}
                              </span>
                            </td>
                            <td>
                              <span className={`trend-badge ${p.trend || "stable"}`}>
                                {p.trend === "improving"
                                  ? "↗ Improving"
                                  : p.trend === "declining"
                                  ? "↘ Declining"
                                  : "➡️ Stable"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default LearningDashboard;
