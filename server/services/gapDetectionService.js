import StudentConceptPerformance from "../models/StudentConceptPerformance.js";
import LearningGap from "../models/LearningGap.js";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import { CONCEPT_DISPLAY_NAMES } from "../utils/concepts.js";

// ============================================================
// Gap Detection Recommendation & Reason Generator
// ============================================================
function generateGapDetails(concept, accuracy, totalAttempts, wrongAnswers, trend, recentScores) {
  const displayName = CONCEPT_DISPLAY_NAMES[concept] || concept;
  let severity = "LOW";
  let reason = "";
  let recommendedAction = "";

  const recentAvg =
    recentScores.length > 0
      ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length)
      : accuracy;

  if (accuracy < 40 && totalAttempts >= 2) {
    severity = "HIGH";
    reason = `Critical knowledge gap in ${displayName}: Accuracy is ${accuracy}% with ${wrongAnswers} incorrect answers across ${totalAttempts} attempts.`;
    recommendedAction = `Prioritize revision of ${displayName} fundamentals. Use CodeFlow Visualizer to trace step-by-step execution before taking practice assessments.`;
  } else if (accuracy < 50) {
    severity = "HIGH";
    reason = `Low accuracy (${accuracy}%) in ${displayName}. Repeated mistakes detected across ${totalAttempts} question attempts.`;
    recommendedAction = `Review core syntax and mechanics for ${displayName}. Attempt focused practice problems in the code editor.`;
  } else if (trend === "declining" || (recentScores.length >= 2 && recentAvg < 50)) {
    severity = "MEDIUM";
    reason = `Declining performance in ${displayName}: Recent score average (${recentAvg}%) is lower than past performance.`;
    recommendedAction = `Revisit recent test questions in ${displayName} to identify conceptual confusion and reinforce key patterns.`;
  } else if (accuracy < 65) {
    severity = "MEDIUM";
    reason = `${displayName} is currently in 'Developing' state (${accuracy}% accuracy). Inconsistent retention across attempts.`;
    recommendedAction = `Practice intermediate-level problems covering ${displayName} to build mastery toward 80%+ accuracy.`;
  } else {
    severity = "LOW";
    reason = `Occasional mistakes in ${displayName} (${accuracy}% accuracy, ${wrongAnswers} wrong answers).`;
    recommendedAction = `Quick refresher on edge cases and complex scenarios involving ${displayName}.`;
  }

  return { severity, reason, recommendedAction };
}

// ============================================================
// Detect and Sync Learning Gaps for a User
// ============================================================
export async function detectLearningGaps(userId) {
  const records = await StudentConceptPerformance.find({ userId });
  const detectedGaps = [];

  for (const record of records) {
    const { concept, accuracy, totalAttempts, wrongAnswers, trend, recentScores, masteryLevel } = record;

    // A gap exists if:
    // 1. Mastery is Weak (accuracy < 50%)
    // 2. Mastery is Developing (accuracy < 65%) with at least 2 attempts
    // 3. Trend is declining
    const isGap =
      masteryLevel === "Weak" ||
      (masteryLevel === "Developing" && totalAttempts >= 2) ||
      (trend === "declining" && accuracy < 75);

    if (isGap) {
      const { severity, reason, recommendedAction } = generateGapDetails(
        concept,
        accuracy,
        totalAttempts,
        wrongAnswers,
        trend,
        recentScores
      );

      // Upsert learning gap record
      const gap = await LearningGap.findOneAndUpdate(
        { userId, concept },
        {
          $set: {
            severity,
            accuracy,
            reason,
            attemptCount: totalAttempts,
            recommendedAction,
            detectedAt: new Date(),
            resolved: false,
            resolvedAt: null,
          },
        },
        { upsert: true, returnDocument: "after" }
      );

      detectedGaps.push(gap);
    } else if (masteryLevel === "Good" || masteryLevel === "Mastered") {
      // If student has reached Good or Mastered, mark existing gap as resolved
      await LearningGap.findOneAndUpdate(
        { userId, concept, resolved: false },
        {
          $set: {
            resolved: true,
            resolvedAt: new Date(),
            accuracy,
          },
        }
      );
    }
  }

  return detectedGaps;
}
