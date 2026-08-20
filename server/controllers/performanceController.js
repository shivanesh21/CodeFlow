import StudentConceptPerformance from "../models/StudentConceptPerformance.js";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import LearningGap from "../models/LearningGap.js";
import {
  ALL_CONCEPTS,
  CONCEPT_TO_CATEGORY,
  CONCEPT_DISPLAY_NAMES,
} from "../utils/concepts.js";
import { detectLearningGaps } from "../services/gapDetectionService.js";

// ============================================================
// GET /api/performance/concepts
// Return all concept performance records for the logged-in user
// ============================================================
export const getConceptPerformance = async (req, res) => {
  try {
    const records = await StudentConceptPerformance.find({
      userId: req.user._id,
    })
      .sort({ accuracy: 1 }) // weakest first
      .lean();

    // Enrich with display names and category
    const enriched = records.map((r) => ({
      ...r,
      displayName: CONCEPT_DISPLAY_NAMES[r.concept] || r.concept,
      category: CONCEPT_TO_CATEGORY[r.concept] || "General",
    }));

    return res.status(200).json({
      success: true,
      performances: enriched,
      totalConcepts: ALL_CONCEPTS.length,
      masteredConcepts: records.filter((r) => r.masteryLevel === "Mastered" || r.masteryLevel === "Expert")
        .length,
    });
  } catch (err) {
    console.error("getConceptPerformance error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching performance." });
  }
};

// ============================================================
// GET /api/performance/gaps
// Return all detected learning gaps (unresolved & resolved)
// ============================================================
export const getLearningGaps = async (req, res) => {
  try {
    // Re-run detection to ensure freshest gap data
    await detectLearningGaps(req.user._id);

    const gaps = await LearningGap.find({ userId: req.user._id })
      .sort({ resolved: 1, severity: 1, accuracy: 1 })
      .lean();

    const enriched = gaps.map((g) => ({
      ...g,
      displayName: CONCEPT_DISPLAY_NAMES[g.concept] || g.concept,
      category: CONCEPT_TO_CATEGORY[g.concept] || "General",
    }));

    return res.status(200).json({
      success: true,
      gaps: enriched,
      activeGapCount: gaps.filter((g) => !g.resolved).length,
    });
  } catch (err) {
    console.error("getLearningGaps error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching learning gaps." });
  }
};

// ============================================================
// GET /api/performance/summary
// Summary: overall stats, weak/strong concepts, learning gaps, revision needed
// ============================================================
export const getPerformanceSummary = async (req, res) => {
  try {
    const records = await StudentConceptPerformance.find({
      userId: req.user._id,
    }).lean();

    // Fetch active learning gaps
    const learningGaps = await LearningGap.find({
      userId: req.user._id,
      resolved: false,
    })
      .sort({ severity: 1, accuracy: 1 })
      .lean();

    const enrichedGaps = learningGaps.map((g) => ({
      ...g,
      displayName: CONCEPT_DISPLAY_NAMES[g.concept] || g.concept,
      category: CONCEPT_TO_CATEGORY[g.concept] || "General",
    }));

    if (records.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          totalConceptsAttempted: 0,
          overallAccuracy: 0,
          weakConcepts: [],
          strongConcepts: [],
          improvingConcepts: [],
          decliningConcepts: [],
          revisionConcepts: [],
          masteryDistribution: {
            Weak: 0,
            Developing: 0,
            Good: 0,
            Mastered: 0,
          },
          learningGaps: [],
          recentActivity: [],
        },
      });
    }

    const totalAttempts = records.reduce((sum, r) => sum + r.totalAttempts, 0);
    const totalCorrect = records.reduce((sum, r) => sum + r.correctAnswers, 0);
    const overallAccuracy =
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    const weakConcepts = records
      .filter((r) => r.masteryLevel === "Weak" || r.accuracy < 50)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)
      .map((r) => ({
        concept: r.concept,
        displayName: CONCEPT_DISPLAY_NAMES[r.concept] || r.concept,
        accuracy: r.accuracy,
        masteryLevel: r.masteryLevel,
        totalAttempts: r.totalAttempts,
        wrongAnswers: r.wrongAnswers,
      }));

    const strongConcepts = records
      .filter(
        (r) =>
          r.masteryLevel === "Mastered" ||
          r.masteryLevel === "Good" ||
          r.masteryLevel === "Proficient" ||
          r.masteryLevel === "Expert" ||
          r.accuracy >= 65
      )
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5)
      .map((r) => ({
        concept: r.concept,
        displayName: CONCEPT_DISPLAY_NAMES[r.concept] || r.concept,
        accuracy: r.accuracy,
        masteryLevel: r.masteryLevel,
      }));

    const improvingConcepts = records
      .filter((r) => r.trend === "improving")
      .slice(0, 4)
      .map((r) => ({
        concept: r.concept,
        displayName: CONCEPT_DISPLAY_NAMES[r.concept] || r.concept,
        accuracy: r.accuracy,
        trend: r.trend,
      }));

    const decliningConcepts = records
      .filter((r) => r.trend === "declining")
      .slice(0, 4)
      .map((r) => ({
        concept: r.concept,
        displayName: CONCEPT_DISPLAY_NAMES[r.concept] || r.concept,
        accuracy: r.accuracy,
        trend: r.trend,
      }));

    // Concepts requiring revision: weak concepts or concepts with declining trends
    const revisionConcepts = records
      .filter((r) => r.accuracy < 60 || r.trend === "declining" || r.wrongAnswers >= 3)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 6)
      .map((r) => ({
        concept: r.concept,
        displayName: CONCEPT_DISPLAY_NAMES[r.concept] || r.concept,
        accuracy: r.accuracy,
        wrongAnswers: r.wrongAnswers,
        trend: r.trend,
      }));

    const masteryDistribution = {
      Weak: 0,
      Developing: 0,
      Good: 0,
      Mastered: 0,
    };
    records.forEach((r) => {
      const level =
        r.masteryLevel === "Novice"
          ? "Weak"
          : r.masteryLevel === "Competent"
          ? "Good"
          : r.masteryLevel === "Proficient" || r.masteryLevel === "Expert"
          ? "Mastered"
          : r.masteryLevel;
      if (masteryDistribution[level] !== undefined) {
        masteryDistribution[level]++;
      }
    });

    // Recent 5 attempts across all assessments
    const recentAttempts = await AssessmentAttempt.find({
      userId: req.user._id,
      status: "completed",
    })
      .populate("assessmentId", "title")
      .sort({ completedAt: -1 })
      .limit(5)
      .lean();

    const recentActivity = recentAttempts.map((a) => ({
      assessmentTitle: a.assessmentId?.title || "Unknown",
      percentage: a.percentage,
      completedAt: a.completedAt,
      totalScore: a.totalScore,
      maxScore: a.maxScore,
    }));

    return res.status(200).json({
      success: true,
      summary: {
        totalConceptsAttempted: records.length,
        overallAccuracy,
        weakConcepts,
        strongConcepts,
        improvingConcepts,
        decliningConcepts,
        revisionConcepts,
        masteryDistribution,
        learningGaps: enrichedGaps,
        recentActivity,
      },
    });
  } catch (err) {
    console.error("getPerformanceSummary error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching summary." });
  }
};

