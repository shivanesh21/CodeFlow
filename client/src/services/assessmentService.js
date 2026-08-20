import API from "./api.js";

// ============================================================
// Assessment Service — API calls for quiz/assessment module
// ============================================================

/**
 * Fetch all active assessments (optionally filtered).
 * @param {{ language?: string, difficulty?: string, concept?: string }} params
 */
export const getAssessments = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await API.get(`/assessments${query ? `?${query}` : ""}`);
  return res.data;
};

/**
 * Fetch a single assessment by ID (questions without correct answers).
 * @param {string} id
 */
export const getAssessment = async (id) => {
  const res = await API.get(`/assessments/${id}`);
  return res.data;
};

/**
 * Start a new attempt for the given assessment.
 * Returns { attemptId }.
 * @param {string} assessmentId
 */
export const startAttempt = async (assessmentId) => {
  const res = await API.post(`/assessments/${assessmentId}/start`);
  return res.data;
};

/**
 * Submit completed answers for an assessment attempt.
 * Returns scored result with correct answers and explanations.
 * @param {string} assessmentId
 * @param {{ attemptId: string, answers: Array, totalTimeTakenMs: number }} payload
 */
export const submitAttempt = async (assessmentId, payload) => {
  const res = await API.post(`/assessments/${assessmentId}/submit`, payload);
  return res.data;
};

/**
 * Fetch the authenticated user's completed attempt history.
 */
export const getMyAttempts = async () => {
  const res = await API.get("/assessments/attempts/mine");
  return res.data;
};

/**
 * Fetch a single attempt with full detail (correct answers, explanations).
 * @param {string} attemptId
 */
export const getAttemptDetail = async (attemptId) => {
  const res = await API.get(`/assessments/attempts/${attemptId}`);
  return res.data;
};
