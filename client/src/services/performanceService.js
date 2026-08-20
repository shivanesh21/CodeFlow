import API from "./api.js";

// ============================================================
// Performance Service — API calls for learning analytics
// ============================================================

/**
 * Fetch all concept performance records for the logged-in user.
 * Returns: { performances: [...], totalConcepts, masteredConcepts }
 */
export const getConceptPerformance = async () => {
  const res = await API.get("/performance/concepts");
  return res.data;
};

/**
 * Fetch summary stats: weak/strong concepts, mastery distribution, recent activity, gaps.
 */
export const getPerformanceSummary = async () => {
  const res = await API.get("/performance/summary");
  return res.data;
};

/**
 * Fetch detected learning gaps with severity, reason, and recommended actions.
 */
export const getLearningGaps = async () => {
  const res = await API.get("/performance/gaps");
  return res.data;
};

/**
 * Ask Gemini AI to analyze this user's performance and return a personalized learning path.
 */
export const getAIRecommendations = async () => {
  const res = await API.post("/ai/analyze-performance");
  return res.data;
};

