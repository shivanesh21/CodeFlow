import Assessment from "../models/Assessment.js";
import Question from "../models/Question.js";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import StudentConceptPerformance from "../models/StudentConceptPerformance.js";
import { getMasteryLevel } from "../utils/concepts.js";
import { detectLearningGaps } from "../services/gapDetectionService.js";

// ============================================================
// Helper: Update StudentConceptPerformance after an attempt
// ============================================================
async function updateConceptPerformance(userId, conceptBreakdown, recentScoreMap) {
  const updates = Object.entries(conceptBreakdown).map(
    async ([concept, { correct, total }]) => {
      if (total === 0) return;

      const attemptAccuracy = Math.round((correct / total) * 100);
      const recentScore = recentScoreMap[concept] ?? attemptAccuracy;

      // Find existing record or create a placeholder
      let record = await StudentConceptPerformance.findOne({ userId, concept });

      if (!record) {
        record = new StudentConceptPerformance({
          userId,
          concept,
          totalAttempts: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          recentScores: [],
        });
      }

      // Update cumulative counters
      record.totalAttempts += total;
      record.correctAnswers += correct;
      record.wrongAnswers += total - correct;
      record.accuracy = Math.round(
        (record.correctAnswers / record.totalAttempts) * 100
      );

      // Update recent scores (keep last 5)
      record.recentScores.push(recentScore);
      if (record.recentScores.length > 5) record.recentScores.shift();

      // Recalculate average score from recentScores history
      record.averageScore = Math.round(
        record.recentScores.reduce((a, b) => a + b, 0) /
          record.recentScores.length
      );

      record.recentScore = recentScore;
      // Require sufficient evidence (totalAttempts) for mastery classification
      record.masteryLevel = getMasteryLevel(record.accuracy, record.totalAttempts);
      record.lastAttemptAt = new Date();

      // Trend: compare first half vs second half of recentScores
      if (record.recentScores.length >= 3) {
        const half = Math.floor(record.recentScores.length / 2);
        const older =
          record.recentScores.slice(0, half).reduce((a, b) => a + b, 0) / half;
        const newer =
          record.recentScores.slice(-half).reduce((a, b) => a + b, 0) / half;
        if (newer - older > 5) record.trend = "improving";
        else if (older - newer > 5) record.trend = "declining";
        else record.trend = "stable";
      } else {
        record.trend = "insufficient_data";
      }

      await record.save();
    }
  );

  await Promise.allSettled(updates);

  // Trigger Learning Gap Detection & update LearningGap records
  try {
    await detectLearningGaps(userId);
  } catch (err) {
    console.error("detectLearningGaps error:", err);
  }
}

// ============================================================
// GET /api/assessments
// List all active assessments (no questions populated)
// ============================================================
export const listAssessments = async (req, res) => {
  try {
    const { language, difficulty, concept } = req.query;

    const filter = { isActive: true };
    if (language) filter.programmingLanguage = language.toLowerCase();
    if (difficulty) filter.difficulty = difficulty.toLowerCase();
    if (concept) filter.concepts = concept;

    const assessments = await Assessment.find(filter)
      .select("-questions")
      .sort({ createdAt: -1 })
      .lean();

    // Attach attempt count for the logged-in user if authenticated
    let attemptMap = {};
    if (req.user) {
      const attempts = await AssessmentAttempt.find({
        userId: req.user._id,
        status: "completed",
      })
        .select("assessmentId")
        .lean();
      attempts.forEach((a) => {
        attemptMap[a.assessmentId.toString()] =
          (attemptMap[a.assessmentId.toString()] || 0) + 1;
      });
    }

    const enriched = assessments.map((a) => ({
      ...a,
      userAttempts: attemptMap[a._id.toString()] || 0,
    }));

    return res.status(200).json({ success: true, assessments: enriched });
  } catch (err) {
    console.error("listAssessments error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching assessments." });
  }
};

// ============================================================
// GET /api/assessments/:id
// Get a single assessment with its questions
// ============================================================
export const getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate("questions")
      .lean();

    if (!assessment || !assessment.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Assessment not found." });
    }

    // Strip correct answers from questions before sending to client
    const sanitizedQuestions = assessment.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      questionType: q.questionType,
      options: q.options,
      codeSnippet: q.codeSnippet,
      difficulty: q.difficulty,
      concepts: q.concepts,
      topic: q.topic,
      programmingLanguage: q.programmingLanguage,
      marks: q.marks,
      // correctAnswer and explanation are intentionally omitted
    }));

    return res.status(200).json({
      success: true,
      assessment: { ...assessment, questions: sanitizedQuestions },
    });
  } catch (err) {
    console.error("getAssessment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching assessment." });
  }
};

// ============================================================
// POST /api/assessments/:id/start
// Create a new in-progress attempt for the logged-in user
// ============================================================
export const startAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id).lean();

    if (!assessment || !assessment.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Assessment not found." });
    }

    // Check if user already has an in-progress attempt
    const existing = await AssessmentAttempt.findOne({
      userId: req.user._id,
      assessmentId: assessment._id,
      status: "in-progress",
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Resuming existing attempt.",
        attemptId: existing._id,
      });
    }

    const attempt = await AssessmentAttempt.create({
      userId: req.user._id,
      assessmentId: assessment._id,
      maxScore: assessment.totalMarks,
      status: "in-progress",
      startedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Assessment started.",
      attemptId: attempt._id,
    });
  } catch (err) {
    console.error("startAssessment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error starting assessment." });
  }
};

// ============================================================
// POST /api/assessments/:id/submit
// Score answers, update performance, mark attempt complete
// ============================================================
export const submitAssessment = async (req, res) => {
  try {
    const { attemptId, answers = [], totalTimeTakenMs = 0 } = req.body;
    // answers: [{ questionId, selectedAnswer, timeTakenMs }]

    if (!attemptId) {
      return res
        .status(400)
        .json({ success: false, message: "attemptId is required." });
    }

    // Load the attempt
    const attempt = await AssessmentAttempt.findOne({
      _id: attemptId,
      userId: req.user._id,
    });

    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: "Attempt not found." });
    }

    if (attempt.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This attempt has already been submitted.",
      });
    }

    // Load the full assessment with correct answers
    const assessment = await Assessment.findById(attempt.assessmentId)
      .populate("questions")
      .lean();

    if (!assessment) {
      return res
        .status(404)
        .json({ success: false, message: "Assessment not found." });
    }

    // Build a map of questionId -> Question for fast lookup
    const questionMap = {};
    assessment.questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    // Score each answer
    let totalScore = 0;
    const conceptBreakdown = {}; // { concept -> { correct, total } }
    const conceptRecentScores = {}; // { concept -> recentScore% }

    const scoredAnswers = answers.map((ans) => {
      const question = questionMap[ans.questionId];
      if (!question) {
        return {
          questionId: ans.questionId,
          selectedAnswer: ans.selectedAnswer || "",
          isCorrect: false,
          marksAwarded: 0,
          concepts: [],
          timeTakenMs: ans.timeTakenMs || 0,
        };
      }

      const isCorrect =
        (ans.selectedAnswer || "").trim().toLowerCase() ===
        question.correctAnswer.trim().toLowerCase();

      const marksAwarded = isCorrect ? question.marks : 0;
      totalScore += marksAwarded;

      // Track concept breakdown
      question.concepts.forEach((concept) => {
        if (!conceptBreakdown[concept]) {
          conceptBreakdown[concept] = { correct: 0, total: 0 };
        }
        conceptBreakdown[concept].total += 1;
        if (isCorrect) conceptBreakdown[concept].correct += 1;
      });

      return {
        questionId: question._id,
        selectedAnswer: ans.selectedAnswer || "",
        isCorrect,
        marksAwarded,
        concepts: question.concepts,
        timeTakenMs: ans.timeTakenMs || 0,
      };
    });

    // For any questions not answered, record them as wrong
    assessment.questions.forEach((q) => {
      const answered = answers.find(
        (a) => a.questionId === q._id.toString()
      );
      if (!answered) {
        q.concepts.forEach((concept) => {
          if (!conceptBreakdown[concept]) {
            conceptBreakdown[concept] = { correct: 0, total: 0 };
          }
          conceptBreakdown[concept].total += 1;
        });
      }
    });

    // Build recentScore per concept (0-100 scale)
    Object.entries(conceptBreakdown).forEach(([concept, { correct, total }]) => {
      conceptRecentScores[concept] =
        total > 0 ? Math.round((correct / total) * 100) : 0;
    });

    const maxScore = assessment.totalMarks || assessment.questions.length;
    const percentage =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Update attempt
    attempt.answers = scoredAnswers;
    attempt.totalScore = totalScore;
    attempt.maxScore = maxScore;
    attempt.percentage = percentage;
    attempt.conceptBreakdown = conceptBreakdown;
    attempt.completedAt = new Date();
    attempt.totalTimeTakenMs = totalTimeTakenMs;
    attempt.status = "completed";

    await attempt.save();

    // Asynchronously update concept performance (don't block response)
    updateConceptPerformance(
      req.user._id,
      conceptBreakdown,
      conceptRecentScores
    ).catch((err) =>
      console.error("Performance update error:", err)
    );

    // Build per-question result (with correct answers and explanations)
    const questionResults = scoredAnswers.map((ans) => {
      const q = questionMap[ans.questionId?.toString()];
      return {
        ...ans,
        correctAnswer: q?.correctAnswer,
        explanation: q?.explanation,
        questionText: q?.question,
        options: q?.options,
        codeSnippet: q?.codeSnippet,
        marks: q?.marks,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Assessment submitted successfully.",
      result: {
        attemptId: attempt._id,
        totalScore,
        maxScore,
        percentage,
        conceptBreakdown,
        questionResults,
        completedAt: attempt.completedAt,
        totalTimeTakenMs,
      },
    });
  } catch (err) {
    console.error("submitAssessment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error submitting assessment." });
  }
};

// ============================================================
// GET /api/assessments/attempts/mine
// Get authenticated user's attempt history
// ============================================================
export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await AssessmentAttempt.find({
      userId: req.user._id,
      status: "completed",
    })
      .populate("assessmentId", "title programmingLanguage difficulty icon")
      .sort({ completedAt: -1 })
      .lean();

    return res.status(200).json({ success: true, attempts });
  } catch (err) {
    console.error("getMyAttempts error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching attempts." });
  }
};

// ============================================================
// GET /api/assessments/attempts/:attemptId
// Get a single completed attempt with full detail
// ============================================================
export const getAttemptDetail = async (req, res) => {
  try {
    const attempt = await AssessmentAttempt.findOne({
      _id: req.params.attemptId,
      userId: req.user._id,
    })
      .populate("assessmentId", "title programmingLanguage difficulty")
      .lean();

    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: "Attempt not found." });
    }

    // Load full questions to include text, correct answers, explanations
    const assessment = await Assessment.findById(
      attempt.assessmentId._id
    )
      .populate("questions")
      .lean();

    const questionMap = {};
    assessment?.questions?.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    const enrichedAnswers = attempt.answers.map((ans) => {
      const q = questionMap[ans.questionId?.toString()];
      return {
        ...ans,
        questionText: q?.question,
        options: q?.options,
        codeSnippet: q?.codeSnippet,
        correctAnswer: q?.correctAnswer,
        explanation: q?.explanation,
        marks: q?.marks,
      };
    });

    return res.status(200).json({
      success: true,
      attempt: { ...attempt, answers: enrichedAnswers },
    });
  } catch (err) {
    console.error("getAttemptDetail error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching attempt." });
  }
};
