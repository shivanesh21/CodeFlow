import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { getAttemptDetail } from "../../services/assessmentService";
import "./AssessmentResult.css";

function AssessmentResult() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const res = await getAttemptDetail(attemptId);
      if (res.success && res.attempt) {
        setAttempt(res.attempt);
      } else {
        setError("Could not load assessment results.");
      }
    } catch (err) {
      console.error("fetchResult error:", err);
      setError("Error loading results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="result-page" style={{ textAlign: "center", padding: "5rem 0" }}>
          <p style={{ color: "#94a3b8" }}>Calculating your performance & updating concept mastery...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !attempt) {
    return (
      <MainLayout>
        <div className="result-page" style={{ textAlign: "center", padding: "5rem 0" }}>
          <h2>{error || "Result not found."}</h2>
          <Link to="/assessments" className="btn-primary-action" style={{ marginTop: "1rem" }}>
            ← Back to Assessments
          </Link>
        </div>
      </MainLayout>
    );
  }

  const {
    percentage,
    totalScore,
    maxScore,
    answers = [],
    conceptBreakdown = {},
    assessmentId,
    totalTimeTakenMs = 0,
  } = attempt;

  const totalMinutes = Math.round(totalTimeTakenMs / 60000);
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = answers.length - correctCount;

  const getScoreCircleClass = () => {
    if (percentage >= 75) return "";
    if (percentage >= 50) return "mid";
    return "low";
  };

  const getProgressClass = (pct) => {
    if (pct >= 75) return "high";
    if (pct >= 50) return "mid";
    return "low";
  };

  return (
    <MainLayout>
      <div className="result-page">
        {/* Header */}
        <div className="result-header">
          <div>
            <h1>📊 Assessment Results</h1>
            <p style={{ color: "#94a3b8", margin: "0.25rem 0 0 0" }}>
              {assessmentId?.title || "Assessment"}
            </p>
          </div>

          <div className="result-actions">
            <Link to="/learning" className="btn-primary-action">
              🧠 View My Learning Path & Gaps →
            </Link>
            <Link to="/assessments" className="btn-secondary-action">
              📋 All Assessments
            </Link>
          </div>
        </div>

        {/* Score Hero Card */}
        <div className="score-hero-card">
          <div className="score-circle-container">
            <div className={`score-circle ${getScoreCircleClass()}`}>
              <span className="score-pct">{percentage}%</span>
              <span className="score-label">Accuracy</span>
            </div>
          </div>

          <div className="score-details-grid">
            <div className="score-stat-box">
              <span className="stat-box-title">Score</span>
              <span className="stat-box-value">
                {totalScore} / {maxScore}
              </span>
            </div>

            <div className="score-stat-box">
              <span className="stat-box-title">Correct Answers</span>
              <span className="stat-box-value" style={{ color: "#10b981" }}>
                {correctCount}
              </span>
            </div>

            <div className="score-stat-box">
              <span className="stat-box-title">Incorrect</span>
              <span className="stat-box-value" style={{ color: "#ef4444" }}>
                {wrongCount}
              </span>
            </div>

            <div className="score-stat-box">
              <span className="stat-box-title">Time Taken</span>
              <span className="stat-box-value">
                {totalMinutes > 0 ? `${totalMinutes} min` : "< 1 min"}
              </span>
            </div>
          </div>
        </div>

        {/* Concept Performance Breakdown */}
        {Object.keys(conceptBreakdown).length > 0 && (
          <div className="section-card">
            <h3>Concept Performance Breakdown</h3>
            <div className="concept-bars-grid">
              {Object.entries(conceptBreakdown).map(([concept, data]) => {
                const pct =
                  data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                return (
                  <div key={concept} className="concept-bar-item">
                    <div className="concept-bar-header">
                      <span className="concept-name">{concept}</span>
                      <span className="concept-score-fraction">
                        {data.correct}/{data.total} ({pct}%)
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${getProgressClass(pct)}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Question Review */}
        <div className="section-card">
          <h3>Question by Question Review</h3>
          {answers.map((ans, idx) => {
            const isCorrect = ans.isCorrect;

            return (
              <div
                key={ans.questionId || idx}
                className={`review-item ${isCorrect ? "correct" : "wrong"}`}
              >
                <div className="review-header">
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: "600" }}>
                    Question {idx + 1}
                  </span>
                  <span
                    className={`review-status-badge ${
                      isCorrect ? "correct" : "wrong"
                    }`}
                  >
                    {isCorrect ? "✓ Correct (+1 pt)" : "✗ Incorrect (0 pts)"}
                  </span>
                </div>

                <h4 className="review-question-text">{ans.questionText}</h4>

                {ans.codeSnippet && (
                  <pre className="code-snippet-box">
                    <code>{ans.codeSnippet}</code>
                  </pre>
                )}

                <div className="review-answers-box">
                  <div
                    className={`answer-row ${
                      !isCorrect ? "user-wrong" : "correct-ans"
                    }`}
                  >
                    <span className="label">Your Answer:</span>
                    <span className="value">
                      {ans.selectedAnswer || "No answer provided"}
                    </span>
                  </div>

                  {!isCorrect && (
                    <div className="answer-row correct-ans">
                      <span className="label">Correct Answer:</span>
                      <span className="value">{ans.correctAnswer}</span>
                    </div>
                  )}
                </div>

                {ans.explanation && (
                  <div className="explanation-box">
                    <strong>💡 Explanation: </strong>
                    {ans.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}

export default AssessmentResult;
