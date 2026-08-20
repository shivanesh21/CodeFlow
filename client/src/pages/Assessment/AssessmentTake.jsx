import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAssessment,
  startAttempt,
  submitAttempt,
} from "../../services/assessmentService";
import { useToast } from "../../context/ToastContext";
import "./AssessmentTake.css";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

function AssessmentTake() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast() || { showToast: () => {} };

  const [assessment, setAssessment] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedAnswer }
  const [questionTimes, setQuestionTimes] = useState({}); // { [questionId]: timeMs }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const startTimeRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());

  // Load Assessment & Start Attempt
  useEffect(() => {
    initTest();
  }, [id]);

  const initTest = async () => {
    try {
      setLoading(true);
      const [asmData, startData] = await Promise.all([
        getAssessment(id),
        startAttempt(id),
      ]);

      if (asmData.success && asmData.assessment) {
        setAssessment(asmData.assessment);
        const limitSeconds = (asmData.assessment.timeLimit || 30) * 60;
        setTimeLeft(limitSeconds);
      }

      if (startData.success && startData.attemptId) {
        setAttemptId(startData.attemptId);
      }

      startTimeRef.current = Date.now();
      questionStartRef.current = Date.now();
    } catch (err) {
      console.error("initTest error:", err);
      if (showToast) showToast("Failed to initialize assessment.", "error");
      navigate("/assessments");
    } finally {
      setLoading(false);
    }
  };

  // Timer Countdown
  useEffect(() => {
    if (loading || submitting || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitting, timeLeft]);

  // Track time spent on previous question before switching
  const recordCurrentQuestionTime = () => {
    if (!assessment?.questions?.[currentIndex]) return;
    const qId = assessment.questions[currentIndex]._id;
    const elapsed = Date.now() - questionStartRef.current;
    setQuestionTimes((prev) => ({
      ...prev,
      [qId]: (prev[qId] || 0) + elapsed,
    }));
    questionStartRef.current = Date.now();
  };

  const handleSelectOption = (optionText) => {
    const qId = assessment.questions[currentIndex]._id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionText,
    }));
  };

  const handleNext = () => {
    recordCurrentQuestionTime();
    if (currentIndex < (assessment?.questions?.length || 0) - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    recordCurrentQuestionTime();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (index) => {
    recordCurrentQuestionTime();
    setCurrentIndex(index);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = assessment?.questions?.length || 0;

    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    await doSubmit();
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    if (showToast) showToast("Time is up! Submitting answers automatically...", "info");
    await doSubmit();
  };

  const doSubmit = async () => {
    try {
      setSubmitting(true);
      recordCurrentQuestionTime();

      const totalTimeTakenMs = Date.now() - startTimeRef.current;

      const formattedAnswers = assessment.questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] || "",
        timeTakenMs: questionTimes[q._id] || 0,
      }));

      const res = await submitAttempt(id, {
        attemptId,
        answers: formattedAnswers,
        totalTimeTakenMs,
      });

      if (res.success && res.result?.attemptId) {
        if (showToast) showToast("Assessment submitted successfully!", "success");
        navigate(`/assessments/result/${res.result.attemptId}`);
      } else {
        throw new Error(res.message || "Failed to submit attempt.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      if (showToast) showToast(err.message || "Error submitting test.", "error");
      setSubmitting(false);
    }
  };

  // Format Timer String
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading || !assessment) {
    return (
      <div className="take-page" style={{ justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "#94a3b8" }}>Loading assessment environment...</p>
      </div>
    );
  }

  const currentQ = assessment.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalCount = assessment.questions.length;
  const isTimeWarning = timeLeft < 300; // less than 5 minutes

  return (
    <div className="take-page">
      {/* Top Bar */}
      <header className="take-topbar">
        <div className="take-title-group">
          <h2>{assessment.title}</h2>
          <span className="take-badge">
            {assessment.programmingLanguage === "general"
              ? "All Languages"
              : assessment.programmingLanguage}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className={`take-timer ${isTimeWarning ? "warning" : ""}`}>
            <span>⏱</span>
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            className="btn-submit-test"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Test ✓"}
          </button>
        </div>
      </header>

      {/* Main Test Layout */}
      <main className="take-layout">
        {/* Question Area */}
        <div className="question-card">
          <div className="question-header">
            <span className="question-index">
              Question {currentIndex + 1} of {totalCount} ({currentQ.marks} {currentQ.marks === 1 ? "mark" : "marks"})
            </span>
            <div className="question-concepts-row">
              {currentQ.concepts?.map((c) => (
                <span key={c} className="question-concept-tag">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <h3 className="question-text">{currentQ.question}</h3>

          {/* Optional Code Snippet */}
          {currentQ.codeSnippet && (
            <pre className="code-snippet-box">
              <code>{currentQ.codeSnippet}</code>
            </pre>
          )}

          {/* Options */}
          <div className="options-list">
            {currentQ.options?.map((opt, idx) => {
              const isSelected = answers[currentQ._id] === opt;
              const letter = OPTION_LETTERS[idx] || String(idx + 1);

              return (
                <div
                  key={idx}
                  className={`option-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectOption(opt)}
                >
                  <div className="option-letter">{letter}</div>
                  <span className="option-text">{opt}</span>
                </div>
              );
            })}
          </div>

          {/* Nav Actions */}
          <div className="question-nav-actions">
            <button
              className="btn-nav"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>

            {currentIndex < totalCount - 1 ? (
              <button className="btn-nav" onClick={handleNext}>
                Next →
              </button>
            ) : (
              <button className="btn-submit-test" onClick={handleSubmit}>
                Review & Submit ✓
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Navigator */}
        <aside className="take-sidebar">
          <div className="nav-card">
            <h4>Question Navigator</h4>
            <div className="grid-numbers">
              {assessment.questions.map((q, idx) => {
                const isAnswered = !!answers[q._id];
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q._id}
                    className={`grid-num-btn ${isAnswered ? "answered" : ""} ${
                      isCurrent ? "active" : ""
                    }`}
                    onClick={() => handleJumpToQuestion(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="legend-row">
              <div className="legend-item">
                <span className="legend-dot answered"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot unanswered"></span>
                <span>Unanswered ({totalCount - answeredCount})</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot current"></span>
                <span>Current Question</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default AssessmentTake;
