import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { getAssessments, getMyAttempts } from "../../services/assessmentService";
import "./AssessmentList.css";

const DIFFICULTY_FILTERS = ["all", "easy", "medium", "hard", "mixed"];

function AssessmentList() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [asmRes, attRes] = await Promise.allSettled([
        getAssessments(),
        getMyAttempts(),
      ]);

      if (asmRes.status === "fulfilled" && asmRes.value?.success) {
        setAssessments(asmRes.value.assessments || []);
      } else {
        setError("Failed to load assessments. Please try again.");
      }

      if (attRes.status === "fulfilled" && attRes.value?.success) {
        setMyAttempts(attRes.value.attempts || []);
      }
    } catch (err) {
      setError("Something went wrong. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    filter === "all"
      ? assessments
      : assessments.filter((a) => a.difficulty === filter);

  const getScoreClass = (pct) => {
    if (pct >= 75) return "score-high";
    if (pct >= 50) return "score-mid";
    return "score-low";
  };

  return (
    <MainLayout>
      <div className="assessments-page">
        {/* Header */}
        <header className="assessments-header">
          <div>
            <h1>📋 Assessments</h1>
            <p>
              Test your programming knowledge. Every attempt tracks your concept
              mastery and builds your personalized learning path.
            </p>
          </div>
          <Link to="/learning" className="btn-start-assessment">
            🧠 My Learning Path →
          </Link>
        </header>

        {/* Difficulty Filters */}
        <div className="assessment-filters">
          {DIFFICULTY_FILTERS.map((d) => (
            <button
              key={d}
              className={`filter-btn ${filter === d ? "active" : ""}`}
              onClick={() => setFilter(d)}
            >
              {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Assessments Grid */}
        {loading ? (
          <div className="assessments-loading">
            <span className="loading-icon">⚙️</span>
            <p>Loading assessments...</p>
          </div>
        ) : error ? (
          <div className="assessments-empty">
            <span className="empty-icon">⚠️</span>
            <h3>{error}</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="assessments-empty">
            <span className="empty-icon">🔍</span>
            <h3>No assessments found for this filter.</h3>
          </div>
        ) : (
          <div className="assessments-grid">
            {filtered.map((assessment) => (
              <AssessmentCard
                key={assessment._id}
                assessment={assessment}
                onStart={() =>
                  navigate(`/assessments/${assessment._id}/take`)
                }
              />
            ))}
          </div>
        )}

        {/* Recent Attempts */}
        {myAttempts.length > 0 && (
          <section className="attempts-section">
            <h2 className="section-title">📊 My Recent Attempts</h2>
            <div className="attempts-list">
              {myAttempts.slice(0, 5).map((attempt) => (
                <div className="attempt-row" key={attempt._id}>
                  <div>
                    <div className="attempt-title">
                      {attempt.assessmentId?.title || "Assessment"}
                    </div>
                    <div className="attempt-date">
                      {new Date(attempt.completedAt).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>
                  <div
                    className={`attempt-score ${getScoreClass(
                      attempt.percentage
                    )}`}
                  >
                    {attempt.percentage}%
                  </div>
                  <Link
                    to={`/assessments/result/${attempt._id}`}
                    className="btn-review"
                  >
                    Review →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
}

// ─── Assessment Card sub-component ─────────────────────────
function AssessmentCard({ assessment, onStart }) {
  const maxConcepts = 4;
  const displayConcepts = (assessment.concepts || []).slice(0, maxConcepts);
  const remaining = (assessment.concepts || []).length - maxConcepts;

  return (
    <div className="assessment-card" onClick={onStart} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onStart()}>
      <div className="card-icon-row">
        <div className="card-icon">{assessment.icon || "📝"}</div>
        <div className="card-meta">
          <h3 className="card-title">{assessment.title}</h3>
          <span className="card-lang">
            {assessment.programmingLanguage === "general"
              ? "Language Agnostic"
              : assessment.programmingLanguage?.toUpperCase()}
          </span>
        </div>
      </div>

      <p className="card-description">{assessment.description}</p>

      <div className="card-stats">
        <span className={`difficulty-badge difficulty-${assessment.difficulty}`}>
          {assessment.difficulty}
        </span>
        <span className="stat-pill">
          <span className="stat-pill-icon">❓</span>
          {assessment.questionCount ?? assessment.questions?.length ?? 0} Questions
        </span>
        <span className="stat-pill">
          <span className="stat-pill-icon">⏱</span>
          {assessment.timeLimit}m
        </span>
        <span className="stat-pill">
          <span className="stat-pill-icon">🏆</span>
          {assessment.totalMarks} pts
        </span>
      </div>

      {displayConcepts.length > 0 && (
        <div className="card-concepts">
          {displayConcepts.map((c) => (
            <span key={c} className="concept-chip">
              {c}
            </span>
          ))}
          {remaining > 0 && (
            <span className="concept-chip-more">+{remaining} more</span>
          )}
        </div>
      )}

      <div className="card-footer">
        <span
          className={`attempts-badge ${assessment.userAttempts > 0 ? "has-attempts" : ""}`}
        >
          {assessment.userAttempts > 0
            ? `✅ ${assessment.userAttempts} attempt${assessment.userAttempts > 1 ? "s" : ""}`
            : "⭕ Not attempted"}
        </span>
        <button
          className="btn-start-assessment"
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
        >
          {assessment.userAttempts > 0 ? "Retry →" : "Start →"}
        </button>
      </div>
    </div>
  );
}

export default AssessmentList;
